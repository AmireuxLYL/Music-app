import { NextRequest, NextResponse } from 'next/server';
import { getRecommendPage } from '@/lib/data/songs';
import { getITunesTrending } from '@/lib/api/itunes';
import { getArchiveTrending } from '@/lib/api/archive';
import type { RecommendResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get('cursor');

  // Parallel fetch from free sources for variety
  const [itunesSongs, archiveSongs] = await Promise.all([
    getITunesTrending(20).catch(() => []),
    getArchiveTrending(20).catch(() => []),
  ]);

  let all = [...itunesSongs, ...archiveSongs].sort(() => Math.random() - 0.5);

  if (all.length > 0) {
    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const pageSize = 10;
    const page = all.slice(startIndex, startIndex + pageSize);
    const nextIndex = startIndex + pageSize;
    const response: RecommendResponse = {
      songs: page,
      cursor: nextIndex < all.length ? String(nextIndex) : null,
    };
    return NextResponse.json(response);
  }

  const page = getRecommendPage(cursor, 10);
  const response: RecommendResponse = { songs: page.songs, cursor: page.cursor };
  return NextResponse.json(response);
}
