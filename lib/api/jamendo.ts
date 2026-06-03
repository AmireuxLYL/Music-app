// Jamendo music source — via local proxy on port 4001
// Full songs; streams routed through Next.js API for phone compatibility

import type { Song } from '@/lib/types';

const PROXY = 'http://localhost:4001';

function mapToSong(item: any): Song {
  return {
    id: item.id,
    title: item.title,
    artist: item.artist,
    coverUrl: item.coverUrl || '',
    type: 'original',
    duration: item.duration,
    sources: [{
      platform: 'other' as const,
      streamUrl: `/api/jamendo-stream?id=${item.id.replace('jamendo-', '')}`,
      downloadUrl: `/api/jamendo-stream?id=${item.id.replace('jamendo-', '')}`,
      quality: '320' as const,
    }],
    tags: [],
    popularity: 70,
    sourceLabel: '完整',
  } as Song;
}

export async function searchJamendo(query: string, limit: number = 15): Promise<Song[]> {
  try {
    const res = await fetch(`${PROXY}/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (!data.results) return [];
    return data.results.map(mapToSong);
  } catch {
    return [];
  }
}

export async function getJamendoTrending(limit: number = 15): Promise<Song[]> {
  try {
    const res = await fetch(`${PROXY}/trending?limit=${limit}`, {
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (!data.results) return [];
    return data.results.map(mapToSong);
  } catch {
    return [];
  }
}
