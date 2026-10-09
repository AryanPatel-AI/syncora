# Syncora — Socket.IO Event Contract

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
| `assign_role` | Client $\rightarrow$ Server | Host only | `{ userId: string, role: 'MODERATOR' \| 'PARTICIPANT' }` | Host updates a participant's role. |
| `remove_participant` | Client $\rightarrow$ Server | Host only | `{ userId: string }` | Host removes/kicks a participant from the room. |
| `transfer_host` | Client $\rightarrow$ Server | Host only | `{ userId: string }` | Host transfers primary ownership to another participant. |
| `request_control` | Client $\rightarrow$ Server | Participant | `{ type: string, requestedVideoId?: string }` | Viewer requests control rights or a video change. |
| `handle_control_request` | Client $\rightarrow$ Server | Host, Moderator | `{ requestId: string, action: 'approved' \| 'rejected' }` | Host/Mod resolves a participant control request. |
| `send_chat` | Client $\rightarrow$ Server | Any | `{ message: string }` | Dispatches room text message. |
| `send_reaction` | Client $\rightarrow$ Server | Any | `{ emoji: string }` | Dispatches floating emoji reaction. |
| `sync_ping` | Client $\rightarrow$ Server | Any | `{ clientTime: number }` | Heartbeat drift check against server authoritative clock. |
| `sync_state` | Server $\rightarrow$ Client | Broadcast | `PlaybackState` | Broadcasts authoritative playback state to room. |
| `user_joined` | Server $\rightarrow$ Client | Broadcast | `{ username, userId, role, participants }` | Informs room of a new member. |
| `user_left` | Server $\rightarrow$ Client | Broadcast | `{ username, userId, participants }` | Informs room that a member disconnected. |
| `role_assigned` | Server $\rightarrow$ Client | Broadcast | `{ userId, username, role, participants }` | Informs room that a user's role changed. |
| `participant_removed` | Server $\rightarrow$ Client | Broadcast | `{ userId, participants }` | Informs room that a user was kicked. |
| `host_transferred` | Server $\rightarrow$ Client | Broadcast | `{ previousHostId, newHostId, participants }` | Informs room of new room host. |
| `control_request_submitted` | Server $\rightarrow$ Client | Broadcast | `{ request, pendingRequests }` | Notifies hosts/mods of a new pending request. |
| `control_request_updated` | Server $\rightarrow$ Client | Broadcast | `{ request, pendingRequests, participants, playback? }` | Notifies room of approved or rejected request. |
| `chat_message` | Server $\rightarrow$ Client | Broadcast | `ChatMessage` | Appends new chat or system message. |
| `reaction_received` | Server $\rightarrow$ Client | Broadcast | `ReactionPayload` | Broadcasts floating emoji particle. |
| `sync_pong` | Server $\rightarrow$ Client | To Sender | `{ serverTime, playState, videoId, drift }` | Returns server authoritative time and drift delta. |
| `error_message` | Server $\rightarrow$ Client | To Sender | `{ message: string }` | Structured error returned when an action is unauthorized or invalid. |

---

## 2. Core Data Models

### `PlaybackState`
```typescript
interface PlaybackState {
  videoId: string;
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

---

## 3. Server Authorization Invariants
1. **Rule 1**: Only sockets with role `HOST` or `MODERATOR` in the target room can execute `play`, `pause`, `seek`, or `change_video`.
2. **Rule 2**: Only the socket with role `HOST` can execute `assign_role`, `remove_participant`, or `transfer_host`.
3. **Rule 3**: A user cannot modify their own role directly or remove themselves.
4. **Rule 4**: If an unauthorized socket issues a privileged command, the server MUST reject it, emit an `error_message` with reason, and MUST NOT mutate or broadcast state.
5. **Rule 5**: A removed participant's socket must be detached from the room channel (`socket.leave(roomId)`).
