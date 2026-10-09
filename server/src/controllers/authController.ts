import { Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthenticatedRequest } from '../utils/authMiddleware';

export class AuthController {
  public static register(req: AuthenticatedRequest, res: Response): void {
    try {
      const { username, password, displayName, avatarColor, bio } = req.body;
      const result = AuthService.register({ username, password, displayName, avatarColor, bio });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Registration failed' });
    }
  }

  public static login(req: AuthenticatedRequest, res: Response): void {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required.' });
        return;
      }
      const result = AuthService.login(username, password);
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message || 'Login failed' });
    }
  }

  public static getMe(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const user = AuthService.getUserById(req.user.id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json({ user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static updateProfile(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const updated = AuthService.updateProfile(req.user.id, req.body);
      res.json({ user: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
