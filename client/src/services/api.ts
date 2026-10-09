import {
  VideoItem,
  UserAccount,
  RoomQueueItem,
  SavedVideoItem,
  WatchHistoryItem,
  FollowedChannelItem,
  NotificationItem,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('syncora_auth_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Request failed with status ${res.status}`);
  }
  return res.json();
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
    return handleResponse(res);
  },

  async getLiveStreams(category?: string): Promise<{ items: VideoItem[]; total: number }> {
    const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    const res = await fetch(`${API_BASE}/api/videos/live${query}`);
    return handleResponse(res);
  },

  async getPopularVideos(category?: string): Promise<{ items: VideoItem[]; total: number }> {
    const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    const res = await fetch(`${API_BASE}/api/videos/popular${query}`);
    return handleResponse(res);
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
