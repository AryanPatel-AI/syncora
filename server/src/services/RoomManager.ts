import { Room } from '../models/Room';
import { Participant } from '../models/Participant';
import { generateRoomId, generateId } from '../utils/helpers';
import { SERVER_CONFIG } from '../config/constants';
import { RoomRepository } from '../database/roomRepository';

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, Room> = new Map(); // roomId -> Room
  private socketToRoom: Map<string, string> = new Map(); // socketId -> roomId
  private socketToUser: Map<string, string> = new Map(); // socketId -> userId

  private constructor() {
    // Singleton
  }

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  /**
   * Creates a new Room and registers the creator as the Host.
   */
  public createRoom(
    creatorUsername: string,
    socketId: string,
    initialVideoId?: string
  ): { room: Room; host: Participant } {
    let roomId = generateRoomId();
    while (this.rooms.has(roomId) || RoomRepository.getRoom(roomId)) {
      roomId = generateRoomId();
    }

    const room = new Room(roomId, initialVideoId || SERVER_CONFIG.DEFAULT_VIDEO_ID);
    const hostId = generateId('user');
    const host = new Participant(hostId, creatorUsername.trim() || 'Host', 'HOST', socketId, true);

    room.addParticipant(host);
    this.rooms.set(roomId, room);

    this.socketToRoom.set(socketId, roomId);
    this.socketToUser.set(socketId, hostId);

    // Persist to SQLite Database
    RoomRepository.saveRoom(room.id, host.id, room.getPlaybackState(), room.createdAt);
    RoomRepository.saveParticipant(
      room.id,
      host.id,
      host.username,
      host.role,
      host.avatarColor,
      host.joinedAt
    );

    return { room, host };
  }

  /**
   * Retrieves an existing room by its ID, rehydrating from SQLite database if needed.
   */
  public getRoom(roomId: string): Room | undefined {
    const cleanId = roomId.toUpperCase().trim();
    let room = this.rooms.get(cleanId);

    if (!room) {
      // Rehydrate room from SQLite persistent database
      const record = RoomRepository.getRoom(cleanId);
      if (record) {
        room = new Room(record.id, record.video_id);
        room.hostId = record.host_id;

        // Restore chat messages from database
        const savedChat = RoomRepository.getChatMessages(cleanId, 50);
        for (const msg of savedChat) {
          room.addChatMessage(msg.senderId, msg.senderName, msg.content, msg.type, msg.senderRole);
        }

        this.rooms.set(cleanId, room);
      }
    }

    return room;
  }

  /**
   * Lets a participant join an existing room.
   */
  public joinRoom(
    roomId: string,
    username: string,
    socketId: string
  ): { room: Room; participant: Participant } | { error: string } {
    const cleanRoomId = roomId.toUpperCase().trim();
    const room = this.getRoom(cleanRoomId);

    if (!room) {
      return { error: `Room ${cleanRoomId} does not exist or has expired.` };
    }

    // Disconnect socket from any previous room
    this.leaveRoom(socketId);

    const userId = generateId('user');
    const participant = new Participant(
      userId,
      username.trim() || 'Participant',
      'PARTICIPANT',
      socketId,
      false
    );

    room.addParticipant(participant);
    this.socketToRoom.set(socketId, cleanRoomId);
    this.socketToUser.set(socketId, userId);

    // Persist participant in SQLite
    RoomRepository.saveParticipant(
      room.id,
      participant.id,
      participant.username,
      participant.role,
      participant.avatarColor,
      participant.joinedAt
    );

    return { room, participant };
  }

  /**
   * Handles user disconnect or departure.
   */
  public leaveRoom(socketId: string): {
    room: Room;
    participant: Participant;
    roomDeleted: boolean;
    previousHostId: string;
    newHostId?: string;
  } | null {
    const roomId = this.socketToRoom.get(socketId);
    const userId = this.socketToUser.get(socketId);

    if (!roomId || !userId) return null;

    const room = this.rooms.get(roomId);
    this.socketToRoom.delete(socketId);
    this.socketToUser.delete(socketId);

    if (!room) return null;

    const previousHostId = room.hostId;
    const participant = room.removeParticipant(userId);
    if (!participant) return null;

    // Remove participant from SQLite
    RoomRepository.removeParticipant(userId);

    if (room.isEmpty()) {
      // Memory cleanup, keep room in SQLite for persistent rejoin or delete if desired
      this.rooms.delete(roomId);
      return {
        room,
        participant,
        roomDeleted: true,
        previousHostId,
      };
    }

    return {
      room,
      participant,
      roomDeleted: false,
      previousHostId,
      newHostId: room.hostId,
    };
  }

  /**
   * Cleans up socket-to-room and socket-to-user mappings when a participant is kicked or explicitly unmapped.
   */
  public unmapSocket(socketId: string): void {
    this.socketToRoom.delete(socketId);
    this.socketToUser.delete(socketId);
  }

  public getRoomBySocketId(socketId: string): Room | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;
    return this.getRoom(roomId);
  }

  public getParticipantBySocketId(socketId: string): Participant | undefined {
    const room = this.getRoomBySocketId(socketId);
    if (!room) return undefined;
    return room.getParticipantBySocketId(socketId);
  }

  public deleteRoom(roomId: string): boolean {
    const cleanId = roomId.toUpperCase().trim();
    RoomRepository.deleteRoom(cleanId);
    return this.rooms.delete(cleanId);
  }

  public getRoomCount(): number {
    return this.rooms.size;
  }
}
