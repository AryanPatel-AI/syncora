export const SERVER_CONFIG = {
  PORT: process.env.PORT || 4000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DEFAULT_VIDEO_ID: 'aqz-KE-bpKQ', // Big Buck Bunny 4K - 100% reliable embed
  MAX_CHAT_HISTORY: 100,
  DRIFT_THRESHOLD_SECONDS: 1.75,
} as const;

export const AVATAR_COLORS = [
  '#8067F5', // Electric Violet
  '#A99BFF', // Lavender Glow
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
] as const;
