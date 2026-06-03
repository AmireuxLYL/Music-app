// QQ Music (QQ音乐) — direct API calls using official endpoints
// EdgeOne is Tencent Cloud → requests to QQ Music should pass internal network
import type { Song } from '@/lib/types';

const GUID = String(Date.now()).slice(0, 13);
const SEARCH_URL = 'https://c.y.qq.com/soso/fcgi-bin/client_search_cp';
const SONG_URL_API = 'https://u.y.qq.com/cgi-bin/musicu.fcg';

function getHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://y.qq.com',
    'Accept': 'application/json',
  };
}

interface QQSearchItem {
  songid: number;
  songmid: string;
  songname: string;
  singer: { name: string }[];
  albumname: string;
  albummid: string;
  interval: number;
}

function mapTrack(item: QQSearchItem, streamUrl?: string): Song {
  const title = item.songname || 'Unknown';
  const lower = title.toLowerCase();

  let type: Song['type'] = 'original';
  if (/伴奏|[（(]伴奏[）)]|instrumental|karaoke/i.test(lower)) type = 'instrumental';
  else if (/纯音乐|piano|orchestral|轻音乐|[（(]纯音乐[）)]/i.test(lower)) type = 'pure_music';
  else if (/翻唱|cover|[（(]翻唱[）)]/i.test(lower)) type = 'cover';

  const coverUrl = item.albummid
    ? `https://y.qq.com/music/photo_new/T002R300x300M000${item.albummid}.jpg`
    : '';

  return {
    id: `qq-${item.songmid}`,
    title,
    artist: (item.singer || []).map(s => s.name).join(' / ') || 'Unknown',
    coverUrl,
    type,
    duration: item.interval || 0,
    sources: streamUrl ? [{
      platform: 'other',
      streamUrl,
      downloadUrl: streamUrl,
      quality: '320',
    }] : [],
    tags: [],
    popularity: 85,
    sourceLabel: '完整',
  };
}

/**
 * Search QQ Music for songs.
 * Uses the official client search API that the QQ Music web player uses.
 */
export async function searchQQ(query: string, limit: number = 20): Promise<Song[]> {
  try {
    const params = new URLSearchParams({
      ct: '24',
      qqmusic_ver: '1298',
      new_json: '1',
      remoteplace: 'txt.yqq.song',
      searchid: String(Date.now()),
      t: '0',
      aggr: '1',
      cr: '1',
      catZhida: '1',
      lossless: '0',
      flag_qc: '0',
      p: '1',
      n: String(Math.min(limit, 30)),
      w: query,
      format: 'json',
      platform: 'yqq.json',
    });

    const url = `${SEARCH_URL}?${params}`;
    const res = await fetch(url, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      console.error(`QQ search HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    const list: QQSearchItem[] = data?.data?.song?.list || [];

    if (!list.length) return [];

    // Get streaming URLs for the first 10 songs (batch)
    const urlMap = await getSongUrls(list.slice(0, 10));

    return list.map(item => mapTrack(item, urlMap.get(item.songmid)));
  } catch (err) {
    console.error('QQ search error:', err);
    return [];
  }
}

/**
 * Get streaming URLs for multiple songs in a single API call.
 */
async function getSongUrls(tracks: QQSearchItem[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  if (!tracks.length) return map;

  try {
    // Build unified request for multiple songs
    const reqData: Record<string, any> = {
      req_0: {
        module: 'vkey.GetVkeyServer',
        method: 'CgiGetVkey',
        param: {
          guid: GUID,
          songmid: tracks.map(t => t.songmid),
          songtype: tracks.map(() => 0),
          uin: '0',
          loginflag: 0,
          platform: '20',
        },
      },
    };

    const encoded = JSON.stringify(reqData);
    const url = `${SONG_URL_API}?format=json&data=${encodeURIComponent(encoded)}`;
    const res = await fetch(url, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return map;

    const data = await res.json();
    const midurlinfo: any[] = data?.req_0?.data?.midurlinfo || [];
    const sip: string[] = data?.req_0?.data?.sip || [];
    const server = sip.length > 0 ? sip[0] : '';

    for (let i = 0; i < midurlinfo.length; i++) {
      const purl = midurlinfo[i]?.purl || '';
      const songmid = tracks[i]?.songmid;
      if (server && purl && songmid && purl !== '') {
        // Full URL = server base + purl filename
        const streamUrl = server + purl;
        map.set(songmid, streamUrl);
      }
    }
  } catch (err) {
    console.error('QQ song URL error:', err);
  }

  return map;
}

/**
 * Get trending songs by searching popular Chinese terms.
 */
const TRENDING_QUERIES = [
  '周杰伦', '陈奕迅', '邓紫棋', '薛之谦', '林俊杰', '刘德华',
  '张学友', '王菲', '五月天', '林宥嘉', '张惠妹', '蔡依林',
  '华语新歌', '抖音热歌', '经典老歌',
];

export async function getQQTrending(limit: number = 20): Promise<Song[]> {
  const query = TRENDING_QUERIES[Math.floor(Math.random() * TRENDING_QUERIES.length)];
  return searchQQ(query, limit);
}
