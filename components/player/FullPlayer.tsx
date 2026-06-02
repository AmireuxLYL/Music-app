'use client';

import { useAudio } from '@/hooks/useAudio';
import { useRouter } from 'next/navigation';
import { addFavorite, removeFavorite, isFavorite, recordInteraction } from '@/lib/db/indexeddb';
import { useState, useEffect } from 'react';
import ProgressBar from '@/components/ui/ProgressBar';
import DownloadButton from '@/components/download/DownloadButton';

const GRADIENTS = [
  'linear-gradient(135deg, #ff6b6b, #ff4757)',
  'linear-gradient(135deg, #ffa502, #ff6348)',
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #2ed573, #1e90ff)',
  'linear-gradient(135deg, #ff6b6b, #ffa502)',
  'linear-gradient(135deg, #e056a0, #764ba2)',
  'linear-gradient(135deg, #00d2d3, #54a0ff)',
  'linear-gradient(135deg, #f368e0, #ff6b6b)',
];

function getGradient(id: string): string {
  const idx = parseInt(id, 10) || id.charCodeAt(0);
  return GRADIENTS[idx % GRADIENTS.length];
}

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
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-text-muted">没有正在播放的歌曲</p>
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

  const coverGradient = getGradient(currentSong.id);
  const typeLabel: Record<string, string> = {
    original: '',
    instrumental: '伴奏',
    pure_music: '纯音乐',
    cover: '翻唱',
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      {/* Blurred background */}
      <div className="absolute top-0 left-0 right-0 h-[60%] opacity-20" style={{
        background: coverGradient,
        filter: 'blur(80px)',
        transform: 'scale(1.5)',
      }} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 text-text-secondary">
        <button onClick={() => router.back()} className="rounded-full p-2 text-xl transition-colors hover:bg-white/10">↓</button>
        <span className="text-xs font-medium">正在播放</span>
        <button className="rounded-full p-2 text-lg transition-colors hover:bg-white/10">⋯</button>
      </div>

      {/* Album cover - vinyl style */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        <div style={{ perspective: '1000px' }}>
          {/* Vinyl ring */}
          <div className={`vinyl-ring absolute -inset-8 ${isPlaying ? 'vinyl-spin' : ''}`}
            style={{ opacity: 0.25 }} />

          {/* Cover */}
          <div
            className={`relative z-10 h-[280px] w-[280px] rounded-full ${isPlaying ? 'vinyl-spin cover-glow' : 'vinyl-spin-slow vinyl-paused'}`}
            style={{
              background: currentSong.coverUrl
                ? `url(${currentSong.coverUrl}) center/cover`
                : coverGradient,
              boxShadow: '0 24px 100px rgba(0,0,0,0.6), 0 0 0 10px rgba(0,0,0,0.3), 0 0 0 12px rgba(255,255,255,0.04)',
            }}
          >
            <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0f0f0f] border-2 border-[#1a1a1a]" />
          </div>
        </div>

        {/* Song info */}
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold text-white">{currentSong.title}</h1>
          <p className="mt-2 text-base text-text-secondary">
            {currentSong.artist}
            {typeLabel[currentSong.type] && (
              <span className="ml-2 inline-block rounded-full bg-white/10 px-3 py-0.5 text-xs">{typeLabel[currentSong.type]}</span>
            )}
          </p>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 px-6 pb-6">
        <ProgressBar current={currentTime} total={duration} onSeek={seek} className="mb-4" />

        {/* Main controls */}
        <div className="flex items-center justify-center gap-10">
          <button className="text-2xl text-text-secondary transition-colors hover:text-white">🔀</button>
          <button className="text-3xl text-white transition-transform active:scale-90" onClick={stop}>⏮</button>
          <button
            onClick={() => (isPlaying ? pause() : resume())}
            className="flex h-16 w-16 items-center justify-center rounded-full text-3xl text-white transition-transform active:scale-95 neon-glow"
            style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff6348)' }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="text-3xl text-white transition-transform active:scale-90">⏭</button>
          <button className="text-2xl text-text-secondary transition-colors hover:text-white">🔁</button>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-around text-sm">
          <button onClick={toggleLike} className={`flex flex-col items-center gap-1 transition-colors ${liked ? 'text-primary' : 'text-text-secondary hover:text-white'}`}>
            <span className="text-lg">{liked ? '❤️' : '🤍'}</span>
            <span className="text-xs">{liked ? '已收藏' : '收藏'}</span>
          </button>
          <DownloadButton song={currentSong} />
          <button className="flex flex-col items-center gap-1 text-text-secondary transition-colors hover:text-white">
            <span className="text-lg">📋</span>
            <span className="text-xs">歌词</span>
          </button>
          <button
            onClick={() => {
              recordInteraction(currentSong.id, 'share');
              navigator.share?.({ title: currentSong.title, url: window.location.href });
            }}
            className="flex flex-col items-center gap-1 text-text-secondary transition-colors hover:text-white"
          >
            <span className="text-lg">🔗</span>
            <span className="text-xs">分享</span>
          </button>
        </div>
      </div>
    </div>
  );
}
