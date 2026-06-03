import { NextRequest, NextResponse } from 'next/server';
import { searchJioSaavn } from '@/lib/api/jiosaavn';
import { searchNetease } from '@/lib/api/ncm';
import { searchJamendo } from '@/lib/api/jamendo';
import type { Song } from '@/lib/types';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.toLowerCase() || '';
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);

  if (!q) {
    return NextResponse.json({ results: [], total: 0, page: 1 });
  }

  const results: Song[] = [];

  const promises = [
    searchNetease(q, 25).then(s => { results.push(...s); }).catch(() => {}),
    searchJioSaavn(q, 20).then(s => { results.push(...s); }).catch(() => {}),
    searchJamendo(q, 15).then(s => { results.push(...s); }).catch(() => {}),
  ];

  await Promise.race([
    Promise.all(promises),
    new Promise(r => setTimeout(r, 8000)),
  ]);

  const seen = new Set<string>();
  const unique = results.filter((s) => {
    const key = s.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const total = unique.length;
  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const paged = unique.slice(start, start + pageSize);

  return NextResponse.json({ results: paged, total, page });
}
