import React from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { Shield, Hand, Film, Check, X, CheckCircle2, Play, Pause, FastForward } from 'lucide-react';

interface ApprovalQueueProps {
  onClose?: () => void;
  isInline?: boolean;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ onClose, isInline = false }) => {
  const { pendingRequests, handleControlRequest, canControl } = useWatchParty();

  const getRequestIcon = (reqType: string) => {
    const t = reqType.toLowerCase();
    if (t.includes('video')) return <Film className="w-3.5 h-3.5" />;
    if (t === 'play') return <Play className="w-3.5 h-3.5" />;
    if (t === 'pause') return <Pause className="w-3.5 h-3.5" />;
    if (t === 'seek') return <FastForward className="w-3.5 h-3.5" />;
    return <Hand className="w-3.5 h-3.5" />;
  };

  const getRequestDescription = (req: any) => {
    const t = String(req.action || req.type || '').toLowerCase();
    if (t.includes('video') || req.requestedVideoId) {
      return `Change video: ${req.requestedVideoTitle || req.requestedVideoId}`;
    }
    if (t === 'play') return 'Request to resume/play video';
    if (t === 'pause') return 'Request to pause video';
    if (t === 'seek') return `Request to seek to ${Math.floor(req.requestedTime || 0)}s`;
    return 'Requesting moderator playback control';
  };

  const content = (
    <div className={`flex flex-col gap-3 ${isInline ? 'w-full' : ''}`}>
      {/* Header if modal */}
      {!isInline && (
        <div className="flex items-center justify-between pb-3 border-b border-[#234735]">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-[#34D399]" />
            <div>
              <h3 className="text-sm font-serif font-semibold text-[#D1FAE5]">
                Playback Control Queue
              </h3>
              <p className="text-xs text-[#8E919C]">
                {pendingRequests.length} pending request{pendingRequests.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close request queue"
              className="p-1 rounded text-[#8E919C] hover:text-[#D1FAE5] hover:bg-[#224433] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-0.5">
        {pendingRequests.length === 0 ? (
          <div className="text-center py-6 text-[#8E919C] flex flex-col items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#34D399]" />
            <p className="text-xs font-medium text-[#D1FAE5]">No pending requests</p>
            <p className="text-[11px] text-[#5E606A]">All participant actions are up to date.</p>
          </div>
        ) : (
          pendingRequests.map((req) => (
            <div
              key={req.id}
              className="p-3 rounded-lg bg-[#193225] border border-[#234735] flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded bg-[#09140F] text-[#34D399] border border-[#234735]">
                    {getRequestIcon(req.action || req.type)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#D1FAE5] truncate">
                        {req.username}
                      </span>
                      <span className="text-[10px] text-[#5E606A] font-mono">
                        {new Date(req.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8E919C] mt-0.5">
                      {getRequestDescription(req)}
                    </p>
                  </div>
                </div>
              </div>

              {canControl && (
                <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-[#234735]/60">
                  <button
                    onClick={() => handleControlRequest(req.id, 'rejected')}
                    aria-label={`Decline request from ${req.username}`}
                    className="px-2.5 py-1 rounded text-xs text-[#8E919C] hover:text-[#F87171] hover:bg-[#F87171]/10 border border-[#234735] transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleControlRequest(req.id, 'approved')}
                    aria-label={`Approve request from ${req.username}`}
                    className="flex items-center gap-1 px-3 py-1 rounded bg-[#34D399] hover:bg-[#2BBF88] text-[#09140F] text-xs font-semibold transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    <span>Approve</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (isInline) {
    return content;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09140F]/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-[#11221A] rounded-xl p-5 shadow-cinema border border-[#234735]">
        {content}
      </div>
    </div>
  );
};
