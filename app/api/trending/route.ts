import { NextRequest, NextResponse } from 'next/server';
import { getJioSaavnTrending } from '@/lib/api/jiosaavn';
import type { Song } from '@/lib/types';

// Fast trending — JioSaavn only (no local proxies needed, works globally)
export async function GET(request: NextRequest) {
  const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

  try {
    const count = Math.min(15, offset === 0 ? 15 : 10);
    const songs = await getJioSaavnTrending(count);

    if (songs.length > 0) {
      const seen = new Set<string>();
      const unique = songs.filter(s => {
        if (s.type !== 'original') return false;
        if (/伴奏|纯音乐|翻唱|instrumental|cover|karaoke/i.test(s.title)) return false;
        const key = s.title.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return NextResponse.json({
        songs: unique,
        nextOffset: offset + unique.length,
        hasMore: offset + unique.length < 120,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      });
    }
    return NextResponse.json({ songs: [], nextOffset: offset, hasMore: false });
  } catch {
    return NextResponse.json({ songs: [], nextOffset: offset, hasMore: false });
  }
}
