import React from 'react';
import { Participant } from '../../types';
import { Crown, Shield } from 'lucide-react';

interface ParticipantAvatarProps {
  participant: Participant;
  size?: 'sm' | 'md' | 'lg';
  showOnlineDot?: boolean;
  showRoleBadge?: boolean;
  className?: string;
}

export const ParticipantAvatar: React.FC<ParticipantAvatarProps> = ({
  participant,
  size = 'md',
  showOnlineDot = true,
  showRoleBadge = false,
  className = '',
}) => {
  const initial = (participant.username || '?').charAt(0).toUpperCase();

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-9 h-9 text-sm',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5 -bottom-0.5 -right-0.5',
    md: 'w-2 h-2 -bottom-0.5 -right-0.5',
    lg: 'w-2.5 h-2.5 bottom-0 right-0',
  };

  const isHost = participant.isHost || participant.role === 'HOST';
  const isModerator = participant.role === 'MODERATOR';

  // Use avatarColor or a deterministic fallback
  const bgColor = participant.avatarColor || '#34D399';
  const textColor = bgColor === '#34D399' ? '#09140F' : '#FFFFFF';

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${className}`}
      title={`${participant.username} (${isHost ? 'Host' : isModerator ? 'Moderator' : 'Viewer'})`}
      aria-label={`${participant.username}, ${isHost ? 'Host' : isModerator ? 'Moderator' : 'Viewer'}`}
    >
      <div
        className={`${sizeClasses[size]} rounded-full font-mono font-semibold flex items-center justify-center shadow-sm border border-[#234735]`}
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        {initial}
      </div>

      {/* Subtle green indicator dot for connected participants */}
      {showOnlineDot && (
        <span
          className={`absolute ${dotSizes[size]} rounded-full bg-[#34D399] border border-[#09140F]`}
          aria-hidden="true"
        />
      )}

      {/* Optional miniature Role Badge */}
      {showRoleBadge && isHost && (
        <span
          className="absolute -top-1 -right-1 p-0.5 rounded-full bg-[#11221A] border border-[#E5A84B]/40 text-[#E5A84B]"
          title="Room Host"
          aria-hidden="true"
        >
          <Crown className="w-2.5 h-2.5 fill-current" />
        </span>
      )}
      {showRoleBadge && isModerator && !isHost && (
        <span
          className="absolute -top-1 -right-1 p-0.5 rounded-full bg-[#11221A] border border-[#82A8F8]/40 text-[#82A8F8]"
          title="Moderator"
          aria-hidden="true"
        >
          <Shield className="w-2.5 h-2.5 fill-current" />
        </span>
      )}
    </div>
  );
};
