# 📽️ Syncora — Comprehensive Project Report & Technical Defense
**Author**: Aryan Patel (<aryanpatel66871@gmail.com>)  
**Project**: Syncora — Real-Time YouTube Watch Party Platform  
**Live Frontend**: [https://syncora-kappa.vercel.app](https://syncora-kappa.vercel.app)  
**Live Backend API & WebSockets**: [https://syncora-backend-rfs0.onrender.com](https://syncora-backend-rfs0.onrender.com)  
**Source Code Repository**: [https://github.com/AryanPatel-AI/syncora](https://github.com/AryanPatel-AI/syncora)  

---

## Executive Summary

When I set out to build **Syncora**, I didn't want to create another generic, utilitarian video player with an uninspired chat window slapped on the side. I wanted to design an **intimate digital screening room**—a cinematic, communal space where friends and communities could experience shared media simultaneously, without the annoyance of someone drifting five seconds ahead or a rogue participant skipping the movie for everyone else.

Syncora is built on three core engineering pillars:
1. **Mathematical, Sub-Second Video Synchronization**: Eliminating feedback loops and clock drift using an interpolated server-authoritative clock and client-side anti-echo locks.
2. **Uncompromising Server-Authoritative RBAC**: A multi-tiered role hierarchy (Host, Moderator, Participant) where every sensitive event is validated on the backend.
3. **Collaborative Friction Reduction**: Introducing a real-time playback request and approval workflow so viewers aren't merely passive observers, but can participate meaningfully without creating room chaos.

Below is the complete architectural report, code walkthrough, library justification, deployment review, and technical defense.

---

## 1. Master File Catalog & Repository Structure

The project is structured as an organized full-stack TypeScript monorepo with clean separation between the frontend client, backend server, database layer, and documentation.

```
watchparty/
├── .gitignore                    # Production git ignore definitions (build artifacts, env, databases)
├── PROJECT_RULES.md              # Core assignment guidelines and architectural decisions
├── README.md                     # Comprehensive documentation, setup guide, and feature highlights
├── package.json                  # Root monorepo scripts (concurrent dev, multi-package builds)
├── render.yaml                   # Infrastructure-as-code blueprint for Render Web Service deployment
├── vercel.json                   # Edge routing, SPA HTML fallback, and API proxy rules for Vercel
│
├── docs/                         # In-depth architectural and developer documentation
│   ├── ARCHITECTURE.md           # 3-tier system architecture and real-time lifecycle diagrams
│   ├── CODE_WALKTHROUGH.md       # Step-by-step code execution tracing for technical evaluation
│   ├── DEPLOYMENT.md             # End-to-end Vercel and Render deployment guide
│   ├── IMPLEMENTATION_PLAN.md    # Feature roadmaps and technical milestones
│   ├── LOGIC_WALKTHROUGH.md      # Detailed event-by-event logic breakdown
│   ├── SOCKET_EVENTS.md          # Formal Socket.IO wire protocol specification and schemas
│   └── PROJECT_REPORT.md         # This technical report and defense document
│
├── client/                       # Frontend application (React 18 + Vite + Tailwind CSS)
│   ├── index.html                # HTML entry point with dark-mode styling and font preconnects
│   ├── package.json              # Client dependencies, scripts, and build targets
│   ├── postcss.config.js         # PostCSS configuration for Tailwind CSS
│   ├── tailwind.config.js        # Bespoke screening room color palette and animation tokens
│   ├── tsconfig.json             # Client TypeScript compiler configuration
│   ├── vite.config.ts            # Vite bundler configuration with dev server reverse proxy
│   └── src/
│       ├── App.tsx               # Client router, global state routing, and toast banner
│       ├── main.tsx              # React DOM root initialization with WatchPartyProvider
│       ├── index.css             # Base styles, cinematic scrollbars, and focus outlines
│       ├── types/
│       │   └── index.ts          # Shared client TypeScript types (Roles, Playback, Socket events)
│       ├── context/
│       │   └── WatchPartyContext.tsx # Centralized application state machine and Socket.IO dispatcher
│       ├── services/
│       │   ├── api.ts            # Axios/Fetch HTTP REST client for search and auth endpoints
│       │   └── socket.ts         # Singleton Socket.IO client instance with reconnection logic
│       ├── utils/
│       │   ├── constants.ts      # Default video IDs, curated starter reels, and room defaults
│       │   ├── formatters.ts     # Time string formatters (mm:ss), room code normalizers
│       │   └── youtube.ts        # Robust YouTube URL parser and 11-char video ID extractor
│       ├── components/
│       │   ├── layout/           # App shell (AppNavbar, RoomHeader, AmbientGlow, Sidebar)
│       │   ├── player/           # Cinema stage (YouTubePlayer, PlaybackControls, LikeButton, Reactions)
│       │   ├── room/             # Room roster (AudiencePresence, ParticipantList, ApprovalQueue)
│       │   ├── chat/             # Real-time room chat with rate limiting and quick reactions
│       │   └── ui/               # Reusable primitives (SyncStatusBadge, Modals, CategoryPills)
│       └── pages/
│           ├── Home/HomePage.tsx # Landing screen, room creator, code entry, and curated reels
│           ├── Room/WatchRoomPage.tsx # Core screening room interface
│           ├── Discovery/        # Video exploration catalog
│           └── Library/          # Saved videos, watch history, and followed creators
│
└── server/                       # Backend real-time engine (Node.js + Express + Socket.IO)
    ├── package.json              # Server dependencies and build scripts
    ├── tsconfig.json             # Server TypeScript compiler configuration
    └── src/
        ├── server.ts             # Express HTTP bootstrap, CORS configuration, and Socket.IO mount
        ├── validation.ts         # Strict sanitization and validation schemas for incoming payloads
        ├── test-sync.ts          # Automated integration test suite validating real-time synchronization
        ├── config/
        │   └── constants.ts      # Port configuration, timeouts, room code alphabet, and limits
        ├── types/
        │   └── index.ts          # Backend domain types, role definitions, and socket contracts
        ├── models/
        │   ├── Room.ts           # Authoritative Room aggregate (playback state, timers, roster, queue)
        │   └── Participant.ts    # Participant entity (roles, socket IDs, join timestamps)
        ├── services/
        │   ├── RoomManager.ts    # In-memory singleton managing room lifecycles and socket mappings
        │   ├── PermissionService.ts # Server-side RBAC authorization rules
        │   ├── ChatRateLimiter.ts # Sliding-window chat spam prevention service
        │   └── YouTubeService.ts # YouTube Data API v3 integration with curated fallback
        ├── sockets/
        │   ├── events.ts         # Master Socket.IO event name constants
        │   └── socketHandler.ts  # Master real-time event router and authorization pipeline
        ├── routes/
        │   └── apiRoutes.ts      # REST endpoints for health checks, room lookup, and video search
        ├── controllers/
        │   ├── roomController.ts # HTTP handlers for room inspection and health checks
        │   └── videoController.ts# HTTP handlers for YouTube search and trending video catalog
        └── database/
            ├── db.ts             # SQLite connection initialization using better-sqlite3
            └── roomRepository.ts # Persistence layer for room snapshots and chat audit logs
```

---

## 2. Technology Stack & Library Selection Justification

Every technology chosen for Syncora was selected with deliberate intent to solve specific real-time, concurrency, and user experience requirements.

| Library / Tool | Primary Purpose in Syncora | Technical Rationale & Why It Was Chosen |
| :--- | :--- | :--- |
| **React 18** | Frontend Component Architecture | Declarative state management, concurrent rendering, and clean lifecycle hooks (`useRef`, `useCallback`, `useEffect`) needed to interface with external DOM-heavy APIs like the YouTube IFrame player without causing re-render storms. |
| **TypeScript** | Full-Stack Type Safety | Shared contract interfaces between client and server prevent deserialization bugs. A change to a socket payload schema immediately surfaces compilation errors across both environments. |
| **Vite** | Frontend Build Engine & HMR | Lightning-fast Hot Module Replacement during development and optimized Rollup-based tree-shaking for production. Creates an ultralight, cache-friendly production bundle (`~370 KB` JS, `~43 KB` CSS). |
| **Socket.IO** | Bidirectional Real-Time Communication | Provides reliable abstraction over raw WebSockets with automatic transport fallbacks (WSS $\rightarrow$ HTTP long-polling), room multiplexing (`socket.join`), automatic reconnection, and acknowledgment callbacks for critical state mutations. |
| **Express & Node.js** | Backend API & HTTP Server | The single-threaded, event-driven Node.js event loop handles thousands of concurrent WebSocket connections with low memory overhead. Express provides clean middleware chaining for CORS, security headers, and health checks. |
| **Tailwind CSS** | Design Tokens & Responsive UI | Eliminates CSS specificity battles and bundle bloat. Allows direct encoding of the bespoke screening room aesthetic (deep obsidian surfaces, glowing lime accents, and cinema letterboxing) directly in utility classes. |
| **YouTube IFrame API** | Programmatic Video Player Engine | The official programmatic API allows direct control of playback (`playVideo`, `pauseVideo`, `seekTo`, `loadVideoById`) while adhering to YouTube Terms of Service and respecting copyright requirements. |
| **SQLite (better-sqlite3)** | Persistent Room & Audit Storage | Embedded, zero-configuration database that avoids the latency, cost, and connection pool overhead of an external managed database instance for MVP deployment while providing complete durability. |
| **Lucide React** | Consistent Iconography | Clean, customizable SVG icons with low bundle footprint and complete accessibility support. |
| **Canvas Confetti** | Visual Feedback & Celebrations | Delivers micro-interactions and celebratory flair when rooms are launched or milestones are reached without heavy external dependencies. |

---

## 3. How WebSockets Enable Real-Time Synchronization

Real-time media synchronization across the public internet is inherently challenging due to:
- Varied network latency across different participants (e.g., 20ms vs 250ms).
- Browser background tab throttling (browsers slow down `requestAnimationFrame` and `setInterval` when a tab is inactive).
- The "Echo Feedback Loop" problem, where a client receiving a pause command emits a pause event back to the server.

Here is how I designed Syncora to solve each of these problems:

### A. The Server-Authoritative Clock Model
The server does not broadcast raw, continuous time ticks every second. Flooding the network with 60 updates per second per room creates network congestion and stutter. Instead, the server maintains an **Authoritative Playback State Snapshot**:

```typescript
interface PlaybackState {
  videoId: string;
  playState: 'playing' | 'paused' | 'buffering';
  currentTime: number;       // Position in seconds when state last changed
  lastUpdatedAt: number;     // Unix millisecond timestamp of last change
  playbackRate: number;      // Normal playback speed (1.0)
  updatedBy: { userId: string; username: string };
}
```

When a video is playing, any client (or the server itself) can compute the exact current time at any millisecond $t_{\text{now}}$ using this mathematical interpolation formula:

$$\text{Current Playback Position} = \text{currentTime} + \left( \frac{\text{Date.now()} - \text{lastUpdatedAt}}{1000} \right) \times \text{playbackRate}$$

When a new user joins, they immediately receive a `room_snapshot`. Their client applies this formula, seeks directly to the calculated millisecond, and begins playing in perfect unison with the host.

### B. Anti-Echo Feedback Loop Protection
When the server sends a `sync_state` event (for example, `playState: 'paused'`), the client's React component must call the YouTube IFrame player's `player.pauseVideo()`. 

However, calling `player.pauseVideo()` natively triggers the YouTube player's `onStateChange` listener. If that listener naively broadcasts a `pause` event back to the server, it causes an infinite ping-pong loop that crashes the session.

To resolve this, I implemented an **anti-echo programmatic lock** in [`client/src/components/player/YouTubePlayer.tsx`](file:///Users/aryanpatel/CODE/project/watchparty/client/src/components/player/YouTubePlayer.tsx):
```typescript
// Set programmatic flag before modifying player state
isProgrammaticUpdate.current = true;

if (playback.playState === 'playing') {
  player.playVideo();
} else if (playback.playState === 'paused') {
  player.pauseVideo();
}

// Release the lock after the native event has settled
setTimeout(() => {
  isProgrammaticUpdate.current = false;
}, 600);
```
Inside `handlePlayerStateChange`:
```typescript
if (isProgrammaticUpdate.current) {
  // Ignored! This change was commanded by the server, do not echo it back.
  return;
}
```

### C. Smart Drift Correction Thresholds
Network jitter causes micro-variations. If you force a video to seek whenever it drifts by 100 milliseconds, the audio will constantly stutter and crackle.

Syncora uses a **two-tier drift threshold**:
1. **Normal Jitter Window ($\le 1.6\text{ seconds}$)**: The video is allowed to naturally play without interruption. Viewers will perceive no noticeable audio-visual desync.
2. **Hard Desync ($\ge 1.75\text{ seconds}$)**: If a client lags behind due to buffering or tab suspension, the system smoothly performs a silent seek to the authoritative time.
3. **No Skipping Ahead of the Host**: Regular participants are strictly forbidden from watching ahead of the host. If a viewer's player somehow exceeds the host's authoritative timestamp by $> 0.8\text{ seconds}$, it is immediately clamped back to the host's position.

### D. DVR Catch-Up Mode vs. Live Edge
If a viewer pauses locally to grab a drink, they don't force-pause the entire room. Instead, their UI transitions into **Catch-Up Viewing Mode**. The UI displays a live badge: `Behind Live: 42s` with a glowing **"Return to Live"** button. Clicking this button immediately seeks the player to the live edge and resynchronizes with the host.

---

## 4. How Role-Based Access Control (RBAC) Works on the Backend

Security and permissions must never rely on client-side state. A malicious user can open DevTools and bypass disabled buttons or call internal functions directly.

In Syncora, **every single mutating action is enforced on the backend**:

### A. Role Hierarchy
```
👑 HOST        Auto (Creator)     Full Control: Play/pause, seek, change video, assign roles, remove participants, transfer host.
🛡️ MODERATOR   Assigned by Host   Playback Control: Play/pause, seek, change video, review & approve playback requests.
👤 PARTICIPANT Assigned by Host   Default Joiner: Watch-only; cannot control playback or change video. May submit playback requests.
👁️ VIEWER      Assigned by Host   Spectator Alias: Watch-only; same permissions as Participant.
```

### B. The Authorization Pipeline
When any socket packet arrives at the server, it passes through the following pipeline before modifying state:
1. **Context Extraction**: The server retrieves the active `Room` and `Participant` associated with `socket.id`.
2. **Role Verification**: The server executes `PermissionService.canControlPlayback(participant)`.
3. **Input Validation**: The timestamp or video ID is sanitized against regex patterns.
4. **State Mutation & Broadcast**: Only upon passing all checks is the domain model mutated and broadcast to room peers.

```typescript
// server/src/sockets/socketHandler.ts
socket.on(SOCKET_EVENTS.PAUSE, (data) => {
  const { room, participant } = getContext();
  if (!room || !participant) return;

  // STRICT BACKEND RBAC CHECK:
  if (!PermissionService.canControlPlayback(participant)) {
    emitError('Permission denied: Only Host or Moderator can pause video.');
    return; // Mutation halted
  }

  const currentTime = data.time ?? room.getAuthoritativeCurrentTime();
  const updatedPlayback = room.updatePlayState('paused', currentTime, participant);
  io.to(room.id).emit(SOCKET_EVENTS.SYNC_STATE, updatedPlayback);
});
```

### C. Playback Request & Approval Workflow
Rather than locking participants out completely, Syncora empowers viewers through an **approval queue**:
1. A participant submits a request: `socket.emit('request_playback_change', { actionType: 'change_video', requestedVideoId: '...' })`.
2. The server creates a `ControlRequest` entity and broadcasts `control_request_submitted` to the room.
3. In the Host and Moderator UI, an approval banner appears with **"Approve"** and **"Decline"** buttons.
4. When the Host clicks **"Approve"**, the server executes the requested action and syncs the entire room.

---

## 5. Deployment Choices & Production Engineering

Deploying a real-time WebSocket application requires specific architectural configurations:

```
[ Client Browser ]
        │
   ┌────┴──────────────────────────┐
   ▼                               ▼
Vercel Edge CDN             Render Web Service
(React Static SPA)          (Node.js + Express + Socket.IO)
   │                               │
   ├─ HTML5 SPA Rewrites           ├─ WSS WebSockets & Polling
   ├─ Sub-second global cache      ├─ Dynamic CORS origin check
   └─ Zero server maintenance      └─ /health monitoring endpoint
```

### A. Frontend on Vercel
- **Single Page Application Routing**: Configured via `vercel.json` rewrites. Because Syncora uses client-side routing (`/room/:roomId`, `/library`, `/discovery`), refreshing a page on Vercel would normally result in a 404. The rewrite rule maps all non-asset routes back to `/index.html`:
  ```json
  {
    "rewrites": [
      { "source": "/((?!assets/|.*\\..*).*)", "destination": "/index.html" }
    ]
  }
  ```
- **Environment Variables**: `VITE_BACKEND_URL` and `VITE_SOCKET_URL` are injected at build time, pointing to `https://syncora-backend-rfs0.onrender.com`.

### B. Backend on Render
- **Persistent Web Service**: Configured via `render.yaml`.
- **CORS Handling**: Cross-Origin Resource Sharing is strictly configured to permit requests from the Vercel production domain (`https://syncora-kappa.vercel.app`), Vercel preview URLs (`https://*.vercel.app`), and local development environments (`localhost:5173`).
- **Health Check Endpoint**: `/health` returns `{ "status": "ok", "uptime": ... }` with HTTP 200, allowing Render's zero-downtime deployment health check to verify the process is alive before routing live traffic.

### C. Overcoming Render Free-Tier Limits (Cold Starts)
Render free instances spin down after 15 minutes of inactivity. To handle this gracefully:
- Syncora's client implements a **Heartbeat Reconnection Manager**. If the initial socket connection times out, it displays an informative connection status indicator (`"Waking up screening room server..."`) and retries with exponential backoff until the WebSocket handshake succeeds.

---

## 6. Engineering Trade-Offs & Challenges Solved

### Trade-Off 1: WebSockets vs. WebRTC DataChannels
- **Evaluation**: WebRTC offers slightly lower peer-to-peer latency. However, a peer-to-peer mesh for $N$ users requires $O(N^2)$ connections, which severely degrades mobile bandwidth and causes NAT traversal failures (requiring expensive TURN servers).
- **Decision**: I selected **WebSockets via Socket.IO**. A star topology with a central Node.js server scales predictably to dozens of viewers per room, provides absolute server authority over clock calculations, and avoids P2P connection failures.

### Trade-Off 2: In-Memory State vs. Database Reads on Every Action
- **Evaluation**: Writing every pause, play, seek, and cursor tick to a relational database causes disk I/O bottlenecks and introduces 10–50ms of unnecessary latency.
- **Decision**: The active room state machine is maintained **in-memory** within `RoomManager` for sub-millisecond responsiveness. Asynchronous persistence to SQLite occurs on milestone events (room creation, chat persistence, member departure) to preserve audit trails without blocking the event loop.

### Trade-Off 3: YouTube Browser Autoplay Restrictions
- **Challenge**: Modern browsers (Chrome, Safari, Firefox) block programmatic unmuted media playback unless initiated by a direct user gesture. If a host plays a video, viewers who just opened the page might have their video blocked by the browser.
- **Solution**: In `YouTubePlayer.tsx`, the `playVideo()` call catches the browser's rejected autoplay promise:
  ```typescript
  const playPromise = player.playVideo();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => setNeedsUserGesture(true));
  }
  ```
  When this occurs, Syncora displays an accessible, non-intrusive floating banner: **"Click anywhere to join live audio"**. Clicking it fulfills the browser's user-gesture requirement and immediately snaps the viewer into unmuted sync.

---

## 7. Deliverables Verification Matrix

| # | Required Deliverable | Status | Implementation Details / Live Reference |
| :-: | :--- | :---: | :--- |
| **1** | **Working Application** | 🟢 **Verified** | **Frontend**: [https://syncora-kappa.vercel.app](https://syncora-kappa.vercel.app)<br>**Backend**: [https://syncora-backend-rfs0.onrender.com](https://syncora-backend-rfs0.onrender.com) |
| **2** | **README.md** | 🟢 **Verified** | Comprehensive setup guide, architecture diagrams, live URLs, and troubleshooting available at [README.md](file:///Users/aryanpatel/CODE/project/watchparty/README.md). |
| **3** | **Architecture Overview** | 🟢 **Verified** | Documented in Section 3 above and detailed with sequence diagrams in [docs/ARCHITECTURE.md](file:///Users/aryanpatel/CODE/project/watchparty/docs/ARCHITECTURE.md). |
| **4** | **Code Walkthrough Readiness** | 🟢 **Verified** | Step-by-step logic, file locations, and interview defense cheat sheet compiled in [docs/CODE_WALKTHROUGH.md](file:///Users/aryanpatel/CODE/project/watchparty/docs/CODE_WALKTHROUGH.md). |
| **5** | **Live Demonstration Plan** | 🟢 **Verified** | Complete two-browser verification procedure detailed below. |

---

## 8. Live Demonstration & Verification Procedure

To test or demonstrate the application in under 3 minutes:

1. **Open Host Session**:
   - Open [https://syncora-kappa.vercel.app](https://syncora-kappa.vercel.app) in a browser window.
   - Enter your name: `"Aryan (Host)"`.
   - Select the curated starter video or paste any valid YouTube URL.
   - Click **"Launch Screening Room"**.
   - Note your 6-character room code (e.g., `SYNC01`).

2. **Open Participant Session**:
   - Open an Incognito window or a second browser.
   - Navigate to `https://syncora-kappa.vercel.app/room/SYNC01` (or enter the code on the home screen).
   - Enter your name: `"Viewer"`.
   - Click **"Join Room"**.

3. **Verify Synchronized Playback**:
   - As the Host, click **Play**, **Pause**, and **Seek to 1:30**.
   - Watch the Participant screen update instantly in real time with sub-second accuracy.

4. **Verify RBAC Enforcement**:
   - On the Participant screen, observe that direct playback controls are disabled.
   - Click **"Request Control"** or change video request.
   - On the Host screen, observe the instant notification badge in the **Approval Queue**.
   - Click **"Approve"**—observe the entire room update simultaneously.

5. **Verify Chat & Reactions**:
   - Send a message in chat from either window.
   - Click the **Like (❤️)** button in the controls to see floating heart reaction animations rendered on all screens with an updated room like counter.

---

*Authored by Aryan Patel — Syncora Engineering*
