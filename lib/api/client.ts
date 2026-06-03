import type { SearchResponse, Song, RecommendResponse } from '@/lib/types';

const BASE_URL = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function searchSongs(
  q: string,
  type?: string,
  page: number = 1
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q, page: String(page) });
  if (type && type !== 'all') params.set('type', type);
  return fetchJSON<SearchResponse>(`${BASE_URL}/search?${params}`);
}

export async function getTrending(): Promise<Song[]> {
  return fetchJSON<Song[]>(`${BASE_URL}/trending`);
}

export async function getRecommendations(cursor?: string): Promise<RecommendResponse> {
  const params = cursor ? `?cursor=${cursor}` : '';
  return fetchJSON<RecommendResponse>(`${BASE_URL}/recommend${params}`);
}

export async function getSongDetail(id: string): Promise<Song> {
  return fetchJSON<Song>(`${BASE_URL}/song/${id}`);
}

/**
 * Get the stream URL for a song.
 * Pass the actual stream URL from the song's sources so the server can proxy it.
 * Falls back to the ID-based route for seed data.
 */
export function getStreamUrl(song: Song | string, platform?: string): string {
  if (typeof song === 'string') {
    // Legacy: just ID — server will try to resolve
    const params = platform ? `?platform=${platform}` : '';
    return `${BASE_URL}/stream/${song}${params}`;
  }

  // Use actual source URL if available — pass via query param for proxy
  const source = song.sources[0];
  if (source?.streamUrl && (source.streamUrl.startsWith('http://') || source.streamUrl.startsWith('https://'))) {
    const srcParam = encodeURIComponent(source.streamUrl);
    const platformParam = platform ? `&platform=${platform}` : '';
    return `${BASE_URL}/stream/${song.id}?src=${srcParam}${platformParam}`;
  }

  const params = platform ? `?platform=${platform}` : '';
  return `${BASE_URL}/stream/${song.id}${params}`;
}

export function getDownloadUrl(id: string): string {
  return `${BASE_URL}/download/${id}`;
}
