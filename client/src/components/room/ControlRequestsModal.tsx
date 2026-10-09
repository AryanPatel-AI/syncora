import React from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { X, Check, Hand, Film, Shield, CheckCircle2 } from 'lucide-react';

interface ControlRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlRequestsModal: React.FC<ControlRequestsModalProps> = ({ isOpen, onClose }) => {
  const { pendingRequests, handleControlRequest, canControl } = useWatchParty();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg glass-panel-elevated rounded-3xl p-6 sm:p-7 shadow-2xl border border-brand-border/80 flex flex-col gap-5 text-brand-text">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-brand-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-primary/20 text-brand-highlight shadow-glow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Playback Control Requests</h2>
              <p className="text-xs text-brand-muted">
                {pendingRequests.length} pending request{pendingRequests.length === 1 ? '' : 's'} awaiting authorization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-brand-muted hover:text-white hover:bg-brand-surface transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-10 text-brand-muted flex flex-col items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-brand-surface/70 border border-brand-border/50 text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="text-xs font-bold text-white">All Clear</p>
              <p className="text-[11px] text-brand-subtle">No pending participant requests at this time.</p>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-brand-surface/80 border border-brand-border/70 flex flex-col gap-3.5 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-brand-card text-brand-highlight border border-brand-border/60">
                      {req.type === 'REQUEST_CHANGE_VIDEO' ? (
                        <Film className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Hand className="w-4 h-4 text-amber-300" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-white">{req.username}</span>
                        <span className="text-[10px] text-brand-subtle font-mono">
                          {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-brand-muted mt-0.5">
                        {req.type === 'REQUEST_CHANGE_VIDEO'
                          ? `Requests to switch stream to: ${req.requestedVideoId}`
                          : 'Requests full playback controls (Promote to Moderator)'}
                      </p>
                    </div>
                  </div>
                </div>

                {canControl && (
                  <div className="flex items-center justify-end gap-2.5 pt-2.5 border-t border-brand-border/40">
                    <button
                      onClick={() => handleControlRequest(req.id, 'rejected')}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-card hover:bg-red-950/40 text-brand-muted hover:text-red-400 border border-brand-border text-xs font-bold transition-all"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleControlRequest(req.id, 'approved')}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-hover text-white text-xs font-bold shadow-glow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
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
