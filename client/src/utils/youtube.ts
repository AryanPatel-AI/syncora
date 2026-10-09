export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If already clean 11 character alphanumeric video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
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

    // youtube.com/embed/VIDEO_ID or youtube.com/shorts/VIDEO_ID
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
      if (['embed', 'v', 'shorts', 'live'].includes(pathParts[0])) {
        const id = pathParts[1];
        return id && id.length === 11 ? id : null;
      }
    }
  } catch {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
