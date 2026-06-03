// go-music-dl wrapper — KuGou, KuWo, Bilibili sources (10+ platforms)
import type { Song, Source } from '@/lib/types';

const PROXY = 'http://localhost:4005';

function mapSong(item: any): Song {
  // Use go-music-dl's download endpoint directly for streaming
  const dlParams = `id=${encodeURIComponent(item.id)}&source=${item.source}&name=${encodeURIComponent(item.name||'')}&artist=${encodeURIComponent(item.artist||'')}`;
  const streamUrl = `/api/gomusic-proxy?${dlParams}`;

  return {
    id: `gm-${item.source}-${item.id}`,
    title: item.name || 'Unknown',
    artist: item.artist || 'Unknown',
    coverUrl: item.coverUrl || '',
    type: 'original',
    duration: item.duration || 0,
    sources: [{
      platform: 'other' as const,
      streamUrl,
      downloadUrl: streamUrl,
      quality: '320' as const,
    }],
    tags: [item.source],
    popularity: 75,
    sourceLabel: '完整',
  } as Song;
}

async function searchSource(query: string, source: string, limit: number): Promise<Song[]> {
  try {
    const searchUrl = `${PROXY}/search?q=${encodeURIComponent(query)}&sources=${source}`;
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(15000) });
    const data = await res.json();
    if (!data.songs) return [];
    return data.songs.slice(0, limit).map(mapSong);
  } catch {
    return [];
  }
}

export async function searchKuGou(query: string, limit: number = 10): Promise<Song[]> {
  return searchSource(query, 'kugou', limit);
}

export async function searchKuWo(query: string, limit: number = 10): Promise<Song[]> {
  return searchSource(query, 'kuwo', limit);
}

export async function getKuGouTrending(limit: number = 10): Promise<Song[]> {
  const queries = ['热门', '流行', '新歌', '经典', '抖音', '华语'];
  const q = queries[Math.floor(Math.random() * queries.length)];
  return searchKuGou(q, limit);
}

export async function getKuWoTrending(limit: number = 10): Promise<Song[]> {
  const queries = ['热门', '流行', '新歌', '经典', '抖音', '华语'];
  const q = queries[Math.floor(Math.random() * queries.length)];
  return searchKuWo(q, limit);
}

/** Combined search across all go-music-dl sources */
export async function searchAllGomusic(query: string, limit: number = 20): Promise<Song[]> {
  const results: Song[] = [];
  const promises = [
    searchKuGou(query, Math.ceil(limit / 2)).then(s => { results.push(...s); }).catch(() => {}),
    searchKuWo(query, Math.ceil(limit / 2)).then(s => { results.push(...s); }).catch(() => {}),
  ];

  await Promise.race([
    Promise.all(promises),
    new Promise(r => setTimeout(r, 15000)),
  ]);

  return results;
}
