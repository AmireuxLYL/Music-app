// iTunes Search API — completely free, no auth needed
// Returns real music previews (30-sec clips) + cover art

import type { Song, Source } from '@/lib/types';

interface ITunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl: string;
  trackTimeMillis: number;
  primaryGenreName: string;
}

function mapTrack(track: ITunesTrack): Song {
  const sources: Source[] = track.previewUrl
    ? [{ platform: 'other', streamUrl: track.previewUrl, downloadUrl: track.previewUrl, quality: '320' }]
    : [];

  let type: Song['type'] = 'original';
  const name = track.trackName.toLowerCase();
  if (name.includes('instrumental') || name.includes('karaoke') || name.includes('伴奏')) {
    type = 'instrumental';
  } else if (name.includes('cover') || name.includes('翻唱')) {
    type = 'cover';
  } else if (name.includes('piano') || name.includes('orchestral') || name.includes('纯音乐')) {
    type = 'pure_music';
  }

  return {
    id: `itunes-${track.trackId}`,
    title: track.trackName,
    artist: track.artistName,
    coverUrl: track.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
    type,
    duration: Math.round(track.trackTimeMillis / 1000),
    sources,
    tags: track.primaryGenreName ? [track.primaryGenreName] : [],
    popularity: 80,
    sourceLabel: '试听 30s',
  };
}

export async function searchITunes(query: string, type?: string, limit: number = 20): Promise<Song[]> {
  // Build search query with type hints
  let searchTerm = query;
  if (type === 'instrumental') searchTerm += ' instrumental karaoke';
  else if (type === 'pure_music') searchTerm += ' instrumental piano orchestral';
  else if (type === 'cover') searchTerm += ' cover';

  const params = new URLSearchParams({
    term: searchTerm,
    media: 'music',
    limit: String(limit),
  });

  try {
    const res = await fetch(`https://itunes.apple.com/search?${params}`);
    const data = await res.json();
    if (!data.results) return [];
    return data.results.map(mapTrack);
  } catch {
    return [];
  }
}

export async function getITunesTrending(limit: number = 20): Promise<Song[]> {
  // Use popular search terms to simulate trending
  const queries = ['pop', 'rock', 'hip-hop', 'rnb', 'electronic', 'mandopop', 'k-pop', 'jazz'];
  const query = queries[Math.floor(Math.random() * queries.length)];

  try {
    const params = new URLSearchParams({
      term: query,
      media: 'music',
      limit: String(limit),
    });
    const res = await fetch(`https://itunes.apple.com/search?${params}`);
    const data = await res.json();
    if (!data.results) return [];
    return data.results.map(mapTrack).sort(() => Math.random() - 0.5);
  } catch {
    return [];
  }
}
