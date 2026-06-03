import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  // Proxy to Jamendo local server
  const proxyUrl = `http://localhost:4001/stream?id=${id}`;

  try {
    const upstream = await fetch(proxyUrl, {
      signal: AbortSignal.timeout(60000),
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: upstream.status });
    }

    const headers = new Headers();
    headers.set('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg');
    headers.set('Accept-Ranges', 'bytes');
    headers.set('X-Cache', upstream.headers.get('X-Cache') || 'MISS');

    const cl = upstream.headers.get('content-length');
    if (cl) headers.set('Content-Length', cl);

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
