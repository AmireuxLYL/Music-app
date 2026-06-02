import { NextRequest, NextResponse } from 'next/server';
import { getRecommendPage } from '@/lib/data/songs';
import { getITunesTrending } from '@/lib/api/itunes';
import type { RecommendResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get('cursor');

  // Try iTunes first for real music
  const itunesSongs = await getITunesTrending(30);
  if (itunesSongs.length > 0) {
    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const pageSize = 10;
    const page = itunesSongs.slice(startIndex, startIndex + pageSize);
    const nextIndex = startIndex + pageSize;
    const response: RecommendResponse = {
      songs: page,
      cursor: nextIndex < itunesSongs.length ? String(nextIndex) : null,
    };
    return NextResponse.json(response);
  }

  // Fallback to seed data
  const page = getRecommendPage(cursor, 10);
  const response: RecommendResponse = { songs: page.songs, cursor: page.cursor };
  return NextResponse.json(response);
}
