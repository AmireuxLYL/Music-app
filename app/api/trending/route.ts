import { NextResponse } from 'next/server';
import { getTrendingSongs } from '@/lib/data/songs';
import { getITunesTrending } from '@/lib/api/itunes';
import { getJamendoTrending } from '@/lib/api/jamendo';

export async function GET() {
  // Try iTunes first (free, no auth)
  const itunesResults = await getITunesTrending(10);

  // Supplement with Jamendo if configured
  let all = itunesResults;
  if (process.env.JAMENDO_CLIENT_ID) {
    const jamendoResults = await getJamendoTrending(5);
    all = [...all, ...jamendoResults];
  }

  if (all.length > 0) {
    return NextResponse.json(all);
  }

  // Fallback to seed data
  return NextResponse.json(getTrendingSongs());
}
