# 📋 Syncora — Implementation Plan & Phase Roadmap

This document outlines the sequential phases to build, enhance, verify, and deliver the **Syncora YouTube Watch Party** platform as an internship assignment.

---

## 1. Phase Status Summary

```
[Phase A] Inspection, Architecture Documentation & Gap Analysis   ✅ COMPLETE
    │
[Phase B] Multi-Page Routing, Shared Layouts & How It Works       📋 NEXT UP
    │
[Phase C] Dedicated Create Room & Join Room Routes                 📋 PLANNED
    │
[Phase D] YouTube IFrame Playback & Synchronization Engine         ✅ WORKING / TO VERIFY
    │
[Phase E] Server RBAC, Member Management & Approval Queues        ✅ WORKING / TO VERIFY
    │
[Phase F] Audience Presence, Likes, Chat, History & Discover       ⏳ PARTIAL (History & Discover to add)
    │
[Phase G] Automated Integration Tests & Browser Verification       ✅ 13/13 INTEGRATION TESTS PASSING
    │
[Phase H] Production Deployment (Vercel + Render) & Defense Docs   ✅ PREPARED & DOCUMENTED
```

---

## 2. Phase-by-Phase Roadmap

### Phase A: Project Inspection, Documentation & Gap Analysis (Current Phase)
- [x] Inspect existing frontend (`client/`), backend (`server/`), packages, and build scripts.
- [x] Verify existing multi-client tests (`test-sync.ts` passing 13/13 test cases).
- [x] Document system architecture and 3-tier data flow in [`docs/ARCHITECTURE.md`](file:///Users/aryanpatel/CODE/project/watchparty/docs/ARCHITECTURE.md).
- [x] Document complete Socket.IO event contract and schemas in [`docs/SOCKET_EVENTS.md`](file:///Users/aryanpatel/CODE/project/watchparty/docs/SOCKET_EVENTS.md).
- [x] Document step-by-step code and function walkthrough in [`docs/LOGIC_WALKTHROUGH.md`](file:///Users/aryanpatel/CODE/project/watchparty/docs/LOGIC_WALKTHROUGH.md).
- [x] Identify gaps for full multi-page application requirements.

### Phase B: Multi-Page Routing, Shared Layouts & How It Works
- [ ] Install `react-router-dom` in `client/package.json`.
- [ ] Configure `BrowserRouter` with real routes:
  - `/` &rarr; Home Page
  - `/discover` &rarr; Video Discovery
  - `/create` &rarr; Create Room
  - `/join` &rarr; Join Room
  - `/room/:roomId` &rarr; Watch Room
  - `/history` &rarr; Local Watch History
  - `/how-it-works` &rarr; How It Works (visual workflow diagram)
  - `*` &rarr; Custom 404 Not Found Page
- [ ] Build reusable shared layouts:
  - `PublicLayout`: Shared header with navigation, mobile dropdown menu, and footer.
  - `RoomLayout`: Compact screening room header and theater view.
- [ ] Implement `HowItWorksPage` illustrating the 3-step synchronization flow.

### Phase C: Dedicated Create Room & Join Room Routes
- [ ] Build dedicated `/create` page with display name input, YouTube stream presets, custom URL validator, and launch action.
- [ ] Build dedicated `/join` page with room code input, link detection, pre-fill handling, and immediate validation.
- [ ] Preserve existing seamless URL sharing (`/room/:roomId` auto-join modal / prompt).

### Phase D: YouTube IFrame Playback & Synchronization Engine
- [x] YouTube IFrame Player API integration with programmatic state lock (`isApplyingServerUpdate`).
- [x] Server-authoritative time interpolation ($t_{\text{server}} = t_0 + \Delta t \times \text{rate}$).
- [x] Anti-echo loop guards preventing infinite ping-pong state events.
- [x] Smart drift correction for $> 1.75\text{s}$ desynchronization.
- [ ] Verify seamless playback behavior across routed navigation and full-screen modes.

### Phase E: Server RBAC, Member Management & Approval Queues
- [x] Authoritative 3-tier role hierarchy: Host (👑), Moderator (🛡️), Participant (👤).
- [x] Host management: promote to Moderator, restore to Participant, remove participant, transfer host.
- [x] Playback control restriction: Host and Moderator can play, pause, seek, and change videos.
- [x] Participant playback requests: submission, approval queue, host/mod approval and rejection.
- [x] Disconnect cleanup and automatic Host succession policy.

### Phase F: Audience Presence, Likes, Chat, History & Video Discovery
- [x] Live audience presence indicator (`Watching now · X`) with avatar cluster, online dots, and roster popover.
- [x] Synchronized room like button with pulse animation, float-up particles, and 500ms anti-spam cooldown.
- [x] Real-time moderated chat with server-derived identity and sliding-window rate limiter.
- [ ] Local Watch History (`/history`) using browser `localStorage` (cleared anytime, fully client-side).
- [ ] Video Discovery (`/discover`):
  - Search input with YouTube URL paste fallback.
  - Backend search endpoint `/api/youtube/search` with API key support or curated catalog fallback.
  - "Watch Together" action that launches a new room or updates current video.

### Phase G: Automated Testing, Hardening & Browser Verification
- [x] Automated 13-requirement test suite in [`server/src/test-sync.ts`](file:///Users/aryanpatel/CODE/project/watchparty/server/src/test-sync.ts).
- [ ] Manual multi-window browser testing (Host in Window 1, Participant in Window 2, Incognito in Window 3).
- [ ] Verify zero console errors, clean unmounts, and responsive mobile layouts.

### Phase H: Production Deployment & Assignment Submission
- [x] Frontend configuration for Vercel SPA (`client/vercel.json`, `vercel.json` SPA rewrite rules).
- [x] Backend configuration for Render Web Service (`render.yaml`, `process.env.PORT`, `/health` endpoint).
- [x] Comprehensive documentation in [`README.md`](file:///Users/aryanpatel/CODE/project/watchparty/README.md).
- [ ] Live URL deployment verification.

---

## 3. Current Test Status

- **Integration Tests**: 13/13 Passing (`npm --prefix server test`)
- **Frontend Build**: Clean compile (`npm --prefix client run build`)
- **Backend Build**: Clean compile (`npm --prefix server run build`)
