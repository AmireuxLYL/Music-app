// YouTube music source — uses ytdl-core for audio streaming
// YouTube has the largest music catalog and fast global CDN

import type { Song, Source } from '@/lib/types';
import ytdl from '@distube/ytdl-core';

function mapVideo(info: ytdl.videoInfo): Song {
  const details = info.videoDetails;
  const formats = info.formats.filter(f => f.hasAudio && !f.hasVideo);
  const bestAudio = formats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];

  let type: Song['type'] = 'original';
  const title = (details.title || '').toLowerCase();
  if (title.includes('instrumental') || title.includes('karaoke') || title.includes('伴奏') || title.includes('纯音乐')) {
    type = 'instrumental';
  } else if (title.includes('cover') || title.includes('翻唱')) {
    type = 'cover';
  } else if (title.includes('piano') || title.includes('orchestral') || title.includes('纯音乐')) {
    type = 'pure_music';
  }

  return {
    id: `yt-${details.videoId}`,
    title: details.title || 'Unknown',
    artist: details.ownerChannelName || details.author?.name || 'YouTube',
    coverUrl: details.thumbnails?.[details.thumbnails.length - 1]?.url || '',
    type,
    duration: parseInt(details.lengthSeconds || '0', 10),
    sources: bestAudio ? [{
      platform: 'youtube',
      streamUrl: bestAudio.url,
      downloadUrl: bestAudio.url,
      quality: '128' as const,
    }] : [],
    tags: details.keywords || [],
    popularity: parseInt(details.viewCount || '0', 10) > 1000000 ? 90 : 70,
    sourceLabel: '完整',
  };
}

export async function searchYouTube(query: string, limit: number = 10): Promise<Song[]> {
  try {
    // Use yt-dlp's search via ytdl-core
    const searchQuery = `${query} music audio`;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });

    const html = await response.text();

    // Extract video IDs from YouTube search results
    const videoIds: string[] = [];
    const matches = html.matchAll(/\/watch\?v=([a-zA-Z0-9_-]{11})/g);
    for (const m of matches) {
      if (!videoIds.includes(m[1])) videoIds.push(m[1]);
      if (videoIds.length >= limit) break;
    }

    if (videoIds.length === 0) return [];

    // Get video info for each
    const songs: Song[] = [];
    for (const id of videoIds) {
      try {
        const info = await ytdl.getInfo(id);
        songs.push(mapVideo(info));
      } catch {
        // Skip failed videos
      }
    }

    return songs;
  } catch {
    return [];
  }
}

export async function getYouTubeTrending(limit: number = 10): Promise<Song[]> {
  const queries = [
    'top music hits 2024',
    'popular songs 2024',
    '华语歌曲 热门',
    'chinese pop music',
    'global top hits',
  ];
  const query = queries[Math.floor(Math.random() * queries.length)];
  return searchYouTube(query, limit);
}

/**
 * Get audio stream URL for a YouTube video.
 * The URLs expire after a few hours, so this should be called per-play.
 */
export async function getYouTubeStreamUrl(videoId: string): Promise<string | null> {
  try {
    const info = await ytdl.getInfo(videoId);
    const formats = info.formats.filter(f => f.hasAudio && !f.hasVideo);
    const best = formats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];
    return best?.url || null;
  } catch {
    return null;
  }
}
