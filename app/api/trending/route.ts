import { NextResponse } from 'next/server';
import { getTrendingSongs } from '@/lib/data/songs';
import { getJamendoTrending } from '@/lib/api/jamendo';

export async function GET() {
  // Try Jamendo first if API key is configured
  const jamendoResults = await getJamendoTrending(10);
  if (jamendoResults.length > 0) {
    return NextResponse.json(jamendoResults);
  }

  // Fallback to seed data
  return NextResponse.json(getTrendingSongs());
}
