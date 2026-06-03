import { NextRequest, NextResponse } from 'next/server';
import { getJioSaavnTrending } from '@/lib/api/jiosaavn';
import { getNeteaseTrending } from '@/lib/api/ncm';
import type { Song } from '@/lib/types';

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get('cursor');

  const results: Song[] = [];

  const promises = [
    getNeteaseTrending(20).then(s => { results.push(...s); }).catch(() => {}),
    getJioSaavnTrending(15).then(s => { results.push(...s); }).catch(() => {}),
  ];

  await Promise.race([
    Promise.all(promises),
    new Promise(r => setTimeout(r, 6000)),
  ]);

  if (results.length > 0) {
    const shuffled = results.sort(() => Math.random() - 0.5);
    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const pageSize = 10;
    const page = shuffled.slice(startIndex, startIndex + pageSize);
    const nextIndex = startIndex + pageSize;
    return NextResponse.json({
      songs: page,
      cursor: nextIndex < shuffled.length ? String(nextIndex) : null,
    });
  }

  // Fallback
  const fallback = await getJioSaavnTrending(20).catch(() => []);
  return NextResponse.json({ songs: fallback.slice(0, 10), cursor: null });
}
