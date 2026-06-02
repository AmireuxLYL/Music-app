import type { Song, Source } from '@/lib/types';

const JAMENDO_BASE = 'https://api.jamendo.com/v3.0';

function getClientId(): string {
  return process.env.JAMENDO_CLIENT_ID || '';
}

function mapTrack(track: Record<string, unknown>): Song {
  const sources: Source[] = [
    {
      platform: 'jamendo',
      streamUrl: track.audio as string,
      downloadUrl: track.audiodownload as string,
      quality: '320',
    },
  ];

  let type: Song['type'] = 'original';
  const name = (track.name as string || '').toLowerCase();
  const tags = (track.tags as string || '').toLowerCase();
  if (name.includes('instrumental') || tags.includes('instrumental')) {
    type = 'instrumental';
  } else if (name.includes('piano') || name.includes('orchestral') || tags.includes('classical')) {
    type = 'pure_music';
  } else if (name.includes('cover')) {
    type = 'cover';
  }

  return {
    id: `jamendo-${track.id}`,
    title: track.name as string,
    artist: track.artist_name as string,
    coverUrl: (track.image as string) || '',
    type,
    duration: track.duration ? Math.round(track.duration as number) : 180,
    sources,
    tags: (track.tags as string)?.split(/\s*,\s*/).filter(Boolean) || [],
    popularity: Math.round((track.popularity_total as number || 0) / 10),
  };
}

export async function searchJamendo(query: string, type?: string, limit: number = 20): Promise<Song[]> {
  const clientId = getClientId();
  if (!clientId) return [];

  const params = new URLSearchParams({
    client_id: clientId,
    format: 'json',
    search: query,
    limit: String(limit),
    include: 'musicinfo',
  });

  // Jamendo doesn't have a type filter, but we can search with type keywords
  if (type === 'instrumental') params.set('tags', 'instrumental');
  if (type === 'pure_music') params.set('tags', 'classical,ambient');

  const res = await fetch(`${JAMENDO_BASE}/tracks/?${params}`);
  const data = await res.json();

  if (!data.results) return [];
  return data.results.map(mapTrack);
}

export async function getJamendoTrending(limit: number = 20): Promise<Song[]> {
  const clientId = getClientId();
  if (!clientId) return [];

  const params = new URLSearchParams({
    client_id: clientId,
    format: 'json',
    limit: String(limit),
    order: 'popularity_total',
    include: 'musicinfo',
  });

  const res = await fetch(`${JAMENDO_BASE}/tracks/?${params}`);
  const data = await res.json();

  if (!data.results) return [];
  return data.results.map(mapTrack);
}
