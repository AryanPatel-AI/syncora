import { spawn, ChildProcess } from 'child_process';
import { io as ioClient, Socket } from 'socket.io-client';
import path from 'path';

const PORT = 4011;
const BASE_URL = `http://localhost:${PORT}`;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPlatformTests() {
  console.log('🧪 Starting Syncora Platform & REST Integration Tests...\n');

  // Spawn test server
  const serverProcess: ChildProcess = spawn(
    'npx',
    ['tsx', path.resolve(__dirname, 'server.ts')],
    {
      env: {
        ...process.env,
        PORT: String(PORT),
        DATABASE_PATH: path.resolve(__dirname, '../watchparty-test.db'),
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    }
  );

  serverProcess.stderr?.on('data', (d) => {
    // console.error('[Server Err]:', d.toString());
  });

  // Wait for server to be up
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch (_) {}
    await sleep(200);
  }

  if (!ready) {
    console.error('❌ Server failed to start');
    serverProcess.kill();
    process.exit(1);
  }

  console.log(`✅ Platform test server ready on ${BASE_URL}\n`);

  try {
    // 1. Test Video Endpoints
    console.log('▶ Test 1: Video Discovery & Categories API...');
    const catRes = await fetch(`${BASE_URL}/api/videos/categories`);
    const categories: any = await catRes.json();
    if (!Array.isArray(categories) || categories.length === 0) {
      throw new Error('Categories failed to return array');
    }
    console.log(`  ✓ Categories returned ${categories.length} entries`);

    const liveRes = await fetch(`${BASE_URL}/api/videos/live`);
    const liveData: any = await liveRes.json();
    if (!Array.isArray(liveData.items)) {
      throw new Error('Live streams failed to return items');
    }
    console.log(`  ✓ Live streams endpoint returned ${liveData.items.length} streams`);

    const searchRes = await fetch(`${BASE_URL}/api/videos/search?q=lofi`);
    const searchData: any = await searchRes.json();
    if (!Array.isArray(searchData.items)) {
      throw new Error('Search failed to return items');
    }
    console.log(`  ✓ Search returned ${searchData.items.length} items for "lofi"`);

    const detailsRes = await fetch(`${BASE_URL}/api/videos/aqz-KE-bpKQ`);
    const details: any = await detailsRes.json();
    if (!details.id || details.id !== 'aqz-KE-bpKQ') {
      throw new Error('Video details failed');
    }
    console.log(`  ✓ Video details returned: "${details.title}"`);

    // 2. Test Auth Endpoints
    console.log('\n▶ Test 2: User Authentication & Profile API...');
    const regUsername = `testuser_${Date.now()}`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: regUsername,
        password: 'Password123!',
        displayName: 'Test User',
      }),
    });
    const regData: any = await regRes.json();
    if (!regData.token || !regData.user) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }
    console.log(`  ✓ Registered user "${regData.user.username}" with token`);

    const token = regData.token;

    // Login test
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: regUsername,
        password: 'Password123!',
      }),
    });
    const loginData: any = await loginRes.json();
    if (!loginData.token) {
      throw new Error('Login failed');
    }
    console.log(`  ✓ Successfully logged in with correct credentials`);

    // Me test
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData: any = await meRes.json();
    if (meData.user?.username !== regUsername) {
      throw new Error('Profile verification failed');
    }
    console.log(`  ✓ Profile verified via auth token`);

    // 3. Test Saved Videos, History, and Follows
    console.log('\n▶ Test 3: Saved Videos & Watch History API...');
    const saveRes = await fetch(`${BASE_URL}/api/user/saved`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        videoId: 'aqz-KE-bpKQ',
        title: 'Big Buck Bunny',
        channelTitle: 'Blender Studio',
      }),
    });
    const saveData: any = await saveRes.json();
    if (!saveData.item) {
      throw new Error('Failed to save video');
    }
    console.log(`  ✓ Saved video: "${saveData.item.title}"`);

    const getSavedRes = await fetch(`${BASE_URL}/api/user/saved`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getSavedData: any = await getSavedRes.json();
    if (!getSavedData.items.some((i: any) => i.videoId === 'aqz-KE-bpKQ')) {
      throw new Error('Saved video not in list');
    }
    console.log(`  ✓ Retrieved ${getSavedData.items.length} saved video(s)`);

    // History
    await fetch(`${BASE_URL}/api/user/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        videoId: 'jfKfPfyJRdk',
        title: 'lofi hip hop radio',
        progressSeconds: 45,
      }),
    });
    const historyRes = await fetch(`${BASE_URL}/api/user/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const historyData: any = await historyRes.json();
    if (!historyData.items.some((i: any) => i.videoId === 'jfKfPfyJRdk')) {
      throw new Error('History entry missing');
    }
    console.log(`  ✓ Recorded and retrieved viewing history`);

    // 4. Test Room Queue API
    console.log('\n▶ Test 4: Room Queue Management API...');
    const testRoomId = `TESTQ_${Date.now()}`;
    const queueAddRes = await fetch(`${BASE_URL}/api/rooms/${testRoomId}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: 'M7lc1UVf-VE',
        title: 'IFrame API Intro',
        addedById: 'user_1',
        addedByName: 'Alice',
      }),
    });
    const queueAddData: any = await queueAddRes.json();
    if (!queueAddData.item) {
      throw new Error('Failed to add to queue');
    }
    console.log(`  ✓ Added video "${queueAddData.item.title}" to room queue`);

    const queueGetRes = await fetch(`${BASE_URL}/api/rooms/${testRoomId}/queue`);
    const queueGetData: any = await queueGetRes.json();
    if (queueGetData.items.length !== 1) {
      throw new Error('Queue length incorrect');
    }
    console.log(`  ✓ Fetched room queue with ${queueGetData.items.length} item`);

    // 5. Test Broadcast Status API
    console.log('\n▶ Test 5: Creator Broadcasting Architecture Endpoint...');
    const bcastStatusRes = await fetch(`${BASE_URL}/api/broadcasts/status`);
    const bcastStatus: any = await bcastStatusRes.json();
    console.log(`  ✓ Broadcast provider: ${bcastStatus.provider}, configured: ${bcastStatus.isConfigured}`);

    // 6. Test Socket.IO Moderation (Pin, Delete, Timeout)
    console.log('\n▶ Test 6: Real-Time Chat Moderation via Sockets (Pin, Delete, Timeout)...');
    const socketHost: Socket = ioClient(BASE_URL, { reconnection: false });
    const socketViewer: Socket = ioClient(BASE_URL, { reconnection: false });

    await new Promise<void>((resolve) => {
      let count = 0;
      const onConnect = () => {
        count++;
        if (count === 2) resolve();
      };
      socketHost.on('connect', onConnect);
      socketViewer.on('connect', onConnect);
    });

    let modRoomId = '';
    await new Promise<void>((resolve) => {
      socketHost.emit('create_room', { username: 'ModHost' }, (res: any) => {
        modRoomId = res.roomId;
        resolve();
      });
    });

    let viewerId = '';
    await new Promise<void>((resolve) => {
      socketViewer.emit('join_room', { roomId: modRoomId, username: 'SpamUser' }, (res: any) => {
        viewerId = res.user.id;
        resolve();
      });
    });

    let sentMsgId = '';
    await new Promise<void>((resolve) => {
      socketViewer.once('chat_message', (msg: any) => {
        if (msg.senderName === 'SpamUser') {
          sentMsgId = msg.id;
          resolve();
        }
      });
      socketViewer.emit('send_chat', { message: 'Message to be moderated' });
    });
    console.log(`  ✓ Message sent by viewer: "${sentMsgId}"`);

    // Moderator pins message
    await new Promise<void>((resolve) => {
      socketViewer.once('message_pinned', (data: any) => {
        if (data.message.id === sentMsgId && data.pinned === true) {
          console.log(`  ✓ Message pinned notification received`);
          resolve();
        }
      });
      socketHost.emit('pin_message', { messageId: sentMsgId, pinned: true });
    });

    // Moderator deletes message
    await new Promise<void>((resolve) => {
      socketViewer.once('message_deleted', (data: any) => {
        if (data.messageId === sentMsgId) {
          console.log(`  ✓ Message deleted notification received`);
          resolve();
        }
      });
      socketHost.emit('delete_message', { messageId: sentMsgId });
    });

    // Moderator times out viewer
    await new Promise<void>((resolve) => {
      socketViewer.once('user_timed_out', (data: any) => {
        if (data.userId === viewerId) {
          console.log(`  ✓ Viewer timed out for ${data.durationSeconds}s`);
          resolve();
        }
      });
      socketHost.emit('timeout_user', { userId: viewerId, durationSeconds: 30 });
    });

    socketHost.disconnect();
    socketViewer.disconnect();

    console.log('\n=================================================================');
    console.log('🎉 ALL PLATFORM REST & MODERATION TESTS PASSED! 🚀');
    console.log('=================================================================\n');
  } finally {
    serverProcess.kill();
  }
}

runPlatformTests().catch((err) => {
  console.error('❌ Platform test suite failed:', err);
  process.exit(1);
});
