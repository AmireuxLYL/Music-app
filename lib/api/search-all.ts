// Unified multi-platform search engine
// Meting API (NetEase/QQ/Kugou/Kuwo full songs) + iTunes (global 30s preview)
import type { Song } from '@/lib/types';
import { metingSearch } from './meting';
import { searchJioSaavn } from './jiosaavn';

// ── iTunes Search (reliable, always works) ──

interface ITunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  previewUrl: string;
  trackTimeMillis: number;
  primaryGenreName: string;
}

function mapITunes(track: ITunesTrack): Song {
  const title = track.trackName;
  const lower = title.toLowerCase();
  let type: Song['type'] = 'original';
  if (/伴奏|instrumental|karaoke/i.test(lower)) type = 'instrumental';
  else if (/纯音乐|piano|orchestral|symphony/i.test(lower)) type = 'pure_music';
  else if (/翻唱|cover\b/i.test(lower)) type = 'cover';

  const genre = track.primaryGenreName || '';
  const tags: string[] = [genre];
  if (/Mandopop|C-Pop|Chinese/i.test(genre)) tags.push('华语流行');
  if (/K-Pop|Korean/i.test(genre)) tags.push('韩语');
  if (/J-Pop|Anime|Japanese/i.test(genre)) tags.push('日语');
  if (/Hip-Hop|Rap/i.test(genre)) tags.push('说唱');
  if (/Rock|Metal/i.test(genre)) tags.push('摇滚');
  if (/Electronic|Dance|EDM|House/i.test(genre)) tags.push('电音');
  if (/R&B|Soul/i.test(genre)) tags.push('R&B');
  if (/Jazz|Bossa/i.test(genre)) tags.push('爵士');
  if (/Folk|Singer|Songwriter/i.test(genre)) tags.push('民谣');
  if (!tags.some(t => ['华语流行', '韩语', '日语', '说唱', '摇滚', '电音', 'R&B', '爵士', '民谣'].includes(t))) {
    tags.push('欧美');
  }

  return {
    id: `itunes-${track.trackId}`,
    title,
    artist: track.artistName,
    coverUrl: track.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
    type,
    duration: Math.round(track.trackTimeMillis / 1000),
    sources: track.previewUrl ? [{ platform: 'other', streamUrl: track.previewUrl, downloadUrl: track.previewUrl, quality: '320' }] : [],
    tags,
    popularity: 80,
    sourceLabel: '试听 30s',
  };
}

async function searchITunes(query: string, country = 'cn', limit = 20): Promise<Song[]> {
  try {
    const params = new URLSearchParams({ term: query, media: 'music', entity: 'song', limit: String(limit), country, lang: country === 'cn' ? 'zh_cn' : 'en_us' });
    const res = await fetch(`https://itunes.apple.com/search?${params}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(mapITunes);
  } catch { return []; }
}

// ── Helpers ──

const dedupKey = (s: Song) => `${s.title}:${s.artist}`.toLowerCase().trim();
const addAll = (map: Map<string, Song>, songs: Song[]) => {
  for (const s of songs) { const k = dedupKey(s); if (!map.has(k)) map.set(k, s); }
};

// ── Main search: Meting (Chinese full songs) + iTunes (global) ──

export async function searchAll(query: string, limit = 30): Promise<Song[]> {
  const results: Map<string, Song> = new Map();

  const [meting, cn, us, jio] = await Promise.all([
    metingSearch(query, 25).catch(() => [] as Song[]),
    searchITunes(query, 'cn', 20).catch(() => [] as Song[]),
    searchITunes(query, 'us', 15).catch(() => [] as Song[]),
    searchJioSaavn(query, 15).catch(() => [] as Song[]),
  ]);

  // Meting returns full songs — show them first
  addAll(results, meting);
  addAll(results, cn);
  addAll(results, us);
  addAll(results, jio);

  return Array.from(results.values()).slice(0, limit);
}

// ── Trending: genre-based multi-platform search ──

const GENRE_QUERIES: Record<string, string[]> = {
  '华语流行': ['周杰伦', '陈奕迅', '邓紫棋', '林俊杰', '张学友', '薛之谦'],
  '欧美': ['Taylor Swift', 'The Weeknd', 'Dua Lipa', 'Billie Eilish', 'Ed Sheeran'],
  '韩语': ['BTS', 'Blackpink', 'IU', 'NewJeans', 'k-pop'],
  '日语': ['YOASOBI', '米津玄师', 'Official髭男dism', 'ado', 'j-pop'],
  '摇滚': ['Queen', 'Imagine Dragons', 'Linkin Park', 'Beyond', 'Coldplay'],
  '民谣': ['赵雷', '宋冬野', 'folk songs', '民谣', '房东的猫'],
  '说唱': ['Eminem', 'Kendrick Lamar', 'hip hop', 'Drake', '说唱'],
  '电音': ['Marshmello', 'Alan Walker', 'EDM', 'electronic', 'The Chainsmokers'],
  '经典': ['邓丽君', '张国荣', 'Beatles', 'Michael Jackson', '经典老歌'],
  'R&B': ['The Weeknd', 'SZA', 'Bruno Mars', '陶喆', '方大同'],
  '爵士': ['Norah Jones', 'jazz classics', 'bossa nova', 'Diana Krall'],
};

export async function getTrendingAll(filter = '', limit = 60): Promise<Song[]> {
  const queries = GENRE_QUERIES[filter];
  const searchTerms = queries
    ? queries.sort(() => Math.random() - 0.5).slice(0, 3)
    : Object.values(GENRE_QUERIES).flat().sort(() => Math.random() - 0.5).slice(0, 5);

  const results: Map<string, Song> = new Map();
  const perTerm = Math.ceil(limit / searchTerms.length);

  for (const term of searchTerms) {
    const [meting, cn, us] = await Promise.all([
      metingSearch(term, perTerm).catch(() => [] as Song[]),
      searchITunes(term, 'cn', perTerm).catch(() => [] as Song[]),
      searchITunes(term, 'us', perTerm).catch(() => [] as Song[]),
    ]);
    addAll(results, meting);
    addAll(results, cn);
    addAll(results, us);
  }

  return Array.from(results.values()).sort(() => Math.random() - 0.5).slice(0, limit);
}
