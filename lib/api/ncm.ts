// NetEase Cloud Music — 30M+ songs via proxy on port 4000
import type { Song, Source } from '@/lib/types';

const PROXY = 'http://localhost:4000';

function mapSong(item: any, streamUrl?: string): Song {
  const name = (item.name || '').toLowerCase();
  let type: Song['type'] = 'original';
  if (name.includes('伴奏') || name.includes('instrumental')) type = 'instrumental';
  else if (name.includes('纯音乐') || name.includes('piano')) type = 'pure_music';
  else if (name.includes('翻唱') || name.includes('cover')) type = 'cover';

  return {
    id: `ncm-${item.id}`,
    title: item.name || 'Unknown',
    artist: (item.artists || item.ar || []).map((a: any) => a.name).join(' / ') || 'Unknown',
    coverUrl: (item.album?.picUrl || item.al?.picUrl || '').replace('http://', 'https://'),
    type,
    duration: Math.floor((item.duration || item.dt || 0) / 1000),
    sources: streamUrl ? [{
      platform: 'other' as const,
      streamUrl, downloadUrl: streamUrl,
      quality: '320' as const,
    }] : [],
    tags: [],
    popularity: 70,
    sourceLabel: '完整',
  } as Song;
}

export async function searchNetease(query: string, limit: number = 20): Promise<Song[]> {
  try {
    const res = await fetch(`${PROXY}/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (data.code !== 200 || !data.result?.songs) return [];

    const songs = data.result.songs.slice(0, limit);
    if (!songs.length) return [];

    const ids = songs.map((s: any) => s.id).join(',');
    const urlRes = await fetch(`${PROXY}/song_url?id=${encodeURIComponent(ids)}`, {
      signal: AbortSignal.timeout(10000),
    });
    const urlData = await urlRes.json();
    const urlMap = new Map<string, string>();
    if (urlData.data) urlData.data.forEach((i: any) => { if (i.url) urlMap.set(String(i.id), i.url); });

    return songs.map((s: any) => mapSong(s, urlMap.get(String(s.id)))).filter((s: Song) => s.sources.length > 0);
  } catch { return []; }
}

/** Get MASSIVE song pool from toplists — 200+ songs from 10+ charts */
export async function getBatchSongs(limit: number = 100): Promise<Song[]> {
  try {
    const res = await fetch(`${PROXY}/batch_songs`, {
      signal: AbortSignal.timeout(20000),
    });
    const data = await res.json();
    if (!data.songs) return [];

    const songs = data.songs.slice(0, limit);
    const ids = songs.map((s: any) => s.id).join(',');
    if (!ids) return [];

    const urlRes = await fetch(`${PROXY}/song_url?id=${encodeURIComponent(ids)}`, {
      signal: AbortSignal.timeout(15000),
    });
    const urlData = await urlRes.json();
    const urlMap = new Map<string, string>();
    if (urlData.data) urlData.data.forEach((i: any) => { if (i.url) urlMap.set(String(i.id), i.url); });

    return songs.map((s: any) => mapSong(s, urlMap.get(String(s.id)))).filter((s: Song) => s.sources.length > 0);
  } catch { return []; }
}

export async function getNeteaseTrending(limit: number = 20): Promise<Song[]> {
  // Get from toplists for variety
  const batch = await getBatchSongs(limit * 3);
  if (batch.length >= limit) return batch.sort(() => Math.random() - 0.5).slice(0, limit);

  // Fallback to search
  const queries = ['热门', '新歌', '流行', '经典', '民谣', '说唱', '抖音', '周杰伦', '陈奕迅', 'Taylor Swift'];
  const q = queries[Math.floor(Math.random() * queries.length)];
  const search = await searchNetease(q, limit);
  return search;
}
