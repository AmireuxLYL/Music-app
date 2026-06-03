// Unified multi-platform search — searches all platforms in parallel
import type { Song } from '@/lib/types';
import { searchITunes } from './itunes';
import { searchJioSaavn } from './jiosaavn';
import { searchNetease } from './netease';
import { searchQQ } from './qqmusic';

export interface SearchAllResult {
  songs: Song[];
  source: string;
}

/**
 * Search across ALL platforms in parallel, return results as they arrive.
 * Order: iTunes (fastest, reliable), NetEase + QQ (China), JioSaavn (backup)
 */
export async function searchAll(query: string, limit: number = 30): Promise<Song[]> {
  const results: Map<string, Song> = new Map();

  const dedupKey = (s: Song) => `${s.title}:${s.artist}`.toLowerCase().trim();

  const addResults = (songs: Song[]) => {
    for (const song of songs) {
      const key = dedupKey(song);
      if (!results.has(key)) {
        results.set(key, song);
      }
    }
  };

  // Fire all searches in parallel
  const searches = [
    searchITunes(query, undefined, limit).catch(() => [] as Song[]),
    searchQQ(query, limit).catch(() => [] as Song[]),
    searchNetease(query, limit).catch(() => [] as Song[]),
    searchJioSaavn(query, limit).catch(() => [] as Song[]),
  ];

  const allResults = await Promise.all(searches);
  for (const r of allResults) addResults(r);

  return Array.from(results.values());
}

/**
 * Get trending songs by searching across all platforms with genre-specific queries.
 * Returns randomly shuffled results from multiple platforms.
 */
export async function getTrendingAll(
  genreKey: string = '',
  limit: number = 15
): Promise<Song[]> {
  // Map genre keys to multi-platform search queries
  const genreQueries: Record<string, string[]> = {
    '华语流行': ['周杰伦 经典', '陈奕迅 热门', '邓紫棋', '华语流行 新歌', '林俊杰'],
    '欧美': ['Taylor Swift', 'The Weeknd hits', 'Dua Lipa', 'Billie Eilish', '欧美流行'],
    '韩语': ['BTS k-pop', 'Blackpink hits', 'k-pop 2024', 'IU songs', 'NewJeans'],
    '日语': ['YOASOBI', '米津玄师', 'j-pop hits', 'Official髭男dism', 'ado'],
    '摇滚': ['rock classics', 'Imagine Dragons', 'beyond 摇滚', 'Queen hits'],
    '民谣': ['民谣 经典', '赵雷', 'folk songs', '宋冬野', '房东的猫'],
    '说唱': ['rap hits', 'Eminem', '说唱', 'hip hop classics', '中国新说唱'],
    '电音': ['EDM hits', 'Alan Walker', 'Marshmello', '电子音乐', '电音'],
    '经典': ['经典老歌', '邓丽君', '怀旧金曲', '张国荣', 'classic hits'],
    'R&B': ['R&B hits', 'SZA', 'rnb classics', '陶喆', '方大同'],
    '爵士': ['jazz classics', 'Norah Jones', '爵士经典', 'bossa nova', 'jazz lounge'],
  };

  const queries = genreQueries[genreKey];
  if (!queries) {
    // No filter — pick random queries from different genres
    const allQueries = Object.values(genreQueries).flat();
    const randomQueries = allQueries.sort(() => Math.random() - 0.5).slice(0, 4);
    return searchAllWithQueries(randomQueries, limit);
  }

  // Pick 3 random queries from the genre
  const selected = queries.sort(() => Math.random() - 0.5).slice(0, 3);
  return searchAllWithQueries(selected, limit);
}

async function searchAllWithQueries(queries: string[], totalLimit: number): Promise<Song[]> {
  const results: Map<string, Song> = new Map();
  const dedupKey = (s: Song) => `${s.title}:${s.artist}`.toLowerCase().trim();

  const perQuery = Math.ceil(totalLimit / queries.length);

  // Search all queries in parallel, each across multiple platforms
  const searchPromises = queries.map(query =>
    Promise.allSettled([
      searchITunes(query, undefined, perQuery),
      searchQQ(query, perQuery),
      searchNetease(query, perQuery),
      searchJioSaavn(query, perQuery),
    ])
  );

  const allSettled = await Promise.all(searchPromises);

  for (const settled of allSettled) {
    for (const r of settled) {
      if (r.status === 'fulfilled') {
        for (const song of r.value) {
          const key = dedupKey(song);
          if (!results.has(key)) {
            results.set(key, song);
          }
        }
      }
    }
  }

  // Shuffle
  return Array.from(results.values()).sort(() => Math.random() - 0.5).slice(0, totalLimit);
}
