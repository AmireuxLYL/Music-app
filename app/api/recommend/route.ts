import { NextRequest, NextResponse } from 'next/server';
import { getRecommendPage } from '@/lib/data/songs';
import type { RecommendResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get('cursor');
  const page = getRecommendPage(cursor, 10);
  const response: RecommendResponse = { songs: page.songs, cursor: page.cursor };
  return NextResponse.json(response);
}
