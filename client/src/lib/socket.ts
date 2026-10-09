import { io, Socket } from 'socket.io-client';

/**
 * Resolves the backend server URL from Vite environment variables.
 * In production on Vercel, VITE_SOCKET_URL or VITE_API_URL points to the deployed Render backend.
 * Fallbacks include VITE_SERVER_URL, VITE_BACKEND_URL, or local port 4000.
 */
export function getBackendUrl(): string {
  const envUrl =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_SERVER_URL ||
    import.meta.env.VITE_BACKEND_URL;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    if (window.location.port === '5173' || window.location.port === '3000') {
      return 'http://localhost:4000';
    }
    return window.location.origin;
  }
  return 'http://localhost:4000';
}

export const BACKEND_URL = getBackendUrl();
export const SOCKET_URL = BACKEND_URL;
export const API_URL = import.meta.env.VITE_API_URL
  ? String(import.meta.env.VITE_API_URL).trim().replace(/\/+$/, '')
  : BACKEND_URL;

/**
 * Shared singleton Socket.IO client instance.
 * Reconnects automatically and maintains connection state.
 */
export const socket: Socket = io(BACKEND_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 15,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ['websocket', 'polling'],
});

export const SOCKET_EVENTS = {
  // Client -> Server
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  PLAY: 'play',
  PAUSE: 'pause',
  SEEK: 'seek',
  CHANGE_VIDEO: 'change_video',
  ASSIGN_ROLE: 'assign_role',
  REMOVE_PARTICIPANT: 'remove_participant',
  TRANSFER_HOST: 'transfer_host',
  REQUEST_CONTROL: 'request_control',
  REQUEST_PLAYBACK_CHANGE: 'request_playback_change',
  HANDLE_CONTROL_REQUEST: 'handle_control_request',
  APPROVE_REQUEST: 'approve_request',
  REJECT_REQUEST: 'reject_request',
  SEND_CHAT: 'send_chat',
  SEND_REACTION: 'send_reaction',
  SYNC_PING: 'sync_ping',
  DELETE_MESSAGE: 'delete_message',
  PIN_MESSAGE: 'pin_message',
  TIMEOUT_USER: 'timeout_user',
  TOGGLE_SLOW_MODE: 'toggle_slow_mode',
  UPDATE_QUEUE: 'update_queue',

  // Server -> Client
  ROOM_SNAPSHOT: 'room_snapshot',
  PARTICIPANTS_UPDATED: 'participants_updated',
  PRESENCE_UPDATED: 'presence_updated',
  SYNC_STATE: 'sync_state',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  ROLE_ASSIGNED: 'role_assigned',
  PARTICIPANT_REMOVED: 'participant_removed',
  HOST_TRANSFERRED: 'host_transferred',
  CONTROL_REQUEST_SUBMITTED: 'control_request_submitted',
  CONTROL_REQUEST_UPDATED: 'control_request_updated',
  CHAT_MESSAGE: 'chat_message',
  MESSAGE_DELETED: 'message_deleted',
  MESSAGE_PINNED: 'message_pinned',
  USER_TIMED_OUT: 'user_timed_out',
  QUEUE_UPDATED: 'queue_updated',
  SLOW_MODE_UPDATED: 'slow_mode_updated',
  REACTION_RECEIVED: 'reaction_received',
  SYNC_PONG: 'sync_pong',
  ERROR_MESSAGE: 'error_message',
  ROOM_ERROR: 'room_error',
  ROOM_CLOSED: 'room_closed',
} as const;

export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
