import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { socket, SOCKET_EVENTS } from '../services/socket';
import {
  Role,
  PlaybackState,
  Participant,
  ControlRequest,
  ControlRequestType,
  ChatMessage,
  ReactionPayload,
  SyncStatus,
  RoomStateSnapshot,
} from '../types';

interface WatchPartyContextType {
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
  toastMessage: { text: string; type: 'info' | 'error' | 'success' } | null;
  isConnected: boolean;
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
  handleControlRequest: (requestId: string, action: 'approved' | 'rejected') => void;
  sendChat: (message: string) => void;
  sendReaction: (emoji: string) => void;
  clearToast: () => void;
  updateLocalPlaybackTime: (time: number) => void;
}

const initialPlayback: PlaybackState = {
  videoId: 'jfKfPfyJRdk',
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
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);

  const showToast = useCallback((text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  }, []);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // Sync state & connection listeners
  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      console.log('[Socket] Connected to server');
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setSyncStatus((prev) => ({ ...prev, state: 'disconnected', isSynced: false }));
      showToast('Lost connection to server. Reconnecting...', 'error');
    };

    const onSyncState = (newPlayback: PlaybackState) => {
      setPlayback(newPlayback);
    };

    const onUserJoined = (data: { username: string; userId: string; role: Role; participants: Participant[] }) => {
      setParticipants(data.participants);
      // If this is our user data, update currentUser
      setCurrentUser((prev) => {
        if (!prev) return null;
        const matching = data.participants.find((p) => p.id === prev.id);
        return matching || prev;
      });
    };

    const onUserLeft = (data: { username: string; userId: string; participants: Participant[] }) => {
      setParticipants(data.participants);
    };

    const onRoleAssigned = (data: { userId: string; username: string; role: Role; participants: Participant[] }) => {
      setParticipants(data.participants);
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
      setParticipants(data.participants);
      setCurrentUser((prev) => {
        if (prev && prev.id === data.userId) {
          showToast('You were removed from the room by the host.', 'error');
          setRoomId(null);
          return null;
        }
        return prev;
      });
    };

    const onHostTransferred = (data: { previousHostId: string; newHostId: string; participants: Participant[] }) => {
      setParticipants(data.participants);
      setCurrentUser((prev) => {
        if (!prev) return null;
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
      setPendingRequests(data.pendingRequests);
      showToast(`${data.request.username} requested playback permissions.`, 'info');
    };

    const onControlRequestUpdated = (data: {
      request: ControlRequest;
      pendingRequests: ControlRequest[];
      participants: Participant[];
      playback?: PlaybackState;
    }) => {
      setPendingRequests(data.pendingRequests);
      setParticipants(data.participants);
      if (data.playback) {
        setPlayback(data.playback);
      }
      if (data.request.status === 'approved') {
        showToast(`Request by ${data.request.username} approved!`, 'success');
      } else {
        showToast(`Request by ${data.request.username} declined.`, 'info');
      }
    };

    const onChatMessage = (msg: ChatMessage) => {
      setChatHistory((prev) => [...prev, msg]);
    };

    const onReactionReceived = (reaction: ReactionPayload) => {
      setReactions((prev) => [...prev, reaction]);
      // Remove reaction after 2.8 seconds
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2800);
    };

    const onSyncPong = (data: { serverTime: number; playState: string; drift: number }) => {
      const isDrifted = data.drift > 1.8;
      setSyncStatus({
        isSynced: !isDrifted,
        driftSeconds: data.drift,
        latencyMs: Math.round(data.drift * 100),
        state: isDrifted ? 'catching_up' : 'synced',
      });
    };

    const onError = (data: { message: string }) => {
      showToast(data.message, 'error');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(SOCKET_EVENTS.SYNC_STATE, onSyncState);
    socket.on(SOCKET_EVENTS.USER_JOINED, onUserJoined);
    socket.on(SOCKET_EVENTS.USER_LEFT, onUserLeft);
    socket.on(SOCKET_EVENTS.ROLE_ASSIGNED, onRoleAssigned);
    socket.on(SOCKET_EVENTS.PARTICIPANT_REMOVED, onParticipantRemoved);
    socket.on(SOCKET_EVENTS.HOST_TRANSFERRED, onHostTransferred);
    socket.on(SOCKET_EVENTS.CONTROL_REQUEST_SUBMITTED, onControlRequestSubmitted);
    socket.on(SOCKET_EVENTS.CONTROL_REQUEST_UPDATED, onControlRequestUpdated);
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, onChatMessage);
    socket.on(SOCKET_EVENTS.REACTION_RECEIVED, onReactionReceived);
    socket.on(SOCKET_EVENTS.SYNC_PONG, onSyncPong);
    socket.on(SOCKET_EVENTS.ERROR_MESSAGE, onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(SOCKET_EVENTS.SYNC_STATE, onSyncState);
      socket.off(SOCKET_EVENTS.USER_JOINED, onUserJoined);
      socket.off(SOCKET_EVENTS.USER_LEFT, onUserLeft);
      socket.off(SOCKET_EVENTS.ROLE_ASSIGNED, onRoleAssigned);
      socket.off(SOCKET_EVENTS.PARTICIPANT_REMOVED, onParticipantRemoved);
      socket.off(SOCKET_EVENTS.HOST_TRANSFERRED, onHostTransferred);
      socket.off(SOCKET_EVENTS.CONTROL_REQUEST_SUBMITTED, onControlRequestSubmitted);
      socket.off(SOCKET_EVENTS.CONTROL_REQUEST_UPDATED, onControlRequestUpdated);
      socket.off(SOCKET_EVENTS.CHAT_MESSAGE, onChatMessage);
      socket.off(SOCKET_EVENTS.REACTION_RECEIVED, onReactionReceived);
      socket.off(SOCKET_EVENTS.SYNC_PONG, onSyncPong);
      socket.off(SOCKET_EVENTS.ERROR_MESSAGE, onError);
    };
  }, [showToast]);

  // Actions
  const createRoom = useCallback(
    (username: string, initialVideoId?: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        socket.emit(
          SOCKET_EVENTS.CREATE_ROOM,
          { username, initialVideoId },
          (response: { success: boolean; roomId?: string; user?: Participant; roomState?: RoomStateSnapshot; error?: string }) => {
            if (response && response.success && response.roomId && response.user) {
              setRoomId(response.roomId);
              setCurrentUser(response.user);
              if (response.roomState) {
                setPlayback(response.roomState.playback);
                setParticipants(response.roomState.participants);
                setPendingRequests(response.roomState.pendingRequests);
                setChatHistory(response.roomState.chatHistory);
              }
              showToast(`Watch room created! Share code: ${response.roomId}`, 'success');
              resolve(response.roomId);
            } else {
              showToast(response?.error || 'Failed to create room', 'error');
              reject(new Error(response?.error || 'Failed to create room'));
            }
          }
        );
      });
    },
    [showToast]
  );

  const joinRoom = useCallback(
    (targetRoomId: string, username: string): Promise<boolean> => {
      return new Promise((resolve) => {
        socket.emit(
          SOCKET_EVENTS.JOIN_ROOM,
          { roomId: targetRoomId.toUpperCase().trim(), username },
          (response: { success: boolean; roomId?: string; user?: Participant; roomState?: RoomStateSnapshot; error?: string }) => {
            if (response && response.success && response.roomId && response.user) {
              setRoomId(response.roomId);
              setCurrentUser(response.user);
              if (response.roomState) {
                setPlayback(response.roomState.playback);
                setParticipants(response.roomState.participants);
                setPendingRequests(response.roomState.pendingRequests);
                setChatHistory(response.roomState.chatHistory);
              }
              showToast(`Joined room ${response.roomId}!`, 'success');
              resolve(true);
            } else {
              showToast(response?.error || 'Failed to join room', 'error');
              resolve(false);
            }
          }
        );
      });
    },
    [showToast]
  );

  const leaveRoom = useCallback(() => {
    socket.emit(SOCKET_EVENTS.LEAVE_ROOM);
    setRoomId(null);
    setCurrentUser(null);
    setParticipants([]);
    setPendingRequests([]);
    setChatHistory([]);
  }, []);

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
    socket.emit(SOCKET_EVENTS.CHANGE_VIDEO, { videoId });
  }, []);

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

  const handleControlRequest = useCallback((requestId: string, action: 'approved' | 'rejected') => {
    socket.emit(SOCKET_EVENTS.HANDLE_CONTROL_REQUEST, { requestId, action });
  }, []);

  const sendChat = useCallback((message: string) => {
    socket.emit(SOCKET_EVENTS.SEND_CHAT, { message });
  }, []);

  const sendReaction = useCallback((emoji: string) => {
    socket.emit(SOCKET_EVENTS.SEND_REACTION, { emoji });
  }, []);

  const updateLocalPlaybackTime = useCallback((time: number) => {
    // Client can ping drift
    socket.emit(SOCKET_EVENTS.SYNC_PING, { clientTime: time });
  }, []);

  const isHost = currentUser?.isHost || currentUser?.role === 'HOST';
  const isModerator = currentUser?.role === 'MODERATOR';
  const canControl = isHost || isModerator;

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
        toastMessage,
        isConnected,
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
        handleControlRequest,
        sendChat,
        sendReaction,
        clearToast,
        updateLocalPlaybackTime,
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
