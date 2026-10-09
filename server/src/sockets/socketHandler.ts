import { Server, Socket } from 'socket.io';
import { RoomManager } from '../services/RoomManager';
import { PermissionService } from '../services/PermissionService';
import { SOCKET_EVENTS } from './events';
import { Role, ControlRequestType } from '../types';

export function registerSocketHandlers(io: Server) {
  const roomManager = RoomManager.getInstance();

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Helper: emit error to this socket
    const emitError = (message: string) => {
      socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, { message });
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
          const { room, host } = roomManager.createRoom(
            data.username,
            socket.id,
            data.initialVideoId
          );

          socket.join(room.id);
          console.log(`[Room Created] Room ID: ${room.id} by Host: ${host.username}`);

          const stateSnapshot = room.getStateSnapshot();

          // Send back to creator
          socket.emit(SOCKET_EVENTS.SYNC_STATE, room.getPlaybackState());
          socket.emit(SOCKET_EVENTS.USER_JOINED, {
            username: host.username,
            userId: host.id,
            role: host.role,
            participants: room.getAllParticipants(),
          });

          if (callback) {
            callback({
              success: true,
              roomId: room.id,
              user: host.toJSON(),
              roomState: stateSnapshot,
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
          if (!data.roomId || !data.username) {
            emitError('Room ID and username are required.');
            if (callback) callback({ success: false, error: 'Room ID and username are required.' });
            return;
          }

          const result = roomManager.joinRoom(data.roomId, data.username, socket.id);
          if ('error' in result) {
            emitError(result.error);
            if (callback) callback({ success: false, error: result.error });
            return;
          }

          const { room, participant } = result;
          socket.join(room.id);

          console.log(`[User Joined] ${participant.username} (${participant.role}) joined ${room.id}`);

          // Broadcast system message
          const sysMsg = room.addChatMessage(
            'system',
            'System',
            `${participant.username} joined the watch party.`,
            'system'
          );

          // Notify everyone in room about new participant
          io.to(room.id).emit(SOCKET_EVENTS.USER_JOINED, {
            username: participant.username,
            userId: participant.id,
            role: participant.role,
            participants: room.getAllParticipants(),
          });

          io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, sysMsg);

          // Send authoritative playback state & full room state to newly joined client
          socket.emit(SOCKET_EVENTS.SYNC_STATE, room.getPlaybackState());

          if (callback) {
            callback({
              success: true,
              roomId: room.id,
              user: participant.toJSON(),
              roomState: room.getStateSnapshot(),
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
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, () => {
      handleLeave();
    });

    // 4. PLAY EVENT
    socket.on(SOCKET_EVENTS.PLAY, (data: { time?: number } = {}) => {
      const { room, participant } = getContext();
      if (!room || !participant) return;

      if (!PermissionService.canControlPlayback(participant)) {
        emitError('Permission denied: Only Host or Moderator can play video.');
        return;
      }

      const currentTime = typeof data.time === 'number' ? data.time : room.getAuthoritativeCurrentTime();
      const updatedPlayback = room.updatePlayState('playing', currentTime, participant);

      io.to(room.id).emit(SOCKET_EVENTS.SYNC_STATE, updatedPlayback);
      console.log(`[Play] Room ${room.id} at ${currentTime.toFixed(1)}s by ${participant.username}`);
    });

    // 5. PAUSE EVENT
    socket.on(SOCKET_EVENTS.PAUSE, (data: { time?: number } = {}) => {
      const { room, participant } = getContext();
      if (!room || !participant) return;

      if (!PermissionService.canControlPlayback(participant)) {
        emitError('Permission denied: Only Host or Moderator can pause video.');
        return;
      }

      const currentTime = typeof data.time === 'number' ? data.time : room.getAuthoritativeCurrentTime();
      const updatedPlayback = room.updatePlayState('paused', currentTime, participant);

      io.to(room.id).emit(SOCKET_EVENTS.SYNC_STATE, updatedPlayback);
      console.log(`[Pause] Room ${room.id} at ${currentTime.toFixed(1)}s by ${participant.username}`);
    });

    // 6. SEEK EVENT
    socket.on(SOCKET_EVENTS.SEEK, (data: { time: number }) => {
      const { room, participant } = getContext();
      if (!room || !participant) return;

      if (!PermissionService.canControlPlayback(participant)) {
        emitError('Permission denied: Only Host or Moderator can seek video.');
        return;
      }

      if (typeof data.time !== 'number' || isNaN(data.time)) return;

      const updatedPlayback = room.seek(data.time, participant);
      io.to(room.id).emit(SOCKET_EVENTS.SYNC_STATE, updatedPlayback);
      console.log(`[Seek] Room ${room.id} to ${data.time.toFixed(1)}s by ${participant.username}`);
    });

    // 7. CHANGE VIDEO EVENT
    socket.on(SOCKET_EVENTS.CHANGE_VIDEO, (data: { videoId: string }) => {
      const { room, participant } = getContext();
      if (!room || !participant) return;

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
    socket.on(SOCKET_EVENTS.ASSIGN_ROLE, (data: { userId: string; role: Role }) => {
      const { room, participant: actor } = getContext();
      if (!room || !actor) return;

      if (!PermissionService.canAssignRoles(actor)) {
        emitError('Permission denied: Only the Host can assign roles.');
        return;
      }

      const target = room.getParticipant(data.userId);
      if (!target) {
        emitError('Target user not found in this room.');
        return;
      }

      if (target.id === actor.id) {
        emitError('Host cannot modify their own role directly.');
        return;
      }

      if (data.role === 'MODERATOR') {
        target.promoteToModerator();
      } else if (data.role === 'PARTICIPANT') {
        target.demoteToParticipant();
      } else {
        emitError('Invalid role assignment.');
        return;
      }

      const sysMsg = room.addChatMessage(
        'system',
        'System',
        `${target.username} was updated to ${target.role} by Host ${actor.username}.`,
        'system'
      );

      io.to(room.id).emit(SOCKET_EVENTS.ROLE_ASSIGNED, {
        userId: target.id,
        username: target.username,
        role: target.role,
        participants: room.getAllParticipants(),
      });
      io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, sysMsg);
      console.log(`[Role Assigned] ${target.username} -> ${target.role} by ${actor.username}`);
    });

    // 9. REMOVE PARTICIPANT (Host Only)
    socket.on(SOCKET_EVENTS.REMOVE_PARTICIPANT, (data: { userId: string }) => {
      const { room, participant: actor } = getContext();
      if (!room || !actor) return;

      const target = room.getParticipant(data.userId);
      if (!target) {
        emitError('Target participant not found.');
        return;
      }

      if (!PermissionService.canRemoveParticipant(actor, target)) {
        emitError('Permission denied: Only the Host can remove participants.');
        return;
      }

      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.emit(SOCKET_EVENTS.ERROR_MESSAGE, {
          message: 'You have been removed from the watch party by the host.',
        });
        targetSocket.leave(room.id);
      }

      room.removeParticipant(target.id);

      const sysMsg = room.addChatMessage(
        'system',
        'System',
        `${target.username} was removed from the party by ${actor.username}.`,
        'system'
      );

      io.to(room.id).emit(SOCKET_EVENTS.PARTICIPANT_REMOVED, {
        userId: target.id,
        participants: room.getAllParticipants(),
      });
      io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, sysMsg);
      console.log(`[Participant Removed] ${target.username} removed by ${actor.username}`);
    });

    // 10. TRANSFER HOST (Host Only)
    socket.on(SOCKET_EVENTS.TRANSFER_HOST, (data: { userId: string }) => {
      const { room, participant: actor } = getContext();
      if (!room || !actor) return;

      const target = room.getParticipant(data.userId);
      if (!target) {
        emitError('Target participant not found.');
        return;
      }

      if (!PermissionService.canTransferHost(actor, target)) {
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

      io.to(room.id).emit(SOCKET_EVENTS.HOST_TRANSFERRED, {
        previousHostId: actor.id,
        newHostId: target.id,
        participants: room.getAllParticipants(),
      });
      io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, sysMsg);
      console.log(`[Host Transferred] ${actor.username} -> ${target.username}`);
    });

    // 11. REQUEST CONTROL (Participant workflow)
    socket.on(
      SOCKET_EVENTS.REQUEST_CONTROL,
      (data: {
        type: ControlRequestType;
        requestedVideoId?: string;
        requestedVideoTitle?: string;
      }) => {
        const { room, participant } = getContext();
        if (!room || !participant) return;

        if (participant.role === 'HOST' || participant.role === 'MODERATOR') {
          emitError('You already have playback control privileges.');
          return;
        }

        const request = room.createControlRequest(
          participant.id,
          data.type || 'REQUEST_CONTROL',
          data.requestedVideoId,
          data.requestedVideoTitle
        );

        if (!request) return;

        const actionText =
          data.type === 'REQUEST_CHANGE_VIDEO'
            ? 'requested to change the video'
            : 'requested playback control';

        const sysMsg = room.addChatMessage(
          'system',
          'System',
          `${participant.username} ${actionText}. Host review required.`,
          'system'
        );

        // Notify room (or hosts/mods)
        io.to(room.id).emit(SOCKET_EVENTS.CONTROL_REQUEST_SUBMITTED, {
          request,
          pendingRequests: room.getPendingRequests(),
        });
        io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, sysMsg);
        console.log(`[Control Request] ${participant.username} submitted ${data.type}`);
      }
    );

    // 12. HANDLE CONTROL REQUEST (Host / Moderator review)
    socket.on(
      SOCKET_EVENTS.HANDLE_CONTROL_REQUEST,
      (data: { requestId: string; action: 'approved' | 'rejected' }) => {
        const { room, participant: actor } = getContext();
        if (!room || !actor) return;

        if (!PermissionService.canHandleControlRequest(actor)) {
          emitError('Permission denied: Only Host or Moderator can approve requests.');
          return;
        }

        const resolved = room.resolveControlRequest(data.requestId, data.action);
        if (!resolved) {
          emitError('Control request not found or already processed.');
          return;
        }

        const requester = room.getParticipant(resolved.userId);
        const actionStr = data.action === 'approved' ? 'approved' : 'declined';
        const sysMsg = room.addChatMessage(
          'system',
          'System',
          `${actor.username} ${actionStr} the control request for ${requester?.username || 'user'}.`,
          'system'
        );

        io.to(room.id).emit(SOCKET_EVENTS.CONTROL_REQUEST_UPDATED, {
          request: resolved,
          pendingRequests: room.getPendingRequests(),
          participants: room.getAllParticipants(),
          playback: room.getPlaybackState(),
        });
        io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, sysMsg);
        console.log(`[Control Request Handled] ${data.requestId} was ${data.action} by ${actor.username}`);
      }
    );

    // 13. CHAT MESSAGE
    socket.on(SOCKET_EVENTS.SEND_CHAT, (data: { message: string }) => {
      const { room, participant } = getContext();
      if (!room || !participant) return;

      if (!data.message || !data.message.trim()) return;

      const msg = room.addChatMessage(
        participant.id,
        participant.username,
        data.message.trim().slice(0, 500),
        'user',
        participant.role
      );

      io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, msg);
    });

    // 14. EMOJI REACTION
    socket.on(SOCKET_EVENTS.SEND_REACTION, (data: { emoji: string }) => {
      const { room, participant } = getContext();
      if (!room || !participant) return;

      if (!data.emoji) return;

      io.to(room.id).emit(SOCKET_EVENTS.REACTION_RECEIVED, {
        id: `react_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        emoji: data.emoji,
        senderId: participant.id,
        senderName: participant.username,
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

      io.to(room.id).emit(SOCKET_EVENTS.USER_LEFT, {
        username: participant.username,
        userId: participant.id,
        participants: room.getAllParticipants(),
      });

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
          participants: room.getAllParticipants(),
        });
        io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, hostTransMsg);
      }

      io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, sysMsg);
    }
  });
}
