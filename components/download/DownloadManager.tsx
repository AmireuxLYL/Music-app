'use client';

import { useState, useEffect } from 'react';
import type { DownloadItem } from '@/lib/types';
import { getAllDownloads, removeDownload } from '@/lib/db/indexeddb';
import { useAudio } from '@/hooks/useAudio';

export default function DownloadManager() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const { play } = useAudio();

  const load = async () => {
    const items = await getAllDownloads();
    setDownloads(items);
  };

  useEffect(() => {
    load();
  }, []);

  if (downloads.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-5xl mb-3">🐾</p>
        <p className="text-text-muted">暂无下载的歌曲</p>
        <p className="mt-1 text-xs text-text-muted">搜索歌曲并点击下载即可离线收听</p>
      </div>
    );
  }

  const handleRemove = async (songId: string) => {
    await removeDownload(songId);
    await load();
  };

  const formatSize = (blob: Blob): string => {
    const mb = blob.size / (1024 * 1024);
    return mb < 1 ? `${(mb * 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-1.5 fade-in">
      {downloads.map((item) => (
        <div key={item.songId} className="flex items-center gap-3 rounded-xl p-3 card-hover" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div
            className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-lg"
            style={{ background: 'linear-gradient(135deg, #3298f0, #38c8e8)' }}
          >
            🐾
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{item.songInfo.title}</p>
            <p className="text-xs text-text-muted">{item.songInfo.artist} · {formatSize(item.blob)}</p>
          </div>
          <button
            onClick={() => {
              const url = URL.createObjectURL(item.blob);
              const offlineSong = { ...item.songInfo, sources: [{ platform: 'other' as const, streamUrl: url, downloadUrl: url, quality: item.quality }] };
              play(offlineSong);
            }}
            className="rounded-full p-2.5 text-lg transition-colors hover:bg-white/10 text-primary"
          >
            ▶️
          </button>
          <button
            onClick={() => handleRemove(item.songId)}
            className="rounded-full p-2 text-sm transition-colors hover:bg-white/10 text-text-muted"
          >
            🗑
          </button>
        </div>
      ))}
    </div>
  );
}
