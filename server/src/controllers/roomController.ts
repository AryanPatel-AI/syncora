import { Request, Response } from 'express';
import { RoomManager } from '../services/RoomManager';

export class RoomController {
  public static getHealth(_req: Request, res: Response): void {
    const roomManager = RoomManager.getInstance();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      activeRooms: roomManager.getRoomCount(),
      service: 'Syncora Watch Party Engine',
    });
  }

  public static getRoomInfo(req: Request, res: Response): void {
    const roomId = req.params.roomId as string;
    const roomManager = RoomManager.getInstance();
    const room = roomManager.getRoom(roomId);

    if (!room) {
      res.status(404).json({ exists: false, message: 'Room not found' });
      return;
    }

    res.json({
      exists: true,
      roomId: room.id,
      participantCount: room.getParticipantCount(),
      videoId: room.getPlaybackState().videoId,
      playState: room.getPlaybackState().playState,
    });
  }
}
