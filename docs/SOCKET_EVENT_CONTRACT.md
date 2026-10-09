# Syncora — Socket.IO Event Contract & Architecture

This contract defines the authoritative real-time communication interface between the Syncora frontend client and Node.js backend server.

---

## 1. Event Summary Table

| Event Name | Direction | Required Role | Payload Schema | Description |
| :--- | :--- | :--- | :--- | :--- |
| `create_room` | Client $\rightarrow$ Server | Any | `{ username: string, initialVideoId?: string }` | Creator initializes a new room. Server assigns `HOST`. |
| `join_room` | Client $\rightarrow$ Server | Any | `{ roomId: string, username: string }` | Joiner joins existing room. Server assigns `PARTICIPANT`. |
| `leave_room` | Client $\rightarrow$ Server | Any | `{}` | Disconnects the socket from active room. |
| `play` | Client $\rightarrow$ Server | Host, Moderator | `{ time?: number }` | Resumes playback at specified second. |
| `pause` | Client $\rightarrow$ Server | Host, Moderator | `{ time?: number }` | Pauses playback at specified second. |
| `seek` | Client $\rightarrow$ Server | Host, Moderator | `{ time: number }` | Seeks playback to timestamp. |
| `change_video` | Client $\rightarrow$ Server | Host, Moderator | `{ videoId: string }` | Changes video stream ID for everyone in the room. |
| `assign_role` | Client $\rightarrow$ Server | Host only | `{ userId: string, role: 'MODERATOR' \| 'PARTICIPANT' }` | Host updates a participant's role (cannot assign Host or self). |
| `remove_participant` | Client $\rightarrow$ Server | Host only | `{ userId: string }` | Host removes/kicks a participant from the room. |
| `transfer_host` | Client $\rightarrow$ Server | Host only | `{ userId: string }` | Host transfers primary ownership to another participant. |
| `request_control` | Client $\rightarrow$ Server | Participant | `{ type: string, requestedVideoId?: string }` | Viewer requests control rights or a video change. |
| `request_playback_change` | Client $\rightarrow$ Server | Participant | `{ action: 'play' \| 'pause' \| 'seek' \| 'change_video', requestedVideoId?: string, requestedTime?: number }` | Participant requests playback state change. |
| `handle_control_request` | Client $\rightarrow$ Server | Host, Moderator | `{ requestId: string, action: 'approved' \| 'rejected' }` | Host/Mod resolves a participant control request. |
| `approve_request` | Client $\rightarrow$ Server | Host, Moderator | `{ requestId: string }` | Host/Mod approves a participant request; server executes change. |
| `reject_request` | Client $\rightarrow$ Server | Host, Moderator | `{ requestId: string }` | Host/Mod declines a participant request. |
| `chat_message` | Client $\rightarrow$ Server | Room Members | `{ text: string }` | Client sends text chat message (server-validated & rate-limited). |
| `send_chat` | Client $\rightarrow$ Server | Room Members | `{ message: string }` | Alias event for backward compatibility. |
| `send_reaction` | Client $\rightarrow$ Server | Room Members | `{ emoji?: string, type?: string }` | Dispatches like / reaction (500ms server cooldown, increments room likeCount). |
| `sync_ping` | Client $\rightarrow$ Server | Any | `{ clientTime: number }` | Heartbeat drift check against server authoritative clock. |
| `room_snapshot` | Server $\rightarrow$ Client | Direct to Socket | `RoomStateSnapshot` | Authoritative complete room snapshot emitted to client upon join/create (includes `likeCount`, `audienceCount`). |
| `participants_updated` | Server $\rightarrow$ Client | Broadcast | `{ participants: Participant[] }` | Broadcast to room whenever membership or roles change. |
| `presence_updated` | Server $\rightarrow$ Client | Broadcast | `{ count: number, participants: Participant[] }` | Broadcast immediately on participant join, leave, role change, or kick. |
| `sync_state` | Server $\rightarrow$ Client | Broadcast | `PlaybackState` | Broadcasts authoritative playback state to room. |
| `user_joined` | Server $\rightarrow$ Client | Broadcast | `{ username, userId, role, participants }` | Informs room of a new member. |
| `user_left` | Server $\rightarrow$ Client | Broadcast | `{ username, userId, participants }` | Informs room that a member disconnected. |
| `role_assigned` | Server $\rightarrow$ Client | Broadcast | `{ userId, username, role, participants }` | Informs room that a user's role changed. |
| `participant_removed` | Server $\rightarrow$ Client | Broadcast | `{ userId, participants }` | Informs room that a user was kicked. |
| `host_transferred` | Server $\rightarrow$ Client | Broadcast | `{ previousHostId, newHostId, participants }` | Informs room of new room host. |
| `control_request_submitted` | Server $\rightarrow$ Client | Broadcast | `{ request, pendingRequests }` | Notifies hosts/mods of a new pending request. |
| `control_request_updated` | Server $\rightarrow$ Client | Broadcast | `{ request, pendingRequests, participants, playback? }` | Notifies room of approved or rejected request. |
| `chat_message` | Server $\rightarrow$ Client | Broadcast | `ChatMessage` | Appends new chat or system message. |
| `reaction_received` | Server $\rightarrow$ Client | Broadcast | `ReactionPayload` | Broadcasts floating emoji particle with synchronized room `likeCount`. |
| `sync_pong` | Server $\rightarrow$ Client | To Sender | `{ serverTime, playState, videoId, drift }` | Returns server authoritative time and drift delta. |
| `room_error` | Server $\rightarrow$ Client | To Sender | `{ error: string, message: string }` | Emitted when room validation, join, or action fails. |
| `error_message` | Server $\rightarrow$ Client | To Sender | `{ message: string }` | Structured error returned when an action is unauthorized or invalid. |

---

## 2. Acknowledgement Callbacks

### `create_room`
- **Request Payload**: `{ username: string, initialVideoId?: string }`
- **Callback Signature**:
  ```typescript
  (response: {
    success: boolean;
    roomId?: string;
    user?: Participant;
    participant?: Participant;
    roomState?: RoomStateSnapshot;
    room?: RoomStateSnapshot;
    error?: string;
  }) => void
  ```

### `join_room`
- **Request Payload**: `{ roomId: string, username: string }`
- **Callback Signature**:
  ```typescript
  (response: {
    success: boolean;
    roomId?: string;
    user?: Participant;
    participant?: Participant;
    roomState?: RoomStateSnapshot;
    room?: RoomStateSnapshot;
    error?: string;
  }) => void
  ```

### `leave_room`
- **Request Payload**: `{}`
- **Callback Signature**:
  ```typescript
  (response: { success: boolean; error?: string }) => void
  ```

---

## 3. Core Data Models

### `PlaybackState`
```typescript
interface PlaybackState {
  videoId: string | null;
  playState: 'playing' | 'paused' | 'buffering';
  currentTime: number; // in seconds
  lastUpdatedAt: number; // Unix timestamp in ms
  playbackRate: number; // default 1.0
  updatedBy: {
    userId: string;
    username: string;
  };
}
```

### `Participant`
```typescript
interface Participant {
  id: string;
  username: string;
  role: 'HOST' | 'MODERATOR' | 'PARTICIPANT';
  joinedAt: number;
  avatarColor: string;
  isHost: boolean;
}
```

### `RoomStateSnapshot`
```typescript
interface RoomStateSnapshot {
  roomId: string;
  hostId: string;
  playback: PlaybackState;
  participants: Participant[];
  pendingRequests: ControlRequest[];
  chatHistory: ChatMessage[];
}
```

### `ControlRequest`
```typescript
interface ControlRequest {
  id: string;
  userId: string;
  username: string;
  role: 'PARTICIPANT';
  type: 'REQUEST_MODERATOR' | 'REQUEST_CONTROL' | 'REQUEST_CHANGE_VIDEO';
  requestedVideoId?: string;
  requestedVideoTitle?: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
}
```

### `ChatMessage`
```typescript
interface ChatMessage {
  id: string; // server-generated unique ID (e.g. msg_...)
  senderId: string; // member's user ID
  senderName: string; // member's username from room roster
  username?: string; // alias to senderName
  senderRole?: Role; // member's role from room roster
  role?: Role; // alias to senderRole
  content: string; // validated text payload
  text?: string; // alias to content
  type: 'user' | 'system';
  timestamp: number; // server timestamp (Date.now())
}
```

---

## 4. Server Authorization & Validation Invariants

1. **Role Enforcement**: Only sockets with role `HOST` or `MODERATOR` in the target room can execute `play`, `pause`, `seek`, or `change_video`.
2. **Host Privileges**: Only the socket with role `HOST` can execute `assign_role`, `remove_participant`, or `transfer_host`.
3. **Self-Modification Guard**: A user cannot modify their own role directly or remove themselves.
4. **Action Rejection**: If an unauthorized socket issues a privileged command, the server MUST reject it, emit `room_error` and `error_message` with reason, and MUST NOT mutate or broadcast state.
5. **Participant Cleanup**: A removed participant's socket is detached from the room channel (`socket.leave(roomId)`).
6. **Input Validation**:
   - `username`: 2-30 characters, non-whitespace, trimmed.
   - `roomId`: 4-12 alphanumeric characters, uppercase normalized.
   - `videoId`: 11-character YouTube video ID format, trimmed.
   - `playbackTime`: Finite positive number.

---

## 5. Host Disconnect & Succession Behavior

When a Host disconnects or leaves an active room:
1. **Moderator First**: If one or more `MODERATOR` participants remain in the room, the first moderator is automatically promoted to `HOST`.
2. **Seniority Fallback**: If no moderators are present, the earliest connected `PARTICIPANT` is automatically promoted to `HOST`.
3. **Broadcast Notification**: The server emits `host_transferred` (`{ previousHostId, newHostId, participants }`) and `participants_updated` to inform all remaining clients, alongside a system announcement in chat.
4. **Empty Room Deletion**: If all participants leave or disconnect, the room is deleted from active memory to prevent memory leaks.

---

## 6. Authoritative Role & Permission Matrix

| Capability / Event | Host | Moderator | Participant (Viewer) |
| :--- | :---: | :---: | :---: |
| **Play / Pause / Seek** (`play`, `pause`, `seek`) | ✅ Full control | ✅ Full control | ❌ Denied (triggers error or request flow) |
| **Change Video** (`change_video`) | ✅ Full control | ✅ Full control | ❌ Denied (triggers error or request flow) |
| **Assign Roles** (`assign_role` to MODERATOR / PARTICIPANT) | ✅ Host only | ❌ Denied | ❌ Denied |
| **Remove / Kick Participant** (`remove_participant`) | ✅ Host only (not self) | ❌ Denied | ❌ Denied |
| **Transfer Host** (`transfer_host`) | ✅ Host only | ❌ Denied | ❌ Denied |
| **Submit Playback / Video Request** (`request_playback_change`, `request_control`) | N/A (Already privileged) | N/A (Already privileged) | ✅ Permitted |
| **Approve / Decline Requests** (`approve_request`, `reject_request`) | ✅ Host | ✅ Moderator | ❌ Denied |
| **Chat & Floating Reactions** (`send_chat`, `send_reaction`) | ✅ Permitted | ✅ Permitted | ✅ Permitted |

### Request & Approval Workflow
1. **Submission**: A `PARTICIPANT` emits `request_playback_change` with `{ action: 'play' | 'pause' | 'seek' | 'change_video', requestedVideoId?, requestedTime? }`.
2. **Validation**: The server validates the action, video ID format (11 chars), and timestamp range. It creates a pending `ControlRequest` with a unique ID and stores it on the room.
3. **Broadcast**: `control_request_submitted` is broadcast to room members, and an entry is added to the in-memory queue.
4. **Resolution**: A `HOST` or `MODERATOR` evaluates the queue and emits `approve_request` or `reject_request` with `{ requestId }`.
5. **Execution**: On approval, the server authoritative room model executes the requested change (`room.changeVideo()`, `room.updatePlayState()`, or `room.seek()`), updates room playback and participant state, and broadcasts both `control_request_updated` and `sync_state`. On rejection, the request is marked rejected and the queue is updated without mutating playback.

---

## 7. Live Audience Presence & Like Reactions System

### Audience Presence
- **Authority**: The server calculates audience presence strictly from active connected participants (`room.getParticipantCount()`).
- **Event**: `presence_updated` broadcasts `{ count: number, participants: Participant[] }` on every join, leave, role change, and member removal.
- **UI Representation**: Header badge displays `Watching now · <count>` with an avatar stack, connected green status dots, role tags, and an accessible roster popover dialog.

### Like Reaction System & Anti-Spam
- **Total Likes**: Stored authoritatively on the server in `Room.likeCount`. Incrementing is synchronous and thread-safe in memory.
- **Reaction Cooldown**: The server tracks per-client reaction timestamps and enforces a `500ms` cooldown (`REACTION_COOLDOWN_MS = 500`). Submissions faster than 500ms are rejected with `Please wait before reacting again.`
- **Broadcast**: Each accepted reaction broadcasts `reaction_received` containing `{ id, emoji, type, senderId, senderName, count, likeCount, timestamp }` so all watching clients increment their synchronized like tally and render floating particle hearts over the cinema stage.
- **Isolation**: Like totals are isolated per room and cleaned up automatically when empty rooms are deallocated.

