# ⚡ Syncora — Socket.IO Events & Protocol Specification

This document provides the canonical reference for all real-time events, communication directions, payload schemas, acknowledgement callbacks, and error responses used in Syncora.

---

## 1. Master Event Catalog

| Event Name | Direction | Required Role | Description |
| :--- | :---: | :---: | :--- |
| `create_room` | Client $\rightarrow$ Server | Any | Creator initializes a room. Creator automatically becomes `HOST`. |
| `join_room` | Client $\rightarrow$ Server | Any | Client joins by room code. Automatically defaults to `PARTICIPANT`. |
| `leave_room` | Client $\rightarrow$ Server | Room Member | Client exits the active screening room cleanly. |
| `room_snapshot` | Server $\rightarrow$ Client | Direct to Caller | Initial complete room state delivered upon joining or creating. |
| `user_joined` | Server $\rightarrow$ Client | Broadcast | Broadcast to room when a new participant joins. |
| `user_left` | Server $\rightarrow$ Client | Broadcast | Broadcast to room when a participant disconnects or leaves. |
| `participants_updated`| Server $\rightarrow$ Client | Broadcast | Broadcast to room whenever members join, leave, or change roles. |
| `presence_updated` | Server $\rightarrow$ Client | Broadcast | Broadcast to room with active connected viewer count and roster. |
| `play` | Client $\rightarrow$ Server | Host / Mod | Resumes video playback at timestamp for all room members. |
| `pause` | Client $\rightarrow$ Server | Host / Mod | Pauses video playback at timestamp for all room members. |
| `seek` | Client $\rightarrow$ Server | Host / Mod | Jumps to a specific timestamp in the video across the room. |
| `change_video` | Client $\rightarrow$ Server | Host / Mod | Switches the current YouTube video stream across the room. |
| `sync_state` | Server $\rightarrow$ Client | Broadcast | Authoritative playback state broadcast to room. |
| `assign_role` | Client $\rightarrow$ Server | Host Only | Host promotes or restores a member's role (`MODERATOR` / `PARTICIPANT` / `VIEWER`). |
| `role_assigned` | Server $\rightarrow$ Client | Broadcast | Broadcast to room notifying member of role promotion or demotion. |
| `remove_participant`| Client $\rightarrow$ Server | Host Only | Host kicks a participant from the room. |
| `participant_removed`| Server $\rightarrow$ Client | Broadcast | Broadcast notifying the room and kicked participant. |
| `transfer_host` | Client $\rightarrow$ Server | Host Only | Host transfers primary ownership to another member. |
| `host_transferred` | Server $\rightarrow$ Client | Broadcast | Broadcast notifying room of new room host. |
| `request_playback_change` | Client $\rightarrow$ Server | Participant | Viewer requests play, pause, seek, or video change for host approval. |
| `request_control` | Client $\rightarrow$ Server | Participant | Viewer requests playback control rights. |
| `control_request_submitted` | Server $\rightarrow$ Client | Broadcast | Broadcast alerting Host/Moderators of a new pending request. |
| `approve_request` | Client $\rightarrow$ Server | Host / Mod | Reviewer approves a pending request; server executes the action. |
| `reject_request` | Client $\rightarrow$ Server | Host / Mod | Reviewer rejects a pending request. |
| `control_request_updated` | Server $\rightarrow$ Client | Broadcast | Broadcast notifying room of request resolution. |
| `chat_message` | Client $\rightarrow$ Server | Room Member | Sends a chat message (validated & rate-limited). |
| `chat_message` | Server $\rightarrow$ Client | Broadcast | Broadcasts validated chat message to room members. |
| `send_reaction` | Client $\rightarrow$ Server | Room Member | Sends a like or emoji reaction (500ms server cooldown). |
| `reaction_received`| Server $\rightarrow$ Client | Broadcast | Broadcasts reaction and synchronized room like count. |
| `sync_ping` | Client $\rightarrow$ Server | Room Member | Client sends current time to check clock drift. |
| `sync_pong` | Server $\rightarrow$ Client | To Caller | Server returns authoritative time and drift delta. |
| `error_message` | Server $\rightarrow$ Client | To Caller | Emitted when an action is unauthorized or input fails validation. |
| `room_error` | Server $\rightarrow$ Client | To Caller | Emitted when room lookup or join fails. |

---

## 2. Client-to-Server Event Payloads

### Room Lifecycle

#### `create_room`
- **Direction**: Client $\rightarrow$ Server
- **Payload**:
  ```typescript
  {
    username: string;          // 2 to 30 characters, non-empty, trimmed
    initialVideoId?: string;   // Optional 11-char YouTube ID (defaults to 'aqz-KE-bpKQ')
  }
  ```
- **Acknowledgement Callback**:
  ```typescript
  (response: {
    success: boolean;
    roomId?: string;
    user?: Participant;
    roomState?: RoomStateSnapshot;
    error?: string;
  }) => void
  ```

#### `join_room`
- **Direction**: Client $\rightarrow$ Server
- **Payload**:
  ```typescript
  {
    roomId: string;            // 4 to 12 alphanumeric characters, uppercase
    username: string;          // 2 to 30 characters, non-empty, trimmed
  }
  ```
- **Acknowledgement Callback**:
  ```typescript
  (response: {
    success: boolean;
    roomId?: string;
    user?: Participant;
    roomState?: RoomStateSnapshot;
    error?: string;
  }) => void
  ```

#### `leave_room`
- **Direction**: Client $\rightarrow$ Server
- **Payload**: `{}` (Empty object)

---

### Playback Synchronization (Host & Moderator Only)

#### `play`
- **Direction**: Client $\rightarrow$ Server
- **Authorization**: `HOST` or `MODERATOR`
- **Payload**:
  ```typescript
  {
    time?: number;             // Timestamp in seconds to resume playback
  }
  ```

#### `pause`
- **Direction**: Client $\rightarrow$ Server
- **Authorization**: `HOST` or `MODERATOR`
- **Payload**:
  ```typescript
  {
    time?: number;             // Timestamp in seconds to pause playback
  }
  ```

#### `seek`
- **Direction**: Client $\rightarrow$ Server
- **Authorization**: `HOST` or `MODERATOR`
- **Payload**:
  ```typescript
  {
    time: number;              // Target timestamp in seconds (positive finite number)
  }
  ```

#### `change_video`
- **Direction**: Client $\rightarrow$ Server
- **Authorization**: `HOST` or `MODERATOR`
- **Payload**:
  ```typescript
  {
    videoId: string;           // 11-character YouTube video ID
  }
  ```

---

### Member Management & Roles (Host Only)

#### `assign_role`
- **Direction**: Client $\rightarrow$ Server
- **Authorization**: `HOST` Only
- **Payload**:
  ```typescript
  {
    userId: string;            // ID of participant to promote/demote
    role: 'MODERATOR' | 'PARTICIPANT' | 'VIEWER'; // Cannot assign HOST directly
  }
  ```

#### `remove_participant`
- **Direction**: Client $\rightarrow$ Server
- **Authorization**: `HOST` Only
- **Payload**:
  ```typescript
  {
    userId: string;            // ID of participant to remove (cannot remove self)
  }
  ```

#### `transfer_host`
- **Direction**: Client $\rightarrow$ Server
- **Authorization**: `HOST` Only
- **Payload**:
  ```typescript
  {
    userId: string;            // ID of participant to receive Host ownership
  }
  ```

---

### Playback Requests & Approvals

#### `request_playback_change`
- **Direction**: Client $\rightarrow$ Server
- **Authorization**: `PARTICIPANT`
- **Payload**:
  ```typescript
  {
    action: 'play' | 'pause' | 'seek' | 'change_video';
    requestedVideoId?: string; // Required for change_video
    requestedTime?: number;    // Required for seek
  }
  ```

#### `approve_request`
- **Direction**: Client $\rightarrow$ Server
- **Authorization**: `HOST` or `MODERATOR`
- **Payload**:
  ```typescript
  {
    requestId: string;         // Unique server-assigned request ID
  }
  ```

#### `reject_request`
- **Direction**: Client $\rightarrow$ Server
- **Authorization**: `HOST` or `MODERATOR`
- **Payload**:
  ```typescript
  {
    requestId: string;         // Unique server-assigned request ID
  }
  ```

---

### Social & Chat

#### `chat_message`
- **Direction**: Client $\rightarrow$ Server
- **Payload**:
  ```typescript
  {
    text: string;              // 1 to 500 characters, non-empty, trimmed
  }
  ```

#### `send_reaction`
- **Direction**: Client $\rightarrow$ Server
- **Payload**:
  ```typescript
  {
    emoji?: string;            // Emoji string (defaults to '❤️')
    type?: string;             // 'like' or 'emoji' (defaults to 'like')
  }
  ```

---

## 3. Server-to-Client Broadcast Payloads

### `sync_state`
Broadcast when video plays, pauses, seeks, or changes:
```typescript
{
  videoId: string;
  playState: 'playing' | 'paused' | 'buffering';
  currentTime: number;
  lastUpdatedAt: number;       // Server UNIX epoch timestamp in milliseconds
  playbackRate: number;
  updatedBy: string;           // Username of person who performed the action
}
```

### `presence_updated`
Broadcast when membership count or roster updates:
```typescript
{
  count: number;               // Total connected viewers
  participants: Participant[]; // Full active roster
}
```

### `reaction_received`
Broadcast when any room member clicks Like or reacts:
```typescript
{
  id: string;                  // Unique reaction particle ID
  emoji: string;
  type: string;
  senderId: string;
  senderName: string;
  count: number;               // Synchronized room like count
  likeCount: number;
  timestamp: number;
}
```

### `error_message`
Direct emission to client upon authorization rejection or invalid command:
```typescript
{
  message: string;             // User-facing error explanation
}
```
