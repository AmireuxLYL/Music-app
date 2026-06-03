// Unified search — prioritizes reliable APIs that work from EdgeOne
// iTunes (always works), JioSaavn (full songs when available)
import type { Song } from '@/lib/types';
import { searchJioSaavn } from './jiosaavn';

// ── iTunes Search (primary, always reliable) ──

interface ITunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl: string;
  trackTimeMillis: number;
  primaryGenreName: string;
  trackExplicitness: string;
  country: string;
}

function mapITunes(track: ITunesTrack): Song {
  const title = track.trackName;
  const lower = title.toLowerCase();

  let type: Song['type'] = 'original';
  if (/伴奏|instrumental|karaoke/i.test(lower)) type = 'instrumental';
  else if (/纯音乐|piano|orchestral|symphony/i.test(lower)) type = 'pure_music';
  else if (/翻唱|cover\b/i.test(lower)) type = 'cover';

  // Map iTunes genre to our tags
  const genre = track.primaryGenreName || '';
  const tags: string[] = [genre];

  // Detect language / region from genre
  if (/Mandopop|C-Pop|Chinese/i.test(genre)) tags.push('华语');
  if (/K-Pop|Korean/i.test(genre)) tags.push('韩语');
  if (/J-Pop|Anime|Japanese/i.test(genre)) tags.push('日语');
  if (/Hip-Hop|Rap/i.test(genre)) tags.push('说唱');
  if (/Rock|Metal/i.test(genre)) tags.push('摇滚');
  if (/Electronic|Dance|EDM|House/i.test(genre)) tags.push('电音');
  if (/R&B|Soul/i.test(genre)) tags.push('R&B');
  if (/Jazz|Bossa/i.test(genre)) tags.push('爵士');
  if (/Folk|Singer|Songwriter/i.test(genre)) tags.push('民谣');
  if (!tags.some(t => ['华语', '韩语', '日语', '说唱', '摇滚', '电音', 'R&B', '爵士', '民谣'].includes(t))) {
    tags.push('欧美');
  }

  return {
    id: `itunes-${track.trackId}`,
    title,
    artist: track.artistName,
    coverUrl: track.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
    type,
    duration: Math.round(track.trackTimeMillis / 1000),
    sources: track.previewUrl ? [{
      platform: 'other' as const,
      streamUrl: track.previewUrl,
      downloadUrl: track.previewUrl,
      quality: '320',
    }] : [],
    tags,
    popularity: 80,
    sourceLabel: '试听 30s',
  };
}

async function searchITunes(query: string, country: string = 'cn', limit: number = 20): Promise<Song[]> {
  try {
    const params = new URLSearchParams({
      term: query,
      media: 'music',
      entity: 'song',
      limit: String(limit),
      country,
      lang: country === 'cn' ? 'zh_cn' : 'en_us',
    });
    const url = `https://itunes.apple.com/search?${params}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(mapITunes);
  } catch {
    return [];
  }
}

// ── JioSaavn (full songs, try but don't rely on) ──

async function searchJioSaavnSafe(query: string, limit: number = 10): Promise<Song[]> {
  try {
    return await searchJioSaavn(query, limit);
  } catch {
    return [];
  }
}

// ── Unified API ──

const dedupKey = (s: Song) => `${s.title}:${s.artist}`.toLowerCase().trim();

/**
 * Search across all available platforms.
 * iTunes is the primary reliable source. Others are bonuses.
 */
export async function searchAll(query: string, limit: number = 30): Promise<Song[]> {
  const results: Map<string, Song> = new Map();

  const addResults = (songs: Song[]) => {
    for (const song of songs) {
      const key = dedupKey(song);
      if (!results.has(key)) results.set(key, song);
    }
  };

  // Search iTunes with BOTH CN and US stores for max coverage
  const [cn, us, jio] = await Promise.all([
    searchITunes(query, 'cn', 25).catch(() => [] as Song[]),
    searchITunes(query, 'us', 25).catch(() => [] as Song[]),
    searchJioSaavnSafe(query, 15),
  ]);

  addResults(cn);
  addResults(us);
  addResults(jio);

  return Array.from(results.values()).slice(0, limit);
}

// ── Genre-based trending (search results) ──

const GENRE_QUERIES: Record<string, string[]> = {
  '华语流行': ['周杰伦', '陈奕迅', '邓紫棋', '林俊杰', '张学友', '华语金曲', '刘德华', '王菲'],
  '欧美': ['Taylor Swift', 'The Weeknd', 'Dua Lipa', 'Ed Sheeran', 'Billie Eilish', 'pop hits'],
  '韩语': ['BTS', 'Blackpink', 'IU', 'NewJeans', 'Twice', 'k-pop', 'Stray Kids'],
  '日语': ['YOASOBI', '米津玄师', 'Official髭男dism', 'ado', 'Vaundy', 'j-pop'],
  '摇滚': ['Queen', 'Imagine Dragons', 'Linkin Park', 'Beyond', 'rock hits', 'Coldplay'],
  '民谣': ['民谣', '赵雷', '宋冬野', 'Bob Dylan', 'folk songs', '吉他'],
  '说唱': ['Eminem', 'Kendrick Lamar', 'Jay Chou rap', 'hip hop hits', 'Drake'],
  '电音': ['Marshmello', 'Alan Walker', 'The Chainsmokers', 'EDM hits', 'electronic'],
  '经典': ['邓丽君', '张国荣', 'Beatles', 'Michael Jackson', '经典老歌', '怀旧金曲'],
  'R&B': ['The Weeknd', 'SZA', 'Bruno Mars', '方大同', '陶喆', 'rnb hits'],
  '爵士': ['Norah Jones', 'Diana Krall', 'jazz classics', 'bossa nova', '爵士名曲'],
};

export async function getTrendingAll(filter: string = '', limit: number = 60): Promise<Song[]> {
  const queries = GENRE_QUERIES[filter];

  let searchQueries: string[];
  if (!queries) {
    // No filter — pick randomly from all genres
    searchQueries = Object.values(GENRE_QUERIES)
      .flat()
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
  } else {
    // Pick 3-4 queries from the selected genre
    searchQueries = queries.sort(() => Math.random() - 0.5).slice(0, 4);
  }

  // Search each query against iTunes (CN + US stores) in parallel batches
  const results: Map<string, Song> = new Map();

  const perQuery = Math.ceil(limit / searchQueries.length);

  const batches = await Promise.all(
    searchQueries.map(q =>
      Promise.all([
        searchITunes(q, 'cn', perQuery).catch(() => [] as Song[]),
        searchITunes(q, 'us', perQuery).catch(() => [] as Song[]),
        searchJioSaavnSafe(q, Math.ceil(perQuery / 2)).catch(() => [] as Song[]),
      ])
    )
  );

  for (const batch of batches) {
    for (const songs of batch) {
      for (const song of songs) {
        const key = dedupKey(song);
        if (!results.has(key)) results.set(key, song);
      }
    }
  }

  // Shuffle results for variety
  return Array.from(results.values())
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}
