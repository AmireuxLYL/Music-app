// QQ Music (QQ音乐) proxy — access to 30M+ songs
const http = require('http');
const https = require('https');
const crypto = require('crypto');

const PORT = 4002;

function randomGuid() {
  return Array.from({length: 10}, () => Math.floor(Math.random() * 10)).join('');
}

function getRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  });
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
      const limit = parseInt(params.limit) || 20;
      const data = await getRequest(
        `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?format=json&n=${limit}&p=1&w=${encodeURIComponent(q)}&ct=24&qqmusic_ver=1298&new_json=1&t=0&aggr=1&cr=1`,
        { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://y.qq.com/' }
      );

      const songs = [];
      if (data?.data?.song?.list) {
        for (const item of data.data.song.list) {
          const singers = (item.singer || []).map(s => s.name).join(' / ');
          songs.push({
            id: `qq-${item.mid || item.songmid}`,
            name: item.title || item.name,
            artist: singers || 'Unknown',
            album: item.album?.name || '',
            duration: item.interval || 0,
            songmid: item.mid || item.songmid,
            coverUrl: item.album?.pic
              ? `https://y.gtimg.cn/music/photo_new/T002R500x500M000${item.album.pic}.jpg`
              : '',
          });
        }
      }

      res.end(JSON.stringify({ result: { songs, songCount: songs.length } }));
      return;
    }

    if (path === '/song_url') {
      const songmid = params.id || '';
      const guid = randomGuid();
      const uin = '0';

      // Get the vkey
      const vkeyData = await getRequest(
        `https://c.y.qq.com/base/fcgi-bin/fcg_musicexpress.fcg?format=json&guid=${guid}&songmid=${songmid}&uin=${uin}&loginflag=1`,
        { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://y.qq.com/' }
      );

      if (vkeyData?.key) {
        const vkey = vkeyData.key;
        // Multiple quality URLs
        const urls = {
          '128': `http://ws.stream.qqmusic.qq.com/C400${songmid}.m4a?fromtag=0&guid=${guid}&vkey=${vkey}`,
          '320': `http://ws.stream.qqmusic.qq.com/M800${songmid}.mp3?fromtag=0&guid=${guid}&vkey=${vkey}`,
          flac: `http://ws.stream.qqmusic.qq.com/F000${songmid}.flac?fromtag=0&guid=${guid}&vkey=${vkey}`,
        };
        res.end(JSON.stringify({ data: [{ id: songmid, url: urls['320'], br: 320000, size: 0 }] }));
      } else {
        res.end(JSON.stringify({ data: [{ id: songmid, url: null }] }));
      }
      return;
    }

    if (path === '/trending') {
      // Search popular queries for trending
      const queries = ['热门', '新歌', '流行', '周杰伦', '抖音', '华语', '薛之谦', '林俊杰', '陈奕迅', '邓紫棋'];
      const q = queries[Math.floor(Math.random() * queries.length)];
      const limit = parseInt(params.limit) || 20;

      const data = await getRequest(
        `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?format=json&n=${limit}&p=1&w=${encodeURIComponent(q)}&ct=24&qqmusic_ver=1298&new_json=1`,
        { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://y.qq.com/' }
      );

      const songs = [];
      if (data?.data?.song?.list) {
        for (const item of data.data.song.list) {
          songs.push({
            id: `qq-${item.mid || item.songmid}`,
            name: item.title || item.name,
            artist: (item.singer || []).map(s => s.name).join(' / ') || 'Unknown',
            album: item.album?.name || '',
            duration: item.interval || 0,
            songmid: item.mid || item.songmid,
            coverUrl: item.album?.pic
              ? `https://y.gtimg.cn/music/photo_new/T002R500x500M000${item.album.pic}.jpg`
              : '',
          });
        }
      }

      res.end(JSON.stringify({ result: { songs, songCount: songs.length } }));
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Unknown endpoint' }));
  } catch (e) {
    console.error('QQ Music error:', e.message);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: e.message }));
  }
});

server.listen(PORT, () => {
  console.log('QQ Music proxy running on port ' + PORT + ' (30M+ songs)');
});
