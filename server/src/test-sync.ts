import { io, Socket } from 'socket.io-client';
import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { registerSocketHandlers } from './sockets/socketHandler';
import { SOCKET_EVENTS } from './sockets/events';

async function runTests() {
  console.log('🧪 Starting Syncora Real-Time Engine & RBAC Verification Tests...\n');

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

  try {
    const hostSocket = await createClient('Alice (Host)');
    const participantSocket = await createClient('Bob (Participant)');

    let roomId = '';
    let hostUserId = '';
    let bobUserId = '';

    // TEST 1: Host creates room
    console.log('▶ Test 1: Host Room Creation...');
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
          console.log(`  ✓ Alice created room ${roomId} as HOST (User ID: ${hostUserId})`);
          resolve();
        }
      );
    });

    // TEST 2: Participant joins room
    console.log('\n▶ Test 2: Participant Joining...');
    await new Promise<void>((resolve, reject) => {
      participantSocket.emit(
        SOCKET_EVENTS.JOIN_ROOM,
        { roomId, username: 'Bob' },
        (res: any) => {
          if (!res.success) return reject(new Error('Failed to join room'));
          bobUserId = res.user.id;
          if (res.user.role !== 'PARTICIPANT') {
            return reject(new Error(`Expected role PARTICIPANT, got ${res.user.role}`));
          }
          console.log(`  ✓ Bob joined room ${roomId} as PARTICIPANT (User ID: ${bobUserId})`);
          resolve();
        }
      );
    });

    // TEST 3: RBAC Enforcement - Bob (Participant) tries to play without permission
    console.log('\n▶ Test 3: Unauthorized Play Command Rejection...');
    await new Promise<void>((resolve, reject) => {
      let errorReceived = false;

      const errorHandler = (data: { message: string }) => {
        if (data.message.includes('Permission denied')) {
          errorReceived = true;
          console.log(`  ✓ Bob's unauthorized play command was correctly rejected by backend: "${data.message}"`);
          participantSocket.off(SOCKET_EVENTS.ERROR_MESSAGE, errorHandler);
          resolve();
        }
      };

      participantSocket.on(SOCKET_EVENTS.ERROR_MESSAGE, errorHandler);
      participantSocket.emit(SOCKET_EVENTS.PLAY, { time: 10 });

      setTimeout(() => {
        if (!errorReceived) reject(new Error('Server failed to reject unauthorized command'));
      }, 1000);
    });

    // TEST 4: Authorized Playback Sync - Alice (Host) plays & seeks
    console.log('\n▶ Test 4: Authorized Playback Synchronization...');
    await new Promise<void>((resolve, reject) => {
      participantSocket.once(SOCKET_EVENTS.SYNC_STATE, (state: any) => {
        if (state.playState === 'playing' && state.currentTime === 25) {
          console.log(`  ✓ Bob received synchronized play state: playing at 25s (Author: ${state.updatedBy.username})`);
          resolve();
        } else {
          reject(new Error(`Unexpected sync state: ${JSON.stringify(state)}`));
        }
      });

      hostSocket.emit(SOCKET_EVENTS.PLAY, { time: 25 });
    });

    // TEST 5: Change Video Sync
    console.log('\n▶ Test 5: Change Video Synchronization...');
    await new Promise<void>((resolve, reject) => {
      participantSocket.once(SOCKET_EVENTS.SYNC_STATE, (state: any) => {
        if (state.videoId === 'aqz-KE-bpKQ') {
          console.log(`  ✓ Bob received new video synchronization: ${state.videoId}`);
          resolve();
        } else {
          reject(new Error(`Unexpected videoId: ${state.videoId}`));
        }
      });

      hostSocket.emit(SOCKET_EVENTS.CHANGE_VIDEO, { videoId: 'aqz-KE-bpKQ' });
    });

    // TEST 6: Participant Control Request Workflow
    console.log('\n▶ Test 6: Participant Control Request & Host Approval...');
    let requestId = '';
    await new Promise<void>((resolve, reject) => {
      hostSocket.once(SOCKET_EVENTS.CONTROL_REQUEST_SUBMITTED, (data: any) => {
        requestId = data.request.id;
        console.log(`  ✓ Host Alice received control request #${requestId} from ${data.request.username}`);
        resolve();
      });

      participantSocket.emit(SOCKET_EVENTS.REQUEST_CONTROL, { type: 'REQUEST_MODERATOR' });
    });

    // Host approves request
    await new Promise<void>((resolve, reject) => {
      participantSocket.once(SOCKET_EVENTS.CONTROL_REQUEST_UPDATED, (data: any) => {
        const matchingBob = data.participants.find((p: any) => p.id === bobUserId);
        if (matchingBob && matchingBob.role === 'MODERATOR') {
          console.log(`  ✓ Request approved! Bob is now promoted to MODERATOR.`);
          resolve();
        } else {
          reject(new Error(`Bob was not promoted to MODERATOR: ${JSON.stringify(matchingBob)}`));
        }
      });

      hostSocket.emit(SOCKET_EVENTS.HANDLE_CONTROL_REQUEST, {
        requestId,
        action: 'approved',
      });
    });

    // TEST 7: Bob (Now Moderator) can control playback!
    console.log('\n▶ Test 7: Newly Promoted Moderator Playback Control...');
    await new Promise<void>((resolve, reject) => {
      hostSocket.once(SOCKET_EVENTS.SYNC_STATE, (state: any) => {
        if (state.playState === 'paused' && state.currentTime === 88) {
          console.log(`  ✓ Bob successfully paused video at 88s as MODERATOR!`);
          resolve();
        } else {
          reject(new Error(`Unexpected playback state: ${JSON.stringify(state)}`));
        }
      });

      participantSocket.emit(SOCKET_EVENTS.PAUSE, { time: 88 });
    });

    // TEST 8: Chat & Reactions
    console.log('\n▶ Test 8: Live Room Chat & Emoji Reactions...');
    await new Promise<void>((resolve) => {
      hostSocket.once(SOCKET_EVENTS.CHAT_MESSAGE, (msg: any) => {
        console.log(`  ✓ Host received chat message from ${msg.senderName}: "${msg.content}"`);
        resolve();
      });

      participantSocket.emit(SOCKET_EVENTS.SEND_CHAT, { message: 'Hello Alice, watching in sync!' });
    });

    await new Promise<void>((resolve) => {
      hostSocket.once(SOCKET_EVENTS.REACTION_RECEIVED, (reaction: any) => {
        console.log(`  ✓ Host received floating emoji reaction: ${reaction.emoji} from ${reaction.senderName}`);
        resolve();
      });

      participantSocket.emit(SOCKET_EVENTS.SEND_REACTION, { emoji: '🔥' });
    });

    // TEST 9: Remove Participant
    console.log('\n▶ Test 9: Host Remove Participant...');
    await new Promise<void>((resolve, reject) => {
      participantSocket.once(SOCKET_EVENTS.ERROR_MESSAGE, (err: any) => {
        if (err.message.includes('removed from the watch party')) {
          console.log(`  ✓ Bob was notified of removal by Host`);
          resolve();
        }
      });

      hostSocket.emit(SOCKET_EVENTS.REMOVE_PARTICIPANT, { userId: bobUserId });
    });

    // Disconnect clients and stop test server
    hostSocket.disconnect();
    participantSocket.disconnect();
    server.close();

    console.log('\n🎉 ALL 9 REAL-TIME ENGINE & RBAC TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    server.close();
    process.exit(1);
  }
}

runTests();
