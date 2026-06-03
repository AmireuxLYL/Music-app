// Meting API bridge — public music API aggregator
// Supports NetEase, QQ Music, Kugou, Kuwo (search → get metadata → get URLs)
import type { Song } from '@/lib/types';

const INSTANCES = [
  'https://api.injahow.cn/meting/',
  'https://meting.elysium-stack.cn/api',
];

interface MetingItem {
  id: string;
  name: string;
  artist: string;
  album?: string;
  url?: string;
  url_128?: string;
  url_320?: string;
  pic?: string;
  pic_url?: string;
  cover?: string;
  duration?: number;
  lrc?: string;
}

async function fetchMeting(instance: string, server: string, type: string, id: string, limit?: number): Promise<MetingItem[]> {
  try {
    const params = new URLSearchParams({ server, type, id });
    if (limit) params.set('limit', String(limit));
    const url = `${instance}?${params}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text.trim() || text === '[]') return [];
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    if (data?.songs) return data.songs;
    if (data?.data) return Array.isArray(data.data) ? data.data : [];
    return [];
  } catch {
    return [];
  }
}

/**
 * Get streaming URL for a single song.
 * Tries both instances and multiple quality levels.
 */
async function fetchSongUrl(server: string, songId: string): Promise<string> {
  for (const instance of INSTANCES) {
    try {
      const items = await fetchMeting(instance, server, 'url', songId);
      for (const item of items) {
        // Try highest quality first
        const url = item.url_320 || item.url_128 || item.url;
        if (url) return url;
      }
    } catch {}
  }
  return '';
}

function parseSong(item: MetingItem, server: string, streamUrl: string): Song {
  const title = item.name || 'Unknown';
  const lower = title.toLowerCase();

  let type: Song['type'] = 'original';
  if (/伴奏|instrumental|karaoke/i.test(lower)) type = 'instrumental';
  else if (/纯音乐|piano|orchestral|轻音乐/i.test(lower)) type = 'pure_music';
  else if (/翻唱|cover/i.test(lower)) type = 'cover';

  const coverUrl = item.pic || item.pic_url || item.cover || '';

  const sourceName: Record<string, string> = {
    netease: '网易云',
    tencent: 'QQ音乐',
    kugou: '酷狗',
    kuwo: '酷我',
    baidu: '百度',
    xiami: '虾米',
  };

  // Detect genre from song content
  const tags: string[] = [];
  if (/[一-鿿]/.test(title)) tags.push('华语流行');
  if (/[가-힯]/.test(title)) tags.push('韩语');
  if (/[぀-ゟ゠-ヿ]/.test(title)) tags.push('日语');
  if (!tags.length) tags.push('欧美');

  return {
    id: `${server}-${item.id}`,
    title,
    artist: item.artist || 'Unknown',
    coverUrl,
    type,
    duration: item.duration || 0,
    sources: streamUrl ? [{
      platform: 'other',
      streamUrl,
      downloadUrl: streamUrl,
      quality: '320',
    }] : [],
    tags,
    popularity: 80,
    sourceLabel: sourceName[server] || server,
  };
}

/**
 * Search across multiple Meting instances and music platforms.
 * Fetches song metadata first, then gets stream URLs for top results.
 */
export async function metingSearch(query: string, limit: number = 20): Promise<Song[]> {
  const seen = new Set<string>();
  const candidates: { item: MetingItem; server: string }[] = [];

  // Step 1: Search all servers via first available instance
  const instance = INSTANCES[0];
  const servers = ['netease', 'tencent', 'kugou', 'kuwo'];

  for (const server of servers) {
    if (candidates.length >= limit * 2) break;
    try {
      const items = await fetchMeting(instance, server, 'search', query, limit);
      for (const item of items) {
        const key = `${item.name}:${item.artist}`.toLowerCase().trim();
        if (key.length > 3 && !seen.has(key)) {
          seen.add(key);
          candidates.push({ item, server });
        }
      }
    } catch {}
  }

  if (!candidates.length) return [];

  // Step 2: Get stream URLs for top candidates (limited to avoid hammering API)
  const urlTargets = candidates.slice(0, Math.min(12, candidates.length));

  const urlResults = await Promise.all(
    urlTargets.map(async ({ item, server }) => {
      const streamUrl = await fetchSongUrl(server, item.id);
      return { item, server, streamUrl };
    })
  );

  // Step 3: Build songs — prioritized ones with URLs first
  const withUrl: Song[] = [];
  const withoutUrl: Song[] = [];

  for (const { item, server, streamUrl } of urlResults) {
    const song = parseSong(item, server, streamUrl);
    if (streamUrl) {
      withUrl.push(song);
    } else {
      withoutUrl.push(song);
    }
  }

  // Also include remaining candidates without URLs (they at least have metadata)
  const remaining = candidates.slice(urlTargets.length).map(({ item, server }) =>
    parseSong(item, server, '')
  );

  return [...withUrl, ...withoutUrl, ...remaining].slice(0, limit);
}
