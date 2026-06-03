import { NextRequest, NextResponse } from 'next/server';
import { getSongById } from '@/lib/data/songs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const srcParam = request.nextUrl.searchParams.get('src');

  // If src param provided, proxy that URL directly (iTunes preview, Jamendo, etc.)
  if (srcParam) {
    try {
      const srcUrl = decodeURIComponent(srcParam);
      return proxyAudio(request, srcUrl);
    } catch {
      // Fall through
    }
  }

  // Handle iTunes ID pattern
  if (id.startsWith('itunes-')) {
    // Try the standard iTunes preview URL pattern
    const realId = id.replace('itunes-', '');
    const patterns = [
      `https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/${realId.slice(-3)}/${realId}/mzaf_${realId}@2x.m4a`,
      `https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/${realId.slice(-3)}/${realId}/mzaf_${realId}@2x.m4a`,
      `https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/${realId.slice(-3)}/${realId}/mzaf_${realId}.m4a`,
    ];

    for (const pattern of patterns) {
      try {
        const result = await proxyAudio(request, pattern);
        if (result.status === 200) return result;
      } catch {
        continue;
      }
    }
    return NextResponse.json({ error: 'iTunes stream not available' }, { status: 404 });
  }

  // Handle Internet Archive ID pattern: ia-IDENTIFIER
  if (id.startsWith('ia-')) {
    const iaId = id.replace('ia-', '');

    // Try multiple common filename patterns
    const filenamePatterns = [
      `${iaId}.mp3`,
      `${iaId}_vbr.mp3`,
      `${iaId}_64kb.mp3`,
    ];

    for (const fn of filenamePatterns) {
      const url = `https://archive.org/download/${iaId}/${fn}`;
      try {
        const result = await proxyAudio(request, url);
        if (result.status === 200) {
          // Check content type to ensure it's audio
          const ct = result.headers.get('Content-Type');
          if (ct && (ct.includes('audio') || ct.includes('mpeg') || ct.includes('octet-stream'))) {
            return result;
          }
        }
      } catch {
        continue;
      }
    }

    // Last resort: try to resolve via archive.org metadata
    try {
      const metaRes = await fetch(`https://archive.org/metadata/${iaId}`);
      const meta = await metaRes.json();
      const files = meta?.files || [];
      const mp3File = files.find(
        (f: { name?: string; format?: string }) =>
          f.name?.endsWith('.mp3') || f.format === 'VBR MP3'
      );
      if (mp3File?.name) {
        return proxyAudio(request, `https://archive.org/download/${iaId}/${mp3File.name}`);
      }
    } catch {
      // Give up
    }

    return NextResponse.json({ error: 'Archive audio not available' }, { status: 404 });
  }

  // Handle Jamendo ID pattern
  if (id.startsWith('jamendo-')) {
    return NextResponse.json(
      { error: 'Jamendo stream requires src parameter. Please re-search with Jamendo key configured.' },
      { status: 400 }
    );
  }

  // Fallback: check seed data
  const seedSong = getSongById(id);
  const sourceUrl = seedSong?.sources[0]?.streamUrl;
  if (sourceUrl && (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://'))) {
    try {
      return proxyAudio(request, sourceUrl);
    } catch {
      // Fall through
    }
  }

  return NextResponse.json({ error: 'Stream not available' }, { status: 404 });
}

/**
 * Proxy an audio URL, forwarding range headers for seeking support.
 */
async function proxyAudio(request: NextRequest, targetUrl: string): Promise<NextResponse> {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Encoding': 'identity',
  };
  // Set proper Referer based on the target domain
  if (targetUrl.includes('163.com') || targetUrl.includes('126.net')) {
    headers['Referer'] = 'https://music.163.com/';
  } else if (targetUrl.includes('y.qq.com') || targetUrl.includes('qq.com')) {
    headers['Referer'] = 'https://y.qq.com/';
  }

  const range = request.headers.get('range');
  if (range) {
    headers['Range'] = range;
  }

  const upstream = await fetch(targetUrl, { headers });

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json(
      { error: `Upstream returned ${upstream.status}` },
      { status: upstream.status }
    );
  }

  const responseHeaders = new Headers();
  const ct = upstream.headers.get('content-type');
  responseHeaders.set('Content-Type', ct || 'audio/mpeg');
  responseHeaders.set('Accept-Ranges', 'bytes');
  responseHeaders.set('Cache-Control', 'public, max-age=3600');

  const cl = upstream.headers.get('content-length');
  if (cl) responseHeaders.set('Content-Length', cl);
  const cr = upstream.headers.get('content-range');
  if (cr) responseHeaders.set('Content-Range', cr);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
