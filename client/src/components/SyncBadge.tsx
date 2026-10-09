import React from 'react';
import { SyncStatus } from '../types';
import { Wifi, RefreshCw, AlertCircle } from 'lucide-react';

interface SyncBadgeProps {
  status: SyncStatus;
  isConnected: boolean;
}

export const SyncBadge: React.FC<SyncBadgeProps> = ({ status, isConnected }) => {
  if (!isConnected) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-red-400 text-xs font-medium">
        <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
        <span>Reconnecting...</span>
      </div>
    );
  }

  if (status.state === 'catching_up') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-400 text-xs font-medium">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Catching up ({status.driftSeconds.toFixed(1)}s)</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-medium transition-all shadow-sm"
      title={`Drift: ${status.driftSeconds.toFixed(2)}s | Latency: ~${status.latencyMs}ms`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <Wifi className="w-3.5 h-3.5" />
      <span>In Sync</span>
    </div>
  );
};
