# Syncora — Implementation Plan

## 1. Project Overview & Milestones

This plan outlines the sequential phases to build, verify, and deliver the Syncora YouTube Watch Party application.

```
[Phase 1] Project Architecture & Event Contract  <-- (Current Milestone)
    │
[Phase 2] Design System Tokens & Base Components
    │
[Phase 3] Discovery Homepage & Room Navigation
    │
[Phase 4] Room Creation & Multi-Client Joining Flow
    │
[Phase 5] Backend RBAC & Socket Event Layer
    │
[Phase 6] YouTube IFrame API Synchronization
    │
[Phase 7] Participant Controls, Request Queue & Chat
    │
[Phase 8] Testing, Hardening & Verification
    │
[Phase 9] Deployment (Render / Vercel) & Documentation
```

---

## 2. File Responsibilities Breakdown

### Backend (`server/src/`)
| File Path | Primary Responsibility |
| :--- | :--- |
| `server.ts` | Express application bootstrap, HTTP server creation, Socket.IO binding, and static client serving. |
| `config/constants.ts` | Centralized constants (port, default video IDs, max chat buffer size, drift tolerances). |
| `types/index.ts` | Shared backend type definitions for roles, playback state, participants, requests, and chat. |
| `models/Room.ts` | In-memory room aggregate root: tracks active participants, current playback, chat history, and control requests. |
| `models/Participant.ts` | Domain entity representing a connected user session, role (`HOST`, `MODERATOR`, `PARTICIPANT`), and socket mapping. |
| `services/RoomManager.ts` | Singleton managing room creation, room lookups, socket-to-room mappings, and room lifecycle cleanup. |
| `services/PermissionService.ts` | Pure authorization service: validates whether a participant can control playback, assign roles, or remove members. |
| `services/SyncService.ts` | Authoritative playback calculations and drift detection logic. |
| `sockets/events.ts` | Canonical event name constants matching the assignment specification. |
| `sockets/socketHandler.ts` | Top-level Socket.IO connection router: validates inputs, enforces permissions via `PermissionService`, and dispatches updates. |
| `controllers/roomController.ts` | REST API endpoints for `/api/health` and `/api/rooms/:roomId`. |
| `routes/apiRoutes.ts` | Express router mounting controller routes. |
| `test-sync.ts` | Multi-client end-to-end integration test verifying real-time sync, RBAC rejections, and approval workflows. |

### Frontend (`client/src/`)
| File Path | Primary Responsibility |
| :--- | :--- |
| `main.tsx` | React DOM root mounting and strict-mode wrapper. |
| `App.tsx` | Root router component switching between `HomePage` and `RoomPage`, handling global toasts. |
| `context/WatchPartyContext.tsx` | Central state management: connects to Socket.IO, listens for room updates, and exposes action handlers. |
| `types/index.ts` | TypeScript types for client-side state, playback models, and socket payloads. |
| `services/socket.ts` | Socket.IO client instance configured with auto-reconnection and base server URL. |
| `components/layout/Navbar.tsx` | Global top navigation: room code pill, 1-click invite link copy, sync radar, and user role badge. |
| `components/layout/AmbientGlow.tsx` | Atmospheric background glow matching video theater playback state. |
| `components/player/YouTubePlayer.tsx` | Direct YouTube IFrame API integration with anti-echo loops, drift correction, and unmute handling. |
| `components/player/VideoControls.tsx` | Floating synchronized playback bar: scrub slider, play/pause, skip 10s, volume, and control request trigger. |
| `components/player/PresetsBar.tsx` | 1-Click verified stream switcher bar under the video player. |
| `components/player/VideoSelectorModal.tsx` | Modal allowing Host/Moderator to paste custom YouTube URLs or select verified presets. |
| `components/room/ParticipantList.tsx` | Live member roster with presence indicators and Host role management dropdowns. |
| `components/room/ControlRequestsModal.tsx` | Host & Moderator review modal for approving or rejecting participant control requests. |
| `components/chat/ChatPanel.tsx` | Real-time text chat with role badges, system events, and floating reaction dock. |
| `components/chat/ReactionsOverlay.tsx` | Floating physics-style emoji reaction particles rendered over the theater stage. |
| `components/ui/SyncStatusBadge.tsx` | Real-time connection badge with live radar ping animation. |
| `pages/Home/HomePage.tsx` | Landing page with instant 1-click demo room, party creation, and join-by-code forms. |
| `pages/Room/RoomPage.tsx` | Theater layout combining the synchronized video player, quick presets, and live social sidebar. |
| `utils/` | Formatting utilities (`formatters.ts`), YouTube ID parsers (`youtube.ts`), and constants (`constants.ts`). |

---

## 3. Development & Testing Commands

### Local Development
```bash
# 1. Install all dependencies (root, server, client)
npm run install:all

# 2. Run both frontend and backend concurrently in dev mode
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:4000
```

### Verification & Testing
```bash
# Run the automated multi-client integration test suite
npm test
# (Verifies room creation, participant join, RBAC rejection, play sync, video change, request approval, and kick)

# Compile TypeScript and build production bundles
npm run build
```

### Production Preview
```bash
# Run the compiled production server (serves API, WebSockets, and SPA)
npm run start
```
