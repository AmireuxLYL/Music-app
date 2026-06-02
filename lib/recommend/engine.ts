import type { Song } from '@/lib/types';
import { db } from '@/lib/db/indexeddb';

export function calculateScore(song: Song, likedTags: Set<string>): number {
  let score = song.popularity / 100;
  for (const tag of song.tags) {
    if (likedTags.has(tag)) {
      score += 0.3;
    }
  }
  return score;
}

export async function getLikedTags(): Promise<Set<string>> {
  await db.favorites.toArray();
  await db.interactions.where('action').equals('like').toArray();
  return new Set<string>();
}

export function rankSongs(songs: Song[], likedTags: Set<string>): Song[] {
  const scored = songs.map((song) => ({
    song,
    score: calculateScore(song, likedTags),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.song);
}

export function selectPage(
  songs: Song[],
  cursor: string | null,
  pageSize: number = 10
): { songs: Song[]; cursor: string | null } {
  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const page = songs.slice(startIndex, startIndex + pageSize);
  const nextIndex = startIndex + pageSize;
  return {
    songs: page,
    cursor: nextIndex < songs.length ? String(nextIndex) : null,
  };
}
