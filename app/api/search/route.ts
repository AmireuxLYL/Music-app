import { NextRequest, NextResponse } from 'next/server';
import { searchSongs } from '@/lib/data/songs';
import { searchITunes } from '@/lib/api/itunes';
import { searchJamendo } from '@/lib/api/jamendo';
import { searchArchive } from '@/lib/api/archive';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.toLowerCase() || '';
  const type = request.nextUrl.searchParams.get('type') || undefined;
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);

  if (!q) {
    return NextResponse.json({ results: [], total: 0, page: 1 });
  }

  // Parallel search from multiple free sources
  const [itunesResults, archiveResults] = await Promise.all([
    searchITunes(q, type),
    searchArchive(q).catch(() => []),
  ]);

  let all = [...itunesResults, ...archiveResults];

  // Add Jamendo if configured
  if (process.env.JAMENDO_CLIENT_ID) {
    const jamendoResults = await searchJamendo(q, type).catch(() => []);
    all = [...all, ...jamendoResults];
  }

  // Fallback to seed data
  if (all.length === 0) {
    all = searchSongs(q, type);
  }

  // De-duplicate by title similarity
  const seen = new Set<string>();
  all = all.filter((s) => {
    const key = s.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const total = all.length;
  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const results = all.slice(start, start + pageSize);

  return NextResponse.json({ results, total, page });
}
