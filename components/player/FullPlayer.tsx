'use client';

import { useAudio } from '@/hooks/useAudio';
import { useRouter } from 'next/navigation';
import { addFavorite, removeFavorite, isFavorite, recordInteraction } from '@/lib/db/indexeddb';
import { useState, useEffect } from 'react';
import CoverArt from '@/components/ui/CoverArt';
import ProgressBar from '@/components/ui/ProgressBar';
import DownloadButton from '@/components/download/DownloadButton';

export default function FullPlayer() {
  const { currentSong, isPlaying, currentTime, duration, pause, resume, stop, seek } = useAudio();
  const router = useRouter();
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (currentSong) {
      isFavorite(currentSong.id).then(setLiked);
    }
  }, [currentSong]);

  if (!currentSong) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p style={{ color: '#666' }}>没有正在播放的歌曲</p>
      </div>
    );
  }

  const toggleLike = () => {
    if (liked) {
      removeFavorite(currentSong.id);
      setLiked(false);
    } else {
      addFavorite(currentSong.id);
      setLiked(true);
      recordInteraction(currentSong.id, 'like');
    }
  };

  const typeLabel: Record<string, string> = {
    original: '🎤 原唱',
    instrumental: '🎹 伴奏',
    pure_music: '🎻 纯音乐',
    cover: '🎙 翻唱',
  };

  return (
    <div className="flex min-h-screen flex-col justify-between px-6 pb-8 pt-4" style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #0a1628 60%, #0f0f0f 100%)' }}>
      <div className="flex items-center justify-between text-sm" style={{ color: '#aaa' }}>
        <button onClick={() => router.back()}>⬇</button>
        <span className="text-xs">正在播放</span>
        <button>⋯</button>
      </div>

      <div className="flex flex-col items-center">
        <CoverArt src={currentSong.coverUrl} size="lg" />
        <h2 className="mt-6 text-xl font-bold text-white">{currentSong.title}</h2>
        <p className="mt-1 text-sm" style={{ color: '#aaa' }}>{currentSong.artist}</p>
        <span className="mt-2 rounded-lg border px-3 py-0.5 text-xs" style={{ borderColor: 'rgba(255,107,107,0.3)', background: 'rgba(255,107,107,0.15)', color: '#ff6b6b' }}>
          {typeLabel[currentSong.type] || currentSong.type}
        </span>
      </div>

      <div className="mt-6">
        <ProgressBar current={currentTime} total={duration} onSeek={seek} />
      </div>

      <div className="mt-4 flex items-center justify-center gap-8">
        <button className="text-xl" style={{ color: '#aaa' }}>🔀</button>
        <button className="text-2xl text-white" onClick={stop}>⏮</button>
        <button
          onClick={() => (isPlaying ? pause() : resume())}
          className="flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white"
          style={{ background: '#ff6b6b', boxShadow: '0 4px 30px rgba(255,107,107,0.5)' }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="text-2xl text-white">⏭</button>
        <button className="text-xl" style={{ color: '#aaa' }}>🔁</button>
      </div>

      <div className="mt-6 flex items-center justify-around text-sm">
        <button onClick={toggleLike} className="flex items-center gap-1" style={{ color: liked ? '#ff6b6b' : '#aaa' }}>
          {liked ? '❤️' : '🤍'} 收藏
        </button>
        <DownloadButton song={currentSong} />
        <button className="flex items-center gap-1" style={{ color: '#aaa' }}>📋 歌词</button>
        <button
          onClick={() => {
            recordInteraction(currentSong.id, 'share');
            navigator.share?.({ title: currentSong.title, url: window.location.href });
          }}
          className="flex items-center gap-1"
          style={{ color: '#aaa' }}
        >
          🔗 分享
        </button>
      </div>
    </div>
  );
}
