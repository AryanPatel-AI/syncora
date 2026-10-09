import { Request, Response } from 'express';
import { BroadcastService } from '../services/BroadcastService';
import { AuthenticatedRequest } from '../utils/authMiddleware';

export class BroadcastController {
  public static getStatus(_req: Request, res: Response): void {
    const status = BroadcastService.getConfigurationStatus();
    res.json(status);
  }

  public static createBroadcast(req: AuthenticatedRequest, res: Response): void {
    const creatorId = req.user?.id || 'guest_creator';
    const creatorName = req.user?.username || 'Creator';
    const title = req.body?.title || 'Live Stream';

    const result = BroadcastService.createBroadcast(creatorId, creatorName, title);
    if (result.requiresCredentials) {
      res.status(503).json(result);
      return;
    }

    res.status(201).json(result);
  }

  public static getBroadcast(req: Request, res: Response): void {
    const broadcast = BroadcastService.getBroadcast(req.params.id as string);
    if (!broadcast) {
      res.status(404).json({ error: 'Broadcast session not found.' });
      return;
    }
    res.json(broadcast);
  }

  public static endBroadcast(req: AuthenticatedRequest, res: Response): void {
    const creatorId = req.user?.id || 'guest_creator';
    const success = BroadcastService.endBroadcast(req.params.id as string, creatorId);
    res.json({ success });
  }

  public static webhook(req: Request, res: Response): void {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signature = req.headers['mux-signature'] as string;
    const result = BroadcastService.handleWebhook(rawBody, signature);
    res.status(result.verified ? 200 : 400).json(result);
  }
}
