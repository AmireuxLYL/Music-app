'use client';

import { useState, useCallback } from 'react';
import type { Song, DownloadItem } from '@/lib/types';
import { addDownload, getDownload, removeDownload, getAllDownloads, recordInteraction } from '@/lib/db/indexeddb';
import { getDownloadUrl } from '@/lib/api/client';

export function useDownload() {
  const [downloading, setDownloading] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Record<string, number>>({});

  const download = useCallback(async (song: Song) => {
    if (downloading.has(song.id)) return;

    const existing = await getDownload(song.id);
    if (existing) return;

    setDownloading((prev) => new Set(prev).add(song.id));

    try {
      const url = getDownloadUrl(song.id);
      const response = await fetch(url);

      if (!response.ok) throw new Error('Download failed');

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total > 0) {
          setProgress((prev) => ({ ...prev, [song.id]: (received / total) * 100 }));
        }
      }

      const blob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
      const item: DownloadItem = {
        songId: song.id,
        songInfo: song,
        blob,
        quality: '320',
        downloadedAt: Date.now(),
      };

      await addDownload(item);
      await recordInteraction(song.id, 'download');
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading((prev) => {
        const next = new Set(prev);
        next.delete(song.id);
        return next;
      });
      setProgress((prev) => {
        const next = { ...prev };
        delete next[song.id];
        return next;
      });
    }
  }, [downloading]);

  const isDownloading = useCallback(
    (songId: string) => downloading.has(songId),
    [downloading]
  );

  const getProgress = useCallback(
    (songId: string) => progress[songId] ?? 0,
    [progress]
  );

  return { download, isDownloading, getProgress, removeDownload, getDownload, getAllDownloads };
}
