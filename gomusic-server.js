// go-music-dl JSON API wrapper — parses go-music-dl's web interface
// Access to 10+ platforms: NetEase, QQ, KuGou, KuWo, MiGu, Bilibili, etc.
const http = require('http');
const https = require('https');

const PORT = 4005;
const MUSIC_DL = 'http://localhost:8080/music';

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ body: data, status: res.statusCode, headers: res.headers }));
    }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  });
}

// Extract song data from go-music-dl's download URLs in HTML
function extractSongs(html) {
  const songs = [];
  const seen = new Set();

  // Parse download URLs: /music/download?id=ID&source=SOURCE&name=NAME&artist=ARTIST&album=ALBUM&cover=COVER
  const dlRegex = /\/music\/download\?([^"'\s<>]+)/g;
  let match;

  while ((match = dlRegex.exec(html)) !== null) {
    const params = new URLSearchParams(match[1]);
    const id = params.get('id');
    const source = params.get('source');
    if (!id || !source) continue;

    const key = `${source}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const extra = params.get('extra');
    let songId = id;
    if (extra) {
      try { songId = JSON.parse(decodeURIComponent(extra)).song_id || id; } catch {}
    }

    songs.push({
      id: songId,
      source: source,
      name: decodeURIComponent(params.get('name') || 'Unknown'),
      artist: decodeURIComponent(params.get('artist') || 'Unknown'),
      album: decodeURIComponent(params.get('album') || ''),
      duration: parseInt(params.get('duration') || '0') || 0,
      coverUrl: decodeURIComponent(params.get('cover') || ''),
    });
  }

  return songs;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  const params = Object.fromEntries(url.searchParams);

  try {
    if (path === '/search') {
      const q = params.q || '';
      const srcParam = params.sources || 'netease';

      // Build URL manually — go-music-dl uses multiple `sources` params, not comma-separated
      const srcList = srcParam.split(',');
      const srcParams = srcList.map(s => `sources=${encodeURIComponent(s)}`).join('&');
      const searchUrl = `${MUSIC_DL}/search?q=${encodeURIComponent(q)}&${srcParams}&type=song`;
      console.log('Fetching:', searchUrl.slice(0, 120));
      const result = await fetch(searchUrl);

      if (result.status !== 200) {
        res.end(JSON.stringify({ songs: [], error: 'search failed' }));
        return;
      }

      const songs = extractSongs(result.body);
      res.end(JSON.stringify({ songs, total: songs.length }));
      return;
    }

    if (path === '/download_url') {
      const id = params.id;
      const source = params.source;
      const name = params.name || 'song';
      const artist = params.artist || '';

      if (!id || !source) {
        res.end(JSON.stringify({ error: 'need id and source' }));
        return;
      }

      // Call go-music-dl's download endpoint
      const dlUrl = `${MUSIC_DL}/download?id=${encodeURIComponent(id)}&source=${encodeURIComponent(source)}&name=${encodeURIComponent(name)}&artist=${encodeURIComponent(artist)}`;

      // Don't follow redirect — just get the redirect URL
      const dlResult = await new Promise((resolve) => {
        const client = dlUrl.startsWith('https') ? https : http;
        const req = client.get(dlUrl, { timeout: 10000 }, (dlRes) => {
          // go-music-dl might redirect to the actual audio URL
          const location = dlRes.headers.location;
          resolve({ url: location || '', status: dlRes.statusCode });
        });
        req.on('error', () => resolve({ url: '', status: 0 }));
        req.on('timeout', function() { this.destroy(); resolve({ url: '', status: 0 }); });
      });

      res.end(JSON.stringify({ url: dlResult.url }));
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'unknown endpoint' }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: e.message }));
  }
});

server.listen(PORT, () => {
  console.log('go-music-dl JSON API on :' + PORT + ' (NetEase, QQ, KuGou, KuWo, MiGu, Bilibili)');
});
