export interface PresetVideo {
  id: string;
  title: string;
  creator: string;
  category: 'Cinema' | 'Chill' | 'Nature' | 'Tech';
  duration: string;
  thumbnail: string;
}

export const VERIFIED_PRESETS: PresetVideo[] = [
  {
    id: 'aqz-KE-bpKQ',
    title: 'Big Buck Bunny 4K (Open Cinema)',
    creator: 'Blender Studio',
    category: 'Cinema',
    duration: '10:34',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'LXb3EKWsInQ',
    title: 'COSTA RICA 4K - Wildlife Experience',
    creator: 'Jacob & Katie Schwarz',
    category: 'Nature',
    duration: '05:14',
    thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'M7lc1UVf-VE',
    title: 'YouTube Developers Official Reel',
    creator: 'Google Developers',
    category: 'Tech',
    duration: '03:10',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'WhWc3b3KhnY',
    title: 'Spring 4K (Blender Open Movie)',
    creator: 'Blender Studio',
    category: 'Cinema',
    duration: '07:44',
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: '1-LpQekNa9g',
    title: 'Lofi Girl 24/7 Live Broadcast',
    creator: 'Lofi Girl',
    category: 'Chill',
    duration: 'LIVE',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'L_LUpnjgPso',
    title: 'Fireplace Ambience 4K (Relaxation)',
    creator: 'Fireplace Atmosphere',
    category: 'Chill',
    duration: '20:00',
    thumbnail: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'EngW7tLk6R8',
    title: 'Cyberpunk 2077 Night City Walk 4K',
    creator: 'Cyber Cinema',
    category: 'Cinema',
    duration: '20:00',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
  },
];

export const DEFAULT_VIDEO_ID = 'aqz-KE-bpKQ';

export const REACTION_EMOJIS = ['❤️', '🔥', '😂', '👏', '🍿', '🚀', '🎉', '🤯'] as const;
