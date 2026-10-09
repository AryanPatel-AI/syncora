export type Role = 'HOST' | 'MODERATOR' | 'PARTICIPANT';

export type PlayState = 'playing' | 'paused' | 'buffering';

export interface PlaybackState {
  videoId: string | null;
  playState: PlayState;
  currentTime: number; // in seconds
  lastUpdatedAt: number; // unix timestamp ms
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

export interface ParticipantJSON {
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
  participants: ParticipantJSON[];
}

export interface RoomStateSnapshot {
  roomId: string;
  hostId: string;
  playback: PlaybackState;
  participants: ParticipantJSON[];
  pendingRequests: ControlRequest[];
  chatHistory: ChatMessage[];
  likeCount: number;
  audienceCount: number;
  slowModeSeconds?: number;
  pinnedMessages?: ChatMessage[];
}
