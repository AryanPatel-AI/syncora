import { Server, Socket } from 'socket.io';
import { RoomManager } from '../services/RoomManager';
import { PermissionService } from '../services/PermissionService';
import { SOCKET_EVENTS } from './events';
import { Role, ControlRequestType } from '../types';
import {
  validateUsername,
  validateRoomCode,
  validateVideoId,
  validatePlaybackTime,
  validateChatMessage,
} from '../validation';
import { ChatRateLimiter } from '../services/ChatRateLimiter';
import { RoomRepository } from '../database/roomRepository';

export function registerSocketHandlers(io: Server) {
  const roomManager = RoomManager.getInstance();
  const lastReactionTimes = new Map<string, number>();
  const lastChatTimes = new Map<string, number>();
  const REACTION_COOLDOWN_MS = 500;

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Helper: emit error to this socket (both error_message and room_error for contract compliance)
    const emitError = (message: string) => {
      socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, { message });
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { error: message, message });
    };

    // Helper: emit presence update (authoritative audience count + roster)
    const emitPresenceUpdated = (targetRoom: any) => {
      io.to(targetRoom.id).emit(SOCKET_EVENTS.PRESENCE_UPDATED, {
        count: targetRoom.getParticipantCount(),
        participants: targetRoom.getAllParticipants(),
      });
    };

    // Helper: get current room & participant for this socket
    const getContext = () => {
      const room = roomManager.getRoomBySocketId(socket.id);
      const participant = room?.getParticipantBySocketId(socket.id);
      return { room, participant };
    };

    // 1. CREATE ROOM
    socket.on(
      SOCKET_EVENTS.CREATE_ROOM,
      (data: { username: string; initialVideoId?: string }, callback?: (res: any) => void) => {
        try {
          const userValidation = validateUsername(data?.username);
          if (!userValidation.isValid || !userValidation.value) {
            const err = userValidation.error || 'Invalid display username.';
            emitError(err);
            if (callback) callback({ success: false, error: err });
            return;
          }

          const videoValidation = validateVideoId(data?.initialVideoId);
          if (!videoValidation.isValid) {
            const err = videoValidation.error || 'Invalid video ID format.';
            emitError(err);
            if (callback) callback({ success: false, error: err });
            return;
          }

          // Leave any previous room
          roomManager.leaveRoom(socket.id);

          const { room, host } = roomManager.createRoom(
            userValidation.value,
            socket.id,
            videoValidation.value || undefined
          );

          socket.join(room.id);
          console.log(`[Room Created] Room ID: ${room.id} by Host: ${host.username}`);

          const stateSnapshot = room.getStateSnapshot();
          const participantsList = room.getAllParticipants();
          const hostJson = host.toJSON();

          // Contract emissions: room_snapshot, sync_state, participants_updated, user_joined
          socket.emit(SOCKET_EVENTS.ROOM_SNAPSHOT, {
            ...stateSnapshot,
            room: stateSnapshot,
            user: hostJson,
            participant: hostJson,
            role: host.role,
          });
          socket.emit(SOCKET_EVENTS.SYNC_STATE, room.getPlaybackState());
          socket.emit(SOCKET_EVENTS.PARTICIPANTS_UPDATED, {
            participants: participantsList,
          });
          socket.emit(SOCKET_EVENTS.PRESENCE_UPDATED, {
            count: room.getParticipantCount(),
            participants: participantsList,
          });
          socket.emit(SOCKET_EVENTS.USER_JOINED, {
            username: host.username,
            userId: host.id,
            role: host.role,
            participants: participantsList,
          });

          if (callback) {
            callback({
              success: true,
              roomId: room.id,
              user: host.toJSON(),
              participant: host.toJSON(),
              roomState: stateSnapshot,
              room: stateSnapshot,
            });
          }
        } catch (err: any) {
          console.error('[Error Create Room]:', err);
          emitError(err.message || 'Failed to create room');
          if (callback) callback({ success: false, error: err.message });
        }
      }
    );

    // 2. JOIN ROOM
    socket.on(
      SOCKET_EVENTS.JOIN_ROOM,
      (data: { roomId: string; username: string }, callback?: (res: any) => void) => {
        try {
          const roomValidation = validateRoomCode(data?.roomId);
          if (!roomValidation.isValid || !roomValidation.value) {
            const err = roomValidation.error || 'Invalid room code.';
            emitError(err);
            if (callback) callback({ success: false, error: err });
            return;
          }

          const userValidation = validateUsername(data?.username);
          if (!userValidation.isValid || !userValidation.value) {
            const err = userValidation.error || 'Invalid display username.';
            emitError(err);
            if (callback) callback({ success: false, error: err });
            return;
          }

          const result = roomManager.joinRoom(roomValidation.value, userValidation.value, socket.id);
          if ('error' in result) {
            emitError(result.error);
            if (callback) callback({ success: false, error: result.error });
            return;
          }

          const { room, participant } = result;
          socket.join(room.id);

          console.log(`[User Joined] ${participant.username} (${participant.role}) joined ${room.id}`);

          // Broadcast system announcement
          const sysMsg = room.addChatMessage(
            'system',
            'System',
            `${participant.username} joined the watch party.`,
            'system'
          );

          const participantsList = room.getAllParticipants();

          // Broadcast to everyone in room: participants_updated, presence_updated & user_joined
          io.to(room.id).emit(SOCKET_EVENTS.PARTICIPANTS_UPDATED, {
            participants: participantsList,
          });
          emitPresenceUpdated(room);

          io.to(room.id).emit(SOCKET_EVENTS.USER_JOINED, {
            username: participant.username,
            userId: participant.id,
            role: participant.role,
            participants: participantsList,
          });

          io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, sysMsg);

          const stateSnapshot = room.getStateSnapshot();
          const participantJson = participant.toJSON();

          // Send authoritative room snapshot & sync state to newly joined client
          socket.emit(SOCKET_EVENTS.ROOM_SNAPSHOT, {
            ...stateSnapshot,
            room: stateSnapshot,
            user: participantJson,
            participant: participantJson,
            role: participant.role,
          });
          socket.emit(SOCKET_EVENTS.SYNC_STATE, room.getPlaybackState());

          if (callback) {
            callback({
              success: true,
              roomId: room.id,
              user: participant.toJSON(),
              participant: participant.toJSON(),
              roomState: stateSnapshot,
              room: stateSnapshot,
            });
          }
        } catch (err: any) {
          console.error('[Error Join Room]:', err);
          emitError(err.message || 'Failed to join room');
          if (callback) callback({ success: false, error: err.message });
        }
      }
    );

    // 3. LEAVE ROOM
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (callback?: (res: any) => void) => {
      try {
        handleLeave();
        if (callback) callback({ success: true });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // 4. PLAY EVENT
    socket.on(SOCKET_EVENTS.PLAY, (data: { time?: number; currentTime?: number } = {}) => {
      const { room, participant } = getContext();
      if (!room || !participant) {
        emitError('You must be an active member of a room to play video.');
        return;
      }

      if (!PermissionService.canControlPlayback(participant)) {
        emitError('Permission denied: Only Host or Moderator can play video.');
        return;
      }

      const inputTime = typeof data?.time === 'number' ? data.time : (typeof data?.currentTime === 'number' ? data.currentTime : undefined);
      const currentTime = typeof inputTime === 'number' ? inputTime : room.getAuthoritativeCurrentTime();
      const updatedPlayback = room.updatePlayState('playing', currentTime, participant);

      io.to(room.id).emit(SOCKET_EVENTS.SYNC_STATE, updatedPlayback);
      console.log(`[Play] Room ${room.id} at ${currentTime.toFixed(1)}s by ${participant.username}`);
    });

    // 5. PAUSE EVENT
    socket.on(SOCKET_EVENTS.PAUSE, (data: { time?: number; currentTime?: number } = {}) => {
      const { room, participant } = getContext();
      if (!room || !participant) {
        emitError('You must be an active member of a room to pause video.');
        return;
      }

      if (!PermissionService.canControlPlayback(participant)) {
        emitError('Permission denied: Only Host or Moderator can pause video.');
        return;
      }

      const inputTime = typeof data?.time === 'number' ? data.time : (typeof data?.currentTime === 'number' ? data.currentTime : undefined);
      const currentTime = typeof inputTime === 'number' ? inputTime : room.getAuthoritativeCurrentTime();
      const updatedPlayback = room.updatePlayState('paused', currentTime, participant);

      io.to(room.id).emit(SOCKET_EVENTS.SYNC_STATE, updatedPlayback);
      console.log(`[Pause] Room ${room.id} at ${currentTime.toFixed(1)}s by ${participant.username}`);
    });

    // 6. SEEK EVENT
    socket.on(SOCKET_EVENTS.SEEK, (data: { time?: number; currentTime?: number }) => {
      const { room, participant } = getContext();
      if (!room || !participant) {
        emitError('You must be an active member of a room to seek video.');
        return;
      }

      if (!PermissionService.canControlPlayback(participant)) {
        emitError('Permission denied: Only Host or Moderator can seek video.');
        return;
      }

      const targetTime = typeof data?.time === 'number' ? data.time : (typeof data?.currentTime === 'number' ? data.currentTime : NaN);
      if (typeof targetTime !== 'number' || isNaN(targetTime)) return;

      const updatedPlayback = room.seek(targetTime, participant);
      io.to(room.id).emit(SOCKET_EVENTS.SYNC_STATE, updatedPlayback);
      console.log(`[Seek] Room ${room.id} to ${targetTime.toFixed(1)}s by ${participant.username}`);
    });

    // 7. CHANGE VIDEO EVENT
    socket.on(SOCKET_EVENTS.CHANGE_VIDEO, (data: { videoId: string }) => {
      const { room, participant } = getContext();
      if (!room || !participant) {
        emitError('You must be an active member of a room to change video.');
        return;
      }

      if (!PermissionService.canControlPlayback(participant)) {
        emitError('Permission denied: Only Host or Moderator can change video.');
        return;
      }

      if (!data.videoId || typeof data.videoId !== 'string') {
        emitError('Valid YouTube video ID required.');
        return;
      }

      const cleanVideoId = data.videoId.trim();
      const updatedPlayback = room.changeVideo(cleanVideoId, participant);

      const sysMsg = room.addChatMessage(
        'system',
        'System',
        `${participant.username} changed the video.`,
        'system'
      );

      io.to(room.id).emit(SOCKET_EVENTS.SYNC_STATE, updatedPlayback);
      io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, sysMsg);
      console.log(`[Change Video] Room ${room.id} new video ${cleanVideoId} by ${participant.username}`);
    });

    // 8. ASSIGN ROLE (Host Only)
    socket.on(
      SOCKET_EVENTS.ASSIGN_ROLE,
      (data: { userId?: string; targetUserId?: string; role?: Role; newRole?: Role }) => {
        const { room, participant: actor } = getContext();
        if (!room || !actor) {
          emitError('You must be an active member of a room to assign roles.');
          return;
        }

        if (!PermissionService.canAssignRoles(actor, room.hostId)) {
          emitError('Permission denied: Only the Host can assign roles.');
          return;
        }

        const targetId = data?.targetUserId || data?.userId;
        if (!targetId) {
          emitError('Target user ID is required.');
          return;
        }

        const target = room.getParticipant(targetId);
        if (!target) {
          emitError('Target user not found in this room.');
          return;
        }

        if (target.id === actor.id) {
          emitError('Host cannot modify their own role directly.');
          return;
        }

        const rawRole = String(data?.newRole || data?.role || '').toUpperCase();
        let targetRole: Role | undefined;
        if (rawRole === 'MODERATOR') {
          targetRole = 'MODERATOR';
          target.promoteToModerator();
        } else if (rawRole === 'PARTICIPANT') {
          targetRole = 'PARTICIPANT';
          target.demoteToParticipant();
        } else if (rawRole === 'VIEWER') {
          targetRole = 'VIEWER';
          target.demoteToViewer();
        } else {
          emitError('Invalid role assignment: Only Moderator, Participant, or Viewer can be assigned.');
          return;
        }

        // Persist updated role in SQLite repository
        RoomRepository.updateParticipantRole(target.id, target.role);

        const sysMsg = room.addChatMessage(
          'system',
          'System',
          `${target.username} was updated to ${target.role} by Host ${actor.username}.`,
          'system'
        );

        const updatedParticipants = room.getAllParticipants();

        io.to(room.id).emit(SOCKET_EVENTS.ROLE_ASSIGNED, {
          userId: target.id,
          targetUserId: target.id,
          username: target.username,
          role: target.role,
          newRole: target.role,
          participants: updatedParticipants,
        });
        io.to(room.id).emit(SOCKET_EVENTS.PARTICIPANTS_UPDATED, {
          participants: updatedParticipants,
        });
        emitPresenceUpdated(room);
        io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, sysMsg);
        console.log(`[Role Assigned] ${target.username} -> ${target.role} by ${actor.username}`);
      }
    );

    // 9. REMOVE PARTICIPANT (Host Only)
    socket.on(
      SOCKET_EVENTS.REMOVE_PARTICIPANT,
      (data: { userId?: string; targetUserId?: string }) => {
        const { room, participant: actor } = getContext();
        if (!room || !actor) {
          emitError('You must be an active member of a room to remove participants.');
          return;
        }

        const targetId = data?.targetUserId || data?.userId;
        if (!targetId) {
          emitError('Target participant ID is required.');
          return;
        }

        const target = room.getParticipant(targetId);
        if (!target) {
          emitError('Target participant not found.');
          return;
        }

        if (!PermissionService.canRemoveParticipant(actor, target, room.hostId)) {
          emitError('Permission denied: Only the Host can remove participants.');
          return;
        }

        const targetSocketId = target.socketId;
        const targetUserId = target.id;
        const targetUsername = target.username;

        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
          targetSocket.emit(SOCKET_EVENTS.PARTICIPANT_REMOVED, {
            userId: targetUserId,
            targetUserId: targetUserId,
            message: 'You have been removed from the watch party by the host.',
          });
          targetSocket.emit(SOCKET_EVENTS.ERROR_MESSAGE, {
            message: 'You have been removed from the watch party by the host.',
          });
          targetSocket.leave(room.id);
        }

        room.removeParticipant(targetUserId);
        RoomRepository.removeParticipant(targetUserId);
        roomManager.unmapSocket(targetSocketId);
        lastReactionTimes.delete(targetUserId);
        lastChatTimes.delete(targetUserId);

        const sysMsg = room.addChatMessage(
          'system',
          'System',
          `${targetUsername} was removed from the party by ${actor.username}.`,
          'system'
        );

        const updatedParticipants = room.getAllParticipants();

        io.to(room.id).emit(SOCKET_EVENTS.PARTICIPANT_REMOVED, {
          userId: targetUserId,
          targetUserId: targetUserId,
          participants: updatedParticipants,
        });
        io.to(room.id).emit(SOCKET_EVENTS.PARTICIPANTS_UPDATED, {
          participants: updatedParticipants,
        });
        emitPresenceUpdated(room);
        io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, sysMsg);
        console.log(`[Participant Removed] ${targetUsername} removed by ${actor.username}`);
      }
    );

    // 10. TRANSFER HOST (Host Only)
    socket.on(
      SOCKET_EVENTS.TRANSFER_HOST,
      (data: { userId?: string; targetUserId?: string; newHostId?: string }) => {
        const { room, participant: actor } = getContext();
        if (!room || !actor) {
          emitError('You must be an active member of a room to transfer host rights.');
          return;
        }

        const targetId = data?.targetUserId || data?.userId || data?.newHostId;
        if (!targetId) {
          emitError('Target participant ID is required.');
          return;
        }

        const target = room.getParticipant(targetId);
        if (!target) {
          emitError('Target participant not found.');
          return;
        }

        if (target.id === actor.id) {
          emitError('You cannot transfer host ownership to yourself.');
          return;
        }

        if (!PermissionService.canTransferHost(actor, target, room.hostId)) {
          emitError('Permission denied: Only current Host can transfer host rights.');
          return;
        }

        const success = room.transferHost(actor.id, target.id);
        if (!success) {
          emitError('Failed to transfer host.');
          return;
        }

        const sysMsg = room.addChatMessage(
          'system',
          'System',
          `${actor.username} transferred Host ownership to ${target.username}.`,
          'system'
        );

        const updatedParticipants = room.getAllParticipants();

        io.to(room.id).emit(SOCKET_EVENTS.HOST_TRANSFERRED, {
          previousHostId: actor.id,
          newHostId: target.id,
          targetUserId: target.id,
          participants: updatedParticipants,
        });
        io.to(room.id).emit(SOCKET_EVENTS.PARTICIPANTS_UPDATED, {
          participants: updatedParticipants,
        });
        emitPresenceUpdated(room);
        io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, sysMsg);
        console.log(`[Host Transferred] ${actor.username} -> ${target.username}`);
      }
    );

    // 11. REQUEST CONTROL & REQUEST PLAYBACK CHANGE (Participant workflow)
    const handlePlaybackChangeRequest = (data: {
      type?: ControlRequestType;
      action?: string;
      requestedVideoId?: string;
      requestedVideoTitle?: string;
      requestedTime?: number;
    }) => {
      const { room, participant } = getContext();
      if (!room || !participant) {
        emitError('You must be an active member of a room to request playback changes.');
        return;
      }

      if (participant.role === 'HOST' || participant.role === 'MODERATOR') {
        emitError('You already have playback control privileges.');
        return;
      }

      const reqAction = (data.action || data.type || 'REQUEST_CONTROL').toLowerCase();
      let validatedVideoId: string | undefined = undefined;
      let validatedTime: number | undefined = undefined;

      if (reqAction.includes('video') || data.requestedVideoId) {
        const vCheck = validateVideoId(data.requestedVideoId);
        if (!vCheck.isValid || !vCheck.value) {
          emitError(vCheck.error || 'Invalid YouTube video ID.');
          return;
        }
        validatedVideoId = vCheck.value;
      }

      if (reqAction === 'seek' || typeof data.requestedTime === 'number') {
        const tCheck = validatePlaybackTime(data.requestedTime);
        if (!tCheck.isValid) {
          emitError(tCheck.error || 'Invalid playback time.');
          return;
        }
        validatedTime = tCheck.value;
      }

      const requestType = (data.action || data.type || 'REQUEST_CONTROL') as ControlRequestType;
      const request = room.createControlRequest(
        participant.id,
        requestType,
        validatedVideoId,
        data.requestedVideoTitle,
        validatedTime
      );

      if (!request) return;

      let actionText = 'requested playback control';
      if (reqAction === 'change_video' || reqAction === 'request_change_video') {
        actionText = 'requested to change the video';
      } else if (reqAction === 'play') {
        actionText = 'requested to play the video';
      } else if (reqAction === 'pause') {
        actionText = 'requested to pause the video';
      } else if (reqAction === 'seek') {
        actionText = `requested to seek to ${Math.floor(validatedTime || 0)}s`;
      }

      const sysMsg = room.addChatMessage(
        'system',
        'System',
        `${participant.username} ${actionText}. Host review required.`,
        'system'
      );

      // Notify room
      io.to(room.id).emit(SOCKET_EVENTS.CONTROL_REQUEST_SUBMITTED, {
        request,
        pendingRequests: room.getPendingRequests(),
      });
      io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, sysMsg);
      console.log(`[Control Request] ${participant.username} submitted ${reqAction}`);
    };

    socket.on(SOCKET_EVENTS.REQUEST_CONTROL, (data) => {
      handlePlaybackChangeRequest(data);
    });

    socket.on(SOCKET_EVENTS.REQUEST_PLAYBACK_CHANGE, (data) => {
      handlePlaybackChangeRequest(data);
    });

    // 12. APPROVE / REJECT REQUEST (Host / Moderator review)
    const handleResolveRequest = (requestId: string, action: 'approved' | 'rejected') => {
      const { room, participant: actor } = getContext();
      if (!room || !actor) {
        emitError('You must be an active member of a room to handle control requests.');
        return;
      }

      if (!PermissionService.canHandleControlRequest(actor)) {
        emitError('Permission denied: Only Host or Moderator can approve requests.');
        return;
      }

      const resolved = room.resolveControlRequest(requestId, action);
      if (!resolved) {
        emitError('Control request not found or already processed.');
        return;
      }

      const requester = room.getParticipant(resolved.userId);
      const actionStr = action === 'approved' ? 'approved' : 'declined';
      const sysMsg = room.addChatMessage(
        'system',
        'System',
        `${actor.username} ${actionStr} the request from ${requester?.username || 'user'}.`,
        'system'
      );

      const updatedParticipants = room.getAllParticipants();
      const currentPlayback = room.getPlaybackState();

      if (action === 'approved' && requester) {
        // Persist role update if participant was promoted to moderator
        RoomRepository.updateParticipantRole(requester.id, requester.role);

        io.to(room.id).emit(SOCKET_EVENTS.ROLE_ASSIGNED, {
          userId: requester.id,
          targetUserId: requester.id,
          username: requester.username,
          role: requester.role,
          newRole: requester.role,
          participants: updatedParticipants,
        });
      }

      io.to(room.id).emit(SOCKET_EVENTS.CONTROL_REQUEST_UPDATED, {
        request: resolved,
        pendingRequests: room.getPendingRequests(),
        participants: updatedParticipants,
        playback: currentPlayback,
      });
      io.to(room.id).emit(SOCKET_EVENTS.PARTICIPANTS_UPDATED, {
        participants: updatedParticipants,
      });
      emitPresenceUpdated(room);
      if (action === 'approved') {
        io.to(room.id).emit(SOCKET_EVENTS.SYNC_STATE, currentPlayback);
      }
      io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, sysMsg);
      console.log(`[Control Request Handled] ${requestId} was ${action} by ${actor.username}`);
    };

    socket.on(
      SOCKET_EVENTS.HANDLE_CONTROL_REQUEST,
      (data: { requestId: string; action: 'approved' | 'rejected' }) => {
        handleResolveRequest(data.requestId, data.action);
      }
    );

    socket.on(SOCKET_EVENTS.APPROVE_REQUEST, (data: { requestId: string }) => {
      handleResolveRequest(data.requestId, 'approved');
    });

    socket.on(SOCKET_EVENTS.REJECT_REQUEST, (data: { requestId: string }) => {
      handleResolveRequest(data.requestId, 'rejected');
    });

    // 13. CHAT MESSAGE (Client -> Server: chat_message & send_chat)
    const handleIncomingChatMessage = (data: any) => {
      const { room, participant } = getContext();

      // Rule: Allow chat messages only from users who are currently members of the room
      if (!room || !participant) {
        emitError('You must be an active member of a room to send messages.');
        return;
      }

      // Check user timeout
      const timeoutStatus = room.isUserTimedOut(participant.id);
      if (timeoutStatus.timedOut) {
        emitError(`You are currently timed out from chatting (${timeoutStatus.remainingSeconds}s remaining).`);
        return;
      }

      // Check slow mode (applies to Participants and Viewers)
      const slowSec = room.getSlowModeSeconds();
      if (slowSec > 0 && (participant.role === 'PARTICIPANT' || participant.role === 'VIEWER')) {
        const lastChat = lastChatTimes.get(participant.id) || 0;
        const elapsed = (Date.now() - lastChat) / 1000;
        if (elapsed < slowSec) {
          emitError(`Slow mode active. Please wait ${Math.ceil(slowSec - elapsed)}s before sending another message.`);
          return;
        }
      }

      // Rule: Validation (trim whitespace, reject empty, max 500 characters)
      const validation = validateChatMessage(data);
      if (!validation.isValid || !validation.value) {
        emitError(validation.error || 'Invalid chat message.');
        return;
      }

      // Rule: Rate limiting to discourage message spam
      const rateLimiter = ChatRateLimiter.getInstance();
      const rateCheck = rateLimiter.checkLimit(participant.id);
      if (!rateCheck.allowed) {
        emitError(rateCheck.error || 'You are typing too fast. Please slow down.');
        return;
      }

      lastChatTimes.set(participant.id, Date.now());

      // Rule: Sender username and role obtained strictly from server-owned participant records
      const messageText = validation.value;
      const msg = room.addChatMessage(
        participant.id,
        participant.username,
        messageText,
        'user',
        participant.role
      );

      // Broadcast the accepted message to all members of the room
      io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, msg);
    };

    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, handleIncomingChatMessage);
    socket.on(SOCKET_EVENTS.SEND_CHAT, handleIncomingChatMessage);

    // 13b. DELETE MESSAGE (Host / Moderator only)
    socket.on(SOCKET_EVENTS.DELETE_MESSAGE, (data: { messageId: string }) => {
      const { room, participant } = getContext();
      if (!room || !participant) {
        emitError('You must be an active member of a room to delete messages.');
        return;
      }

      if (!PermissionService.canModerateChat(participant)) {
        emitError('Permission denied: Only Host or Moderator can delete messages.');
        return;
      }

      if (!data?.messageId) return;
      const deleted = room.deleteChatMessage(data.messageId);
      if (deleted) {
        io.to(room.id).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
          messageId: data.messageId,
          deletedBy: participant.username,
        });
      }
    });

    // 13c. PIN MESSAGE (Host / Moderator only)
    socket.on(SOCKET_EVENTS.PIN_MESSAGE, (data: { messageId: string; pinned?: boolean }) => {
      const { room, participant } = getContext();
      if (!room || !participant) {
        emitError('You must be an active member of a room to pin messages.');
        return;
      }

      if (!PermissionService.canModerateChat(participant)) {
        emitError('Permission denied: Only Host or Moderator can pin messages.');
        return;
      }

      if (!data?.messageId) return;
      const shouldPin = data.pinned !== false;
      const updatedMsg = room.pinChatMessage(data.messageId, shouldPin);
      if (updatedMsg) {
        io.to(room.id).emit(SOCKET_EVENTS.MESSAGE_PINNED, {
          message: updatedMsg,
          pinned: shouldPin,
          pinnedBy: participant.username,
        });
      }
    });

    // 13d. TIMEOUT USER (Host / Moderator only)
    socket.on(SOCKET_EVENTS.TIMEOUT_USER, (data: { userId: string; durationSeconds?: number }) => {
      const { room, participant } = getContext();
      if (!room || !participant) {
        emitError('You must be an active member of a room to timeout participants.');
        return;
      }

      if (!PermissionService.canModerateChat(participant)) {
        emitError('Permission denied: Only Host or Moderator can timeout participants.');
        return;
      }

      const target = room.getParticipant(data?.userId);
      if (!target) {
        emitError('Target participant not found.');
        return;
      }

      if (target.id === room.hostId) {
        emitError('Cannot timeout the Room Host.');
        return;
      }

      const duration = typeof data.durationSeconds === 'number' ? data.durationSeconds : 60;
      room.timeoutUser(target.id, duration);

      const sysMsg = room.addChatMessage(
        'system',
        'System',
        `${target.username} was timed out for ${duration}s by ${participant.username}.`,
        'system'
      );

      io.to(room.id).emit(SOCKET_EVENTS.USER_TIMED_OUT, {
        userId: target.id,
        username: target.username,
        durationSeconds: duration,
        moderatorName: participant.username,
      });
      io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, sysMsg);
    });

    // 13e. TOGGLE SLOW MODE (Host only)
    socket.on(SOCKET_EVENTS.TOGGLE_SLOW_MODE, (data: { seconds: number }) => {
      const { room, participant } = getContext();
      if (!room || !participant) {
        emitError('You must be an active member of a room to change room settings.');
        return;
      }

      if (!PermissionService.canManageSettings(participant)) {
        emitError('Permission denied: Only the Host can change room settings.');
        return;
      }

      const seconds = Math.max(0, Math.min(Number(data?.seconds) || 0, 60));
      room.setSlowMode(seconds);

      const sysMsg = room.addChatMessage(
        'system',
        'System',
        seconds > 0
          ? `Slow mode (${seconds}s) enabled by Host.`
          : 'Slow mode disabled by Host.',
        'system'
      );

      io.to(room.id).emit(SOCKET_EVENTS.SLOW_MODE_UPDATED, { slowModeSeconds: seconds });
      io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, sysMsg);
    });

    // 13f. UPDATE QUEUE (Notify room of queue modification)
    socket.on(SOCKET_EVENTS.UPDATE_QUEUE, () => {
      const { room, participant } = getContext();
      if (!room || !participant) {
        emitError('You must be an active member of a room to update the queue.');
        return;
      }
      io.to(room.id).emit(SOCKET_EVENTS.QUEUE_UPDATED, { roomId: room.id });
    });

    // 14. LIVE LIKE & EMOJI REACTION
    socket.on(SOCKET_EVENTS.SEND_REACTION, (data: { emoji?: string; type?: string }) => {
      const { room, participant } = getContext();
      if (!room || !participant) {
        emitError('You must be an active member of a room to send reactions.');
        return;
      }

      const now = Date.now();
      const lastTime = lastReactionTimes.get(participant.id) || 0;
      if (now - lastTime < REACTION_COOLDOWN_MS) {
        emitError('Please wait before reacting again.');
        return;
      }
      lastReactionTimes.set(participant.id, now);

      const emoji = (data?.emoji && typeof data.emoji === 'string' && data.emoji.trim())
        ? data.emoji.trim().slice(0, 8)
        : '❤️';
      const reactionType = (data?.type && typeof data.type === 'string')
        ? data.type
        : 'like';

      const newTotal = room.incrementLikeCount();

      io.to(room.id).emit(SOCKET_EVENTS.REACTION_RECEIVED, {
        id: `react_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        emoji,
        type: reactionType,
        senderId: participant.id,
        senderName: participant.username,
        count: newTotal,
        likeCount: newTotal,
        timestamp: Date.now(),
      });
    });

    // 15. SYNC PING (Client drift heartbeat check)
    socket.on(SOCKET_EVENTS.SYNC_PING, (data: { clientTime: number }) => {
      const { room } = getContext();
      if (!room) return;

      const serverTime = room.getAuthoritativeCurrentTime();
      socket.emit(SOCKET_EVENTS.SYNC_PONG, {
        serverTime,
        playState: room.getPlaybackState().playState,
        videoId: room.getPlaybackState().videoId,
        drift: Math.abs(data.clientTime - serverTime),
      });
    });

    // DISCONNECT
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      handleLeave();
    });

    function handleLeave() {
      const leaveResult = roomManager.leaveRoom(socket.id);
      if (!leaveResult) return;

      const { room, participant, roomDeleted, previousHostId, newHostId } = leaveResult;
      socket.leave(room.id);
      lastReactionTimes.delete(participant.id);

      if (roomDeleted) {
        console.log(`[Room Deleted] Room ${room.id} is now empty and removed.`);
        return;
      }

      console.log(`[User Left] ${participant.username} left room ${room.id}`);

      const sysMsg = room.addChatMessage(
        'system',
        'System',
        `${participant.username} left the watch party.`,
        'system'
      );

      const updatedParticipants = room.getAllParticipants();

      io.to(room.id).emit(SOCKET_EVENTS.USER_LEFT, {
        username: participant.username,
        userId: participant.id,
        participants: updatedParticipants,
      });

      io.to(room.id).emit(SOCKET_EVENTS.PARTICIPANTS_UPDATED, {
        participants: updatedParticipants,
      });

      emitPresenceUpdated(room);

      if (newHostId && previousHostId !== newHostId) {
        const newHost = room.getParticipant(newHostId);
        const hostTransMsg = room.addChatMessage(
          'system',
          'System',
          `Host left. ${newHost?.username || 'New user'} is now the room Host.`,
          'system'
        );
        io.to(room.id).emit(SOCKET_EVENTS.HOST_TRANSFERRED, {
          previousHostId,
          newHostId,
          participants: updatedParticipants,
        });
        io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, hostTransMsg);
      }

      io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, sysMsg);
    }
  });
}
