import {
  VideoItem,
  UserAccount,
  RoomQueueItem,
  SavedVideoItem,
  WatchHistoryItem,
  FollowedChannelItem,
  NotificationItem,
} from '../types';

import { getBackendUrl } from '../lib/socket';

const API_BASE = getBackendUrl();

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('syncora_auth_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Server responded with non-JSON (${res.status}): ${text.slice(0, 100)}`
    );
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Request failed with status ${res.status}`);
  }
  return res.json();
}

const UNPLAYABLE_STORAGE_KEY = 'syncora_unplayable_videos';

// Default list of videos known to be ended livestreams, deleted, or owner-restricted for embedding
const KNOWN_UNPLAYABLE = new Set<string>([
  'jfKfPfyJRdk', // Ended 2022 stream
  '4xDzrJKXOOY', // Ended 2022 stream
  '21X5lGlDOfg', // Ended ISS stream
  'Bey4XXJAqS8', // Deleted 404
  'dQw4w9WgXcQ', // Embedding restricted (Error 150)
  'fJ9rUzIMcZQ', // Embedding restricted (Error 150)
  'e-ORhEE9VVg', // Embedding restricted (Error 150)
  'kJQP7kiw5Fk', // Embedding restricted (Error 150)
]);

function getStoredUnplayable(): Set<string> {
  const set = new Set<string>(KNOWN_UNPLAYABLE);
  try {
    const raw = sessionStorage.getItem(UNPLAYABLE_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((id) => set.add(id));
      }
    }
  } catch (_) {}
  return set;
}

const unplayableVideos = getStoredUnplayable();

export function markVideoAsUnplayable(videoId: string): void {
  if (!videoId || typeof videoId !== 'string') return;
  const cleanId = videoId.trim();
  if (!cleanId) return;
  unplayableVideos.add(cleanId);
  try {
    sessionStorage.setItem(UNPLAYABLE_STORAGE_KEY, JSON.stringify(Array.from(unplayableVideos)));
  } catch (_) {}
}

export function isUnplayableVideo(videoId: string): boolean {
  if (!videoId || typeof videoId !== 'string') return false;
  return unplayableVideos.has(videoId.trim());
}

export function filterPlayableVideos<T extends { id?: string; videoId?: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => {
    const id = item.id || item.videoId;
    return id ? !unplayableVideos.has(id.trim()) : true;
  });
}

export const api = {
  // Videos & Discovery
  async searchVideos(params: { q?: string; type?: 'all' | 'video' | 'live'; category?: string; limit?: number }): Promise<{ items: VideoItem[]; totalResults: number; configuredWithApiKey?: boolean }> {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.type) query.set('type', params.type);
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/api/videos/search?${query.toString()}`);
    const data = await handleResponse<{ items: VideoItem[]; totalResults: number; configuredWithApiKey?: boolean }>(res);
    return {
      ...data,
      items: filterPlayableVideos(data.items || []),
    };
  },

  async getLiveStreams(category?: string): Promise<{ items: VideoItem[]; total: number }> {
    const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    const res = await fetch(`${API_BASE}/api/videos/live${query}`);
    const data = await handleResponse<{ items: VideoItem[]; total: number }>(res);
    return {
      ...data,
      items: filterPlayableVideos(data.items || []),
    };
  },

  async getPopularVideos(category?: string): Promise<{ items: VideoItem[]; total: number }> {
    const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    const res = await fetch(`${API_BASE}/api/videos/popular${query}`);
    const data = await handleResponse<{ items: VideoItem[]; total: number }>(res);
    return {
      ...data,
      items: filterPlayableVideos(data.items || []),
    };
  },

  async getVideoDetails(videoId: string): Promise<VideoItem> {
    const res = await fetch(`${API_BASE}/api/videos/${encodeURIComponent(videoId)}`);
    return handleResponse(res);
  },

  async getCategories(): Promise<{ id: string; name: string }[]> {
    const res = await fetch(`${API_BASE}/api/videos/categories`);
    return handleResponse(res);
  },

  // Auth
  async register(params: { username: string; password: string; displayName?: string; avatarColor?: string; bio?: string }): Promise<{ user: UserAccount; token: string }> {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await handleResponse<{ user: UserAccount; token: string }>(res);
    localStorage.setItem('syncora_auth_token', data.token);
    localStorage.setItem('syncora_username', data.user.displayName || data.user.username);
    return data;
  },

  async login(params: { username: string; password: string }): Promise<{ user: UserAccount; token: string }> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await handleResponse<{ user: UserAccount; token: string }>(res);
    localStorage.setItem('syncora_auth_token', data.token);
    localStorage.setItem('syncora_username', data.user.displayName || data.user.username);
    return data;
  },

  async getMe(): Promise<{ user: UserAccount }> {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async updateProfile(data: { displayName?: string; avatarColor?: string; bio?: string }): Promise<{ user: UserAccount }> {
    const res = await fetch(`${API_BASE}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  logout(): void {
    localStorage.removeItem('syncora_auth_token');
  },

  // Saved / Watch Later
  async getSavedVideos(): Promise<{ items: SavedVideoItem[] }> {
    const res = await fetch(`${API_BASE}/api/user/saved`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async saveVideo(video: { videoId: string; title: string; channelTitle?: string; thumbnailUrl?: string; duration?: string; isLive?: boolean }): Promise<{ item: SavedVideoItem }> {
    const res = await fetch(`${API_BASE}/api/user/saved`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(video),
    });
    return handleResponse(res);
  },

  async removeSavedVideo(videoId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/api/user/saved/${encodeURIComponent(videoId)}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Watch History
  async getWatchHistory(): Promise<{ items: WatchHistoryItem[] }> {
    const res = await fetch(`${API_BASE}/api/user/history`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async recordHistory(video: { videoId: string; title: string; channelTitle?: string; thumbnailUrl?: string; progressSeconds?: number }): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/api/user/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(video),
    });
    return handleResponse(res);
  },

  async clearHistory(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/api/user/history`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Followed Channels
  async getFollowedChannels(): Promise<{ items: FollowedChannelItem[] }> {
    const res = await fetch(`${API_BASE}/api/user/follows`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async followChannel(channel: { channelId: string; channelTitle: string; avatarUrl?: string }): Promise<{ item: FollowedChannelItem }> {
    const res = await fetch(`${API_BASE}/api/user/follows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(channel),
    });
    return handleResponse(res);
  },

  async unfollowChannel(channelId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/api/user/follows/${encodeURIComponent(channelId)}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Notifications
  async getNotifications(): Promise<{ items: NotificationItem[] }> {
    const res = await fetch(`${API_BASE}/api/user/notifications`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async markNotificationsRead(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/api/user/notifications/read`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Content Reports
  async reportContent(params: { targetType: 'message' | 'user' | 'room'; targetId: string; reason: string; details?: string }): Promise<{ id: string; success: boolean }> {
    const res = await fetch(`${API_BASE}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  // Room Queue
  async getRoomQueue(roomId: string): Promise<{ items: RoomQueueItem[] }> {
    const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(roomId)}/queue`);
    return handleResponse(res);
  },

  async addToRoomQueue(roomId: string, video: { videoId: string; title: string; channelTitle?: string; thumbnailUrl?: string; addedById?: string; addedByName?: string }): Promise<{ item: RoomQueueItem }> {
    const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(roomId)}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(video),
    });
    return handleResponse(res);
  },

  async removeFromRoomQueue(roomId: string, queueId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(roomId)}/queue/${encodeURIComponent(queueId)}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async advanceRoomQueue(roomId: string): Promise<{ nextItem: RoomQueueItem | null }> {
    const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(roomId)}/queue/next`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Creator Broadcasting
  async getBroadcastStatus(): Promise<{ provider: string; isConfigured: boolean; missingCredentials: string[] }> {
    const res = await fetch(`${API_BASE}/api/broadcasts/status`);
    return handleResponse(res);
  },

  async createBroadcast(title?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/broadcasts/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ title }),
    });
    return handleResponse(res);
  },
};
