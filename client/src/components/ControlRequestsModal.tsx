import React from 'react';
import { useWatchParty } from '../context/WatchPartyContext';
import { X, Check, Hand, Film, User, Shield } from 'lucide-react';

interface ControlRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlRequestsModal: React.FC<ControlRequestsModalProps> = ({ isOpen, onClose }) => {
  const { pendingRequests, handleControlRequest, canControl } = useWatchParty();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md glass-panel-elevated rounded-2xl p-6 shadow-2xl border border-brand-border/80 flex flex-col gap-4 text-brand-text">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-brand-border/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-primary/20 text-brand-highlight">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Participant Control Requests</h2>
              <p className="text-xs text-brand-muted">
                {pendingRequests.length} pending approval request{pendingRequests.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-brand-surface transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Requests List */}
        <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-brand-muted flex flex-col items-center gap-2">
              <Check className="w-8 h-8 text-brand-border" />
              <p className="text-xs">All clear! No pending requests at this time.</p>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 rounded-xl bg-brand-surface border border-brand-border/60 flex flex-col gap-3 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-highlight">
                      {req.type === 'REQUEST_CHANGE_VIDEO' ? (
                        <Film className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Hand className="w-4 h-4 text-amber-300" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{req.username}</span>
                        <span className="text-[10px] text-brand-subtle">
                          {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-brand-muted mt-0.5">
                        {req.type === 'REQUEST_CHANGE_VIDEO'
                          ? `Requested to change video (ID: ${req.requestedVideoId})`
                          : 'Requests playback control & Moderator rights'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {canControl && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border/40">
                    <button
                      onClick={() => handleControlRequest(req.id, 'rejected')}
                      className="px-3 py-1.5 rounded-lg bg-brand-card hover:bg-red-950/40 text-brand-muted hover:text-red-400 border border-brand-border text-xs font-semibold transition-all"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleControlRequest(req.id, 'approved')}
                      className="px-3.5 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-hover text-white text-xs font-semibold shadow-glow-sm transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
