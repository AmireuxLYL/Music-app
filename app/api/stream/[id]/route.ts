import { NextRequest, NextResponse } from 'next/server';
import { getSongById } from '@/lib/data/songs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // If the ID looks like "itunes-XXX", proxy the iTunes preview URL
  if (id.startsWith('itunes-')) {
    const realId = id.replace('itunes-', '');
    const previewUrl = `https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/${realId.slice(-3)}/${realId}/mzaf_${realId}@2x.m4a`;

    try {
      const range = request.headers.get('range');
      const upstream = await fetch(previewUrl, {
        headers: range ? { Range: range } : {},
      });

      if (upstream.ok) {
        const headers = new Headers();
        headers.set('Content-Type', 'audio/x-m4a');
        headers.set('Accept-Ranges', 'bytes');
        const cl = upstream.headers.get('content-length');
        if (cl) headers.set('Content-Length', cl);
        return new NextResponse(upstream.body, { status: upstream.status, headers });
      }
    } catch {
      // Fall through
    }
  }

  // Check seed data for direct URLs
  const seedSong = getSongById(id);
  const sourceUrl = seedSong?.sources[0]?.streamUrl;
  if (sourceUrl && (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://'))) {
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
      // Fall through
    }
  }

  return NextResponse.json(
    { error: 'Stream not available' },
    { status: 404 }
  );
}
