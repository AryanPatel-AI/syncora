import { db } from './db';
import { PlaybackState, Role, ChatMessage } from '../types';

export interface RoomRecord {
  id: string;
  host_id: string;
  video_id: string | null;
  play_state: 'playing' | 'paused' | 'buffering';
  current_time: number;
  last_updated_at: number;
  playback_rate: number;
  created_at: number;
  updated_at: number;
}

export interface ParticipantRecord {
  id: string;
  room_id: string;
  username: string;
  role: Role;
  avatar_color: string;
  joined_at: number;
}

export class RoomRepository {
  public static saveRoom(
    roomId: string,
    hostId: string,
    playback: PlaybackState,
    createdAt: number
  ): void {
    const stmt = db.prepare(`
      INSERT INTO rooms (id, host_id, video_id, play_state, current_time, last_updated_at, playback_rate, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        host_id = excluded.host_id,
        video_id = excluded.video_id,
        play_state = excluded.play_state,
        current_time = excluded.current_time,
        last_updated_at = excluded.last_updated_at,
        playback_rate = excluded.playback_rate,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      roomId,
      hostId,
      playback.videoId,
      playback.playState,
      playback.currentTime,
      playback.lastUpdatedAt,
      playback.playbackRate,
      createdAt,
      Date.now()
    );
  }

  public static getRoom(roomId: string): RoomRecord | undefined {
    const stmt = db.prepare('SELECT * FROM rooms WHERE id = ?');
    return stmt.get(roomId) as RoomRecord | undefined;
  }

  public static updatePlayback(
    roomId: string,
    videoId: string | null,
    playState: string,
    currentTime: number,
    lastUpdatedAt: number,
    playbackRate: number = 1
  ): void {
    const stmt = db.prepare(`
      UPDATE rooms
      SET video_id = ?, play_state = ?, current_time = ?, last_updated_at = ?, playback_rate = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(videoId, playState, currentTime, lastUpdatedAt, playbackRate, Date.now(), roomId);
  }

  public static updateHost(roomId: string, newHostId: string): void {
    const stmt = db.prepare(`
      UPDATE rooms
      SET host_id = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(newHostId, Date.now(), roomId);
  }

  public static saveParticipant(
    roomId: string,
    participantId: string,
    username: string,
    role: Role,
    avatarColor: string,
    joinedAt: number
  ): void {
    const stmt = db.prepare(`
      INSERT INTO participants (id, room_id, username, role, avatar_color, joined_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        role = excluded.role,
        username = excluded.username
    `);

    stmt.run(participantId, roomId, username, role, avatarColor, joinedAt);
  }

  public static getParticipants(roomId: string): ParticipantRecord[] {
    const stmt = db.prepare('SELECT * FROM participants WHERE room_id = ? ORDER BY joined_at ASC');
    return stmt.all(roomId) as ParticipantRecord[];
  }

  public static updateParticipantRole(participantId: string, role: Role): void {
    const stmt = db.prepare('UPDATE participants SET role = ? WHERE id = ?');
    stmt.run(role, participantId);
  }

  public static removeParticipant(participantId: string): void {
    const stmt = db.prepare('DELETE FROM participants WHERE id = ?');
    stmt.run(participantId);
  }

  public static saveChatMessage(roomId: string, msg: ChatMessage): void {
    const stmt = db.prepare(`
      INSERT INTO chat_messages (id, room_id, sender_id, sender_name, sender_role, content, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      msg.id,
      roomId,
      msg.senderId,
      msg.senderName,
      msg.senderRole || null,
      msg.content,
      msg.type,
      msg.timestamp
    );
  }

  public static getChatMessages(roomId: string, limit: number = 50): ChatMessage[] {
    const stmt = db.prepare(`
      SELECT id, sender_id as senderId, sender_name as senderName, sender_role as senderRole,
             content, type, created_at as timestamp
      FROM chat_messages
      WHERE room_id = ?
      ORDER BY created_at ASC
      LIMIT ?
    `);

    return stmt.all(roomId, limit) as ChatMessage[];
  }

  public static deleteRoom(roomId: string): void {
    const stmt = db.prepare('DELETE FROM rooms WHERE id = ?');
    stmt.run(roomId);
  }
}
