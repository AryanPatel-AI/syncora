import React from 'react';
import { SyncStatus } from '../../types';
import { Wifi, RefreshCw, AlertCircle } from 'lucide-react';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  isConnected: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ status, isConnected }) => {
  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-400 text-xs font-bold shadow-sm">
        <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
        <span>Reconnecting...</span>
      </div>
    );
  }

  if (status.state === 'catching_up') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-400 text-xs font-bold shadow-sm">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Catching up ({status.driftSeconds.toFixed(1)}s)</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm backdrop-blur-md"
      title={`Drift: ${status.driftSeconds.toFixed(2)}s | Ping: ~${status.latencyMs}ms`}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#10B981]"></span>
      </span>
      <Wifi className="w-3.5 h-3.5" />
      <span>In Sync</span>
    </div>
  );
};
