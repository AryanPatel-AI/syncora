import { Room } from '../models/Room';
import { PlaybackState } from '../types';

export class SyncService {
  /**
   * Threshold in seconds beyond which a client's playback is considered drifting.
   * If client difference > DRIFT_THRESHOLD, client should seek to authoritative time.
   */
  public static readonly DRIFT_THRESHOLD_SECONDS = 1.75;

  /**
   * Generates the authoritative synchronized playback state snapshot for a room.
   */
  public static getSyncPayload(room: Room): PlaybackState {
    return room.getPlaybackState();
  }

  /**
   * Calculates if a client time has drifted beyond acceptable tolerance.
   */
  public static isDrifted(clientTime: number, room: Room): boolean {
    const authoritativeTime = room.getAuthoritativeCurrentTime();
    return Math.abs(clientTime - authoritativeTime) > this.DRIFT_THRESHOLD_SECONDS;
  }
}
