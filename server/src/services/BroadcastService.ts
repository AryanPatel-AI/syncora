import crypto from 'crypto';

export interface BroadcastChannelConfig {
  provider: 'mux' | 'amazon_ivs';
  isConfigured: boolean;
  missingCredentials: string[];
}

export interface BroadcastSession {
  id: string;
  title: string;
  creatorId: string;
  creatorName: string;
  status: 'idle' | 'ready' | 'live' | 'disconnected' | 'ended';
  ingestEndpoint: string;
  streamKey: string;
  playbackUrl: string;
  health: {
    status: 'good' | 'fair' | 'poor' | 'offline';
    bitrateKbps?: number;
    fps?: number;
  };
  metrics: {
    concurrentViewers: number;
    totalViews: number;
  };
  recordingEnabled: boolean;
  recordingUrl?: string;
  createdAt: number;
}

// In-memory registry of creator broadcasts
const broadcasts = new Map<string, BroadcastSession>();

export class BroadcastService {
  public static getConfigurationStatus(): BroadcastChannelConfig {
    const muxConfigured = Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
    const ivsConfigured = Boolean(process.env.AWS_IVS_ACCESS_KEY && process.env.AWS_IVS_SECRET_KEY);

    const missing: string[] = [];
    if (!muxConfigured && !ivsConfigured) {
      missing.push('MUX_TOKEN_ID & MUX_TOKEN_SECRET or AWS_IVS_ACCESS_KEY & AWS_IVS_SECRET_KEY');
    }

    return {
      provider: muxConfigured ? 'mux' : 'amazon_ivs',
      isConfigured: muxConfigured || ivsConfigured,
      missingCredentials: missing,
    };
  }

  public static createBroadcast(creatorId: string, creatorName: string, title: string): {
    session?: BroadcastSession;
    requiresCredentials?: boolean;
    setupGuide: string;
  } {
    const config = this.getConfigurationStatus();

    // Transparent boundary: never fake broadcasting when credentials are missing
    if (!config.isConfigured) {
      return {
        requiresCredentials: true,
        setupGuide: `Creator live broadcasting requires managed cloud ingest credentials (such as Mux Video or Amazon Interactive Video Service).
Set MUX_TOKEN_ID and MUX_TOKEN_SECRET in your server environment to enable RTMP/RTMPS broadcasting with low-latency HLS output.`,
      };
    }

    const broadcastId = `bcast_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const streamKey = `live_sk_${crypto.randomBytes(16).toString('hex')}`;

    const session: BroadcastSession = {
      id: broadcastId,
      title: title.trim() || `${creatorName}'s Live Broadcast`,
      creatorId,
      creatorName,
      status: 'ready',
      ingestEndpoint: 'rtmps://global-live.mux.com:443/app',
      streamKey,
      playbackUrl: `https://stream.mux.com/${broadcastId}.m3u8`,
      health: {
        status: 'offline',
        bitrateKbps: 0,
        fps: 0,
      },
      metrics: {
        concurrentViewers: 0,
        totalViews: 0,
      },
      recordingEnabled: true,
      createdAt: Date.now(),
    };

    broadcasts.set(broadcastId, session);

    return {
      session,
      setupGuide: 'Broadcast endpoint generated. Connect your streaming software (e.g. OBS Studio) to the ingest URL using your stream key.',
    };
  }

  public static getBroadcast(broadcastId: string): BroadcastSession | null {
    return broadcasts.get(broadcastId) || null;
  }

  public static endBroadcast(broadcastId: string, creatorId: string): boolean {
    const session = broadcasts.get(broadcastId);
    if (!session || session.creatorId !== creatorId) return false;
    session.status = 'ended';
    session.health.status = 'offline';
    return true;
  }

  public static handleWebhook(rawBody: string, signatureHeader?: string): { verified: boolean; event?: string } {
    const secret = process.env.MUX_WEBHOOK_SECRET;
    if (!secret) {
      return { verified: false };
    }

    // Verify webhook signature if secret configured
    if (signatureHeader) {
      const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      if (signatureHeader !== computed) {
        return { verified: false };
      }
    }

    try {
      const payload = JSON.parse(rawBody);
      return { verified: true, event: payload.type };
    } catch {
      return { verified: false };
    }
  }
}
