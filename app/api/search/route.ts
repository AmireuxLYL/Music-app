import { NextRequest, NextResponse } from 'next/server';
import { searchAll } from '@/lib/api/search-all';
import type { Song } from '@/lib/types';

const cache = new Map<string, { data: Song[]; expires: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.toLowerCase().trim() || '';
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);

  if (!q || q.length < 1) {
    return NextResponse.json({ results: [], total: 0, page: 1 });
  }

  const cacheKey = `search:${q}:${page}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    return NextResponse.json(
      { results: cached.data.slice(start, start + pageSize), total: cached.data.length, page },
      { headers: { 'Cache-Control': 'public, s-maxage=120' } }
    );
  }

  try {
    const songs = await searchAll(q, 40);

    // Filter by type if requested
    const type = request.nextUrl.searchParams.get('type') || '';
    const filtered = type
      ? songs.filter(s => s.type === type)
      : songs;

    // Cache the full result set
    cache.set(cacheKey, { data: filtered, expires: Date.now() + CACHE_TTL });

    const pageSize = 10;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return NextResponse.json(
      { results: paged, total: filtered.length, page },
      { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=30' } }
    );
  } catch {
    if (cached) {
      const pageSize = 10;
      const start = (page - 1) * pageSize;
      return NextResponse.json(
        { results: cached.data.slice(start, start + pageSize), total: cached.data.length, page },
        { headers: { 'Cache-Control': 'public, s-maxage=60' } }
      );
    }
    return NextResponse.json({ results: [], total: 0, page: 1 });
  }
}
