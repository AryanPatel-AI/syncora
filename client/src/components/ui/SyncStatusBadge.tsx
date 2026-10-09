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
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1C1E24] border border-[#F87171]/40 text-[#F87171] text-[11px] font-medium tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F87171]" />
        <span>Disconnected</span>
      </div>
    );
  }

  if (status.state === 'catching_up') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1C1E24] border border-[#F59E0B]/40 text-[#F59E0B] text-[11px] font-medium tracking-wide">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>Catching up ({status.driftSeconds.toFixed(1)}s)</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#16171B] border border-[#282A33] text-[#F2F0E9] text-[11px] font-medium tracking-wide"
      title={`Frame drift: ${status.driftSeconds.toFixed(2)}s | Ping: ~${status.latencyMs}ms`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#D6F279]" />
      <span className="text-[#8E919C]">Sync</span>
      <span className="font-mono text-[10px] text-[#D6F279]">±{Math.max(0.01, status.driftSeconds).toFixed(2)}s</span>
    </div>
  );
};
