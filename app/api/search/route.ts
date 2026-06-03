import { NextRequest, NextResponse } from 'next/server';
import { searchJioSaavn } from '@/lib/api/jiosaavn';
import type { Song } from '@/lib/types';

const cache = new Map<string, { data: Song[]; expires: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.toLowerCase() || '';
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);

  if (!q) {
    return NextResponse.json({ results: [], total: 0, page: 1 });
  }

  const cacheKey = `search:${q}:${page}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    return NextResponse.json(
      { results: cached.data.slice(start, start + pageSize), total: cached.data.length, page },
      { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=30' } }
    );
  }

  try {
    const results: Song[] = [];

    // JioSaavn — fast global API, no proxy needed
    const jioResults = await Promise.race([
      searchJioSaavn(q, 30),
      new Promise<Song[]>(r => setTimeout(() => r([]), 5000)),
    ]);
    results.push(...jioResults);

    const seen = new Set<string>();
    const unique = results.filter((s) => {
      const key = s.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Cache the full result set
    cache.set(cacheKey, { data: unique, expires: Date.now() + CACHE_TTL });

    const total = unique.length;
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    const paged = unique.slice(start, start + pageSize);

    return NextResponse.json(
      { results: paged, total, page },
      { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=30' } }
    );
  } catch {
    // Return stale cache if available
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
