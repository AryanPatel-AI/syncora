import crypto from 'crypto';
import { db } from '../database/db';

export interface SavedVideoItem {
  id: string;
  userId: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration?: string;
  isLive: boolean;
  savedAt: number;
}

export interface WatchHistoryItem {
  id: string;
  userId: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  progressSeconds: number;
  watchedAt: number;
}

export interface FollowedChannelItem {
  id: string;
  userId: string;
  channelId: string;
  channelTitle: string;
  avatarUrl?: string;
  followedAt: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'invite' | 'system' | 'moderation' | 'stream';
  link?: string;
  isRead: boolean;
  createdAt: number;
}

export class UserDataService {
  // SAVED VIDEOS
  public static getSavedVideos(userId: string): SavedVideoItem[] {
    const rows = db.prepare('SELECT * FROM saved_videos WHERE user_id = ? ORDER BY saved_at DESC').all(userId) as any[];
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      videoId: r.video_id,
      title: r.title,
      channelTitle: r.channel_title,
      thumbnailUrl: r.thumbnail_url,
      duration: r.duration,
      isLive: Boolean(r.is_live),
      savedAt: r.saved_at,
    }));
  }

  public static saveVideo(userId: string, video: {
    videoId: string;
    title: string;
    channelTitle?: string;
    thumbnailUrl?: string;
    duration?: string;
    isLive?: boolean;
  }): SavedVideoItem {
    // Avoid duplicate
    const existing = db.prepare('SELECT * FROM saved_videos WHERE user_id = ? AND video_id = ?').get(userId, video.videoId) as any;
    if (existing) {
      return {
        id: existing.id,
        userId: existing.user_id,
        videoId: existing.video_id,
        title: existing.title,
        channelTitle: existing.channel_title,
        thumbnailUrl: existing.thumbnail_url,
        duration: existing.duration,
        isLive: Boolean(existing.is_live),
        savedAt: existing.saved_at,
      };
    }

    const id = `saved_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = Date.now();
    db.prepare(`
      INSERT INTO saved_videos (id, user_id, video_id, title, channel_title, thumbnail_url, duration, is_live, saved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      video.videoId,
      video.title,
      video.channelTitle || '',
      video.thumbnailUrl || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
      video.duration || '',
      video.isLive ? 1 : 0,
      now
    );

    return {
      id,
      userId,
      videoId: video.videoId,
      title: video.title,
      channelTitle: video.channelTitle || '',
      thumbnailUrl: video.thumbnailUrl || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
      duration: video.duration,
      isLive: Boolean(video.isLive),
      savedAt: now,
    };
  }

  public static removeSavedVideo(userId: string, videoId: string): boolean {
    const res = db.prepare('DELETE FROM saved_videos WHERE user_id = ? AND video_id = ?').run(userId, videoId);
    return res.changes > 0;
  }

  // WATCH HISTORY
  public static getHistory(userId: string): WatchHistoryItem[] {
    const rows = db.prepare('SELECT * FROM watch_history WHERE user_id = ? ORDER BY watched_at DESC LIMIT 50').all(userId) as any[];
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      videoId: r.video_id,
      title: r.title,
      channelTitle: r.channel_title,
      thumbnailUrl: r.thumbnail_url,
      progressSeconds: r.progress_seconds || 0,
      watchedAt: r.watched_at,
    }));
  }

  public static recordHistory(userId: string, video: {
    videoId: string;
    title: string;
    channelTitle?: string;
    thumbnailUrl?: string;
    progressSeconds?: number;
  }): void {
    const now = Date.now();
    const existing = db.prepare('SELECT id FROM watch_history WHERE user_id = ? AND video_id = ?').get(userId, video.videoId) as any;
    if (existing) {
      db.prepare(`
        UPDATE watch_history
        SET title = ?, channel_title = ?, thumbnail_url = ?, progress_seconds = ?, watched_at = ?
        WHERE id = ?
      `).run(
        video.title,
        video.channelTitle || '',
        video.thumbnailUrl || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
        video.progressSeconds || 0,
        now,
        existing.id
      );
    } else {
      const id = `hist_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      db.prepare(`
        INSERT INTO watch_history (id, user_id, video_id, title, channel_title, thumbnail_url, progress_seconds, watched_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        userId,
        video.videoId,
        video.title,
        video.channelTitle || '',
        video.thumbnailUrl || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
        video.progressSeconds || 0,
        now
      );
    }
  }

  public static clearHistory(userId: string): void {
    db.prepare('DELETE FROM watch_history WHERE user_id = ?').run(userId);
  }

  // FOLLOWS
  public static getFollowedChannels(userId: string): FollowedChannelItem[] {
    const rows = db.prepare('SELECT * FROM followed_channels WHERE user_id = ? ORDER BY followed_at DESC').all(userId) as any[];
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      channelId: r.channel_id,
      channelTitle: r.channel_title,
      avatarUrl: r.avatar_url,
      followedAt: r.followed_at,
    }));
  }

  public static followChannel(userId: string, channel: { channelId: string; channelTitle: string; avatarUrl?: string }): FollowedChannelItem {
    const existing = db.prepare('SELECT * FROM followed_channels WHERE user_id = ? AND channel_id = ?').get(userId, channel.channelId) as any;
    if (existing) {
      return {
        id: existing.id,
        userId: existing.user_id,
        channelId: existing.channel_id,
        channelTitle: existing.channel_title,
        avatarUrl: existing.avatar_url,
        followedAt: existing.followed_at,
      };
    }

    const id = `fol_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = Date.now();
    db.prepare(`
      INSERT INTO followed_channels (id, user_id, channel_id, channel_title, avatar_url, followed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, channel.channelId, channel.channelTitle, channel.avatarUrl || '', now);

    return {
      id,
      userId,
      channelId: channel.channelId,
      channelTitle: channel.channelTitle,
      avatarUrl: channel.avatarUrl,
      followedAt: now,
    };
  }

  public static unfollowChannel(userId: string, channelId: string): boolean {
    const res = db.prepare('DELETE FROM followed_channels WHERE user_id = ? AND channel_id = ?').run(userId, channelId);
    return res.changes > 0;
  }

  // NOTIFICATIONS
  public static getNotifications(userId: string): NotificationItem[] {
    const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30').all(userId) as any[];
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      message: r.message,
      type: r.type,
      link: r.link,
      isRead: Boolean(r.is_read),
      createdAt: r.created_at,
    }));
  }

  public static markNotificationsRead(userId: string): void {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
  }

  public static addNotification(userId: string, notification: {
    title: string;
    message: string;
    type?: 'invite' | 'system' | 'moderation' | 'stream';
    link?: string;
  }): NotificationItem {
    const id = `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = Date.now();
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, userId, notification.title, notification.message, notification.type || 'system', notification.link || '', now);

    return {
      id,
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'system',
      link: notification.link,
      isRead: false,
      createdAt: now,
    };
  }

  // REPORTS
  public static createReport(reporterId: string, params: {
    targetType: 'message' | 'user' | 'room';
    targetId: string;
    reason: string;
    details?: string;
  }): { id: string; success: boolean } {
    const id = `rep_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = Date.now();
    db.prepare(`
      INSERT INTO reports (id, reporter_id, target_type, target_id, reason, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, reporterId, params.targetType, params.targetId, params.reason, params.details || '', now);

    return { id, success: true };
  }
}
