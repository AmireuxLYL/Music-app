// JioSaavn music API — full songs, 320kbps, DRM-free
// Uses JioSaavn's internal API with DES decryption for media URLs

import type { Song, Source } from '@/lib/types';
import CryptoJS from 'crypto-js';

const API_BASE = 'https://www.jiosaavn.com/api.php';

interface JioSaavnSong {
  id: string;
  song: string;
  singers: string;
  image: string;
  duration: string;
  year: string;
  album: string;
  encrypted_media_url: string;
  encrypted_media_path: string;
  '320kbps': string;
  perma_url: string;
  language: string;
  play_count: string;
  is_drm: string;
  media_preview_url?: string;
}

/**
 * Decrypt JioSaavn's encrypted media URL.
 * Algorithm: DES-ECB with key "38346591", no padding
 */
function decryptUrl(encrypted: string): string {
  try {
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const encryptedBytes = CryptoJS.enc.Base64.parse(encrypted);
    const decrypted = CryptoJS.DES.decrypt(
      { ciphertext: encryptedBytes } as CryptoJS.lib.CipherParams,
      key,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
}

function mapSong(js: JioSaavnSong): Song {
  const decrypted = decryptUrl(js.encrypted_media_url);
  // Clean up the decrypted URL (remove garbage padding)
  const cleanUrl = decrypted.replace(/[^\x20-\x7E]/g, '').trim();
  // Extract actual URL from the decrypted string
  const urlMatch = cleanUrl.match(/https?:\/\/[^\s"']+/);
  const streamUrl = urlMatch ? urlMatch[0] : '';

  let type: Song['type'] = 'original';
  const title = (js.song || '').toLowerCase();
  if (title.includes('instrumental') || title.includes('karaoke') || title.includes('伴奏')) {
    type = 'instrumental';
  } else if (title.includes('cover') || title.includes('翻唱')) {
    type = 'cover';
  }

  return {
    id: `js-${js.id}`,
    title: js.song || 'Unknown',
    artist: js.singers || 'Unknown Artist',
    coverUrl: js.image?.replace('150x150', '500x500') || '',
    type,
    duration: parseInt(js.duration || '0', 10),
    sources: streamUrl ? [{
      platform: 'other',
      streamUrl,
      downloadUrl: streamUrl,
      quality: js['320kbps'] === 'true' ? '320' : '128',
    }] : [],
    tags: [js.language, js.year].filter(Boolean),
    popularity: parseInt(js.play_count || '0', 10) > 10000 ? 85 : 70,
    sourceLabel: '完整',
  };
}

export async function searchJioSaavn(query: string, limit: number = 10): Promise<Song[]> {
  try {
    const params = new URLSearchParams({
      __call: 'search.getResults',
      _format: 'json',
      _marker: '0',
      ctx: 'web6dot0',
      q: query,
      n: String(Math.min(limit, 20)),
    });

    const res = await fetch(`${API_BASE}?${params}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json();
    if (!data.results) return [];

    // Now get song details (encrypted URLs) for each result
    const songIds = data.results.slice(0, limit).map((r: { id: string }) => r.id);
    if (songIds.length === 0) return [];

    const detailParams = new URLSearchParams({
      __call: 'song.getDetails',
      _format: 'json',
      ctx: 'web6dot0',
      _marker: '0',
      pids: songIds.join(','),
    });

    const detailRes = await fetch(`${API_BASE}?${detailParams}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    });

    const detailData = await detailRes.json();
    if (!detailData.songs) return [];

    return detailData.songs.map(mapSong).filter((s: Song) => s.sources.length > 0);
  } catch {
    return [];
  }
}

export async function getJioSaavnTrending(limit: number = 10): Promise<Song[]> {
  const queries = ['top hits', 'trending', 'popular songs', 'best of', 'chartbusters'];
  const query = queries[Math.floor(Math.random() * queries.length)];
  return searchJioSaavn(query, limit);
}
