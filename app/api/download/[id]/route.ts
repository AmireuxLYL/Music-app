import { NextRequest, NextResponse } from 'next/server';
import { getSongById } from '@/lib/data/songs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const song = getSongById(id);

  if (!song) {
    return NextResponse.json({ error: 'Song not found' }, { status: 404 });
  }

  const source = song.sources.find((s) => s.downloadUrl);

  if (!source) {
    return NextResponse.json(
      { error: 'No download source available for this song' },
      { status: 404 }
    );
  }

  try {
    const range = request.headers.get('range');
    const response = await fetch(source.downloadUrl, {
      headers: range ? { Range: range } : {},
    });

    const headers: Record<string, string> = {
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Content-Disposition': `attachment; filename="${song.title}.mp3"`,
    };

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (err) {
    console.error('Download proxy error:', err);
    return NextResponse.json(
      { error: 'Failed to download from source' },
      { status: 502 }
    );
  }
}
