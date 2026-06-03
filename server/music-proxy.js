// Unified Music Proxy — handles NetEase + QQ + KuGou + KuWo
// Run: node server/music-proxy.js
// Listens on port 4000

const http = require('http');
const https = require('https');
const url = require('url');
const crypto = require('crypto');

const PORT = 4000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function fetchJSON(apiUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(apiUrl);
    const mod = u.protocol === 'https:' ? https : http;
    const req = mod.get(apiUrl, {
      headers: { 'User-Agent': UA, Referer: options.referer || '', Accept: 'application/json', ...options.headers },
      timeout: 8000,
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

// ── NetEase Cloud Music ──
async function neteaseSearch(q, limit = 20) {
  const data = await fetchJSON(
    `https://music.163.com/api/search/get?s=${encodeURIComponent(q)}&type=1&limit=${limit}`,
    { referer: 'https://music.163.com/' }
  );
  const songs = data?.result?.songs || [];
  return songs.slice(0, limit).map(s => ({
    id: String(s.id),
    name: s.name,
    artist: (s.artists || []).map(a => a.name).join(' / '),
    album: { name: s.album?.name || '', picUrl: (s.album?.picUrl || '').replace('http:', 'https:') },
    duration: s.duration,
    source: 'netease',
  }));
}

async function neteaseGetUrl(songId) {
  const data = await fetchJSON(
    `https://music.163.com/api/song/enhance/player/url?id=${songId}&ids=[${songId}]&br=320000`,
    { referer: 'https://music.163.com/' }
  );
  return data?.data?.[0]?.url || '';
}

// ── QQ Music ──
async function qqSearch(q, limit = 20) {
  const params = new URLSearchParams({
    ct: '24', qqmusic_ver: '1298', new_json: '1',
    remoteplace: 'txt.yqq.song', searchid: String(Date.now()),
    t: '0', aggr: '1', cr: '1', catZhida: '1',
    lossless: '0', flag_qc: '0', p: '1',
    n: String(Math.min(limit, 30)), w: q,
    format: 'json', platform: 'yqq.json',
  });
  const data = await fetchJSON(
    `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?${params}`,
    { referer: 'https://y.qq.com' }
  );
  return (data?.data?.song?.list || []).map(s => ({
    id: s.songmid || String(s.songid),
    name: s.songname || s.name,
    artist: (s.singer || []).map(a => a.name).join(' / '),
    album: { name: s.albumname || '', picUrl: s.albummid ? `https://y.qq.com/music/photo_new/T002R300x300M000${s.albummid}.jpg` : '' },
    duration: s.interval || 0,
    source: 'tencent',
  }));
}

async function qqGetUrl(songmid) {
  const GUID = String(Math.floor(Math.random() * 1e10));
  const reqData = {
    req_0: {
      module: 'vkey.GetVkeyServer',
      method: 'CgiGetVkey',
      param: { guid: GUID, songmid: [songmid], songtype: [0], uin: '0', loginflag: 0, platform: '20' },
    },
  };
  const enc = encodeURIComponent(JSON.stringify(reqData));
  const data = await fetchJSON(
    `https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&data=${enc}`,
    { referer: 'https://y.qq.com' }
  );
  const purl = data?.req_0?.data?.midurlinfo?.[0]?.purl || '';
  const sip = data?.req_0?.data?.sip || [];
  return purl && sip.length > 0 ? sip[0] + purl : '';
}

// ── KuGou ──
async function kugouSearch(q, limit = 20) {
  const data = await fetchJSON(
    `http://mobilecdn.kugou.com/api/v3/search/song?format=json&keyword=${encodeURIComponent(q)}&page=1&pagesize=${limit}`,
    { referer: 'https://www.kugou.com/' }
  );
  return (data?.data?.info || []).map(s => ({
    id: s.hash || s.songname,
    name: s.songname || '',
    artist: s.singername || '',
    album: { name: s.album_name || '', picUrl: '' },
    duration: s.duration || 0,
    source: 'kugou',
  }));
}

async function kugouGetUrl(songHash, albumId = '') {
  const data = await fetchJSON(
    `http://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash=${songHash}`,
    { referer: 'https://www.kugou.com/' }
  );
  return data?.url || '';
}

// ── HTTP Server ──

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.end();

  const u = new URL(req.url, `http://localhost:${PORT}`);
  const path = u.pathname;
  const q = u.searchParams;

  try {
    // ── NetEase ──
    if (path === '/netease/search') {
      const songs = await neteaseSearch(q.get('q') || '', parseInt(q.get('limit') || '20'));
      return res.end(JSON.stringify({ code: 200, result: { songs } }));
    }
    if (path === '/netease/url') {
      const url = await neteaseGetUrl(q.get('id') || '');
      return res.end(JSON.stringify({ data: [{ id: q.get('id'), url }] }));
    }

    // ── QQ Music ──
    if (path === '/qq/search') {
      const songs = await qqSearch(q.get('q') || '', parseInt(q.get('limit') || '20'));
      return res.end(JSON.stringify({ result: { songs } }));
    }
    if (path === '/qq/url') {
      const url = await qqGetUrl(q.get('id') || '');
      return res.end(JSON.stringify({ data: [{ id: q.get('id'), url }] }));
    }

    // ── KuGou ──
    if (path === '/kugou/search') {
      const songs = await kugouSearch(q.get('q') || '', parseInt(q.get('limit') || '20'));
      return res.end(JSON.stringify({ result: { songs } }));
    }
    if (path === '/kugou/url') {
      const url = await kugouGetUrl(q.get('id') || '', q.get('album_id') || '');
      return res.end(JSON.stringify({ url }));
    }

    // ── Combined search ──
    if (path === '/search') {
      const query = q.get('q') || '';
      const limit = parseInt(q.get('limit') || '20');
      const sources = (q.get('sources') || 'netease,qq,kugou').split(',');

      const tasks = [];
      if (sources.includes('netease')) tasks.push(neteaseSearch(query, limit).catch(() => []));
      if (sources.includes('qq')) tasks.push(qqSearch(query, limit).catch(() => []));
      if (sources.includes('kugou')) tasks.push(kugouSearch(query, limit).catch(() => []));

      const results = await Promise.all(tasks);
      const all = results.flat();
      return res.end(JSON.stringify({ songs: all.slice(0, limit) }));
    }

    // ── Get URL for any platform ──
    if (path === '/url') {
      const id = q.get('id') || '';
      const source = q.get('source') || '';

      let streamUrl = '';
      if (source === 'netease') streamUrl = await neteaseGetUrl(id);
      else if (source === 'tencent' || source === 'qq') streamUrl = await qqGetUrl(id);
      else if (source === 'kugou') streamUrl = await kugouGetUrl(id);

      return res.end(JSON.stringify({ url: streamUrl }));
    }

    // Health check
    if (path === '/health') {
      return res.end(JSON.stringify({ status: 'ok', platforms: ['netease', 'qq', 'kugou'] }));
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (e) {
    console.error('Proxy error:', e);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: e.message }));
  }
});

server.listen(PORT, () => {
  console.log(`🎵 Music Proxy running on http://localhost:${PORT}`);
  console.log(`   NetEase: /netease/search, /netease/url`);
  console.log(`   QQ:      /qq/search, /qq/url`);
  console.log(`   KuGou:   /kugou/search, /kugou/url`);
  console.log(`   Combined: /search?q=xxx&sources=netease,qq,kugou`);
});
