import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const paddedSecs = secs.toString().padStart(2, '0');
  if (hrs > 0) {
    const paddedMins = mins.toString().padStart(2, '0');
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }
  return `${mins}:${paddedSecs}`;
}

/**
 * Extracts YouTube video ID from various URL formats or returns raw ID if already clean.
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If 11 character alphanumeric string without slash/question mark
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    // Handle standard YouTube URL
    const url = new URL(trimmed);

    // youtu.be/VIDEO_ID
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.slice(1).split('?')[0].split('/')[0];
      return id && id.length === 11 ? id : null;
    }

    // youtube.com/watch?v=VIDEO_ID
    if (url.searchParams.has('v')) {
      const id = url.searchParams.get('v');
      return id && id.length === 11 ? id : null;
    }

    // youtube.com/embed/VIDEO_ID or youtube.com/v/VIDEO_ID or youtube.com/shorts/VIDEO_ID
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
      if (['embed', 'v', 'shorts', 'live'].includes(pathParts[0])) {
        const id = pathParts[1];
        return id && id.length === 11 ? id : null;
      }
    }
  } catch {
    // If not a parseable URL, try regex extraction
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export interface PresetVideo {
  id: string;
  title: string;
  creator: string;
  category: string;
  thumbnail: string;
}

export const PRESET_VIDEOS: PresetVideo[] = [
  {
    id: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio 📚 - Beats to Relax/Study to',
    creator: 'Lofi Girl',
    category: 'Chill & Music',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'aqz-KE-bpKQ',
    title: 'Big Buck Bunny 4K (Open Source Cinema)',
    creator: 'Blender Foundation',
    category: 'Animation',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'LXb3EKWsInQ',
    title: 'COSTA RICA 4K - Ultra HD Wildlife Experience',
    creator: 'Jacob & Katie Schwarz',
    category: 'Nature & 4K',
    thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'kJQP7kiw5Fk',
    title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
    creator: 'Luis Fonsi',
    category: 'Music Video',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'M7lc1UVf-VE',
    title: 'YouTube Developers Official Demo Reel',
    creator: 'Google Developers',
    category: 'Tech & Demo',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80',
  },
];
