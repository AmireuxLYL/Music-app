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
    return <span className={`flex items-center gap-1 ${className}`} style={{ color: '#2ed573' }}>✅ 已下载</span>;
  }

  if (isDownloading(song.id)) {
    const pct = Math.round(getProgress(song.id));
    return <span className={`flex items-center gap-1 ${className}`} style={{ color: '#aaa' }}>📥 {pct}%</span>;
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); download(song); }}
      className={`flex items-center gap-1 transition-colors hover:text-white ${className}`}
      style={{ color: '#aaa' }}
    >
      ⬇ 下载
    </button>
  );
}
