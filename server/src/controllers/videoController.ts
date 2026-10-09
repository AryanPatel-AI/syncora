import { Request, Response } from 'express';
import { YouTubeService } from '../services/YouTubeService';

export class VideoController {
  public static async search(req: Request, res: Response): Promise<void> {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const type = (req.query.type as any) || 'all';
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const maxResults = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const pageToken = typeof req.query.pageToken === 'string' ? req.query.pageToken : undefined;

      const result = await YouTubeService.search({
        query: q,
        type,
        category,
        maxResults,
        pageToken,
      });

      res.json({
        ...result,
        configuredWithApiKey: YouTubeService.isConfigured(),
      });
    } catch (err: any) {
      console.error('[VideoController Search Error]:', err);
      res.status(500).json({ error: 'Failed to search videos', message: err.message });
    }
  }

  public static async getLive(req: Request, res: Response): Promise<void> {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const liveStreams = await YouTubeService.getLiveStreams(category);
      res.json({
        items: liveStreams,
        total: liveStreams.length,
      });
    } catch (err: any) {
      console.error('[VideoController Live Error]:', err);
      res.status(500).json({ error: 'Failed to fetch live streams', message: err.message });
    }
  }

  public static async getPopular(req: Request, res: Response): Promise<void> {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const videos = await YouTubeService.getPopular(category);
      res.json({
        items: videos,
        total: videos.length,
      });
    } catch (err: any) {
      console.error('[VideoController Popular Error]:', err);
      res.status(500).json({ error: 'Failed to fetch popular videos', message: err.message });
    }
  }

  public static async getDetails(req: Request, res: Response): Promise<void> {
    try {
      const videoId = req.params.videoId as string;
      if (!videoId) {
        res.status(400).json({ error: 'Video ID is required.' });
        return;
      }

      const video = await YouTubeService.getVideoDetails(videoId);
      if (!video) {
        res.status(404).json({ error: 'Video not found or is unavailable.' });
        return;
      }

      res.json(video);
    } catch (err: any) {
      console.error('[VideoController Details Error]:', err);
      res.status(500).json({ error: 'Failed to fetch video details', message: err.message });
    }
  }

  public static getCategories(_req: Request, res: Response): void {
    res.json(YouTubeService.getCategories());
  }
}
