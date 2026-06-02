import { NextResponse } from 'next/server';
import { getTrendingSongs } from '@/lib/data/songs';
import { getITunesTrending } from '@/lib/api/itunes';
import { getJamendoTrending } from '@/lib/api/jamendo';
import { getArchiveTrending } from '@/lib/api/archive';

export async function GET() {
  // Parallel fetch from free sources
  const [itunesResults, archiveResults] = await Promise.all([
    getITunesTrending(10).catch(() => []),
    getArchiveTrending(10).catch(() => []),
  ]);

  let all = [...itunesResults, ...archiveResults];

  // Add Jamendo if configured
  if (process.env.JAMENDO_CLIENT_ID) {
    const jamendoResults = await getJamendoTrending(5).catch(() => []);
    all = [...all, ...jamendoResults];
  }

  if (all.length > 0) {
    return NextResponse.json(all.sort(() => Math.random() - 0.5));
  }

  return NextResponse.json(getTrendingSongs());
}
