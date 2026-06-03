import { NextRequest, NextResponse } from 'next/server';
import { getTrendingAll } from '@/lib/api/search-all';
import type { Song } from '@/lib/types';

// Cache by genre key
const cache = new Map<string, { data: Song[]; expires: number }>();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export async function GET(request: NextRequest) {
  const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');
  const filter = request.nextUrl.searchParams.get('filter') || '';
  const cacheKey = `trending:${filter}:${Math.floor(offset / 15)}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    const sliced = cached.data.slice(offset, offset + 15);
    return NextResponse.json({
      songs: sliced,
      nextOffset: offset + sliced.length,
      hasMore: offset + sliced.length < Math.min(cached.data.length, 120),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=60',
      },
    });
  }

  try {
    // Get 60 songs across multiple platforms using genre-specific queries
    const songs = await getTrendingAll(filter, 60);

    if (songs.length > 0) {
      // Store full result set in cache
      cache.set(cacheKey, { data: songs, expires: Date.now() + CACHE_TTL });

      const sliced = songs.slice(offset, offset + 15);
      return NextResponse.json({
        songs: sliced,
        nextOffset: offset + sliced.length,
        hasMore: offset + sliced.length < Math.min(songs.length, 120),
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=60',
        },
      });
    }
    return NextResponse.json({ songs: [], nextOffset: offset, hasMore: false });
  } catch {
    // Return stale cache if available
    if (cached) {
      const sliced = cached.data.slice(offset, offset + 15);
      return NextResponse.json({
        songs: sliced,
        nextOffset: offset + sliced.length,
        hasMore: offset + sliced.length < Math.min(cached.data.length, 120),
      });
    }
    return NextResponse.json({ songs: [], nextOffset: offset, hasMore: false });
  }
}
