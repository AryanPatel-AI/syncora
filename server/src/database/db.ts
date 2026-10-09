import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || path.resolve(__dirname, '../../watchparty.db');

// Ensure parent directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable WAL mode for high performance concurrent reads and writes
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      host_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      play_state TEXT NOT NULL DEFAULT 'paused',
      current_time REAL NOT NULL DEFAULT 0,
      last_updated_at INTEGER NOT NULL,
      playback_rate REAL NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      username TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'PARTICIPANT',
      avatar_color TEXT NOT NULL,
      joined_at INTEGER NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT,
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'user',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      display_name TEXT,
      avatar_color TEXT,
      bio TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_videos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      channel_title TEXT,
      thumbnail_url TEXT,
      duration TEXT,
      is_live INTEGER DEFAULT 0,
      saved_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS watch_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      channel_title TEXT,
      thumbnail_url TEXT,
      progress_seconds REAL DEFAULT 0,
      watched_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS followed_channels (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      channel_title TEXT NOT NULL,
      avatar_url TEXT,
      followed_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS room_queues (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      channel_title TEXT,
      thumbnail_url TEXT,
      added_by_id TEXT NOT NULL,
      added_by_name TEXT NOT NULL,
      position INTEGER NOT NULL,
      added_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'system',
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_participants_room_id ON participants(room_id);
    CREATE INDEX IF NOT EXISTS idx_chat_room_id ON chat_messages(room_id);
    CREATE INDEX IF NOT EXISTS idx_saved_videos_user ON saved_videos(user_id);
    CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_followed_channels_user ON followed_channels(user_id);
    CREATE INDEX IF NOT EXISTS idx_room_queues_room ON room_queues(room_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `);

  // Safe migration for columns if chat_messages already exists
  try {
    db.exec(`ALTER TABLE chat_messages ADD COLUMN is_pinned INTEGER DEFAULT 0;`);
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE chat_messages ADD COLUMN is_deleted INTEGER DEFAULT 0;`);
  } catch (_) {}

  console.log('[SQLite Database] Persistent storage initialized at:', dbPath);
}
