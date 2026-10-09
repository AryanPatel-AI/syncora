export type Role = 'HOST' | 'MODERATOR' | 'PARTICIPANT';

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
}

export type ControlRequestType = 'REQUEST_MODERATOR' | 'REQUEST_CONTROL' | 'REQUEST_CHANGE_VIDEO';

export interface ControlRequest {
  id: string;
  userId: string;
  username: string;
  role: Role;
  type: ControlRequestType;
  requestedVideoId?: string;
  requestedVideoTitle?: string;
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
  senderRole?: Role;
  content: string;
  type: 'user' | 'system';
  timestamp: number;
}

export interface ReactionPayload {
  id: string;
  emoji: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

export interface RoomStateSnapshot {
  roomId: string;
  hostId: string;
  playback: PlaybackState;
  participants: Participant[];
  pendingRequests: ControlRequest[];
  chatHistory: ChatMessage[];
}

export interface SyncStatus {
  isSynced: boolean;
  driftSeconds: number;
  latencyMs: number;
  state: 'synced' | 'catching_up' | 'disconnected';
}
