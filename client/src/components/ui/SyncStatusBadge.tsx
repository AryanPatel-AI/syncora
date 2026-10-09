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
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#193225] border border-[#F87171]/40 text-[#F87171] text-[11px] font-medium tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F87171]" />
        <span>Disconnected</span>
      </div>
    );
  }

  if (status.state === 'catching_up') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#193225] border border-[#F59E0B]/40 text-[#F59E0B] text-[11px] font-medium tracking-wide">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>Catching up ({status.driftSeconds.toFixed(1)}s)</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#11221A] border border-[#234735] text-[#D1FAE5] text-[11px] font-medium tracking-wide"
      title={`Frame drift: ${status.driftSeconds.toFixed(2)}s | Ping: ~${status.latencyMs}ms`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
      <span className="text-[#8E919C]">Sync</span>
      <span className="font-mono text-[10px] text-[#34D399]">±{Math.max(0.01, status.driftSeconds).toFixed(2)}s</span>
    </div>
  );
};
