import { NextRequest, NextResponse } from 'next/server';
import { searchNetease } from '@/lib/api/ncm';
import type { Song } from '@/lib/types';

export async function GET(request: NextRequest) {
  const artists = request.nextUrl.searchParams.get('artists') || '';
  const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

  const results: Song[] = [];

  // Search based on user's favorite artists
  if (artists) {
    const artistList = artists.split(',').filter(Boolean);
    const selected = artistList.sort(() => Math.random() - 0.5).slice(0, 3);

    const promises = selected.map(artist =>
      searchNetease(artist + ' 歌曲', 20).then(s => { results.push(...s); }).catch(() => {})
    );

    await Promise.race([
      Promise.all(promises),
      new Promise(r => setTimeout(r, 8000)),
    ]);
  }

  // If no favorites or no results, search trending keywords
  if (results.length < 5) {
    const fallback = ['热门新歌', '流行歌曲', '华语金曲', '抖音热歌'];
    const q = fallback[Math.floor(Math.random() * fallback.length)];
    const extra = await searchNetease(q, 20).catch(() => []);
    results.push(...extra);
  }

  if (results.length > 0) {
    const seen = new Set<string>();
    const unique = results.filter(s => {
      if (s.type !== 'original') return false;
      if (/伴奏|纯音乐|翻唱|instrumental|cover|karaoke/i.test(s.title)) return false;
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });

    return NextResponse.json({
      songs: unique.sort(() => Math.random() - 0.5),
      nextOffset: offset + unique.length,
      hasMore: true,
    });
  }

  return NextResponse.json({ songs: [], hasMore: false });
}
