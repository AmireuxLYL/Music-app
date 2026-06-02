import Dexie, { Table } from 'dexie';
import type { DownloadItem, HistoryItem, Interaction } from '@/lib/types';

class MusicDB extends Dexie {
  downloads!: Table<DownloadItem, string>;
  favorites!: Table<{ songId: string }, string>;
  history!: Table<HistoryItem, string>;
  interactions!: Table<Interaction, string>;

  constructor() {
    super('MusicAppDB');
    this.version(1).stores({
      downloads: 'songId',
      favorites: 'songId',
      history: 'songId',
      interactions: '++id, songId, action, timestamp',
    });
  }
}

export const db = new MusicDB();

export async function addFavorite(songId: string): Promise<void> {
  await db.favorites.put({ songId });
}

export async function removeFavorite(songId: string): Promise<void> {
  await db.favorites.delete(songId);
}

export async function isFavorite(songId: string): Promise<boolean> {
  const item = await db.favorites.get(songId);
  return !!item;
}

export async function getAllFavorites(): Promise<string[]> {
  const items = await db.favorites.toArray();
  return items.map((i) => i.songId);
}

export async function addHistory(songId: string, progress: number): Promise<void> {
  await db.history.put({ songId, playedAt: Date.now(), progress });
}

export async function getHistory(limit: number = 50): Promise<HistoryItem[]> {
  return db.history.orderBy('playedAt').reverse().limit(limit).toArray();
}

export async function addDownload(item: DownloadItem): Promise<void> {
  await db.downloads.put(item);
}

export async function removeDownload(songId: string): Promise<void> {
  await db.downloads.delete(songId);
}

export async function getDownload(songId: string): Promise<DownloadItem | undefined> {
  return db.downloads.get(songId);
}

export async function getAllDownloads(): Promise<DownloadItem[]> {
  return db.downloads.toArray();
}

export async function recordInteraction(
  songId: string,
  action: Interaction['action']
): Promise<void> {
  await db.interactions.add({ songId, action, timestamp: Date.now() });
}

export async function getInteractions(songId: string): Promise<Interaction[]> {
  return db.interactions.where('songId').equals(songId).toArray();
}
