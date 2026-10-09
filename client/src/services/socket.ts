import { io, Socket } from 'socket.io-client';

// Use environment variable if provided, else use empty string for same-origin or localhost:4000 in dev
const SERVER_URL = import.meta.env.VITE_SERVER_URL || (
  window.location.port === '5173' ? 'http://localhost:4000' : ''
);

export const socket: Socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
});

export const SOCKET_EVENTS = {
  // Client -> Server
  JOIN_ROOM: 'join_room',
  CREATE_ROOM: 'create_room',
  LEAVE_ROOM: 'leave_room',
  PLAY: 'play',
  PAUSE: 'pause',
  SEEK: 'seek',
  CHANGE_VIDEO: 'change_video',
  ASSIGN_ROLE: 'assign_role',
  REMOVE_PARTICIPANT: 'remove_participant',
  TRANSFER_HOST: 'transfer_host',
  REQUEST_CONTROL: 'request_control',
  HANDLE_CONTROL_REQUEST: 'handle_control_request',
  SEND_CHAT: 'send_chat',
  SEND_REACTION: 'send_reaction',
  SYNC_PING: 'sync_ping',

  // Server -> Client
  SYNC_STATE: 'sync_state',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  ROLE_ASSIGNED: 'role_assigned',
  PARTICIPANT_REMOVED: 'participant_removed',
  HOST_TRANSFERRED: 'host_transferred',
  CONTROL_REQUEST_SUBMITTED: 'control_request_submitted',
  CONTROL_REQUEST_UPDATED: 'control_request_updated',
  CHAT_MESSAGE: 'chat_message',
  REACTION_RECEIVED: 'reaction_received',
  SYNC_PONG: 'sync_pong',
  ERROR_MESSAGE: 'error_message',
  ROOM_CLOSED: 'room_closed',
} as const;
