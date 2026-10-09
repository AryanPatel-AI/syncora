import crypto from 'crypto';
import { db } from '../database/db';
import { AVATAR_COLORS } from '../config/constants';

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  bio?: string;
  createdAt: number;
}

const TOKEN_SECRET = process.env.SESSION_SECRET || 'syncora_jwt_secret_dev_389271638';

export class AuthService {
  private static hashPassword(password: string, salt: string): string {
    return crypto.scryptSync(password, salt, 64).toString('hex');
  }

  public static generateToken(user: UserAccount): string {
    const payload = JSON.stringify({
      id: user.id,
      username: user.username,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
    });
    const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
    return Buffer.from(payload).toString('base64url') + '.' + signature;
  }

  public static verifyToken(tokenString: string): { id: string; username: string } | null {
    try {
      const parts = tokenString.split('.');
      if (parts.length !== 2) return null;
      const [payloadB64, signature] = parts;
      const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
      const expectedSignature = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadStr).digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null;
      }

      const parsed = JSON.parse(payloadStr);
      if (parsed.exp && parsed.exp < Date.now()) {
        return null;
      }

      return { id: parsed.id, username: parsed.username };
    } catch {
      return null;
    }
  }

  public static register(params: {
    username: string;
    password: string;
    displayName?: string;
    avatarColor?: string;
    bio?: string;
  }): { user: UserAccount; token: string } {
    const username = params.username.trim().toLowerCase();
    if (!username || username.length < 3 || username.length > 25) {
      throw new Error('Username must be between 3 and 25 characters.');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw new Error('Username can only contain alphanumeric characters, underscores, and dashes.');
    }
    if (!params.password || params.password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // Check uniqueness
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      throw new Error('Username is already taken.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = this.hashPassword(params.password, salt);
    const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const displayName = params.displayName?.trim() || params.username.trim();
    const avatarColor = params.avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const bio = params.bio?.trim() || '';
    const now = Date.now();

    db.prepare(`
      INSERT INTO users (id, username, password_hash, salt, display_name, avatar_color, bio, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, username, hash, salt, displayName, avatarColor, bio, now);

    const user: UserAccount = {
      id: userId,
      username,
      displayName,
      avatarColor,
      bio,
      createdAt: now,
    };

    const token = this.generateToken(user);
    return { user, token };
  }

  public static login(usernameRaw: string, passwordRaw: string): { user: UserAccount; token: string } {
    const username = usernameRaw.trim().toLowerCase();
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

    if (!row) {
      throw new Error('Invalid username or password.');
    }

    const testHash = this.hashPassword(passwordRaw, row.salt);
    if (!crypto.timingSafeEqual(Buffer.from(testHash), Buffer.from(row.password_hash))) {
      throw new Error('Invalid username or password.');
    }

    const user: UserAccount = {
      id: row.id,
      username: row.username,
      displayName: row.display_name || row.username,
      avatarColor: row.avatar_color,
      bio: row.bio,
      createdAt: row.created_at,
    };

    const token = this.generateToken(user);
    return { user, token };
  }

  public static getUserById(userId: string): UserAccount | null {
    const row = db.prepare('SELECT id, username, display_name, avatar_color, bio, created_at FROM users WHERE id = ?').get(userId) as any;
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      displayName: row.display_name || row.username,
      avatarColor: row.avatar_color,
      bio: row.bio,
      createdAt: row.created_at,
    };
  }

  public static updateProfile(userId: string, data: { displayName?: string; avatarColor?: string; bio?: string }): UserAccount {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found.');

    const newDisplayName = data.displayName?.trim() || user.displayName;
    const newAvatarColor = data.avatarColor || user.avatarColor;
    const newBio = typeof data.bio === 'string' ? data.bio.trim() : user.bio;

    db.prepare(`
      UPDATE users SET display_name = ?, avatar_color = ?, bio = ? WHERE id = ?
    `).run(newDisplayName, newAvatarColor, newBio, userId);

    return {
      ...user,
      displayName: newDisplayName,
      avatarColor: newAvatarColor,
      bio: newBio,
    };
  }
}
