'use client';

import { useState, useEffect } from 'react';
import type { Song } from '@/lib/types';
import { useDownload } from '@/hooks/useDownload';
import { getDownload } from '@/lib/db/indexeddb';

interface DownloadButtonProps {
  song: Song;
  className?: string;
}

export default function DownloadButton({ song, className = '' }: DownloadButtonProps) {
  const { download, isDownloading, getProgress } = useDownload();
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    getDownload(song.id).then((item) => setDownloaded(!!item));
  }, [song.id]);

  if (downloaded) {
    return (
      <div className={`flex flex-col items-center gap-1 ${className}`} style={{ color: '#6bcb77' }}>
        <span className="text-lg">✅</span>
        <span className="text-xs">已下载</span>
      </div>
    );
  }

  if (isDownloading(song.id)) {
    const pct = Math.round(getProgress(song.id));
    return (
      <div className={`flex flex-col items-center gap-1 ${className}`} style={{ color: '#f472b6' }}>
        <span className="text-lg">📥</span>
        <span className="text-xs">{pct}%</span>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); download(song); }}
      className={`flex flex-col items-center gap-1 transition-colors hover:text-white ${className}`}
      style={{ color: '#aaa' }}
    >
      <span className="text-lg">⬇️</span>
      <span className="text-xs">下载</span>
    </button>
  );
}
