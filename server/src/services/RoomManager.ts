import { Room } from '../models/Room';
import { Participant } from '../models/Participant';
import { generateRoomId, generateId } from '../utils/helpers';

import { SERVER_CONFIG } from '../config/constants';

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
    while (this.rooms.has(roomId)) {
      roomId = generateRoomId();
    }

    const room = new Room(roomId, initialVideoId || SERVER_CONFIG.DEFAULT_VIDEO_ID);
    const hostId = generateId('user');
    const host = new Participant(hostId, creatorUsername.trim() || 'Host', 'HOST', socketId, true);

    room.addParticipant(host);
    this.rooms.set(roomId, room);

    this.socketToRoom.set(socketId, roomId);
    this.socketToUser.set(socketId, hostId);

    return { room, host };
  }

  /**
   * Retrieves an existing room by its ID.
   */
  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId.toUpperCase().trim());
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
    const room = this.rooms.get(cleanRoomId);

    if (!room) {
      return { error: `Room ${cleanRoomId} does not exist or has expired.` };
    }

    // Check if socket is already in another room
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

    if (room.isEmpty()) {
      // Room has 0 participants, delete it
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

  public getRoomBySocketId(socketId: string): Room | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  public getParticipantBySocketId(socketId: string): Participant | undefined {
    const room = this.getRoomBySocketId(socketId);
    if (!room) return undefined;
    return room.getParticipantBySocketId(socketId);
  }

  public deleteRoom(roomId: string): boolean {
    return this.rooms.delete(roomId.toUpperCase().trim());
  }

  public getRoomCount(): number {
    return this.rooms.size;
  }
}
