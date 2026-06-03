// NetEase Cloud Music API proxy — 30M+ song catalog
const http = require('http');
const netease = require('NeteaseCloudMusicApi');
const PORT = 4000;

// ALL official toplists + popular playlists — each yields 100-1000 songs
const TOPLISTS = [0,1,2,3,4,22,23,24,25,26,27,28];
const PLAYLISTS = [
  '3778678','3779629','2884035','19723756','2809513713',
  '2809577409','745956260','505966151','668806946','991708300',
  '71384707','2644265664','2890622004','3138809958','3108425172',
  '6695704917','7000896207','6011878737','3108298680',
];

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  const params = Object.fromEntries(url.searchParams);

  try {
    let result;

    if (path === '/search') {
      result = await netease.search({ keywords: params.q, limit: parseInt(params.limit)||20, type: 1 });
    } else if (path === '/song_url') {
      result = await netease.song_url_v1({ id: params.id, level: 'standard' });
    } else if (path === '/batch_songs') {
      // Pull from ALL toplists and playlists — massive song pool
      const allSongs = [];
      const visited = new Set();

      for (const tid of TOPLISTS) {
        try {
          const r = await netease.top_list({ id: tid });
          if (r.body?.playlist?.tracks) {
            for (const t of r.body.playlist.tracks) {
              if (!visited.has(t.id)) { visited.add(t.id); allSongs.push(t); }
            }
          }
        } catch {}
      }

      for (const pid of PLAYLISTS) {
        try {
          const r = await netease.playlist_track_all({ id: pid, limit: 100 });
          if (r.body?.songs) {
            for (const t of r.body.songs) {
              if (!visited.has(t.id)) { visited.add(t.id); allSongs.push(t); }
            }
          }
        } catch {}
      }

      result = { body: { songs: allSongs } };
    } else if (path === '/artist_songs') {
      result = await netease.artist_songs({ id: params.id, limit: parseInt(params.limit)||50, order: 'hot' });
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Unknown' }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify(result.body || result));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: e.message }));
  }
});

server.listen(PORT, () => console.log('NetEase API on :'+PORT+' (30M+ songs, 12 toplists + 19 playlists)'));
