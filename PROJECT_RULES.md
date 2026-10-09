# Syncora — Project Rules & Technical Decisions

## 1. Project Purpose & Scope
Syncora is a real-time collaborative YouTube Watch Party web application built as an internship assignment. It enables users to create or join watch rooms and experience synchronized video playback with server-enforced role permissions.

---

## 2. Core Functional Requirements
1. **Room Creation & Joining**:
   - Any user can create a room with a unique room ID/code.
   - The creator automatically becomes the **Host**.
   - Participants join via a unique room link or 6-character room code.
   - Joining users are assigned the **Participant** (viewer) role by default.
2. **Real-Time Video Synchronization**:
   - Synchronizes video state: `videoId`, `playState` (`playing`, `paused`, `buffering`), and `currentTime`.
   - Play, pause, seek, and video changes broadcast in real time via WebSockets (Socket.IO).
   - Server acts as the single source of truth for playback state and clock calculations.
   - Clients implement drift correction without continuous desync loops.
3. **Role-Based Access Control (RBAC)**:
   - **Host**: Full room control (play/pause, seek, change video, assign roles, remove participants, transfer host, approve/reject control requests).
   - **Moderator**: Playback control (play/pause, seek, change video) and control request review.
   - **Participant**: Watch-only mode; playback controls are locked.
   - **Participant Control Requests**: Participants can submit requests to control playback or change video, which the Host/Moderator can approve or decline.
4. **Backend Authorization & Security**:
   - Every sensitive event (`play`, `pause`, `seek`, `change_video`, `assign_role`, `remove_participant`, `transfer_host`) MUST be validated on the backend.
   - Never trust client-supplied roles or permissions.
   - Rejected commands return structured error feedback.

---

## 3. Technology Stack Decisions

| Component | Selected Technology | Decision Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite | Fast HMR, strong static typing, optimized bundling. |
| **Styling** | Tailwind CSS | Utility-first styling with centralized design tokens and zero CSS conflicts. |
| **Backend** | Node.js, Express, TypeScript | High-throughput asynchronous event loop, strong typing for Socket.IO event payloads. |
| **Real-Time Communication** | Socket.IO | Bidirectional WebSocket abstraction with room management and reconnect fallbacks. |
| **Video Engine** | YouTube IFrame Player API | Direct programmatic iframe control with custom synchronized controls. |
| **Room Storage** | In-Memory Service (with optional SQLite interface) | Fast, zero-dependency room management for MVP with repository interface abstraction. |
| **Testing** | Node.js Integration Suite & Unit Tests | Verifies real-time event flow, RBAC rejections, and state sync across multiple sockets. |
| **Deployment Targets** | Vercel (Frontend) & Render (Backend) | Standard modern split or unified Node.js deployment. |

---

## 4. Code Quality & Development Rules
- **Maintainability First**: Write straightforward code that a junior developer can easily read, explain, and maintain.
- **Strict Payload Validation**: Validate every incoming WebSocket and HTTP payload on the server before mutating state.
- **Server Authority**: The server decides role assignments, state changes, and membership. The frontend only displays state and sends intent.
- **Short, Useful Comments**: Write comments only when explaining non-obvious rationale or edge-case handling. Avoid redundant or repetitive commentary.
- **No Fake Functionality**: Never build dummy buttons that do nothing, fabricate test passes, or claim features work without verifying them.
- **Preserve Working Code**: Inspect existing code before making changes. Never overwrite working functionality without a clear reason.
- **Environment Configuration**: Keep `.env` files out of source control. Always maintain `.env.example` templates.
