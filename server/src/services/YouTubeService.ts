import { SERVER_CONFIG } from '../config/constants';

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  channelAvatarUrl?: string;
  publishedAt: string;
  isLive: boolean;
  isUpcoming?: boolean;
  scheduledStartTime?: string;
  duration?: string;
  durationSeconds?: number;
  viewCount?: number;
  concurrentViewers?: number;
  likeCount?: number;
  category?: string;
}

export interface VideoSearchResponse {
  items: VideoItem[];
  nextPageToken?: string;
  prevPageToken?: string;
  totalResults: number;
}

// Curated verified catalog of real streams and high-resolution videos
// Used when YOUTUBE_API_KEY is not configured or when quota is exceeded
const CURATED_CATALOG: VideoItem[] = [
  {
    id: '1-LpQekNa9g',
    title: 'lofi hip hop radio 📚 - beats to relax/study to',
    description: 'Welcome to the Lofi Girl 24/7 live stream! Enjoy peaceful beats to study, work, or relax.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    channelId: 'UCvQb8z0fM5I74iUfK4H0Zjw',
    channelTitle: 'Lofi Girl',
    publishedAt: '2023-01-01T00:00:00Z',
    isLive: true,
    category: 'music',
  },
  {
    id: 'M3HKLzjvKPc',
    title: 'NASA Live: Earth Views from the International Space Station',
    description: 'Official live views of Earth from the ISS external high-definition cameras orbiting at 17,500 mph.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    channelId: 'UCLA_DiR1FfKNvjuUpBHmylQ',
    channelTitle: 'NASA',
    publishedAt: '2023-03-15T00:00:00Z',
    isLive: true,
    category: 'science',
  },
  {
    id: '5qap5aO4i9A',
    title: 'synthwave & chill radio - 24/7 retro beats',
    description: 'Live broadcast featuring retro synthwave sounds, soothing melodies, and neon aesthetic.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
    channelId: 'UCo0tqC1rC3Kj4zP5lK3Q2bw',
    channelTitle: 'Lofi Chill Radio',
    publishedAt: '2023-01-01T00:00:00Z',
    isLive: true,
    category: 'music',
  },
  {
    id: 'aqz-KE-bpKQ',
    title: 'Big Buck Bunny 4K (60fps Ultra HD Open Movie)',
    description: 'A large and lovable rabbit deals with bullying forest creatures in this classic open-source 4K benchmark animation by the Blender Foundation.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=80',
    channelId: 'UC_BlvJjKzL5h4D6o5jK1Qw',
    channelTitle: 'Blender Studio',
    publishedAt: '2022-01-01T00:00:00Z',
    isLive: false,
    duration: '10:34',
    durationSeconds: 634,
    category: 'animation',
  },
  {
    id: 'M7lc1UVf-VE',
    title: 'YouTube Developers: Introducing the YouTube IFrame Player API',
    description: 'Learn how to integrate and programmatically control YouTube video playback within modern web applications.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    channelTitle: 'Google for Developers',
    publishedAt: '2021-06-10T00:00:00Z',
    isLive: false,
    duration: '03:15',
    durationSeconds: 195,
    category: 'tech',
  },
  {
    id: 'LXb3EKWsInQ',
    title: 'COSTA RICA IN 4K 60fps HDR (Ultra HD Wildlife Exploration)',
    description: 'Incredible wildlife cinematography filmed across Costa Rica featuring tapirs, sloths, tree frogs, and toucans.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    channelId: 'UC6J4gW0z9WwE5W4rW2t8e-w',
    channelTitle: 'Jacob & Katie Schwarz',
    publishedAt: '2020-04-20T00:00:00Z',
    isLive: false,
    duration: '05:14',
    durationSeconds: 314,
    category: 'travel',
  },
  {
    id: 'WhWc3b3KhnY',
    title: 'Spring - Blender Open Movie 4K',
    description: 'Spring is the story of a shepherd girl and her dog, who face ancient spirits in order to continue the cycle of life.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    channelId: 'UC_BlvJjKzL5h4D6o5jK1Qw',
    channelTitle: 'Blender Studio',
    publishedAt: '2019-04-04T00:00:00Z',
    isLive: false,
    duration: '07:44',
    durationSeconds: 464,
    category: 'animation',
  },
  {
    id: 'TLkA0RELQ1g',
    title: 'Elephants Dream 4K - Blender Open VFX Movie',
    description: 'The historic first open-source computer animation movie by the Blender Foundation.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
    channelId: 'UC_BlvJjKzL5h4D6o5jK1Qw',
    channelTitle: 'Blender Studio',
    publishedAt: '2006-03-24T00:00:00Z',
    isLive: false,
    duration: '10:54',
    durationSeconds: 654,
    category: 'animation',
  },
  {
    id: 'L_LUpnjgPso',
    title: 'Fireplace Ambience 4K: Cozy Fire for Relaxation & Ambiance',
    description: 'Crisp crackling fire sounds with warm glowing embers filmed in Ultra HD 4K.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&auto=format&fit=crop&q=80',
    channelId: 'UCfireplace',
    channelTitle: 'Fireplace Atmosphere',
    publishedAt: '2021-12-01T00:00:00Z',
    isLive: false,
    duration: '20:00',
    durationSeconds: 1200,
    category: 'chill',
  },
  {
    id: 'EngW7tLk6R8',
    title: 'Cyber Cinema 4K: Night City Walk Experience',
    description: 'Atmospheric 4K cinematic neon city walk with ambient binaural sound.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    channelId: 'UCcybercinema',
    channelTitle: 'Cyber Cinema',
    publishedAt: '2023-08-10T00:00:00Z',
    isLive: false,
    duration: '20:00',
    durationSeconds: 1200,
    category: 'gaming',
  },
  {
    id: 'jNQXAC9IVRw',
    title: 'Me at the zoo (First Video on YouTube)',
    description: 'The historic first video uploaded to YouTube on April 23, 2005 by co-founder Jawed Karim at the San Diego Zoo.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    channelId: 'UC4QobU6ST3KWZCmG456Wd7Q',
    channelTitle: 'jawed',
    publishedAt: '2005-04-23T00:00:00Z',
    isLive: false,
    duration: '00:19',
    durationSeconds: 19,
    category: 'tech',
  },
];

export class YouTubeService {
  private static apiKey = process.env.YOUTUBE_API_KEY || '';

  public static isConfigured(): boolean {
    return Boolean(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY.trim().length > 10);
  }

  // Parse ISO 8601 duration string (e.g. PT4M13S) into seconds & formatted string
  private static parseDuration(iso: string): { duration: string; durationSeconds: number } {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return { duration: '0:00', durationSeconds: 0 };
    const hours = parseInt(match[1] || '0', 10);
    const mins = parseInt(match[2] || '0', 10);
    const secs = parseInt(match[3] || '0', 10);
    const total = hours * 3600 + mins * 60 + secs;
    const formatted =
      hours > 0
        ? `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        : `${mins}:${secs.toString().padStart(2, '0')}`;
    return { duration: formatted, durationSeconds: total };
  }

  public static async search(params: {
    query?: string;
    type?: 'all' | 'video' | 'live';
    category?: string;
    maxResults?: number;
    pageToken?: string;
  }): Promise<VideoSearchResponse> {
    const query = (params.query || '').trim();
    const type = params.type || 'all';
    const category = params.category || '';
    const maxResults = Math.min(params.maxResults || 20, 50);

    const apiKey = process.env.YOUTUBE_API_KEY;

    if (apiKey && apiKey.trim().length > 10) {
      try {
        let eventTypeParam = '';
        if (type === 'live') {
          eventTypeParam = '&eventType=live';
        }

        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          query
        )}&type=video${eventTypeParam}&videoEmbeddable=true&videoSyndicated=true&maxResults=${maxResults}&key=${apiKey}${
          params.pageToken ? `&pageToken=${encodeURIComponent(params.pageToken)}` : ''
        }`;

        const res = await fetch(searchUrl);
        if (res.ok) {
          const data = (await res.json()) as any;
          const videoIds = (data.items || [])
            .map((item: any) => item.id?.videoId)
            .filter(Boolean)
            .join(',');

          if (!videoIds) {
            return { items: [], totalResults: 0 };
          }

          // Fetch full video details including liveStreamingDetails, statistics, contentDetails
          const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,liveStreamingDetails&id=${videoIds}&key=${apiKey}`;
          const detailsRes = await fetch(detailsUrl);
          if (detailsRes.ok) {
            const detailsData = (await detailsRes.json()) as any;
            const items: VideoItem[] = (detailsData.items || []).map((v: any) => {
              const isLive = v.snippet?.liveBroadcastContent === 'live';
              const isUpcoming = v.snippet?.liveBroadcastContent === 'upcoming';
              const durationInfo = v.contentDetails?.duration
                ? this.parseDuration(v.contentDetails.duration)
                : { duration: undefined, durationSeconds: undefined };

              let concurrentViewers: number | undefined = undefined;
              if (v.liveStreamingDetails?.concurrentViewers) {
                const parsed = parseInt(v.liveStreamingDetails.concurrentViewers, 10);
                if (!isNaN(parsed)) concurrentViewers = parsed;
              }

              let viewCount: number | undefined = undefined;
              if (v.statistics?.viewCount) {
                const parsed = parseInt(v.statistics.viewCount, 10);
                if (!isNaN(parsed)) viewCount = parsed;
              }

              let likeCount: number | undefined = undefined;
              if (v.statistics?.likeCount) {
                const parsed = parseInt(v.statistics.likeCount, 10);
                if (!isNaN(parsed)) likeCount = parsed;
              }

              return {
                id: v.id,
                title: v.snippet?.title || 'Untitled Video',
                description: v.snippet?.description || '',
                thumbnailUrl:
                  v.snippet?.thumbnails?.maxres?.url ||
                  v.snippet?.thumbnails?.high?.url ||
                  v.snippet?.thumbnails?.medium?.url ||
                  `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
                channelId: v.snippet?.channelId || '',
                channelTitle: v.snippet?.channelTitle || 'YouTube Creator',
                publishedAt: v.snippet?.publishedAt || new Date().toISOString(),
                isLive,
                isUpcoming,
                scheduledStartTime: v.liveStreamingDetails?.scheduledStartTime,
                duration: isLive ? 'LIVE' : durationInfo.duration,
                durationSeconds: isLive ? 0 : durationInfo.durationSeconds,
                viewCount,
                concurrentViewers,
                likeCount,
              };
            });

            return {
              items,
              nextPageToken: data.nextPageToken,
              prevPageToken: data.prevPageToken,
              totalResults: data.pageInfo?.totalResults || items.length,
            };
          }
        } else {
          console.warn(`[YouTube API] Search returned status ${res.status}. Falling back to curated catalog.`);
        }
      } catch (err) {
        console.warn('[YouTube API] Request failed, using fallback catalog:', err);
      }
    }

    // Fallback: Filter curated catalog
    let filtered = [...CURATED_CATALOG];

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.channelTitle.toLowerCase().includes(q)
      );
    }

    if (type === 'live') {
      filtered = filtered.filter((v) => v.isLive);
    } else if (type === 'video') {
      filtered = filtered.filter((v) => !v.isLive);
    }

    if (category && category !== 'all') {
      filtered = filtered.filter((v) => v.category === category.toLowerCase());
    }

    return {
      items: filtered.slice(0, maxResults),
      totalResults: filtered.length,
    };
  }

  public static async getLiveStreams(category?: string): Promise<VideoItem[]> {
    const result = await this.search({ type: 'live', category, maxResults: 25 });
    return result.items.filter((item) => item.isLive);
  }

  public static async getPopular(category?: string): Promise<VideoItem[]> {
    const result = await this.search({ type: 'all', category, maxResults: 20 });
    return result.items;
  }

  public static async getVideoDetails(videoId: string): Promise<VideoItem | null> {
    const cleanId = videoId.trim();
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (apiKey && apiKey.trim().length > 10) {
      try {
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,liveStreamingDetails&id=${cleanId}&key=${apiKey}`;
        const res = await fetch(detailsUrl);
        if (res.ok) {
          const data = (await res.json()) as any;
          const v = data.items?.[0];
          if (v) {
            const isLive = v.snippet?.liveBroadcastContent === 'live';
            const isUpcoming = v.snippet?.liveBroadcastContent === 'upcoming';
            const durationInfo = v.contentDetails?.duration
              ? this.parseDuration(v.contentDetails.duration)
              : { duration: undefined, durationSeconds: undefined };

            let concurrentViewers: number | undefined = undefined;
            if (v.liveStreamingDetails?.concurrentViewers) {
              const parsed = parseInt(v.liveStreamingDetails.concurrentViewers, 10);
              if (!isNaN(parsed)) concurrentViewers = parsed;
            }

            let viewCount: number | undefined = undefined;
            if (v.statistics?.viewCount) {
              const parsed = parseInt(v.statistics.viewCount, 10);
              if (!isNaN(parsed)) viewCount = parsed;
            }

            let likeCount: number | undefined = undefined;
            if (v.statistics?.likeCount) {
              const parsed = parseInt(v.statistics.likeCount, 10);
              if (!isNaN(parsed)) likeCount = parsed;
            }

            return {
              id: v.id,
              title: v.snippet?.title || 'YouTube Video',
              description: v.snippet?.description || '',
              thumbnailUrl:
                v.snippet?.thumbnails?.maxres?.url ||
                v.snippet?.thumbnails?.high?.url ||
                `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
              channelId: v.snippet?.channelId || '',
              channelTitle: v.snippet?.channelTitle || 'YouTube Channel',
              publishedAt: v.snippet?.publishedAt || new Date().toISOString(),
              isLive,
              isUpcoming,
              scheduledStartTime: v.liveStreamingDetails?.scheduledStartTime,
              duration: isLive ? 'LIVE' : durationInfo.duration,
              durationSeconds: isLive ? 0 : durationInfo.durationSeconds,
              viewCount,
              concurrentViewers,
              likeCount,
            };
          }
        }
      } catch (err) {
        console.warn(`[YouTube API] Fetching details for ${cleanId} failed:`, err);
      }
    }

    // Match in curated catalog or generate high quality metadata placeholder
    const found = CURATED_CATALOG.find((v) => v.id === cleanId);
    if (found) return found;

    return {
      id: cleanId,
      title: 'YouTube Stream',
      description: 'Streamed video via YouTube embed.',
      thumbnailUrl: `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`,
      channelId: 'yt_channel',
      channelTitle: 'YouTube Creator',
      publishedAt: new Date().toISOString(),
      isLive: false,
    };
  }

  public static getCategories(): { id: string; name: string }[] {
    return [
      { id: 'all', name: 'All Content' },
      { id: 'live', name: 'Live Now' },
      { id: 'music', name: 'Music' },
      { id: 'gaming', name: 'Gaming' },
      { id: 'science', name: 'Science & Tech' },
      { id: 'animation', name: 'Film & Animation' },
      { id: 'travel', name: 'Travel & Events' },
    ];
  }
}
