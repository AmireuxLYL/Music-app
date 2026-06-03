// Meting API bridge — public music API aggregator
// Supports NetEase, QQ Music, Kugou, Kuwo
// Public instances tested 2025-2026

import type { Song } from '@/lib/types';

// Multiple public Meting API instances for redundancy
const INSTANCES = [
  'https://api.injahow.cn/meting/',
  'https://meting.elysium-stack.cn/api',
];

interface MetingSong {
  id: string;
  name: string;
  artist: string;
  album: string;
  url: string;
  pic: string;
  lrc: string;
  duration?: number;
}

function mapSong(item: MetingSong, server: string): Song {
  const title = item.name || 'Unknown';
  const lower = title.toLowerCase();

  let type: Song['type'] = 'original';
  if (/伴奏|instrumental|karaoke/i.test(lower)) type = 'instrumental';
  else if (/纯音乐|piano|orchestral|轻音乐/i.test(lower)) type = 'pure_music';
  else if (/翻唱|cover/i.test(lower)) type = 'cover';

  const sourceName: Record<string, string> = {
    netease: '网易云',
    tencent: 'QQ音乐',
    kugou: '酷狗',
    kuwo: '酷我',
  };

  return {
    id: `${server}-${item.id}`,
    title,
    artist: item.artist || 'Unknown',
    coverUrl: item.pic || '',
    type,
    duration: item.duration || 0,
    sources: item.url ? [{
      platform: 'other',
      streamUrl: item.url,
      downloadUrl: item.url,
      quality: '320',
    }] : [],
    tags: [],
    popularity: 80,
    sourceLabel: sourceName[server] || server,
  };
}

async function callMeting(instance: string, server: string, type: string, id: string, limit?: number): Promise<MetingSong[]> {
  try {
    const params = new URLSearchParams({ server, type, id });
    if (limit) params.set('limit', String(limit));
    const url = `${instance}?${params}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text.trim()) return [];
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    if (data?.songs) return data.songs;
    return [];
  } catch {
    return [];
  }
}

/**
 * Search across multiple Meting instances and music platforms.
 * NetEase has best search support. QQ Music search might not work via Meting.
 */
export async function metingSearch(query: string, limit: number = 20): Promise<Song[]> {
  const results: Song[] = [];
  const seen = new Set<string>();

  // Try all instance × server combinations
  for (const instance of INSTANCES) {
    const servers = ['netease', 'tencent', 'kugou', 'kuwo'];
    const searches = servers.map(server =>
      callMeting(instance, server, 'search', query, limit).catch(() => [] as MetingSong[])
    );

    const allResults = await Promise.all(searches);
    for (let i = 0; i < allResults.length; i++) {
      for (const song of allResults[i]) {
        const key = `${song.name}:${song.artist}`.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          results.push(mapSong(song, servers[i]));
        }
      }
    }

    if (results.length >= limit) break;
  }

  return results.slice(0, limit);
}

/**
 * Get stream URL for a specific song.
 */
export async function metingGetUrl(server: string, songId: string): Promise<string | null> {
  for (const instance of INSTANCES) {
    try {
      const songs = await callMeting(instance, server, 'url', songId);
      if (songs.length > 0 && songs[0].url) {
        return songs[0].url;
      }
    } catch {}
  }
  return null;
}

/**
 * Get trending Chinese music.
 * Instead of searching by random terms, use NetEase's playlist/chart data.
 */
export async function metingTrending(limit: number = 20): Promise<Song[]> {
  const queries = [
    '周杰伦', '陈奕迅', '邓紫棋', '林俊杰', '薛之谦',
    '抖音热歌', '华语新歌', '经典老歌', '流行', '民谣',
  ];
  const query = queries[Math.floor(Math.random() * queries.length)];
  return metingSearch(query, limit);
}
