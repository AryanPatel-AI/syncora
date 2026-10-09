import { Role, ParticipantJSON } from '../types';
import { getRandomAvatarColor } from '../utils/helpers';

export class Participant {
  public readonly id: string;
  public username: string;
  public role: Role;
  public socketId: string;
  public readonly joinedAt: number;
  public readonly avatarColor: string;
  public isHost: boolean;

  constructor(id: string, username: string, role: Role, socketId: string, isHost: boolean = false) {
    this.id = id;
    this.username = username;
    this.role = role;
    this.socketId = socketId;
    this.joinedAt = Date.now();
    this.avatarColor = getRandomAvatarColor();
    this.isHost = isHost;
  }

  public setRole(newRole: Role): void {
    this.role = newRole;
  }

  public promoteToModerator(): void {
    if (this.role !== 'HOST') {
      this.role = 'MODERATOR';
    }
  }

  public demoteToParticipant(): void {
    if (this.role !== 'HOST') {
      this.role = 'PARTICIPANT';
    }
  }

  public makeHost(): void {
    this.role = 'HOST';
    this.isHost = true;
  }

  public revokeHost(): void {
    this.isHost = false;
    this.role = 'MODERATOR';
  }

  public toJSON(): ParticipantJSON {
    return {
      id: this.id,
      username: this.username,
      role: this.role,
      joinedAt: this.joinedAt,
      avatarColor: this.avatarColor,
      isHost: this.isHost,
    };
  }
}
