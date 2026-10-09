export type Role = 'HOST' | 'MODERATOR' | 'PARTICIPANT' | 'VIEWER';

export type PlayState = 'playing' | 'paused' | 'buffering';

export interface PlaybackState {
  videoId: string;
  playState: PlayState;
  currentTime: number;
  lastUpdatedAt: number;
  playbackRate: number;
  updatedBy: {
    userId: string;
    username: string;
  };
  isLive?: boolean;
}

export type ControlRequestType =
  | 'REQUEST_MODERATOR'
  | 'REQUEST_CONTROL'
  | 'REQUEST_CHANGE_VIDEO'
  | 'change_video'
  | 'play'
  | 'pause'
  | 'seek'
  | string;

export interface ControlRequest {
  id: string;
  userId: string;
  username: string;
  role: Role;
  type: string;
  action?: string;
  requestedVideoId?: string;
  requestedVideoTitle?: string;
  requestedTime?: number;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Participant {
  id: string;
  username: string;
  role: Role;
  joinedAt: number;
  avatarColor: string;
  isHost: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  username?: string;
  senderRole?: Role;
  role?: Role;
  content: string;
  text?: string;
  type: 'user' | 'system';
  timestamp: number;
  isPinned?: boolean;
  isDeleted?: boolean;
}

export interface ReactionPayload {
  id: string;
  emoji: string;
  type?: string;
  senderId: string;
  senderName: string;
  count?: number;
  likeCount?: number;
  timestamp: number;
}

export interface PresencePayload {
  count: number;
  participants: Participant[];
}

export interface RoomStateSnapshot {
  roomId: string;
  hostId: string;
  playback: PlaybackState;
  participants: Participant[];
  pendingRequests: ControlRequest[];
  chatHistory: ChatMessage[];
  likeCount?: number;
  audienceCount?: number;
  slowModeSeconds?: number;
  pinnedMessages?: ChatMessage[];
}

export interface SyncStatus {
  isSynced: boolean;
  driftSeconds: number;
  latencyMs: number;
  state: 'synced' | 'catching_up' | 'disconnected';
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  channelAvatarUrl?: string;
  publishedAt: string;
  isLive: boolean;
  isUpcoming?: boolean;
  scheduledStartTime?: string;
  duration?: string;
  durationSeconds?: number;
  viewCount?: number;
  concurrentViewers?: number;
  likeCount?: number;
  category?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  bio?: string;
  createdAt: number;
}

export interface RoomQueueItem {
  id: string;
  roomId: string;
  videoId: string;
  title: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  addedById: string;
  addedByName: string;
  position: number;
  addedAt: number;
}

export interface SavedVideoItem {
  id: string;
  userId: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration?: string;
  isLive: boolean;
  savedAt: number;
}

export interface WatchHistoryItem {
  id: string;
  userId: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  progressSeconds: number;
  watchedAt: number;
}

export interface FollowedChannelItem {
  id: string;
  userId: string;
  channelId: string;
  channelTitle: string;
  avatarUrl?: string;
  followedAt: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'invite' | 'system' | 'moderation' | 'stream';
  link?: string;
  isRead: boolean;
  createdAt: number;
}
