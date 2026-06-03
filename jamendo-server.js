// Jamendo API proxy server — handles search + caches audio locally
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 4001;
const CLIENT_ID = '7f409e8f';
const CACHE_DIR = path.join(__dirname, 'public', 'audio', 'cache');

// Ensure cache directory
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  try {
    // SEARCH endpoint
    if (pathname === '/search') {
      const q = url.searchParams.get('q') || '';
      const limit = url.searchParams.get('limit') || '20';
      const type = url.searchParams.get('type') || '';

      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        format: 'json',
        search: q,
        limit,
        include: 'musicinfo',
      });
      if (type === 'instrumental') params.set('tags', 'instrumental');
      if (type === 'pure_music') params.set('tags', 'classical,ambient');

      const apiRes = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`);
      const data = await apiRes.json();

      const songs = (data.results || []).map(track => ({
        id: `jamendo-${track.id}`,
        title: track.name,
        artist: track.artist_name,
        coverUrl: track.image || '',
        duration: track.duration || 180,
        streamUrl: track.audio,
        downloadUrl: track.audiodownload,
        quality: '320',
      }));

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ results: songs }));
      return;
    }

    // STREAM endpoint — proxy audio with caching
    if (pathname === '/stream') {
      const trackId = url.searchParams.get('id');
      const srcUrl = url.searchParams.get('src');

      if (!srcUrl && !trackId) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Need id or src param' }));
        return;
      }

      const audioUrl = srcUrl || `https://prod-1.storage.jamendo.com/?trackid=${trackId}&format=mp31`;

      // Check cache
      const cacheKey = (trackId || encodeURIComponent(audioUrl.slice(-40))).replace(/[^a-zA-Z0-9]/g, '_');
      const cachePath = path.join(CACHE_DIR, cacheKey + '.mp3');

      if (fs.existsSync(cachePath)) {
        const stat = fs.statSync(cachePath);
        const stream = fs.createReadStream(cachePath);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', stat.size);
        res.setHeader('X-Cache', 'HIT');
        stream.pipe(res);
        return;
      }

      // Fetch from Jamendo CDN
      console.log('Downloading:', audioUrl.slice(0, 80) + '...');
      const upstream = await fetch(audioUrl, {
        headers: { 'User-Agent': 'MusicFlow/1.0' },
        signal: AbortSignal.timeout(60000),
      });

      if (!upstream.ok) {
        res.statusCode = upstream.status;
        res.end(JSON.stringify({ error: 'Upstream error: ' + upstream.status }));
        return;
      }

      const buffer = Buffer.from(await upstream.arrayBuffer());

      // Save to cache
      try { fs.writeFileSync(cachePath, buffer); } catch {}

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('X-Cache', 'MISS');
      res.end(buffer);
      return;
    }

    // TRENDING endpoint
    if (pathname === '/trending') {
      const limit = url.searchParams.get('limit') || '15';
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        format: 'json',
        limit,
        order: 'popularity_total',
        include: 'musicinfo',
      });

      const apiRes = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`);
      const data = await apiRes.json();

      const songs = (data.results || []).map(track => ({
        id: `jamendo-${track.id}`,
        title: track.name,
        artist: track.artist_name,
        coverUrl: track.image || '',
        duration: track.duration || 180,
        streamUrl: track.audio,
        downloadUrl: track.audiodownload,
        quality: '320',
      }));

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ results: songs }));
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Unknown endpoint' }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: e.message }));
  }
});

server.listen(PORT, () => {
  console.log('Jamendo API proxy running on http://localhost:' + PORT);
});
