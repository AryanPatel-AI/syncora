import { Request, Response } from 'express';
import { RoomQueueService } from '../services/RoomQueueService';
import { RoomManager } from '../services/RoomManager';

export class QueueController {
  public static getQueue(req: Request, res: Response): void {
    const roomId = req.params.roomId as string;
    if (!roomId) {
      res.status(400).json({ error: 'Room ID required.' });
      return;
    }
    const items = RoomQueueService.getQueue(roomId);
    res.json({ items });
  }

  public static addToQueue(req: Request, res: Response): void {
    const roomId = req.params.roomId as string;
    const { videoId, title, channelTitle, thumbnailUrl, addedById, addedByName } = req.body;
    if (!roomId || !videoId || !title) {
      res.status(400).json({ error: 'Room ID, videoId, and title are required.' });
      return;
    }

    const item = RoomQueueService.addToQueue(roomId, {
      videoId,
      title,
      channelTitle,
      thumbnailUrl,
      addedById: addedById || 'viewer',
      addedByName: addedByName || 'Viewer',
    });

    res.status(201).json({ item });
  }

  public static removeFromQueue(req: Request, res: Response): void {
    const roomId = req.params.roomId as string;
    const queueId = req.params.queueId as string;
    if (!roomId || !queueId) {
      res.status(400).json({ error: 'Room ID and Queue Item ID are required.' });
      return;
    }

    const success = RoomQueueService.removeFromQueue(roomId, queueId);
    res.json({ success });
  }

  public static advanceQueue(req: Request, res: Response): void {
    const roomId = req.params.roomId as string;
    if (!roomId) {
      res.status(400).json({ error: 'Room ID required.' });
      return;
    }

    const nextItem = RoomQueueService.advanceQueue(roomId);
    if (nextItem) {
      const room = RoomManager.getInstance().getRoom(roomId);
      if (room) {
        const fakeAuthor = { id: nextItem.addedById, username: nextItem.addedByName } as any;
        room.changeVideo(nextItem.videoId, fakeAuthor);
      }
    }

    res.json({ nextItem });
  }
}
