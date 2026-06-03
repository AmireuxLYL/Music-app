// Unified search engine — local proxy > Meting > iTunes
// Local proxy gives full songs from NetEase+QQ+KuGou on localhost
import type { Song } from '@/lib/types';
import { localProxySearch, localProxyTrending } from './local-proxy';
import { metingSearch } from './meting';

const dedupKey = (s: Song) => `${s.title}:${s.artist}`.toLowerCase().trim();

// ── iTunes (reliable global backup) ──

interface ITunesTrack {
  trackId: number; trackName: string; artistName: string;
  artworkUrl100: string; previewUrl: string; trackTimeMillis: number;
  primaryGenreName: string;
}

function mapITunes(t: ITunesTrack): Song {
  const title = t.trackName, lower = title.toLowerCase();
  let type: Song['type'] = 'original';
  if (/伴奏|instrumental|karaoke/i.test(lower)) type = 'instrumental';
  else if (/纯音乐|piano|orchestral|symphony/i.test(lower)) type = 'pure_music';
  else if (/翻唱|cover\b/i.test(lower)) type = 'cover';

  const genre = t.primaryGenreName || '';
  const tags = [genre];
  if (/Mandopop|C-Pop|Chinese/i.test(genre)) tags.push('华语流行');
  if (/K-Pop|Korean/i.test(genre)) tags.push('韩语');
  if (/J-Pop|Anime|Japanese/i.test(genre)) tags.push('日语');
  if (/Hip-Hop|Rap/i.test(genre)) tags.push('说唱');
  if (/Rock|Metal/i.test(genre)) tags.push('摇滚');
  if (/Electronic|Dance|EDM/i.test(genre)) tags.push('电音');
  if (/R&B|Soul/i.test(genre)) tags.push('R&B');
  if (/Jazz/i.test(genre)) tags.push('爵士');
  if (!tags.some(t => ['华语流行','韩语','日语','说唱','摇滚','电音','R&B','爵士'].includes(t))) tags.push('欧美');

  return {
    id: `itunes-${t.trackId}`, title, artist: t.artistName,
    coverUrl: t.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
    type, duration: Math.round(t.trackTimeMillis / 1000),
    sources: t.previewUrl ? [{ platform: 'other', streamUrl: t.previewUrl, downloadUrl: t.previewUrl, quality: '320' }] : [],
    tags, popularity: 80, sourceLabel: '试听 30s',
  };
}

async function searchITunes(query: string, country = 'cn', limit = 20): Promise<Song[]> {
  try {
    const params = new URLSearchParams({ term: query, media: 'music', entity: 'song', limit: String(limit), country, lang: country === 'cn' ? 'zh_cn' : 'en_us' });
    const url = `https://itunes.apple.com/search?${params}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    return ((await res.json()).results || []).map(mapITunes);
  } catch { return []; }
}

// ── Helpers ──

function addAll(map: Map<string, Song>, songs: Song[]) {
  for (const s of songs) { const k = dedupKey(s); if (!map.has(k)) map.set(k, s); }
}

// ── Search: local proxy → Meting → iTunes ──

export async function searchAll(query: string, limit = 30): Promise<Song[]> {
  const results: Map<string, Song> = new Map();

  // Tier 1: Local proxy (full songs from NetEase + QQ + KuGou)
  const local = await localProxySearch(query, 25).catch(() => [] as Song[]);
  addAll(results, local);

  // Tier 2: Meting API (backup for any sources not covered by local proxy)
  if (results.size < limit) {
    const meting = await metingSearch(query, 20).catch(() => [] as Song[]);
    addAll(results, meting);
  }

  // Tier 3: iTunes (global safety net, 30s previews)
  if (results.size < limit) {
    const [cn, us] = await Promise.all([
      searchITunes(query, 'cn', 15).catch(() => [] as Song[]),
      searchITunes(query, 'us', 15).catch(() => [] as Song[]),
    ]);
    addAll(results, cn);
    addAll(results, us);
  }

  return Array.from(results.values()).slice(0, limit);
}

// ── Trending: local proxy genre search ──

export async function getTrendingAll(filter = '', limit = 60): Promise<Song[]> {
  const results: Map<string, Song> = new Map();

  // Primary: local proxy with genre-specific queries
  const local = await localProxyTrending(filter, limit).catch(() => [] as Song[]);
  addAll(results, local);

  // Fallback: Meting + iTunes
  if (results.size < limit / 2) {
    const meting = await metingSearch(
      filter ? ['华语流行','欧美','韩语','日语','摇滚','民谣','说唱','电音','经典','R&B','爵士']
        .filter(g => g === filter)[0] || '热门' : '热门', limit
    ).catch(() => [] as Song[]);
    addAll(results, meting);

    const itunes = await searchITunes(filter || 'top hits', 'cn', limit).catch(() => [] as Song[]);
    addAll(results, itunes);
  }

  return Array.from(results.values()).sort(() => Math.random() - 0.5).slice(0, limit);
}
