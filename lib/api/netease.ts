// NetEase Cloud Music (网易云音乐) — direct API calls, no proxy needed
import type { Song } from '@/lib/types';

const SEARCH_API = 'https://music.163.com/api/search/get';
const SONG_URL_API = 'https://music.163.com/api/song/enhance/player/url';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://music.163.com/',
};

interface NeteaseTrack {
  id: number;
  name: string;
  artists: { name: string }[];
  album: { name: string; picUrl: string };
  duration: number;
}

function mapTrack(track: NeteaseTrack, streamUrl?: string): Song {
  const title = track.name || 'Unknown';
  const lower = title.toLowerCase();

  let type: Song['type'] = 'original';
  if (/伴奏|instrumental|karaoke/i.test(lower)) type = 'instrumental';
  else if (/纯音乐|piano|orchestral|轻音乐/i.test(lower)) type = 'pure_music';
  else if (/翻唱|cover/i.test(lower)) type = 'cover';

  return {
    id: `ncm-${track.id}`,
    title,
    artist: (track.artists || []).map(a => a.name).join(' / ') || 'Unknown',
    coverUrl: (track.album?.picUrl || '').replace('http://', 'https://'),
    type,
    duration: Math.floor((track.duration || 0) / 1000),
    sources: streamUrl ? [{
      platform: 'other',
      streamUrl,
      downloadUrl: streamUrl,
      quality: '320',
    }] : [],
    tags: [],
    popularity: 75,
    sourceLabel: streamUrl ? '完整' : '试听',
  };
}

export async function searchNetease(query: string, limit: number = 20): Promise<Song[]> {
  try {
    const params = new URLSearchParams({ s: query, type: '1', limit: String(Math.min(limit, 30)) });
    const res = await fetch(`${SEARCH_API}?${params}`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(6000),
    });
    const data = await res.json();
    const tracks: NeteaseTrack[] = data?.result?.songs || [];
    if (!tracks.length) return [];

    // Get stream URLs in batch
    const ids = tracks.slice(0, 10).map((t: NeteaseTrack) => t.id);
    const urlMap = await getStreamUrls(ids);

    return tracks.map(t => mapTrack(t, urlMap.get(String(t.id))));
  } catch {
    return [];
  }
}

async function getStreamUrls(ids: number[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const idParam = ids.map(id => `["${id}"]`).join(',');
    const url = `${SONG_URL_API}?id=${ids[0]}&ids=[${ids.join(',')}]&br=320000`;
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    (data?.data || []).forEach((item: { id: number; url: string }) => {
      if (item.url) map.set(String(item.id), item.url);
    });
  } catch {}
  return map;
}

const GENRE_QUERIES: Record<string, string[]> = {
  '华语流行': ['周杰伦', '陈奕迅', '林俊杰', '薛之谦', '邓紫棋', '蔡徐坤', '热门华语'],
  '欧美': ['Taylor Swift', 'Ed Sheeran', 'The Weeknd', 'Dua Lipa', 'Billie Eilish', 'top hits'],
  '韩语': ['BTS', 'Blackpink', 'IU', 'Twice', 'NewJeans', 'k-pop'],
  '日语': ['YOASOBI', '米津玄师', 'Official髭男dism', 'ado', 'j-pop'],
  '摇滚': ['摇滚', 'rock', 'Imagine Dragons', 'Queen', 'beyond'],
  '民谣': ['民谣', 'folk', '赵雷', '宋冬野', '房东的猫'],
  '说唱': ['说唱', 'rap', 'hip hop', 'Eminem', 'Drake'],
  '电音': ['电音', 'EDM', 'electronic', 'Marshmello', 'Alan Walker'],
  '经典': ['经典老歌', '怀旧', 'classic', 'Beatles', '邓丽君', '张国荣'],
  'R&B': ['R&B', 'rnb', 'soul', 'Bruno Mars', 'SZA'],
  '爵士': ['爵士', 'jazz', 'bossa nova', 'Norah Jones'],
};

export function getGenreQueries(genreKey: string): string[] {
  return GENRE_QUERIES[genreKey] || [];
}

export function getAllGenreQueries(): Record<string, string[]> {
  return GENRE_QUERIES;
}
