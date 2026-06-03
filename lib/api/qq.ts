// QQ Music (QQ音乐) — 30M+ songs, Chinese music giant
import type { Song, Source } from '@/lib/types';

const PROXY = 'http://localhost:4002';

function mapSong(item: any, streamUrl?: string): Song {
  const name = (item.name || '').toLowerCase();
  let type: Song['type'] = 'original';
  if (name.includes('伴奏') || name.includes('instrumental')) type = 'instrumental';
  else if (name.includes('纯音乐') || name.includes('piano')) type = 'pure_music';
  else if (name.includes('翻唱') || name.includes('cover')) type = 'cover';

  return {
    id: item.id,
    title: item.name || 'Unknown',
    artist: item.artist || 'Unknown',
    coverUrl: item.coverUrl || '',
    type,
    duration: Math.floor((item.duration || 0) / 1000),
    sources: streamUrl ? [{
      platform: 'other' as const,
      streamUrl,
      downloadUrl: streamUrl,
      quality: '320' as const,
    }] : [],
    tags: [],
    popularity: 80,
    sourceLabel: '完整',
  } as Song;
}

export async function searchQQ(query: string, limit: number = 20): Promise<Song[]> {
  try {
    const res = await fetch(`${PROXY}/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (!data.result?.songs) return [];

    // Get streaming URLs
    const songmids = data.result.songs.map((s: any) => s.songmid).filter(Boolean).join(',');
    let urlMap = new Map<string, string>();

    if (songmids) {
      const urlRes = await fetch(`${PROXY}/song_url?id=${songmids.split(',')[0]}`, {
        signal: AbortSignal.timeout(8000),
      });
      const urlData = await urlRes.json();
      if (urlData.data?.[0]?.url) {
        // Get URLs for first few songs only (QQ rate limits)
        for (const song of data.result.songs.slice(0, 5)) {
          try {
            const uRes = await fetch(`${PROXY}/song_url?id=${song.songmid}`, {
              signal: AbortSignal.timeout(5000),
            });
            const uData = await uRes.json();
            if (uData.data?.[0]?.url) urlMap.set(song.id, uData.data[0].url);
          } catch {}
        }
      }
    }

    return data.result.songs
      .map((s: any) => mapSong(s, urlMap.get(s.id)))
      .filter((s: Song) => s.sources.length > 0);
  } catch {
    return [];
  }
}

export async function getQQTrending(limit: number = 20): Promise<Song[]> {
  try {
    const res = await fetch(`${PROXY}/trending?limit=${limit}`, {
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (!data.result?.songs) return [];

    // Get URLs for first few songs
    let results: Song[] = [];
    for (const s of data.result.songs.slice(0, 8)) {
      try {
        const uRes = await fetch(`${PROXY}/song_url?id=${s.songmid}`, {
          signal: AbortSignal.timeout(5000),
        });
        const uData = await uRes.json();
        const url = uData.data?.[0]?.url;
        if (url) results.push(mapSong(s, url));
      } catch {}
    }

    return results;
  } catch {
    return [];
  }
}
