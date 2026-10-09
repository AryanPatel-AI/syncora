import crypto from 'crypto';
import { db } from '../database/db';

export interface RoomQueueItem {
  id: string;
  roomId: string;
  videoId: string;
  title: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  addedById: string;
  addedByName: string;
  position: number;
  addedAt: number;
}

export class RoomQueueService {
  public static getQueue(roomId: string): RoomQueueItem[] {
    const rows = db.prepare('SELECT * FROM room_queues WHERE room_id = ? ORDER BY position ASC, added_at ASC').all(roomId) as any[];
    return rows.map((r) => ({
      id: r.id,
      roomId: r.room_id,
      videoId: r.video_id,
      title: r.title,
      channelTitle: r.channel_title,
      thumbnailUrl: r.thumbnail_url,
      addedById: r.added_by_id,
      addedByName: r.added_by_name,
      position: r.position,
      addedAt: r.added_at,
    }));
  }

  public static addToQueue(roomId: string, video: {
    videoId: string;
    title: string;
    channelTitle?: string;
    thumbnailUrl?: string;
    addedById: string;
    addedByName: string;
  }): RoomQueueItem {
    const maxPosRow = db.prepare('SELECT MAX(position) as max_pos FROM room_queues WHERE room_id = ?').get(roomId) as any;
    const nextPos = (maxPosRow?.max_pos !== null && maxPosRow?.max_pos !== undefined) ? maxPosRow.max_pos + 1 : 0;

    const id = `q_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = Date.now();

    db.prepare(`
      INSERT INTO room_queues (id, room_id, video_id, title, channel_title, thumbnail_url, added_by_id, added_by_name, position, added_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      roomId,
      video.videoId,
      video.title,
      video.channelTitle || '',
      video.thumbnailUrl || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
      video.addedById,
      video.addedByName,
      nextPos,
      now
    );

    return {
      id,
      roomId,
      videoId: video.videoId,
      title: video.title,
      channelTitle: video.channelTitle,
      thumbnailUrl: video.thumbnailUrl,
      addedById: video.addedById,
      addedByName: video.addedByName,
      position: nextPos,
      addedAt: now,
    };
  }

  public static removeFromQueue(roomId: string, queueId: string): boolean {
    const res = db.prepare('DELETE FROM room_queues WHERE room_id = ? AND id = ?').run(roomId, queueId);
    return res.changes > 0;
  }

  public static advanceQueue(roomId: string): RoomQueueItem | null {
    const current = db.prepare('SELECT * FROM room_queues WHERE room_id = ? ORDER BY position ASC, added_at ASC LIMIT 1').get(roomId) as any;
    if (!current) return null;

    db.prepare('DELETE FROM room_queues WHERE id = ?').run(current.id);

    return {
      id: current.id,
      roomId: current.room_id,
      videoId: current.video_id,
      title: current.title,
      channelTitle: current.channel_title,
      thumbnailUrl: current.thumbnail_url,
      addedById: current.added_by_id,
      addedByName: current.added_by_name,
      position: current.position,
      addedAt: current.added_at,
    };
  }

  public static clearQueue(roomId: string): void {
    db.prepare('DELETE FROM room_queues WHERE room_id = ?').run(roomId);
  }
}
