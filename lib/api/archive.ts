// Internet Archive API — free, no auth, full-length audio
// https://archive.org/advancedsearch.php

import type { Song, Source } from '@/lib/types';

interface IADoc {
  identifier: string;
  title: string;
  creator?: string;
  description?: string;
  year?: string;
  subject?: string[];
  collection?: string[];
}

export async function searchArchive(query: string, limit: number = 20): Promise<Song[]> {
  try {
    const params = new URLSearchParams({
      q: `(${query}) AND mediatype:(audio) AND format:(MP3)`,
      fl: 'identifier,title,creator,description,year,subject,collection',
      sort: 'downloads desc',
      rows: String(limit),
      output: 'json',
    });

    const res = await fetch(`https://archive.org/advancedsearch.php?${params}`);
    const data = await res.json();
    if (!data.response?.docs) return [];

    return data.response.docs.map((doc: IADoc) => {
      const id = doc.identifier;
      const sources: Source[] = [
        {
          platform: 'other',
          streamUrl: `https://archive.org/download/${id}/${id}.mp3`,
          downloadUrl: `https://archive.org/download/${id}/${id}.mp3`,
          quality: '128',
        },
      ];

      let type: Song['type'] = 'original';
      const title = (doc.title || '').toLowerCase();
      if (title.includes('instrumental')) type = 'instrumental';
      else if (title.includes('cover')) type = 'cover';
      else if (title.includes('piano') || title.includes('classical')) type = 'pure_music';

      return {
        id: `ia-${id}`,
        title: doc.title || 'Unknown',
        artist: doc.creator || 'Unknown Artist',
        coverUrl: `https://archive.org/services/img/${id}`,
        type,
        duration: 200,
        sources,
        tags: doc.subject || [],
        popularity: 60,
        sourceLabel: '完整',
      };
    });
  } catch {
    return [];
  }
}

export async function getArchiveTrending(limit: number = 20): Promise<Song[]> {
  try {
    const queries = ['live music', 'jazz', 'rock concert', 'classical piano', 'electronic'];
    const query = queries[Math.floor(Math.random() * queries.length)];
    return searchArchive(query, limit);
  } catch {
    return [];
  }
}
