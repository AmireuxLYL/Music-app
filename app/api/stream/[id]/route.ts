import { NextRequest, NextResponse } from 'next/server';
import { getSongById } from '@/lib/data/songs';
import { searchJamendo } from '@/lib/api/jamendo';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check seed data first
  const seedSong = getSongById(id);
  const sourceUrl = seedSong?.sources[0]?.streamUrl;

  if (sourceUrl) {
    try {
      const range = request.headers.get('range');
      const upstream = await fetch(sourceUrl, {
        headers: range ? { Range: range } : {},
      });
      const headers = new Headers();
      headers.set('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg');
      headers.set('Accept-Ranges', 'bytes');
      const cl = upstream.headers.get('content-length');
      if (cl) headers.set('Content-Length', cl);
      return new NextResponse(upstream.body, { status: upstream.status, headers });
    } catch {
      // Fall through to error
    }
  }

  // If ID looks like "jamendo-XXX", extract the real ID and proxy
  if (id.startsWith('jamendo-')) {
    const realId = id.replace('jamendo-', '');
    try {
      const tracks = await searchJamendo('', undefined, 50);
      const track = tracks.find((t) => t.id === id);
      if (track?.sources[0]?.streamUrl) {
        const range = request.headers.get('range');
        const upstream = await fetch(track.sources[0].streamUrl, {
          headers: range ? { Range: range } : {},
        });
        const headers = new Headers();
        headers.set('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg');
        headers.set('Accept-Ranges', 'bytes');
        const cl = upstream.headers.get('content-length');
        if (cl) headers.set('Content-Length', cl);
        return new NextResponse(upstream.body, { status: upstream.status, headers });
      }
    } catch {
      // Fall through
    }
  }

  return NextResponse.json(
    { error: 'Audio not available. Set JAMENDO_CLIENT_ID in .env.local for real music streaming.' },
    { status: 404 }
  );
}
