import { NextRequest, NextResponse } from 'next/server';
import { searchSongs } from '@/lib/data/songs';
import { searchITunes } from '@/lib/api/itunes';
import { searchJamendo } from '@/lib/api/jamendo';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.toLowerCase() || '';
  const type = request.nextUrl.searchParams.get('type') || undefined;
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);

  if (!q) {
    return NextResponse.json({ results: [], total: 0, page: 1 });
  }

  // Try iTunes first (free, no auth)
  let all = await searchITunes(q, type);

  // Supplement with Jamendo if configured
  if (process.env.JAMENDO_CLIENT_ID) {
    const jamendoResults = await searchJamendo(q, type);
    all = [...all, ...jamendoResults];
  }

  // Fallback to seed data
  if (all.length === 0) {
    all = searchSongs(q, type);
  }

  const total = all.length;
  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const results = all.slice(start, start + pageSize);

  return NextResponse.json({ results, total, page });
}
