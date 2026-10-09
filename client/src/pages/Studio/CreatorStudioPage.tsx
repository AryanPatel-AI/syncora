import React, { useState, useEffect } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { api } from '../../services/api';
import {
  Tv,
  Radio,
  Key,
  ShieldAlert,
  Server,
  Activity,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Video,
} from 'lucide-react';

export const CreatorStudioPage: React.FC = () => {
  const { currentUserAccount, setIsAuthModalOpen, showToast } = useWatchParty();
  const [status, setStatus] = useState<{ provider: string; isConfigured: boolean; missingCredentials: string[] } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [streamTitle, setStreamTitle] = useState<string>('');
  const [session, setSession] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedIngest, setCopiedIngest] = useState<boolean>(false);

  useEffect(() => {
    api
      .getBroadcastStatus()
      .then((res) => setStatus(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserAccount) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const res = await api.createBroadcast(streamTitle);
      if (res.requiresCredentials) {
        showToast('Provider credentials required to initialize live broadcast.', 'info');
      } else if (res.session) {
        setSession(res.session);
        showToast('Broadcast session initialized!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Creation failed', 'error');
    }
  };

  const copyText = (text: string, type: 'key' | 'ingest') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') setCopiedKey(true);
    if (type === 'ingest') setCopiedIngest(true);
    setTimeout(() => {
      setCopiedKey(false);
      setCopiedIngest(false);
    }, 2000);
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-[#234735]">
        <div className="w-10 h-10 rounded-2xl bg-[#34D399]/15 text-[#34D399] flex items-center justify-center">
          <Tv className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Creator Studio & Broadcasting</h1>
          <p className="text-xs text-[#8E919C]">RTMP/RTMPS Live Ingest and Stream Management Architecture</p>
        </div>
      </div>

      {/* Architectural Notice & Provider Status Card */}
      <div className="p-5 rounded-2xl bg-[#11221A] border border-[#234735] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#34D399]" />
            <h2 className="text-sm font-bold text-white">Managed Ingest Architecture</h2>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
            status?.isConfigured
              ? 'bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30'
              : 'bg-[#E5A84B]/15 text-[#E5A84B] border border-[#E5A84B]/30'
          }`}>
            {status?.isConfigured ? 'Provider Active' : 'Configuration Required'}
          </span>
        </div>

        <p className="text-xs text-[#8E919C] leading-relaxed">
          Syncora utilizes managed live video infrastructure (such as <strong>Mux Video</strong> or <strong>Amazon Interactive Video Service (IVS)</strong>) for direct creator broadcasting. Client sockets and WebSockets are strictly reserved for real-time synchronization, telemetry, and room chat, while media transcoding and ultra-low-latency HLS packaging are handled by dedicated broadcast pipelines.
        </p>

        {!status?.isConfigured && (
          <div className="p-3.5 rounded-xl bg-[#193225] border border-[#234735] text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#E5A84B] font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>Provider Setup & Environment Configuration</span>
            </div>
            <p className="text-[#8E919C] text-[11px] leading-relaxed">
              To broadcast your own video directly without YouTube, configure managed streaming provider credentials in your server environment:
            </p>
            <div className="p-2.5 rounded-lg bg-[#09140F] font-mono text-[11px] text-[#34D399] border border-[#234735]">
              MUX_TOKEN_ID=your_mux_token_id<br />
              MUX_TOKEN_SECRET=your_mux_token_secret<br />
              # or AWS_IVS_ACCESS_KEY & AWS_IVS_SECRET_KEY
            </div>
            <p className="text-[10px] text-[#5E606A]">
              Standard accounts include free tiers or pay-as-you-go pricing (~$0.07/hour for live encoding). No paid activation is performed without explicit configuration.
            </p>
          </div>
        )}
      </div>

      {/* Broadcast Session Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Creation Box */}
        <div className="p-5 rounded-2xl bg-[#11221A] border border-[#234735] flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#34D399]" />
            <h3 className="text-sm font-bold text-white">Create Broadcast Session</h3>
          </div>

          <form onSubmit={handleCreateBroadcast} className="flex flex-col gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#8E919C] mb-1">
                Stream Title
              </label>
              <input
                type="text"
                placeholder="e.g. Weekend Game Dev Live"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="w-full bg-[#09140F] border border-[#234735] rounded-xl px-3 py-2 text-xs text-[#D1FAE5] focus:outline-none focus:border-[#34D399]"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 rounded-xl bg-[#34D399] text-[#09140F] font-bold text-xs hover:bg-[#2BBF88] active:scale-95 transition-all shadow-md shadow-[#34D399]/15 flex items-center justify-center gap-1.5"
            >
              <Video className="w-4 h-4" />
              <span>Initialize Ingest Key</span>
            </button>
          </form>
        </div>

        {/* Ingest Credentials & OBS Setup */}
        <div className="p-5 rounded-2xl bg-[#11221A] border border-[#234735] flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#34D399]" />
            <h3 className="text-sm font-bold text-white">OBS Studio / RTMP Connection</h3>
          </div>

          <div className="flex flex-col gap-2.5 text-xs">
            <div>
              <span className="text-[10px] text-[#8E919C] font-semibold uppercase">RTMP Ingest Server URL</span>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#09140F] border border-[#234735] font-mono text-[11px] text-white mt-1">
                <span className="truncate">{session?.ingestEndpoint || 'rtmps://global-live.mux.com:443/app'}</span>
                <button
                  onClick={() => copyText(session?.ingestEndpoint || 'rtmps://global-live.mux.com:443/app', 'ingest')}
                  className="p-1 text-[#8E919C] hover:text-white"
                >
                  {copiedIngest ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-[#8E919C] font-semibold uppercase">Stream Key</span>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#09140F] border border-[#234735] font-mono text-[11px] text-white mt-1">
                <span className="truncate">{session?.streamKey || '••••••••••••••••••••••••'}</span>
                {session?.streamKey && (
                  <button
                    onClick={() => copyText(session.streamKey, 'key')}
                    className="p-1 text-[#8E919C] hover:text-white"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#193225] text-[11px] text-[#8E919C] leading-relaxed">
              Open <strong>OBS Studio</strong> &gt; <strong>Settings</strong> &gt; <strong>Stream</strong>. Select Custom Service, paste the server URL and your private stream key, and start streaming.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
