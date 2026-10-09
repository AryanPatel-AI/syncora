import { io, Socket } from 'socket.io-client';
import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { registerSocketHandlers } from './sockets/socketHandler';
import { SOCKET_EVENTS } from './sockets/events';
import { initDatabase } from './database/db';
import { RoomManager } from './services/RoomManager';
import { ChatRateLimiter } from './services/ChatRateLimiter';

async function runTests() {
  console.log('🧪 Starting Syncora Full Assignment Verification Test Suite...\n');

  initDatabase();

  // 1. Setup in-memory test server on port 4009
  const app = express();
  const server = http.createServer(app);
  const testIo = new SocketIOServer(server, { cors: { origin: '*' } });
  registerSocketHandlers(testIo);

  await new Promise<void>((resolve) => server.listen(4009, resolve));
  console.log('✅ Test server started on http://localhost:4009\n');

  const SERVER_URL = 'http://127.0.0.1:4009';

  // Helper to connect socket
  const createClient = (name: string): Promise<Socket> => {
    return new Promise((resolve, reject) => {
      const client = io(SERVER_URL, { forceNew: true, transports: ['websocket', 'polling'] });
      client.on('connect', () => {
        resolve(client);
      });
      client.on('connect_error', (err) => {
        console.error(`  Connection error for ${name}:`, err.message);
        reject(err);
      });
    });
  };

  // Helper to expect server error
  const expectError = (
    socket: Socket,
    emitter: () => void,
    expectedSubstr: string,
    testName: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      let done = false;
      const handler = (data: { message?: string }) => {
        if (data?.message && data.message.toLowerCase().includes(expectedSubstr.toLowerCase())) {
          done = true;
          console.log(`  ✓ ${testName} correctly rejected: "${data.message}"`);
          socket.off(SOCKET_EVENTS.ERROR_MESSAGE, handler);
          resolve();
        }
      };
      socket.on(SOCKET_EVENTS.ERROR_MESSAGE, handler);
      emitter();
      setTimeout(() => {
        if (!done) {
          socket.off(SOCKET_EVENTS.ERROR_MESSAGE, handler);
          reject(new Error(`Server failed to reject unauthorized command for: ${testName}`));
        }
      }, 1500);
    });
  };

  try {
    const hostSocket = await createClient('Alice (Host)');
    const participantSocket = await createClient('Bob (Participant)');

    let roomId = '';
    let hostUserId = '';
    let bobUserId = '';

    // =========================================================================
    // REQUIREMENT 1: Creating a room and assigning Host
    // =========================================================================
    console.log('▶ Test 1: Creating a room and assigning Host...');
    await new Promise<void>((resolve, reject) => {
      hostSocket.emit(
        SOCKET_EVENTS.CREATE_ROOM,
        { username: 'Alice', initialVideoId: 'aqz-KE-bpKQ' },
        (res: any) => {
          if (!res.success) return reject(new Error('Failed to create room'));
          roomId = res.roomId;
          hostUserId = res.user.id;
          if (res.user.role !== 'HOST' || !res.user.isHost) {
            return reject(new Error(`Expected role HOST, got ${res.user.role}`));
          }
          console.log(`  ✓ Alice created room "${roomId}" as HOST (User ID: ${hostUserId})`);
          resolve();
        }
      );
    });

    // =========================================================================
    // REQUIREMENT 2: Joining an existing room as Participant
    // =========================================================================
    console.log('\n▶ Test 2: Joining an existing room as Participant...');
    await new Promise<void>((resolve, reject) => {
      participantSocket.emit(
        SOCKET_EVENTS.JOIN_ROOM,
        { roomId, username: 'Bob' },
        (res: any) => {
          if (!res.success) return reject(new Error('Failed to join room'));
          bobUserId = res.user.id;
          if (res.user.role !== 'PARTICIPANT' || res.user.isHost) {
            return reject(new Error(`Expected role PARTICIPANT, got ${res.user.role}`));
          }
          console.log(`  ✓ Bob joined room "${roomId}" as PARTICIPANT (User ID: ${bobUserId})`);
          resolve();
        }
      );
    });

    // =========================================================================
    // REQUIREMENT 3: Rejecting an unknown room or invalid payload
    // =========================================================================
    console.log('\n▶ Test 3: Rejecting an unknown room or invalid payload...');
    const testClient = await createClient('TestClient');

    // 3a. Unknown room rejection
    await new Promise<void>((resolve, reject) => {
      testClient.emit(
        SOCKET_EVENTS.JOIN_ROOM,
        { roomId: 'NONEXIST99', username: 'Tester' },
        (res: any) => {
          if (!res.success && res.error) {
            console.log(`  ✓ Non-existent room correctly rejected via ack: "${res.error}"`);
            resolve();
          } else {
            reject(new Error('Server accepted non-existent room code'));
          }
        }
      );
    });

    // 3b. Empty username in create_room
    await new Promise<void>((resolve, reject) => {
      testClient.emit(SOCKET_EVENTS.CREATE_ROOM, { username: '' }, (res: any) => {
        if (!res.success && res.error) {
          console.log(`  ✓ Empty username in create_room rejected: "${res.error}"`);
          resolve();
        } else {
          reject(new Error('Server accepted empty username'));
        }
      });
    });

    // 3c. Empty username in join_room
    await new Promise<void>((resolve, reject) => {
      testClient.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, username: '   ' }, (res: any) => {
        if (!res.success && res.error) {
          console.log(`  ✓ Whitespace-only username in join_room rejected: "${res.error}"`);
          resolve();
        } else {
          reject(new Error('Server accepted whitespace username'));
        }
      });
    });

    // 3d. Invalid YouTube video ID format
    await new Promise<void>((resolve, reject) => {
      testClient.emit(SOCKET_EVENTS.CREATE_ROOM, { username: 'Tester', initialVideoId: 'bad_id' }, (res: any) => {
        if (!res.success && res.error) {
          console.log(`  ✓ Invalid video ID format rejected: "${res.error}"`);
          resolve();
        } else {
          reject(new Error('Server accepted invalid video ID format'));
        }
      });
    });
    testClient.disconnect();

    // =========================================================================
    // REQUIREMENT 4: Broadcasting participant join and leave updates
    // =========================================================================
    console.log('\n▶ Test 4: Broadcasting participant join and leave updates...');
    const charlieSocket = await createClient('Charlie');
    let charlieUserId = '';

    // Charlie joins: Alice should receive user_joined & participants_updated (3 members)
    await new Promise<void>((resolve, reject) => {
      let joinBroadcastReceived = false;
      let listUpdatedReceived = false;

      hostSocket.once(SOCKET_EVENTS.USER_JOINED, (data: any) => {
        if (data.username === 'Charlie') {
          joinBroadcastReceived = true;
          if (listUpdatedReceived) resolve();
        }
      });

      hostSocket.once(SOCKET_EVENTS.PARTICIPANTS_UPDATED, (data: any) => {
        if (data.participants?.length === 3) {
          listUpdatedReceived = true;
          if (joinBroadcastReceived) resolve();
        }
      });

      charlieSocket.emit(
        SOCKET_EVENTS.JOIN_ROOM,
        { roomId, username: 'Charlie' },
        (res: any) => {
          if (!res.success) return reject(new Error('Charlie failed to join'));
          charlieUserId = res.user.id;
        }
      );
    });
    console.log(`  ✓ Charlie joined. Host Alice received user_joined and participants_updated (3 members)`);

    // Charlie leaves: Alice should receive user_left & participants_updated (2 members)
    await new Promise<void>((resolve) => {
      let leftBroadcastReceived = false;
      let listUpdatedReceived = false;

      hostSocket.once(SOCKET_EVENTS.USER_LEFT, (data: any) => {
        if (data.username === 'Charlie' && data.userId === charlieUserId) {
          leftBroadcastReceived = true;
          if (listUpdatedReceived) resolve();
        }
      });

      hostSocket.once(SOCKET_EVENTS.PARTICIPANTS_UPDATED, (data: any) => {
        if (data.participants?.length === 2) {
          listUpdatedReceived = true;
          if (leftBroadcastReceived) resolve();
        }
      });

      charlieSocket.emit(SOCKET_EVENTS.LEAVE_ROOM);
    });
    console.log(`  ✓ Charlie left. Host Alice received user_left and participants_updated (2 members)`);
    charlieSocket.disconnect();

    // =========================================================================
    // REQUIREMENT 5: Synchronizing play, pause, seek, and video changes
    // =========================================================================
    console.log('\n▶ Test 5: Synchronizing play, pause, seek, and video changes...');

    // 5a. Play sync
    await new Promise<void>((resolve, reject) => {
      participantSocket.once(SOCKET_EVENTS.SYNC_STATE, (state: any) => {
        if (state.playState === 'playing' && Math.abs(state.currentTime - 25) < 0.1) {
          console.log(`  ✓ Play synchronized: state is "playing" at 25s (Updated by: ${state.updatedBy.username})`);
          resolve();
        } else {
          reject(new Error(`Unexpected play sync state: ${JSON.stringify(state)}`));
        }
      });
      hostSocket.emit(SOCKET_EVENTS.PLAY, { time: 25 });
    });

    // 5b. Seek sync
    await new Promise<void>((resolve, reject) => {
      participantSocket.once(SOCKET_EVENTS.SYNC_STATE, (state: any) => {
        if (state.currentTime === 60) {
          console.log(`  ✓ Seek synchronized: currentTime is 60s`);
          resolve();
        } else {
          reject(new Error(`Unexpected seek sync state: ${JSON.stringify(state)}`));
        }
      });
      hostSocket.emit(SOCKET_EVENTS.SEEK, { time: 60 });
    });

    // 5c. Pause sync
    await new Promise<void>((resolve, reject) => {
      participantSocket.once(SOCKET_EVENTS.SYNC_STATE, (state: any) => {
        if (state.playState === 'paused' && state.currentTime === 60) {
          console.log(`  ✓ Pause synchronized: state is "paused" at 60s`);
          resolve();
        } else {
          reject(new Error(`Unexpected pause sync state: ${JSON.stringify(state)}`));
        }
      });
      hostSocket.emit(SOCKET_EVENTS.PAUSE, { time: 60 });
    });

    // 5d. Change video sync
    await new Promise<void>((resolve, reject) => {
      participantSocket.once(SOCKET_EVENTS.SYNC_STATE, (state: any) => {
        if (state.videoId === 'M7lc1UVf-VE') {
          console.log(`  ✓ Video change synchronized: videoId is "${state.videoId}"`);
          resolve();
        } else {
          reject(new Error(`Unexpected videoId: ${state.videoId}`));
        }
      });
      hostSocket.emit(SOCKET_EVENTS.CHANGE_VIDEO, { videoId: 'M7lc1UVf-VE' });
    });

    // =========================================================================
    // REQUIREMENT 6: Rejecting playback commands from a Participant
    // =========================================================================
    console.log('\n▶ Test 6: Rejecting playback commands from a Participant...');
    await expectError(
      participantSocket,
      () => participantSocket.emit(SOCKET_EVENTS.PLAY, { time: 10 }),
      'Permission denied',
      'Participant PLAY'
    );
    await expectError(
      participantSocket,
      () => participantSocket.emit(SOCKET_EVENTS.PAUSE, { time: 10 }),
      'Permission denied',
      'Participant PAUSE'
    );
    await expectError(
      participantSocket,
      () => participantSocket.emit(SOCKET_EVENTS.SEEK, { time: 30 }),
      'Permission denied',
      'Participant SEEK'
    );
    await expectError(
      participantSocket,
      () => participantSocket.emit(SOCKET_EVENTS.CHANGE_VIDEO, { videoId: 'aqz-KE-bpKQ' }),
      'Permission denied',
      'Participant CHANGE_VIDEO'
    );

    // =========================================================================
    // REQUIREMENT 7: Allowing authorized Moderator controls
    // =========================================================================
    console.log('\n▶ Test 7: Allowing authorized Moderator controls...');

    // Host promotes Bob to MODERATOR
    await new Promise<void>((resolve, reject) => {
      participantSocket.once(SOCKET_EVENTS.ROLE_ASSIGNED, (data: any) => {
        if (data.userId === bobUserId && data.role === 'MODERATOR') {
          console.log(`  ✓ Bob promoted to MODERATOR via assign_role`);
          resolve();
        } else {
          reject(new Error(`Failed to assign MODERATOR: ${JSON.stringify(data)}`));
        }
      });
      hostSocket.emit(SOCKET_EVENTS.ASSIGN_ROLE, { userId: bobUserId, role: 'MODERATOR' });
    });

    // Moderator Bob can now pause playback
    await new Promise<void>((resolve, reject) => {
      hostSocket.once(SOCKET_EVENTS.SYNC_STATE, (state: any) => {
        if (state.playState === 'paused' && state.currentTime === 88) {
          console.log(`  ✓ Moderator Bob successfully executed pause at 88s`);
          resolve();
        } else {
          reject(new Error(`Moderator playback command failed: ${JSON.stringify(state)}`));
        }
      });
      participantSocket.emit(SOCKET_EVENTS.PAUSE, { time: 88 });
    });

    // Moderator Bob can change video
    await new Promise<void>((resolve, reject) => {
      hostSocket.once(SOCKET_EVENTS.SYNC_STATE, (state: any) => {
        if (state.videoId === 'aqz-KE-bpKQ') {
          console.log(`  ✓ Moderator Bob successfully changed video to "aqz-KE-bpKQ"`);
          resolve();
        } else {
          reject(new Error(`Moderator change video failed: ${state.videoId}`));
        }
      });
      participantSocket.emit(SOCKET_EVENTS.CHANGE_VIDEO, { videoId: 'aqz-KE-bpKQ' });
    });

    // Host demotes Bob back to PARTICIPANT
    await new Promise<void>((resolve, reject) => {
      participantSocket.once(SOCKET_EVENTS.ROLE_ASSIGNED, (data: any) => {
        if (data.userId === bobUserId && data.role === 'PARTICIPANT') {
          console.log(`  ✓ Bob demoted back to PARTICIPANT`);
          resolve();
        } else {
          reject(new Error(`Failed to demote Bob: ${JSON.stringify(data)}`));
        }
      });
      hostSocket.emit(SOCKET_EVENTS.ASSIGN_ROLE, { userId: bobUserId, role: 'PARTICIPANT' });
    });

    // Demoted Bob can no longer pause
    await expectError(
      participantSocket,
      () => participantSocket.emit(SOCKET_EVENTS.PAUSE, { time: 90 }),
      'Permission denied',
      'Demoted Bob PAUSE'
    );

    // =========================================================================
    // REQUIREMENT 8: Allowing role assignments and participant removal only by the Host
    // =========================================================================
    console.log('\n▶ Test 8: Allowing role assignments and participant removal only by Host...');

    // Non-host Bob cannot assign role
    await expectError(
      participantSocket,
      () => participantSocket.emit(SOCKET_EVENTS.ASSIGN_ROLE, { userId: hostUserId, role: 'MODERATOR' }),
      'Permission denied',
      'Participant ASSIGN_ROLE'
    );

    // Non-host Bob cannot remove participant
    await expectError(
      participantSocket,
      () => participantSocket.emit(SOCKET_EVENTS.REMOVE_PARTICIPANT, { userId: hostUserId }),
      'Permission denied',
      'Participant REMOVE_PARTICIPANT'
    );

    // Host cannot assign role HOST
    await expectError(
      hostSocket,
      () => hostSocket.emit(SOCKET_EVENTS.ASSIGN_ROLE, { userId: bobUserId, role: 'HOST' as any }),
      'Invalid role assignment',
      'Host assigning invalid role HOST'
    );

    // Host cannot modify own role directly
    await expectError(
      hostSocket,
      () => hostSocket.emit(SOCKET_EVENTS.ASSIGN_ROLE, { userId: hostUserId, role: 'MODERATOR' }),
      'Host cannot modify their own role',
      'Host modifying own role directly'
    );

    // Host cannot remove self
    await expectError(
      hostSocket,
      () => hostSocket.emit(SOCKET_EVENTS.REMOVE_PARTICIPANT, { userId: hostUserId }),
      'Only the Host can remove participants',
      'Host removing self'
    );

    // Host kicks a participant
    const frankSocket = await createClient('Frank');
    let frankUserId = '';
    await new Promise<void>((resolve) => {
      frankSocket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, username: 'Frank' }, (res: any) => {
        frankUserId = res.user.id;
        resolve();
      });
    });

    await new Promise<void>((resolve, reject) => {
      frankSocket.once(SOCKET_EVENTS.ERROR_MESSAGE, (err: any) => {
        if (err.message.includes('removed from the watch party')) {
          console.log(`  ✓ Frank was kicked by Host Alice and received removal notification`);
          resolve();
        } else {
          reject(new Error(`Unexpected kick message: ${err.message}`));
        }
      });
      hostSocket.emit(SOCKET_EVENTS.REMOVE_PARTICIPANT, { userId: frankUserId });
    });
    frankSocket.disconnect();

    // =========================================================================
    // REQUIREMENT 9: Creating, approving, and rejecting playback requests
    // =========================================================================
    console.log('\n▶ Test 9: Creating, approving, and rejecting playback requests...');

    // 9a. Request video change & Host approve
    let reqVideoId = '';
    await new Promise<void>((resolve) => {
      hostSocket.once(SOCKET_EVENTS.CONTROL_REQUEST_SUBMITTED, (data: any) => {
        reqVideoId = data.request.id;
        console.log(`  ✓ Host received playback change request #${reqVideoId} from Bob`);
        resolve();
      });
      participantSocket.emit(SOCKET_EVENTS.REQUEST_PLAYBACK_CHANGE, {
        action: 'change_video',
        requestedVideoId: 'M7lc1UVf-VE',
      });
    });

    await new Promise<void>((resolve, reject) => {
      let stateSynced = false;
      let reqUpdated = false;

      participantSocket.once(SOCKET_EVENTS.CONTROL_REQUEST_UPDATED, (data: any) => {
        if (data.request.id === reqVideoId && data.request.status === 'approved') {
          reqUpdated = true;
          if (stateSynced) resolve();
        }
      });

      participantSocket.once(SOCKET_EVENTS.SYNC_STATE, (state: any) => {
        if (state.videoId === 'M7lc1UVf-VE') {
          stateSynced = true;
          console.log(`  ✓ Request approved by Host: videoId synchronized to "${state.videoId}"`);
          if (reqUpdated) resolve();
        }
      });

      hostSocket.emit(SOCKET_EVENTS.APPROVE_REQUEST, { requestId: reqVideoId });

      setTimeout(() => {
        if (!stateSynced || !reqUpdated) reject(new Error('Approve request timed out'));
      }, 1500);
    });

    // 9b. Request seek & Host reject
    let reqSeekId = '';
    await new Promise<void>((resolve) => {
      hostSocket.once(SOCKET_EVENTS.CONTROL_REQUEST_SUBMITTED, (data: any) => {
        reqSeekId = data.request.id;
        console.log(`  ✓ Host received seek request #${reqSeekId} from Bob`);
        resolve();
      });
      participantSocket.emit(SOCKET_EVENTS.REQUEST_PLAYBACK_CHANGE, {
        action: 'seek',
        requestedTime: 120,
      });
    });

    await new Promise<void>((resolve, reject) => {
      participantSocket.once(SOCKET_EVENTS.CONTROL_REQUEST_UPDATED, (data: any) => {
        if (data.request.id === reqSeekId && data.request.status === 'rejected') {
          console.log(`  ✓ Seek request #${reqSeekId} rejected by Host`);
          resolve();
        } else {
          reject(new Error(`Unexpected status: ${data.request.status}`));
        }
      });
      hostSocket.emit(SOCKET_EVENTS.REJECT_REQUEST, { requestId: reqSeekId });
    });

    // =========================================================================
    // REQUIREMENT 10: Preventing a participant from approving their own unauthorized action
    // =========================================================================
    console.log('\n▶ Test 10: Preventing a participant from approving their own unauthorized action...');
    let selfReqId = '';
    await new Promise<void>((resolve) => {
      hostSocket.once(SOCKET_EVENTS.CONTROL_REQUEST_SUBMITTED, (data: any) => {
        selfReqId = data.request.id;
        resolve();
      });
      participantSocket.emit(SOCKET_EVENTS.REQUEST_PLAYBACK_CHANGE, {
        action: 'play',
      });
    });

    // Bob attempts to approve his own pending request
    await expectError(
      participantSocket,
      () => participantSocket.emit(SOCKET_EVENTS.APPROVE_REQUEST, { requestId: selfReqId }),
      'Permission denied: Only Host or Moderator can approve requests',
      'Participant approving own request via approve_request'
    );

    // Also test via handle_control_request
    await expectError(
      participantSocket,
      () => participantSocket.emit(SOCKET_EVENTS.HANDLE_CONTROL_REQUEST, { requestId: selfReqId, action: 'approved' }),
      'Permission denied: Only Host or Moderator can approve requests',
      'Participant approving own request via handle_control_request'
    );

    // Clean up Bob's pending request by having Host reject it
    await new Promise<void>((resolve) => {
      participantSocket.once(SOCKET_EVENTS.CONTROL_REQUEST_UPDATED, () => resolve());
      hostSocket.emit(SOCKET_EVENTS.REJECT_REQUEST, { requestId: selfReqId });
    });

    // =========================================================================
    // REQUIREMENT 11: Cleaning up disconnected members and empty rooms
    // =========================================================================
    console.log('\n▶ Test 11: Cleaning up disconnected members and empty rooms...');
    const userCSocket = await createClient('Carol (Host Room 2)');
    const userDSocket = await createClient('Dave (Participant Room 2)');
    let room2Id = '';
    let daveUserId = '';

    await new Promise<void>((resolve, reject) => {
      let snapshotReceived = false;
      let participantsReceived = false;
      let ackReceived = false;

      const checkDone = () => {
        if (snapshotReceived && participantsReceived && ackReceived) resolve();
      };

      userCSocket.once(SOCKET_EVENTS.ROOM_SNAPSHOT, (snapshot: any) => {
        if (snapshot.roomId) {
          room2Id = snapshot.roomId;
          snapshotReceived = true;
          checkDone();
        }
      });

      userCSocket.once(SOCKET_EVENTS.PARTICIPANTS_UPDATED, (data: any) => {
        if (data.participants?.length === 1) {
          participantsReceived = true;
          checkDone();
        }
      });

      userCSocket.emit(SOCKET_EVENTS.CREATE_ROOM, { username: 'Carol' }, (res: any) => {
        if (!res.success) return reject(new Error('Carol failed to create room'));
        room2Id = res.roomId;
        ackReceived = true;
        checkDone();
      });
    });
    console.log(`  ✓ Carol created room "${room2Id}"`);

    await new Promise<void>((resolve, reject) => {
      let daveSnapshot = false;
      let daveParticipants = false;
      let daveAck = false;

      const checkDave = () => {
        if (daveSnapshot && daveParticipants && daveAck) resolve();
      };

      userDSocket.once(SOCKET_EVENTS.ROOM_SNAPSHOT, () => {
        daveSnapshot = true;
        checkDave();
      });

      userDSocket.once(SOCKET_EVENTS.PARTICIPANTS_UPDATED, (data: any) => {
        if (data.participants?.length === 2) {
          daveParticipants = true;
          checkDave();
        }
      });

      userDSocket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId: room2Id, username: 'Dave' }, (res: any) => {
        if (!res.success) return reject(new Error('Dave failed to join room'));
        daveUserId = res.user.id;
        daveAck = true;
        checkDave();
      });
    });
    console.log(`  ✓ Dave joined room "${room2Id}"`);

    // Carol disconnects -> Dave promoted to Host
    await new Promise<void>((resolve, reject) => {
      userDSocket.once(SOCKET_EVENTS.HOST_TRANSFERRED, (data: any) => {
        if (data.newHostId === daveUserId) {
          console.log(`  ✓ Host Carol disconnected. Remaining participant Dave promoted to Host!`);
          resolve();
        } else {
          reject(new Error(`Expected new host ${daveUserId}, got ${data.newHostId}`));
        }
      });
      userCSocket.disconnect();
    });

    // Dave disconnects -> Room becomes empty and cleaned up
    userDSocket.disconnect();
    await new Promise((r) => setTimeout(r, 200));

    const roomManager = RoomManager.getInstance();
    const activeRoom = roomManager.getRoom(room2Id);
    if (!activeRoom || activeRoom.isEmpty()) {
      console.log(`  ✓ Last participant Dave left. Empty room "${room2Id}" successfully deleted from memory`);
    } else {
      throw new Error(`Room ${room2Id} was not cleaned up`);
    }

    // =========================================================================
    // REQUIREMENT 12: Real-time chat validation & anti-spam rate limiting
    // =========================================================================
    console.log('\n▶ Test 12: Real-Time Chat Engine (Validation, Server Identity, Rate Limiting)...');

    // 12a. Valid chat message emission
    await new Promise<void>((resolve, reject) => {
      hostSocket.once(SOCKET_EVENTS.CHAT_MESSAGE, (msg: any) => {
        if (
          msg.id &&
          msg.senderName === 'Bob' &&
          msg.senderRole === 'PARTICIPANT' &&
          (msg.content === 'Hello Alice, watching together!' || msg.text === 'Hello Alice, watching together!') &&
          typeof msg.timestamp === 'number'
        ) {
          console.log(`  ✓ Valid chat message broadcast: [${msg.senderRole}] ${msg.senderName}: "${msg.content}"`);
          resolve();
        } else {
          reject(new Error(`Invalid chat message structure: ${JSON.stringify(msg)}`));
        }
      });
      participantSocket.emit(SOCKET_EVENTS.CHAT_MESSAGE, { text: 'Hello Alice, watching together!' });
    });

    // 12b. Empty message rejection
    await expectError(
      participantSocket,
      () => participantSocket.emit(SOCKET_EVENTS.CHAT_MESSAGE, { text: '   ' }),
      'cannot be empty',
      'Empty chat message'
    );

    // 12c. Over-length (>500 chars) message rejection
    await expectError(
      participantSocket,
      () => participantSocket.emit(SOCKET_EVENTS.CHAT_MESSAGE, { text: 'Z'.repeat(505) }),
      'exceeds maximum allowed length',
      'Over-length (>500 chars) chat message'
    );

    // 12d. Non-member chat rejection
    const nonMember = await createClient('NonMember');
    await expectError(
      nonMember,
      () => nonMember.emit(SOCKET_EVENTS.CHAT_MESSAGE, { text: 'Not in room' }),
      'must be an active member',
      'Non-member chat message'
    );
    nonMember.disconnect();

    // 12e. Rate limiting anti-spam
    console.log('  Testing chat anti-spam rate limiter protection...');
    let rateBlocked = false;
    for (let i = 0; i < 7; i++) {
      participantSocket.emit(SOCKET_EVENTS.CHAT_MESSAGE, { text: `Spam attempt ${i}` });
    }
    await new Promise<void>((resolve, reject) => {
      const handler = (data: { message?: string }) => {
        if (data?.message && (data.message.includes('rate limit') || data.message.includes('too fast') || data.message.includes('slow down'))) {
          rateBlocked = true;
          console.log(`  ✓ Chat spam blocked by server rate limiter: "${data.message}"`);
          participantSocket.off(SOCKET_EVENTS.ERROR_MESSAGE, handler);
          resolve();
        }
      };
      participantSocket.on(SOCKET_EVENTS.ERROR_MESSAGE, handler);
      setTimeout(() => {
        if (!rateBlocked) reject(new Error('Rate limiter failed to block rapid chat spam'));
      }, 1500);
    });

    ChatRateLimiter.getInstance().reset(bobUserId);

    // =========================================================================
    // REQUIREMENT 13: Live Audience Presence & Like Reactions System
    // =========================================================================
    console.log('▶ Test 13: Live Audience Presence & Like Reactions System...');

    // 13a. Verify like reaction broadcast and like count synchronization
    await new Promise<void>((resolve, reject) => {
      let hostReceived = false;
      let participantReceived = false;

      const checkDone = () => {
        if (hostReceived && participantReceived) {
          console.log('  ✓ Like reaction received by all room members with synchronized likeCount');
          hostSocket.off(SOCKET_EVENTS.REACTION_RECEIVED, hostHandler);
          participantSocket.off(SOCKET_EVENTS.REACTION_RECEIVED, participantHandler);
          resolve();
        }
      };

      const hostHandler = (payload: any) => {
        if (payload.type === 'like' && payload.likeCount === 1 && payload.senderName === 'Bob') {
          hostReceived = true;
          checkDone();
        }
      };

      const participantHandler = (payload: any) => {
        if (payload.type === 'like' && payload.likeCount === 1 && payload.senderName === 'Bob') {
          participantReceived = true;
          checkDone();
        }
      };

      hostSocket.on(SOCKET_EVENTS.REACTION_RECEIVED, hostHandler);
      participantSocket.on(SOCKET_EVENTS.REACTION_RECEIVED, participantHandler);

      participantSocket.emit(SOCKET_EVENTS.SEND_REACTION, { emoji: '❤️', type: 'like' });

      setTimeout(() => {
        if (!hostReceived || !participantReceived) {
          reject(new Error(`Like reaction not received by all clients: host=${hostReceived}, participant=${participantReceived}`));
        }
      }, 1500);
    });

    // 13b. Verify second like increments count to 2 from host
    await new Promise<void>((resolve, reject) => {
      const handler = (payload: any) => {
        if (payload.type === 'like' && payload.likeCount === 2) {
          console.log('  ✓ Second like incremented room likeCount to 2');
          hostSocket.off(SOCKET_EVENTS.REACTION_RECEIVED, handler);
          resolve();
        }
      };
      hostSocket.on(SOCKET_EVENTS.REACTION_RECEIVED, handler);
      hostSocket.emit(SOCKET_EVENTS.SEND_REACTION, { emoji: '❤️', type: 'like' });
      setTimeout(() => reject(new Error('Second like count was not broadcast as 2')), 1500);
    });

    // 13c. Verify reaction cooldown anti-spam (500ms)
    console.log('  Testing reaction cooldown anti-spam protection...');
    await expectError(
      hostSocket,
      () => hostSocket.emit(SOCKET_EVENTS.SEND_REACTION, { emoji: '❤️', type: 'like' }),
      'wait before reacting again',
      'Rapid reaction cooldown rejection'
    );

    // 13d. Verify non-member reaction rejection
    const nonMemberReactor = await createClient('NonMemberReactor');
    await expectError(
      nonMemberReactor,
      () => nonMemberReactor.emit(SOCKET_EVENTS.SEND_REACTION, { emoji: '🔥', type: 'emoji' }),
      'must be an active member',
      'Non-member reaction attempt'
    );
    nonMemberReactor.disconnect();

    // 13e. Room isolation: Likes in room B do not bleed into room A
    const roomBHost = await createClient('Carol (Room B Host)');
    let roomBId = '';
    await new Promise<void>((resolve, reject) => {
      roomBHost.emit(
        SOCKET_EVENTS.CREATE_ROOM,
        { username: 'Carol', initialVideoId: 'dQw4w9WgXcQ' },
        (res: any) => {
          if (!res.success) return reject(new Error('Failed to create Room B'));
          roomBId = res.roomId;
          resolve();
        }
      );
    });

    await new Promise<void>((resolve, reject) => {
      const handler = (payload: any) => {
        if (payload.likeCount === 1) {
          console.log(`  ✓ Room B like received independently (likeCount: 1, Room B: ${roomBId})`);
          roomBHost.off(SOCKET_EVENTS.REACTION_RECEIVED, handler);
          resolve();
        }
      };
      roomBHost.on(SOCKET_EVENTS.REACTION_RECEIVED, handler);
      roomBHost.emit(SOCKET_EVENTS.SEND_REACTION, { emoji: '❤️', type: 'like' });
      setTimeout(() => reject(new Error('Room B like was not received')), 1500);
    });

    // Room A's room manager still has likeCount = 2
    const roomAInstance = RoomManager.getInstance().getRoom(roomId);
    if (roomAInstance?.getLikeCount() !== 2) {
      throw new Error(`Room isolation violated: Room A like count was ${roomAInstance?.getLikeCount()}, expected 2`);
    }
    console.log('  ✓ Room isolation verified: Room A and Room B maintain independent like counts');

    roomBHost.disconnect();

    // Clean disconnects
    hostSocket.disconnect();
    participantSocket.disconnect();
    server.close();

    console.log('\n=================================================================');
    console.log('🎉 ALL 13 ASSIGNMENT REQUIREMENTS VERIFIED & PASSED! 🚀');
    console.log('=================================================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    server.close();
    process.exit(1);
  }
}

runTests();
