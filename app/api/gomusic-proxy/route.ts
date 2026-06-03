import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const id = params.get('id');
  const source = params.get('source');
  const name = params.get('name') || 'song';
  const artist = params.get('artist') || '';

  if (!id || !source) {
    return NextResponse.json({ error: 'need id and source' }, { status: 400 });
  }

  const dlUrl = `http://localhost:8080/music/download?id=${encodeURIComponent(id)}&source=${source}&name=${encodeURIComponent(name)}&artist=${encodeURIComponent(artist)}`;

  try {
    const upstream = await fetch(dlUrl, {
      signal: AbortSignal.timeout(60000),
      headers: { 'User-Agent': 'MusicFlow/1.0' },
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: `Upstream: ${upstream.status}` }, { status: 502 });
    }

    const ct = upstream.headers.get('content-type') || 'audio/mpeg';
    const headers = new Headers();
    headers.set('Content-Type', ct);
    headers.set('Accept-Ranges', 'bytes');
    const cl = upstream.headers.get('content-length');
    if (cl) headers.set('Content-Length', cl);

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
