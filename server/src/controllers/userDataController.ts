import { Response } from 'express';
import { UserDataService } from '../services/UserDataService';
import { AuthenticatedRequest } from '../utils/authMiddleware';

export class UserDataController {
  // Saved Videos
  public static getSaved(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const items = UserDataService.getSavedVideos(req.user.id);
    res.json({ items });
  }

  public static addSaved(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { videoId, title, channelTitle, thumbnailUrl, duration, isLive } = req.body;
    if (!videoId || !title) {
      res.status(400).json({ error: 'videoId and title are required.' });
      return;
    }
    const item = UserDataService.saveVideo(req.user.id, {
      videoId,
      title,
      channelTitle,
      thumbnailUrl,
      duration,
      isLive,
    });
    res.status(201).json({ item });
  }

  public static removeSaved(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const videoId = req.params.videoId as string;
    const success = UserDataService.removeSavedVideo(req.user.id, videoId);
    res.json({ success });
  }

  // History
  public static getHistory(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const items = UserDataService.getHistory(req.user.id);
    res.json({ items });
  }

  public static recordHistory(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { videoId, title, channelTitle, thumbnailUrl, progressSeconds } = req.body;
    if (!videoId || !title) {
      res.status(400).json({ error: 'videoId and title are required.' });
      return;
    }
    UserDataService.recordHistory(req.user.id, {
      videoId,
      title,
      channelTitle,
      thumbnailUrl,
      progressSeconds,
    });
    res.json({ success: true });
  }

  public static clearHistory(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    UserDataService.clearHistory(req.user.id);
    res.json({ success: true });
  }

  // Followed Channels
  public static getFollows(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const items = UserDataService.getFollowedChannels(req.user.id);
    res.json({ items });
  }

  public static followChannel(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { channelId, channelTitle, avatarUrl } = req.body;
    if (!channelId || !channelTitle) {
      res.status(400).json({ error: 'channelId and channelTitle are required.' });
      return;
    }
    const item = UserDataService.followChannel(req.user.id, { channelId, channelTitle, avatarUrl });
    res.status(201).json({ item });
  }

  public static unfollowChannel(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const channelId = req.params.channelId as string;
    const success = UserDataService.unfollowChannel(req.user.id, channelId);
    res.json({ success });
  }

  // Notifications
  public static getNotifications(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const items = UserDataService.getNotifications(req.user.id);
    res.json({ items });
  }

  public static markNotificationsRead(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    UserDataService.markNotificationsRead(req.user.id);
    res.json({ success: true });
  }

  // Content Reporting
  public static createReport(req: AuthenticatedRequest, res: Response): void {
    const reporterId = req.user?.id || 'anonymous';
    const { targetType, targetId, reason, details } = req.body;
    if (!targetType || !targetId || !reason) {
      res.status(400).json({ error: 'targetType, targetId, and reason are required.' });
      return;
    }
    const result = UserDataService.createReport(reporterId, { targetType, targetId, reason, details });
    res.status(201).json(result);
  }
}
