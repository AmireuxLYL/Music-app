import { NextRequest, NextResponse } from 'next/server';
import { searchNetease } from '@/lib/api/ncm';
import { getJioSaavnTrending } from '@/lib/api/jiosaavn';
import { getJamendoTrending } from '@/lib/api/jamendo';
import type { Song } from '@/lib/types';

const GENRE_QUERIES: Record<string, string[]> = {
  '华语流行': ['周杰伦', '林俊杰', '陈奕迅', '邓紫棋', '薛之谦', '华语流行'],
  '欧美': ['Taylor Swift', 'Ed Sheeran', 'The Weeknd', 'Billie Eilish', 'Dua Lipa', 'pop hits'],
  '韩语': ['BTS', 'Blackpink', 'IU', 'kpop', 'K-pop'],
  '日语': ['YOASOBI', '米津玄師', 'jpop', '日本流行'],
  '摇滚': ['摇滚', 'beyond', '五月天', 'Linkin Park', 'Coldplay', 'rock'],
  '民谣': ['民谣', '赵雷', '宋冬野', 'folk', '吉他'],
  '说唱': ['说唱', 'rap', 'hip hop', '中国新说唱'],
  '电音': ['电子', 'EDM', 'Avicii', 'Alan Walker', 'electric'],
  '经典': ['经典老歌', '张学友', '张国荣', '邓丽君', '怀旧'],
  'R&B': ['R&B', '陶喆', '方大同', 'rnb'],
  '爵士': ['jazz', '爵士', 'Norah Jones'],
};

// Global offset tracker per filter for pagination
const filterOffsets = new Map<string, number>();

export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get('filter') || '';
  const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');
  const isLoadMore = offset > 0;

  const results: Song[] = [];
  const cacheKey = filter || '__random__';

  // Pick queries based on filter
  let queries: string[];
  if (filter && GENRE_QUERIES[filter]) {
    const all = GENRE_QUERIES[filter];
    // Rotate through keywords for variety on each page
    const startIdx = offset % all.length;
    queries = [...all.slice(startIdx), ...all.slice(0, startIdx)].slice(0, 3);
  } else {
    const keys = Object.keys(GENRE_QUERIES).sort(() => Math.random() - 0.5).slice(0, 3);
    queries = keys.flatMap(k => GENRE_QUERIES[k]).sort(() => Math.random() - 0.5);
    // Add offset variety
    const startIdx = offset % queries.length;
    queries = [...queries.slice(startIdx), ...queries.slice(0, startIdx)].slice(0, 3);
  }

  const promises = [
    ...queries.map(q => searchNetease(q, isLoadMore ? 20 : 15).then(s => { results.push(...s); }).catch(() => {})),
    offset === 0 ? getJioSaavnTrending(3).then(s => { results.push(...s); }).catch(() => {}) : Promise.resolve(),
    offset === 0 ? getJamendoTrending(2).then(s => { results.push(...s); }).catch(() => {}) : Promise.resolve(),
  ];

  await Promise.race([
    Promise.all(promises),
    new Promise(r => setTimeout(r, 8000)),
  ]);

  if (results.length > 0) {
    const seen = new Set<string>();
    const unique = results.filter(s => {
      if (s.type !== 'original') return false;
      if (/伴奏|纯音乐|翻唱|instrumental|cover|karaoke/i.test(s.title)) return false;
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });

    const nextOffset = offset + unique.length;
    return NextResponse.json({
      songs: unique.sort(() => Math.random() - 0.5),
      nextOffset,
      hasMore: nextOffset < 300, // effectively infinite
    });
  }
  return NextResponse.json({ songs: [], nextOffset: offset, hasMore: false });
}
