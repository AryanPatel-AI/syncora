import { Participant } from '../models/Participant';

export class PermissionService {
  /**
   * Only Host and Moderator can control playback (play, pause, seek, change video).
   */
  public static canControlPlayback(participant: Participant | undefined): boolean {
    if (!participant) return false;
    return participant.role === 'HOST' || participant.role === 'MODERATOR';
  }

  /**
   * Only the Host can assign or change roles (promote to moderator, demote to participant).
   */
  public static canAssignRoles(
    participant: Participant | undefined,
    roomHostId?: string
  ): boolean {
    if (!participant) return false;
    if (roomHostId && participant.id !== roomHostId) return false;
    return participant.role === 'HOST' || participant.isHost;
  }

  /**
   * Only the Host can remove/kick participants, and cannot kick themselves.
   */
  public static canRemoveParticipant(
    actor: Participant | undefined,
    target: Participant | undefined,
    roomHostId?: string
  ): boolean {
    if (!actor || !target) return false;
    if (actor.id === target.id) return false; // cannot kick self
    if (roomHostId && actor.id !== roomHostId) return false;
    return actor.role === 'HOST' || actor.isHost;
  }

  /**
   * Only current Host can transfer Host role to another participant.
   */
  public static canTransferHost(
    actor: Participant | undefined,
    target: Participant | undefined,
    roomHostId?: string
  ): boolean {
    if (!actor || !target) return false;
    if (actor.id === target.id) return false; // cannot transfer to self
    if (roomHostId && actor.id !== roomHostId) return false;
    return actor.role === 'HOST' || actor.isHost;
  }

  /**
   * Host and Moderators can review/approve/reject control requests from participants.
   */
  public static canHandleControlRequest(actor: Participant | undefined): boolean {
    if (!actor) return false;
    return actor.role === 'HOST' || actor.role === 'MODERATOR';
  }

  /**
   * Host and Moderators can moderate room chat (delete messages, pin messages, timeout users).
   */
  public static canModerateChat(actor: Participant | undefined): boolean {
    if (!actor) return false;
    return actor.role === 'HOST' || actor.role === 'MODERATOR';
  }

  /**
   * Only Host can change room-wide settings like slow mode.
   */
  public static canManageSettings(actor: Participant | undefined): boolean {
    if (!actor) return false;
    return actor.role === 'HOST' || actor.isHost;
  }
}
