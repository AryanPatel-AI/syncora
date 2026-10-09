import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { socket, SOCKET_EVENTS } from '../services/socket';
import { api } from '../services/api';
import { DEFAULT_VIDEO_ID } from '../utils/constants';
import {
  Role,
  PlayState,
  PlaybackState,
  Participant,
  ControlRequest,
  ControlRequestType,
  ChatMessage,
  ReactionPayload,
  SyncStatus,
  RoomStateSnapshot,
  UserAccount,
  RoomQueueItem,
} from '../types';

interface WatchPartyContextType {
  // Room state
  roomId: string | null;
  currentUser: Participant | null;
  isHost: boolean;
  isModerator: boolean;
  canControl: boolean;
  playback: PlaybackState;
  participants: Participant[];
  pendingRequests: ControlRequest[];
  chatHistory: ChatMessage[];
  syncStatus: SyncStatus;
  reactions: ReactionPayload[];
  likeCount: number;
  audienceCount: number;
  toastMessage: { text: string; type: 'info' | 'error' | 'success' } | null;
  isConnected: boolean;
  connectionError: string | null;

  // Room actions
  createRoom: (username: string, initialVideoId?: string) => Promise<string>;
  joinRoom: (roomId: string, username: string) => Promise<boolean>;
  leaveRoom: () => void;
  playVideo: (time?: number) => void;
  pauseVideo: (time?: number) => void;
  seekVideo: (time: number) => void;
  changeVideo: (videoId: string) => void;
  assignRole: (userId: string, role: Role) => void;
  removeParticipant: (userId: string) => void;
  transferHost: (userId: string) => void;
  requestControl: (type?: ControlRequestType, videoId?: string, videoTitle?: string) => void;
  requestPlaybackChange: (
    action: 'play' | 'pause' | 'seek' | 'change_video',
    requestedVideoId?: string,
    requestedTime?: number
  ) => void;
  handleControlRequest: (requestId: string, action: 'approved' | 'rejected') => void;
  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
  sendChat: (message: string) => void;
  sendReaction: (emoji?: string, type?: string) => void;
  sendLike: () => void;
  clearToast: () => void;
  showToast: (text: string, type?: 'info' | 'error' | 'success') => void;
  updateLocalPlaybackTime: (time: number) => void;

  // Live DVR & Catch-up Viewing Mode
  isLiveSynced: boolean;
  setIsLiveSynced: (synced: boolean) => void;
  timeBehindLive: number;
  setTimeBehindLive: (seconds: number) => void;
  localPlayState: PlayState;
  setLocalPlayState: (state: PlayState) => void;
  returnToLive: (playerRef?: any) => void;
  getAuthoritativeTime: () => number;

  // Moderation state & actions
  slowModeSeconds: number;
  pinnedMessages: ChatMessage[];
  deleteMessage: (messageId: string) => void;
  pinMessage: (messageId: string, pinned?: boolean) => void;
  timeoutUser: (userId: string, durationSeconds?: number) => void;
  toggleSlowMode: (seconds: number) => void;

  // Room Queue
  roomQueue: RoomQueueItem[];
  addToQueue: (video: { videoId: string; title: string; channelTitle?: string; thumbnailUrl?: string }) => Promise<void>;
  removeFromQueue: (queueId: string) => Promise<void>;
  playNextInQueue: () => Promise<void>;

  // Routing & Global App Navigation
  currentRoute: string;
  activeVideoId: string | null;
  activeCategory: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  navigateTo: (path: string) => void;

  // Authentication & Profile
  currentUserAccount: UserAccount | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
  logout: () => void;
  refreshAuth: () => Promise<void>;

  // Room creation modals
  isCreateRoomModalOpen: boolean;
  setIsCreateRoomModalOpen: (open: boolean) => void;
  isScheduleModalOpen: boolean;
  setIsScheduleModalOpen: (open: boolean) => void;
}

const initialPlayback: PlaybackState = {
  videoId: DEFAULT_VIDEO_ID,
  playState: 'paused',
  currentTime: 0,
  lastUpdatedAt: Date.now(),
  playbackRate: 1,
  updatedBy: {
    userId: 'system',
    username: 'System',
  },
};

const initialSyncStatus: SyncStatus = {
  isSynced: true,
  driftSeconds: 0,
  latencyMs: 15,
  state: 'synced',
};

const WatchPartyContext = createContext<WatchPartyContextType | undefined>(undefined);

export const WatchPartyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [playback, setPlayback] = useState<PlaybackState>(initialPlayback);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ControlRequest[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(initialSyncStatus);
  const [reactions, setReactions] = useState<ReactionPayload[]>([]);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [audienceCount, setAudienceCount] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Moderation state
  const [slowModeSeconds, setSlowModeSeconds] = useState<number>(0);

  // Live DVR & Catch-up Viewing Mode
  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(true);
  const [timeBehindLive, setTimeBehindLive] = useState<number>(0);
  const [localPlayState, setLocalPlayState] = useState<PlayState>('playing');

  const getAuthoritativeTime = useCallback(() => {
    if (playback.playState === 'playing') {
      const elapsed = (Date.now() - playback.lastUpdatedAt) / 1000;
      return Math.max(0, playback.currentTime + elapsed * playback.playbackRate);
    }
    return Math.max(0, playback.currentTime);
  }, [playback]);

  // Room Queue state
  const [roomQueue, setRoomQueue] = useState<RoomQueueItem[]>([]);

  // Navigation & routing state
  const [currentRoute, setCurrentRoute] = useState<string>(() => window.location.pathname || '/');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);

  // User account
  const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount | null>(null);

  const showToast = useCallback((text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  }, []);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // Fetch user account on mount
  const refreshAuth = useCallback(async () => {
    const token = localStorage.getItem('syncora_auth_token');
    if (!token) {
      setCurrentUserAccount(null);
      return;
    }
    try {
      const data = await api.getMe();
      if (data?.user) {
        setCurrentUserAccount(data.user);
      }
    } catch {
      localStorage.removeItem('syncora_auth_token');
      setCurrentUserAccount(null);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const logout = useCallback(() => {
    api.logout();
    setCurrentUserAccount(null);
    showToast('Signed out successfully.', 'info');
  }, [showToast]);

  // Route parser helper
  const parseCurrentUrl = useCallback(() => {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);

    setCurrentRoute(path);

    if (parts.length >= 2 && parts[0] === 'watch') {
      setActiveVideoId(parts[1]);
    } else {
      setActiveVideoId(null);
    }

    if (parts.length >= 2 && parts[0] === 'categories') {
      setActiveCategory(parts[1]);
    } else {
      setActiveCategory(null);
    }
  }, []);

  useEffect(() => {
    parseCurrentUrl();
    window.addEventListener('popstate', parseCurrentUrl);
    return () => window.removeEventListener('popstate', parseCurrentUrl);
  }, [parseCurrentUrl]);

  const navigateTo = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    parseCurrentUrl();
  }, [parseCurrentUrl]);

  // Fetch Room Queue helper
  const fetchRoomQueue = useCallback(async (targetRoomId: string) => {
    try {
      const data = await api.getRoomQueue(targetRoomId);
      if (Array.isArray(data.items)) {
        setRoomQueue(data.items);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (roomId) {
      fetchRoomQueue(roomId);
    } else {
      setRoomQueue([]);
    }
  }, [roomId, fetchRoomQueue]);

  // Socket Connection & Event Listeners
  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log('[Socket] Connected to Syncora server');
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setSyncStatus((prev) => ({ ...prev, state: 'disconnected', isSynced: false }));
      showToast('Lost connection to server. Reconnecting...', 'error');
    };

    const onConnectError = (err: any) => {
      setIsConnected(false);
      setConnectionError('Backend server is currently unreachable.');
      console.warn('[Socket] Connection error:', err?.message);
    };

    const onRoomSnapshot = (snapshot: any) => {
      if (!snapshot) return;
      const actualRoom = snapshot.room || snapshot;
      if (actualRoom.roomId) setRoomId(actualRoom.roomId);
      if (typeof actualRoom.likeCount === 'number') setLikeCount(actualRoom.likeCount);
      if (typeof actualRoom.audienceCount === 'number') setAudienceCount(actualRoom.audienceCount);
      else if (Array.isArray(actualRoom.participants)) setAudienceCount(actualRoom.participants.length);
      if (actualRoom.playback) {
        setPlayback(actualRoom.playback);
        setLocalPlayState(actualRoom.playback.playState);
      }
      if (typeof actualRoom.slowModeSeconds === 'number') setSlowModeSeconds(actualRoom.slowModeSeconds);
      if (Array.isArray(actualRoom.participants)) {
        setParticipants(actualRoom.participants);
        setCurrentUser((prev) => {
          if (snapshot.user) return snapshot.user;
          if (snapshot.participant) return snapshot.participant;
          if (!prev) return null;
          const matching = actualRoom.participants.find((p: any) => p.id === prev.id);
          return matching || prev;
        });
      }
      if (Array.isArray(actualRoom.pendingRequests)) setPendingRequests(actualRoom.pendingRequests);
      if (Array.isArray(actualRoom.chatHistory)) setChatHistory(actualRoom.chatHistory);
    };

    const onParticipantsUpdated = (data: { participants: Participant[]; count?: number }) => {
      if (Array.isArray(data?.participants)) {
        setParticipants(data.participants);
        setAudienceCount(typeof data.count === 'number' ? data.count : data.participants.length);
        setCurrentUser((prev) => {
          if (!prev) return null;
          const matching = data.participants.find((p) => p.id === prev.id);
          return matching || prev;
        });
      }
    };

    const onPresenceUpdated = (data: { count: number; participants: Participant[] }) => {
      if (typeof data?.count === 'number') {
        setAudienceCount(data.count);
      }
      if (Array.isArray(data?.participants)) {
        setParticipants(data.participants);
        setCurrentUser((prev) => {
          if (!prev) return null;
          const matching = data.participants.find((p) => p.id === prev.id);
          return matching || prev;
        });
      }
    };

    const onSyncState = (newPlayback: PlaybackState) => {
      setPlayback((prev) => {
        if (newPlayback.videoId && newPlayback.videoId !== prev.videoId) {
          setIsLiveSynced(true);
          setTimeBehindLive(0);
          setLocalPlayState(newPlayback.playState);
        }
        return newPlayback;
      });
      setIsLiveSynced((synced) => {
        if (synced) {
          setLocalPlayState(newPlayback.playState);
        }
        return synced;
      });
    };

    const onUserJoined = (data: { username: string; userId: string; role: Role; participants: Participant[] }) => {
      if (Array.isArray(data.participants)) {
        setParticipants(data.participants);
      }
      setCurrentUser((prev) => {
        if (!prev) return null;
        const matching = data.participants?.find((p) => p.id === prev.id);
        return matching || prev;
      });
    };

    const onUserLeft = (data: { username: string; userId: string; participants: Participant[] }) => {
      if (Array.isArray(data.participants)) {
        setParticipants(data.participants);
      }
    };

    const onRoleAssigned = (data: { userId: string; username: string; role: Role; participants: Participant[] }) => {
      if (Array.isArray(data.participants)) {
        setParticipants(data.participants);
      }
      setCurrentUser((prev) => {
        if (!prev) return null;
        if (prev.id === data.userId) {
          const isHost = data.role === 'HOST';
          showToast(`Your role was updated to: ${data.role}`, isHost || data.role === 'MODERATOR' ? 'success' : 'info');
          return { ...prev, role: data.role, isHost };
        }
        return prev;
      });
    };

    const onParticipantRemoved = (data: { userId: string; participants: Participant[] }) => {
      if (Array.isArray(data.participants)) {
        setParticipants(data.participants);
      }
      setCurrentUser((prev) => {
        if (prev && prev.id === data.userId) {
          showToast('You were removed from the room by the host.', 'error');
          setRoomId(null);
          navigateTo('/');
          return null;
        }
        return prev;
      });
    };

    const onHostTransferred = (data: { previousHostId: string; newHostId: string; participants: Participant[] }) => {
      if (Array.isArray(data.participants)) {
        setParticipants(data.participants);
      }
      setCurrentUser((prev) => {
        if (!prev) return null;
        if (Array.isArray(data.participants)) {
          const matching = data.participants.find((p) => p.id === prev.id);
          if (matching) {
            if (prev.id === data.newHostId) {
              showToast('You are now the room Host!', 'success');
            } else if (prev.id === data.previousHostId) {
              showToast('Host ownership transferred.', 'info');
            }
            return matching;
          }
        }
        if (prev.id === data.newHostId) {
          showToast('You are now the room Host!', 'success');
          return { ...prev, role: 'HOST', isHost: true };
        }
        if (prev.id === data.previousHostId) {
          return { ...prev, isHost: false, role: 'MODERATOR' };
        }
        return prev;
      });
    };

    const onControlRequestSubmitted = (data: { request: ControlRequest; pendingRequests: ControlRequest[] }) => {
      if (Array.isArray(data.pendingRequests)) {
        setPendingRequests(data.pendingRequests);
      }
      showToast(`${data.request.username} requested playback permissions.`, 'info');
    };

    const onControlRequestUpdated = (data: {
      request: ControlRequest;
      pendingRequests: ControlRequest[];
      participants: Participant[];
      playback?: PlaybackState;
    }) => {
      if (Array.isArray(data.pendingRequests)) {
        setPendingRequests(data.pendingRequests);
      }
      if (Array.isArray(data.participants)) {
        setParticipants(data.participants);
      }
      if (data.playback) {
        setPlayback(data.playback);
      }
      if (data.request.status === 'approved') {
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
        }
        showToast(`Request by ${data.request.username} approved!`, 'success');
      } else {
        showToast(`Request by ${data.request.username} declined.`, 'info');
      }
    };

    const onChatMessage = (msg: ChatMessage) => {
      setChatHistory((prev) => [...prev, msg]);
    };

    const onMessageDeleted = (data: { messageId: string }) => {
      setChatHistory((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? { ...m, isDeleted: true, content: '[This message was removed by a moderator]', text: '[This message was removed by a moderator]' }
            : m
        )
      );
    };

    const onMessagePinned = (data: { message: ChatMessage; pinned: boolean }) => {
      setChatHistory((prev) =>
        prev.map((m) => (m.id === data.message.id ? { ...m, isPinned: data.pinned } : m))
      );
    };

    const onUserTimedOut = (data: { userId: string; username: string; durationSeconds: number }) => {
      setCurrentUser((user) => {
        if (user && user.id === data.userId) {
          showToast(`You have been timed out for ${data.durationSeconds}s.`, 'error');
        }
        return user;
      });
    };

    const onSlowModeUpdated = (data: { slowModeSeconds: number }) => {
      setSlowModeSeconds(data.slowModeSeconds);
    };

    const onQueueUpdated = () => {
      if (roomId) {
        fetchRoomQueue(roomId);
      }
    };

    const onReactionReceived = (reaction: ReactionPayload) => {
      if (typeof reaction.likeCount === 'number') {
        setLikeCount(reaction.likeCount);
      } else if (typeof reaction.count === 'number') {
        setLikeCount(reaction.count);
      }
      setReactions((prev) => [...prev.slice(-15), reaction]);
    };

    const onSyncPong = (data: { serverTime: number; playState: string; videoId: string; drift: number }) => {
      setSyncStatus({
        isSynced: data.drift < 1.75,
        driftSeconds: data.drift,
        latencyMs: 15,
        state: data.drift < 1.75 ? 'synced' : 'catching_up',
      });
    };

    const onErrorMessage = (data: { message: string }) => {
      showToast(data.message, 'error');
    };

    const onRoomError = (data: { error?: string; message?: string }) => {
      showToast(data.error || data.message || 'Room error occurred', 'error');
    };

    const onRoomClosed = () => {
      showToast('Room has been closed.', 'info');
      setRoomId(null);
      setCurrentUser(null);
      navigateTo('/');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on(SOCKET_EVENTS.ROOM_SNAPSHOT, onRoomSnapshot);
    socket.on(SOCKET_EVENTS.PARTICIPANTS_UPDATED, onParticipantsUpdated);
    socket.on(SOCKET_EVENTS.PRESENCE_UPDATED, onPresenceUpdated);
    socket.on(SOCKET_EVENTS.SYNC_STATE, onSyncState);
    socket.on(SOCKET_EVENTS.USER_JOINED, onUserJoined);
    socket.on(SOCKET_EVENTS.USER_LEFT, onUserLeft);
    socket.on(SOCKET_EVENTS.ROLE_ASSIGNED, onRoleAssigned);
    socket.on(SOCKET_EVENTS.PARTICIPANT_REMOVED, onParticipantRemoved);
    socket.on(SOCKET_EVENTS.HOST_TRANSFERRED, onHostTransferred);
    socket.on(SOCKET_EVENTS.CONTROL_REQUEST_SUBMITTED, onControlRequestSubmitted);
    socket.on(SOCKET_EVENTS.CONTROL_REQUEST_UPDATED, onControlRequestUpdated);
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, onChatMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, onMessageDeleted);
    socket.on(SOCKET_EVENTS.MESSAGE_PINNED, onMessagePinned);
    socket.on(SOCKET_EVENTS.USER_TIMED_OUT, onUserTimedOut);
    socket.on(SOCKET_EVENTS.SLOW_MODE_UPDATED, onSlowModeUpdated);
    socket.on(SOCKET_EVENTS.QUEUE_UPDATED, onQueueUpdated);
    socket.on(SOCKET_EVENTS.REACTION_RECEIVED, onReactionReceived);
    socket.on(SOCKET_EVENTS.SYNC_PONG, onSyncPong);
    socket.on(SOCKET_EVENTS.ERROR_MESSAGE, onErrorMessage);
    socket.on(SOCKET_EVENTS.ROOM_ERROR, onRoomError);
    socket.on(SOCKET_EVENTS.ROOM_CLOSED, onRoomClosed);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off(SOCKET_EVENTS.ROOM_SNAPSHOT, onRoomSnapshot);
      socket.off(SOCKET_EVENTS.PARTICIPANTS_UPDATED, onParticipantsUpdated);
      socket.off(SOCKET_EVENTS.PRESENCE_UPDATED, onPresenceUpdated);
      socket.off(SOCKET_EVENTS.SYNC_STATE, onSyncState);
      socket.off(SOCKET_EVENTS.USER_JOINED, onUserJoined);
      socket.off(SOCKET_EVENTS.USER_LEFT, onUserLeft);
      socket.off(SOCKET_EVENTS.ROLE_ASSIGNED, onRoleAssigned);
      socket.off(SOCKET_EVENTS.PARTICIPANT_REMOVED, onParticipantRemoved);
      socket.off(SOCKET_EVENTS.HOST_TRANSFERRED, onHostTransferred);
      socket.off(SOCKET_EVENTS.CONTROL_REQUEST_SUBMITTED, onControlRequestSubmitted);
      socket.off(SOCKET_EVENTS.CONTROL_REQUEST_UPDATED, onControlRequestUpdated);
      socket.off(SOCKET_EVENTS.CHAT_MESSAGE, onChatMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, onMessageDeleted);
      socket.off(SOCKET_EVENTS.MESSAGE_PINNED, onMessagePinned);
      socket.off(SOCKET_EVENTS.USER_TIMED_OUT, onUserTimedOut);
      socket.off(SOCKET_EVENTS.SLOW_MODE_UPDATED, onSlowModeUpdated);
      socket.off(SOCKET_EVENTS.QUEUE_UPDATED, onQueueUpdated);
      socket.off(SOCKET_EVENTS.REACTION_RECEIVED, onReactionReceived);
      socket.off(SOCKET_EVENTS.SYNC_PONG, onSyncPong);
      socket.off(SOCKET_EVENTS.ERROR_MESSAGE, onErrorMessage);
      socket.off(SOCKET_EVENTS.ROOM_ERROR, onRoomError);
      socket.off(SOCKET_EVENTS.ROOM_CLOSED, onRoomClosed);
    };
  }, [showToast, roomId, fetchRoomQueue, navigateTo]);

  // Actions
  const createRoom = useCallback(
    (username: string, initialVideoId?: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        let isSettled = false;
        const timer = setTimeout(() => {
          if (!isSettled) {
            isSettled = true;
            reject(new Error('Creating room timed out. Please check server connectivity.'));
          }
        }, 8000);

        socket.emit(
          SOCKET_EVENTS.CREATE_ROOM,
          { username, initialVideoId },
          (response: any) => {
            if (isSettled) return;
            isSettled = true;
            clearTimeout(timer);

            const user = response?.user || response?.participant;
            const snapshot = response?.roomState || response?.room;

            if (response && response.success && response.roomId && user) {
              setRoomId(response.roomId);
              setCurrentUser(user);
              if (snapshot) {
                if (typeof snapshot.likeCount === 'number') setLikeCount(snapshot.likeCount);
                if (typeof snapshot.audienceCount === 'number') setAudienceCount(snapshot.audienceCount);
                if (snapshot.playback) setPlayback(snapshot.playback);
                if (Array.isArray(snapshot.participants)) setParticipants(snapshot.participants);
                if (Array.isArray(snapshot.pendingRequests)) setPendingRequests(snapshot.pendingRequests);
                if (Array.isArray(snapshot.chatHistory)) setChatHistory(snapshot.chatHistory);
              }
              localStorage.setItem('syncora_username', username);
              navigateTo(`/room/${response.roomId}`);
              showToast(`Room created: ${response.roomId}`, 'success');
              resolve(response.roomId);
            } else {
              const errMsg = response?.error || 'Failed to create room';
              showToast(errMsg, 'error');
              reject(new Error(errMsg));
            }
          }
        );
      });
    },
    [showToast, navigateTo]
  );

  const joinRoom = useCallback(
    (targetRoomId: string, username: string): Promise<boolean> => {
      return new Promise((resolve) => {
        let isSettled = false;
        const timer = setTimeout(() => {
          if (!isSettled) {
            isSettled = true;
            showToast('Joining room timed out.', 'error');
            resolve(false);
          }
        }, 8000);

        socket.emit(
          SOCKET_EVENTS.JOIN_ROOM,
          { roomId: targetRoomId.toUpperCase(), username },
          (response: any) => {
            if (isSettled) return;
            isSettled = true;
            clearTimeout(timer);

            const user = response?.user || response?.participant;
            const snapshot = response?.roomState || response?.room;

            if (response && response.success && response.roomId && user) {
              setRoomId(response.roomId);
              setCurrentUser(user);
              if (snapshot) {
                if (typeof snapshot.likeCount === 'number') setLikeCount(snapshot.likeCount);
                if (typeof snapshot.audienceCount === 'number') setAudienceCount(snapshot.audienceCount);
                if (snapshot.playback) setPlayback(snapshot.playback);
                if (Array.isArray(snapshot.participants)) setParticipants(snapshot.participants);
                if (Array.isArray(snapshot.pendingRequests)) setPendingRequests(snapshot.pendingRequests);
                if (Array.isArray(snapshot.chatHistory)) setChatHistory(snapshot.chatHistory);
              }
              localStorage.setItem('syncora_username', username);
              navigateTo(`/room/${response.roomId}`);
              showToast(`Joined room ${response.roomId}!`, 'success');
              resolve(true);
            } else {
              const errMsg = response?.error || 'Failed to join room';
              showToast(errMsg, 'error');
              resolve(false);
            }
          }
        );
      });
    },
    [showToast, navigateTo]
  );

  const leaveRoom = useCallback(() => {
    socket.emit(SOCKET_EVENTS.LEAVE_ROOM);
    setRoomId(null);
    setCurrentUser(null);
    setParticipants([]);
    setPendingRequests([]);
    setChatHistory([]);
    setReactions([]);
    setLikeCount(0);
    setAudienceCount(1);
    setRoomQueue([]);
    navigateTo('/');
  }, [navigateTo]);

  const playVideo = useCallback((time?: number) => {
    socket.emit(SOCKET_EVENTS.PLAY, { time });
  }, []);

  const pauseVideo = useCallback((time?: number) => {
    socket.emit(SOCKET_EVENTS.PAUSE, { time });
  }, []);

  const seekVideo = useCallback((time: number) => {
    socket.emit(SOCKET_EVENTS.SEEK, { time });
  }, []);

  const changeVideo = useCallback((videoId: string) => {
    setIsLiveSynced(true);
    setTimeBehindLive(0);
    socket.emit(SOCKET_EVENTS.CHANGE_VIDEO, { videoId });
  }, []);

  const returnToLive = useCallback(
    (playerRef?: any) => {
      setIsLiveSynced(true);
      setTimeBehindLive(0);
      setLocalPlayState(playback.playState);
      const targetTime = getAuthoritativeTime();
      if (playerRef) {
        if (typeof playerRef.seekTo === 'function') {
          playerRef.seekTo(targetTime, true);
        }
        if (playback.playState === 'playing' && typeof playerRef.playVideo === 'function') {
          playerRef.playVideo();
        } else if (playback.playState === 'paused' && typeof playerRef.pauseVideo === 'function') {
          playerRef.pauseVideo();
        }
      }
      showToast('Synchronized with Live Stream', 'success');
    },
    [getAuthoritativeTime, playback.playState, showToast]
  );

  const assignRole = useCallback((userId: string, role: Role) => {
    socket.emit(SOCKET_EVENTS.ASSIGN_ROLE, { userId, role });
  }, []);

  const removeParticipant = useCallback((userId: string) => {
    socket.emit(SOCKET_EVENTS.REMOVE_PARTICIPANT, { userId });
  }, []);

  const transferHost = useCallback((userId: string) => {
    socket.emit(SOCKET_EVENTS.TRANSFER_HOST, { userId });
  }, []);

  const requestControl = useCallback(
    (type: ControlRequestType = 'REQUEST_CONTROL', videoId?: string, videoTitle?: string) => {
      socket.emit(SOCKET_EVENTS.REQUEST_CONTROL, {
        type,
        requestedVideoId: videoId,
        requestedVideoTitle: videoTitle,
      });
      showToast('Control request sent to Host for approval.', 'info');
    },
    [showToast]
  );

  const requestPlaybackChange = useCallback(
    (
      action: 'play' | 'pause' | 'seek' | 'change_video',
      requestedVideoId?: string,
      requestedTime?: number
    ) => {
      socket.emit(SOCKET_EVENTS.REQUEST_PLAYBACK_CHANGE, {
        action,
        requestedVideoId,
        requestedTime,
      });
      showToast(`Playback request (${action}) sent to Host for approval.`, 'info');
    },
    [showToast]
  );

  const handleControlRequest = useCallback((requestId: string, action: 'approved' | 'rejected') => {
    socket.emit(SOCKET_EVENTS.HANDLE_CONTROL_REQUEST, { requestId, action });
  }, []);

  const approveRequest = useCallback((requestId: string) => {
    socket.emit(SOCKET_EVENTS.APPROVE_REQUEST, { requestId });
  }, []);

  const rejectRequest = useCallback((requestId: string) => {
    socket.emit(SOCKET_EVENTS.REJECT_REQUEST, { requestId });
  }, []);

  const sendChat = useCallback((message: string) => {
    if (!message || !message.trim()) return;
    socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, { text: message.trim() });
  }, []);

  const sendReaction = useCallback((emoji: string = '❤️', type: string = 'like') => {
    socket.emit(SOCKET_EVENTS.SEND_REACTION, { emoji, type });
  }, []);

  const sendLike = useCallback(() => {
    sendReaction('❤️', 'like');
  }, [sendReaction]);

  const updateLocalPlaybackTime = useCallback((time: number) => {
    socket.emit(SOCKET_EVENTS.SYNC_PING, { clientTime: time });
  }, []);

  // Moderation Methods
  const deleteMessage = useCallback((messageId: string) => {
    socket.emit(SOCKET_EVENTS.DELETE_MESSAGE, { messageId });
  }, []);

  const pinMessage = useCallback((messageId: string, pinned: boolean = true) => {
    socket.emit(SOCKET_EVENTS.PIN_MESSAGE, { messageId, pinned });
  }, []);

  const timeoutUser = useCallback((userId: string, durationSeconds: number = 60) => {
    socket.emit(SOCKET_EVENTS.TIMEOUT_USER, { userId, durationSeconds });
  }, []);

  const toggleSlowMode = useCallback((seconds: number) => {
    socket.emit(SOCKET_EVENTS.TOGGLE_SLOW_MODE, { seconds });
  }, []);

  // Room Queue Methods
  const addToQueue = useCallback(async (video: { videoId: string; title: string; channelTitle?: string; thumbnailUrl?: string }) => {
    if (!roomId) return;
    try {
      await api.addToRoomQueue(roomId, {
        ...video,
        addedById: currentUser?.id || 'viewer',
        addedByName: currentUser?.username || 'Viewer',
      });
      socket.emit(SOCKET_EVENTS.UPDATE_QUEUE);
      await fetchRoomQueue(roomId);
      showToast(`Added "${video.title}" to room queue`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add to queue', 'error');
    }
  }, [roomId, currentUser, fetchRoomQueue, showToast]);

  const removeFromQueue = useCallback(async (queueId: string) => {
    if (!roomId) return;
    try {
      await api.removeFromRoomQueue(roomId, queueId);
      socket.emit(SOCKET_EVENTS.UPDATE_QUEUE);
      await fetchRoomQueue(roomId);
    } catch (err: any) {
      showToast(err.message || 'Failed to remove from queue', 'error');
    }
  }, [roomId, fetchRoomQueue, showToast]);

  const playNextInQueue = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await api.advanceRoomQueue(roomId);
      socket.emit(SOCKET_EVENTS.UPDATE_QUEUE);
      await fetchRoomQueue(roomId);
      if (res.nextItem) {
        showToast(`Now playing next: "${res.nextItem.title}"`, 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to advance queue', 'error');
    }
  }, [roomId, fetchRoomQueue, showToast]);

  const isHost = currentUser?.isHost || currentUser?.role === 'HOST';
  const isModerator = currentUser?.role === 'MODERATOR';
  const canControl = isHost || isModerator;
  const pinnedMessages = chatHistory.filter((m) => m.isPinned && !m.isDeleted);

  return (
    <WatchPartyContext.Provider
      value={{
        roomId,
        currentUser,
        isHost: !!isHost,
        isModerator: !!isModerator,
        canControl: !!canControl,
        playback,
        participants,
        pendingRequests,
        chatHistory,
        syncStatus,
        reactions,
        likeCount,
        audienceCount,
        toastMessage,
        isConnected,
        connectionError,
        createRoom,
        joinRoom,
        leaveRoom,
        playVideo,
        pauseVideo,
        seekVideo,
        changeVideo,
        assignRole,
        removeParticipant,
        transferHost,
        requestControl,
        requestPlaybackChange,
        handleControlRequest,
        approveRequest,
        rejectRequest,
        sendChat,
        sendReaction,
        sendLike,
        clearToast,
        showToast,
        updateLocalPlaybackTime,
        isLiveSynced,
        setIsLiveSynced,
        timeBehindLive,
        setTimeBehindLive,
        localPlayState,
        setLocalPlayState,
        returnToLive,
        getAuthoritativeTime,
        slowModeSeconds,
        pinnedMessages,
        deleteMessage,
        pinMessage,
        timeoutUser,
        toggleSlowMode,
        roomQueue,
        addToQueue,
        removeFromQueue,
        playNextInQueue,
        currentRoute,
        activeVideoId,
        activeCategory,
        searchQuery,
        setSearchQuery,
        navigateTo,
        currentUserAccount,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        logout,
        refreshAuth,
        isCreateRoomModalOpen,
        setIsCreateRoomModalOpen,
        isScheduleModalOpen,
        setIsScheduleModalOpen,
      }}
    >
      {children}
    </WatchPartyContext.Provider>
  );
};

export const useWatchParty = () => {
  const context = useContext(WatchPartyContext);
  if (!context) {
    throw new Error('useWatchParty must be used within a WatchPartyProvider');
  }
  return context;
};
