import { Participant } from './Participant';
import {
  PlaybackState,
  PlayState,
  ControlRequest,
  ControlRequestType,
  ChatMessage,
  ParticipantJSON,
  RoomStateSnapshot,
} from '../types';
import { generateId } from '../utils/helpers';
import { SERVER_CONFIG } from '../config/constants';
import { RoomRepository } from '../database/roomRepository';

export class Room {
  public readonly id: string;
  public hostId: string;
  public readonly createdAt: number;
  private participants: Map<string, Participant> = new Map(); // userId -> Participant
  private playback: PlaybackState;
  private controlRequests: Map<string, ControlRequest> = new Map(); // requestId -> ControlRequest
  private chatHistory: ChatMessage[] = [];
  private static readonly MAX_CHAT_HISTORY = SERVER_CONFIG.MAX_CHAT_HISTORY;

  constructor(id: string, initialVideoId: string = SERVER_CONFIG.DEFAULT_VIDEO_ID) {
    this.id = id;
    this.hostId = '';
    this.createdAt = Date.now();
    this.playback = {
      videoId: initialVideoId,
      playState: 'paused',
      currentTime: 0,
      lastUpdatedAt: Date.now(),
      playbackRate: 1,
      updatedBy: {
        userId: 'system',
        username: 'System',
      },
    };
  }

  // Participant Management
  public addParticipant(participant: Participant): void {
    if (this.participants.size === 0) {
      participant.makeHost();
      this.hostId = participant.id;
    }
    this.participants.set(participant.id, participant);
  }

  public removeParticipant(userId: string): Participant | undefined {
    const participant = this.participants.get(userId);
    if (!participant) return undefined;

    this.participants.delete(userId);

    // If host left and there are other participants, promote next member (prefer moderator)
    if (participant.id === this.hostId && this.participants.size > 0) {
      let nextHost: Participant | undefined;
      for (const p of this.participants.values()) {
        if (p.role === 'MODERATOR') {
          nextHost = p;
          break;
        }
      }
      if (!nextHost) {
        nextHost = this.participants.values().next().value;
      }
      if (nextHost) {
        nextHost.makeHost();
        this.hostId = nextHost.id;
      }
    }

    return participant;
  }

  public getParticipant(userId: string): Participant | undefined {
    return this.participants.get(userId);
  }

  public getParticipantBySocketId(socketId: string): Participant | undefined {
    for (const p of this.participants.values()) {
      if (p.socketId === socketId) {
        return p;
      }
    }
    return undefined;
  }

  public getAllParticipants(): ParticipantJSON[] {
    return Array.from(this.participants.values()).map((p) => p.toJSON());
  }

  public getParticipantCount(): number {
    return this.participants.size;
  }

  public transferHost(currentHostId: string, targetUserId: string): boolean {
    const currentHost = this.participants.get(currentHostId);
    const target = this.participants.get(targetUserId);

    if (!currentHost || !target || currentHost.id !== this.hostId) {
      return false;
    }

    currentHost.revokeHost();
    target.makeHost();
    this.hostId = target.id;
    RoomRepository.updateHost(this.id, target.id);
    return true;
  }

  // Playback & Synchronization Engine
  public getAuthoritativeCurrentTime(): number {
    if (this.playback.playState === 'playing') {
      const elapsedSeconds = (Date.now() - this.playback.lastUpdatedAt) / 1000;
      return Math.max(0, this.playback.currentTime + elapsedSeconds * this.playback.playbackRate);
    }
    return Math.max(0, this.playback.currentTime);
  }

  public getPlaybackState(): PlaybackState {
    return {
      ...this.playback,
      currentTime: this.getAuthoritativeCurrentTime(),
    };
  }

  public updatePlayState(state: PlayState, currentTime: number, author: Participant): PlaybackState {
    this.playback = {
      ...this.playback,
      playState: state,
      currentTime: Math.max(0, currentTime),
      lastUpdatedAt: Date.now(),
      updatedBy: {
        userId: author.id,
        username: author.username,
      },
    };
    RoomRepository.updatePlayback(
      this.id,
      this.playback.videoId,
      this.playback.playState,
      this.playback.currentTime,
      this.playback.lastUpdatedAt,
      this.playback.playbackRate
    );
    return this.getPlaybackState();
  }

  public seek(time: number, author: Participant): PlaybackState {
    this.playback = {
      ...this.playback,
      currentTime: Math.max(0, time),
      lastUpdatedAt: Date.now(),
      updatedBy: {
        userId: author.id,
        username: author.username,
      },
    };
    RoomRepository.updatePlayback(
      this.id,
      this.playback.videoId,
      this.playback.playState,
      this.playback.currentTime,
      this.playback.lastUpdatedAt,
      this.playback.playbackRate
    );
    return this.getPlaybackState();
  }

  public changeVideo(videoId: string, author: Participant): PlaybackState {
    this.playback = {
      videoId,
      playState: 'playing',
      currentTime: 0,
      lastUpdatedAt: Date.now(),
      playbackRate: 1,
      updatedBy: {
        userId: author.id,
        username: author.username,
      },
    };
    RoomRepository.updatePlayback(
      this.id,
      this.playback.videoId,
      this.playback.playState,
      this.playback.currentTime,
      this.playback.lastUpdatedAt,
      this.playback.playbackRate
    );
    return this.getPlaybackState();
  }

  // Participant Control Request System
  public createControlRequest(
    userId: string,
    type: ControlRequestType,
    requestedVideoId?: string,
    requestedVideoTitle?: string
  ): ControlRequest | null {
    const participant = this.participants.get(userId);
    if (!participant) return null;

    // Remove any existing pending requests for this user
    for (const [id, req] of this.controlRequests.entries()) {
      if (req.userId === userId && req.status === 'pending') {
        this.controlRequests.delete(id);
      }
    }

    const request: ControlRequest = {
      id: generateId('req'),
      userId: participant.id,
      username: participant.username,
      role: participant.role,
      type,
      requestedVideoId,
      requestedVideoTitle,
      timestamp: Date.now(),
      status: 'pending',
    };

    this.controlRequests.set(request.id, request);
    return request;
  }

  public resolveControlRequest(requestId: string, status: 'approved' | 'rejected'): ControlRequest | null {
    const request = this.controlRequests.get(requestId);
    if (!request || request.status !== 'pending') return null;

    request.status = status;
    const participant = this.participants.get(request.userId);

    if (status === 'approved' && participant) {
      if (request.type === 'REQUEST_MODERATOR' || request.type === 'REQUEST_CONTROL') {
        participant.promoteToModerator();
      }
      if (request.type === 'REQUEST_CHANGE_VIDEO' && request.requestedVideoId) {
        this.changeVideo(request.requestedVideoId, participant);
      }
    }

    return request;
  }

  public getPendingRequests(): ControlRequest[] {
    return Array.from(this.controlRequests.values()).filter((r) => r.status === 'pending');
  }

  // Chat & Communication
  public addChatMessage(
    senderId: string,
    senderName: string,
    content: string,
    type: 'user' | 'system' = 'user',
    senderRole?: Participant['role']
  ): ChatMessage {
    const msg: ChatMessage = {
      id: generateId('msg'),
      senderId,
      senderName,
      senderRole,
      content,
      type,
      timestamp: Date.now(),
    };

    this.chatHistory.push(msg);
    if (this.chatHistory.length > Room.MAX_CHAT_HISTORY) {
      this.chatHistory.shift();
    }
    RoomRepository.saveChatMessage(this.id, msg);
    return msg;
  }

  public getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  public getStateSnapshot(): RoomStateSnapshot {
    return {
      roomId: this.id,
      hostId: this.hostId,
      playback: this.getPlaybackState(),
      participants: this.getAllParticipants(),
      pendingRequests: this.getPendingRequests(),
      chatHistory: this.getChatHistory(),
    };
  }

  public isEmpty(): boolean {
    return this.participants.size === 0;
  }
}
