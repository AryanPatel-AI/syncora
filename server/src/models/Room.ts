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
  private likeCount: number = 0;
  private static readonly MAX_CHAT_HISTORY = SERVER_CONFIG.MAX_CHAT_HISTORY;

  constructor(id: string, initialVideoId?: string | null) {
    this.id = id;
    this.hostId = '';
    this.createdAt = Date.now();
    this.playback = {
      videoId: initialVideoId || SERVER_CONFIG.DEFAULT_VIDEO_ID,
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
        RoomRepository.updateHost(this.id, nextHost.id);
        RoomRepository.updateParticipantRole(nextHost.id, nextHost.role);
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
    RoomRepository.updateParticipantRole(currentHost.id, currentHost.role);
    RoomRepository.updateParticipantRole(target.id, target.role);
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
    return { ...this.playback };
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
    return { ...this.playback };
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
    requestedVideoTitle?: string,
    requestedTime?: number
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
      action: type,
      requestedVideoId,
      requestedVideoTitle,
      requestedTime,
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
      const normalizedType = String(request.type || '').toLowerCase();
      if (
        normalizedType.includes('moderator') ||
        normalizedType.includes('control')
      ) {
        participant.promoteToModerator();
      } else if (
        normalizedType.includes('video') ||
        request.requestedVideoId
      ) {
        if (request.requestedVideoId) {
          this.changeVideo(request.requestedVideoId, participant);
        }
      } else if (normalizedType === 'play') {
        const targetTime = typeof request.requestedTime === 'number'
          ? request.requestedTime
          : this.getAuthoritativeCurrentTime();
        this.updatePlayState('playing', targetTime, participant);
      } else if (normalizedType === 'pause') {
        const targetTime = typeof request.requestedTime === 'number'
          ? request.requestedTime
          : this.getAuthoritativeCurrentTime();
        this.updatePlayState('paused', targetTime, participant);
      } else if (normalizedType === 'seek') {
        if (typeof request.requestedTime === 'number') {
          this.seek(request.requestedTime, participant);
        }
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
      username: senderName,
      senderRole,
      role: senderRole,
      content,
      text: content,
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

  public getLikeCount(): number {
    return this.likeCount;
  }

  public incrementLikeCount(): number {
    this.likeCount += 1;
    return this.likeCount;
  }

  private slowModeSeconds: number = 0;
  private timeouts: Map<string, number> = new Map(); // userId -> expiresAt ms

  public deleteChatMessage(messageId: string): boolean {
    const msg = this.chatHistory.find((m) => m.id === messageId);
    if (!msg) return false;
    msg.isDeleted = true;
    msg.content = '[This message was removed by a moderator]';
    msg.text = msg.content;
    return true;
  }

  public pinChatMessage(messageId: string, pinned: boolean = true): ChatMessage | null {
    const msg = this.chatHistory.find((m) => m.id === messageId);
    if (!msg) return null;
    msg.isPinned = pinned;
    return msg;
  }

  public getPinnedMessages(): ChatMessage[] {
    return this.chatHistory.filter((m) => m.isPinned && !m.isDeleted);
  }

  public timeoutUser(userId: string, durationSeconds: number = 60): void {
    this.timeouts.set(userId, Date.now() + durationSeconds * 1000);
  }

  public isUserTimedOut(userId: string): { timedOut: boolean; remainingSeconds: number } {
    const expiresAt = this.timeouts.get(userId);
    if (!expiresAt) return { timedOut: false, remainingSeconds: 0 };
    const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
    if (remaining <= 0) {
      this.timeouts.delete(userId);
      return { timedOut: false, remainingSeconds: 0 };
    }
    return { timedOut: true, remainingSeconds: remaining };
  }

  public setSlowMode(seconds: number): void {
    this.slowModeSeconds = Math.max(0, Math.min(seconds, 60));
  }

  public getSlowModeSeconds(): number {
    return this.slowModeSeconds;
  }

  public getStateSnapshot(): RoomStateSnapshot {
    return {
      roomId: this.id,
      hostId: this.hostId,
      playback: this.getPlaybackState(),
      participants: this.getAllParticipants(),
      pendingRequests: this.getPendingRequests(),
      chatHistory: this.getChatHistory(),
      likeCount: this.getLikeCount(),
      audienceCount: this.getParticipantCount(),
      slowModeSeconds: this.slowModeSeconds,
      pinnedMessages: this.getPinnedMessages(),
    };
  }

  public isEmpty(): boolean {
    return this.participants.size === 0;
  }
}
