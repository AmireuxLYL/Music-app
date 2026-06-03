// Local music proxy client — primary source when running locally
// Proxy server: node server/music-proxy.js (port 4000)
import type { Song } from '@/lib/types';

const PROXY = 'http://localhost:4000';

interface ProxySong {
  id: string;
  name: string;
  artist: string;
  album: { name: string; picUrl?: string };
  duration: number;
  source: string;
}

function mapSong(item: ProxySong, streamUrl: string): Song {
  const title = item.name || 'Unknown';
  const lower = title.toLowerCase();
  let type: Song['type'] = 'original';
  if (/伴奏|instrumental|karaoke/i.test(lower)) type = 'instrumental';
  else if (/纯音乐|piano|orchestral|轻音乐/i.test(lower)) type = 'pure_music';
  else if (/翻唱|cover/i.test(lower)) type = 'cover';

  const sourceName: Record<string, string> = {
    netease: '网易云', tencent: 'QQ音乐', qq: 'QQ音乐', kugou: '酷狗', kuwo: '酷我',
  };

  return {
    id: `${item.source}-${item.id}`,
    title,
    artist: item.artist || 'Unknown',
    coverUrl: (item.album?.picUrl || '').replace('http://', 'https://'),
    type,
    duration: Math.floor(item.duration / 1000) || 0,
    sources: streamUrl ? [{ platform: 'other', streamUrl, downloadUrl: streamUrl, quality: '320' }] : [],
    tags: [],
    popularity: 85,
    sourceLabel: sourceName[item.source] || item.source,
  };
}

async function fetchJSON(url: string): Promise<any> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

/**
 * Search across NetEase + QQ + KuGou via local proxy.
 * Returns songs WITH stream URLs ready to play.
 */
export async function localProxySearch(query: string, limit = 20): Promise<Song[]> {
  const data = await fetchJSON(
    `${PROXY}/search?q=${encodeURIComponent(query)}&limit=${limit}&sources=netease,qq,kugou`
  );
  if (!data?.songs?.length) return [];

  const songs: ProxySong[] = data.songs;
  const results: Song[] = [];

  // Get stream URLs for top 10 songs
  const urlTargets = songs.slice(0, 10);
  const urlPromises = urlTargets.map(s =>
    fetchJSON(`${PROXY}/url?id=${encodeURIComponent(s.id)}&source=${s.source}`)
  );
  const urlResults = await Promise.all(urlPromises);

  const urlMap = new Map<string, string>();
  urlResults.forEach((r, i) => {
    if (r?.url) urlMap.set(urlTargets[i].id, r.url);
  });

  const seen = new Set<string>();
  for (const s of songs) {
    const key = `${s.name}:${s.artist}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(mapSong(s, urlMap.get(s.id) || ''));
  }

  return results.slice(0, limit);
}

/**
 * Get trending by searching popular terms via local proxy.
 */
export async function localProxyTrending(filter = '', limit = 20): Promise<Song[]> {
  const queries: Record<string, string[]> = {
    '华语流行': ['周杰伦', '陈奕迅', '林俊杰', '薛之谦'],
    '欧美': ['Taylor Swift', 'Ed Sheeran', 'The Weeknd'],
    '韩语': ['BTS', 'Blackpink', 'IU'],
    '日语': ['米津玄师', 'YOASOBI', 'ado'],
    '摇滚': ['Beyond', 'Queen', 'Imagine Dragons'],
    '民谣': ['赵雷', 'folk', '民谣'],
    '说唱': ['Eminem', 'Drake', '说唱'],
    '电音': ['Alan Walker', 'Marshmello', 'EDM'],
    '经典': ['邓丽君', 'classic hits', '经典老歌'],
    'R&B': ['Bruno Mars', 'SZA', 'rnb'],
    '爵士': ['jazz', 'Norah Jones', '爵士'],
  };

  const pool = queries[filter] || Object.values(queries).flat();
  const q = pool[Math.floor(Math.random() * pool.length)];
  return localProxySearch(q, limit);
}
