// QQ Music (QQ音乐) — direct API calls, no proxy needed
import type { Song } from '@/lib/types';

const SEARCH_API = 'https://c.y.qq.com/soso/fcgi-bin/client_search_cp';
const SONG_URL_API = 'https://u.y.qq.com/cgi-bin/musicu.fcg';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://y.qq.com/',
};

interface QQTrack {
  id: number;
  songid: number;
  songmid: string;
  songname: string;
  singer: { name: string }[];
  albumname: string;
  albummid: string;
  interval: number;
}

function mapTrack(track: QQTrack, streamUrl?: string): Song {
  const title = track.songname || 'Unknown';
  const lower = title.toLowerCase();

  let type: Song['type'] = 'original';
  if (/伴奏|instrumental|karaoke/i.test(lower)) type = 'instrumental';
  else if (/纯音乐|piano|orchestral|轻音乐/i.test(lower)) type = 'pure_music';
  else if (/翻唱|cover/i.test(lower)) type = 'cover';

  const coverUrl = track.albummid
    ? `https://y.qq.com/music/photo_new/T002R300x300M000${track.albummid}.jpg`
    : '';

  return {
    id: `qq-${track.songmid || track.songid}`,
    title,
    artist: (track.singer || []).map(s => s.name).join(' / ') || 'Unknown',
    coverUrl,
    type,
    duration: track.interval || 0,
    sources: streamUrl ? [{
      platform: 'other',
      streamUrl,
      downloadUrl: streamUrl,
      quality: '320',
    }] : [],
    tags: [],
    popularity: 80,
    sourceLabel: streamUrl ? '完整' : '试听',
  };
}

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
      n: String(Math.min(limit, 20)),
      w: query,
      format: 'json',
    });

    const res = await fetch(`${SEARCH_API}?${params}`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(6000),
    });
    const data = await res.json();
    const tracks: QQTrack[] = data?.data?.song?.list || [];
    if (!tracks.length) return [];

    // Get stream URLs for first 8 songs
    const urlMap = await getQQStreamUrls(tracks.slice(0, 8));

    return tracks.map(t => mapTrack(t, urlMap.get(t.songmid)));
  } catch {
    return [];
  }
}

async function getQQStreamUrls(tracks: QQTrack[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const track of tracks) {
    try {
      const reqData = {
        req_0: {
          module: 'vkey.GetVkeyServer',
          method: 'CgiGetVkey',
          param: {
            guid: String(Math.floor(Math.random() * 1e10)),
            songmid: [track.songmid],
            songtype: [0],
            uin: '0',
            loginflag: 1,
            platform: '20',
          },
        },
      };

      const res = await fetch(`${SONG_URL_API}?format=json&data=${encodeURIComponent(JSON.stringify(reqData))}`, {
        headers: HEADERS,
        signal: AbortSignal.timeout(4000),
      });
      const data = await res.json();
      const midurlinfo = data?.req_0?.data?.midurlinfo || [];
      const sip = data?.req_0?.data?.sip || [];
      const server = sip.length > 0 ? sip[0] : '';
      const purl = midurlinfo[0]?.purl || '';
      if (server && purl && !purl.includes('C400') === false) {
        map.set(track.songmid, `${server}${purl}`);
      }
    } catch {}
  }
  return map;
}

const GENRE_QUERIES: Record<string, string[]> = {
  '华语流行': ['周杰伦', '陈奕迅', '林俊杰', '薛之谦', '邓紫棋', '热门', '新歌'],
  '欧美': ['Taylor Swift', 'Ed Sheeran', 'The Weeknd', 'Billie Eilish', '欧美流行'],
  '韩语': ['BTS', 'Blackpink', 'IU', 'k-pop', '韩国'],
  '日语': ['米津玄师', 'YOASOBI', 'ado', '日语', '日本流行'],
  '摇滚': ['摇滚', 'Beyond', 'Imagine Dragons', 'Queen'],
  '民谣': ['民谣', '赵雷', '宋冬野', '房东的猫'],
  '说唱': ['说唱', 'rap', 'Eminem', '中国新说唱'],
  '电音': ['电音', 'EDM', 'Alan Walker', 'Marshmello'],
  '经典': ['经典老歌', '怀旧', '邓丽君', '张国荣', '刘德华'],
  'R&B': ['R&B', 'rnb', '陶喆', '方大同'],
  '爵士': ['爵士', 'jazz', '王家卫', '小野丽莎'],
};

export function getGenreQueries(genreKey: string): string[] {
  return GENRE_QUERIES[genreKey] || [];
}
