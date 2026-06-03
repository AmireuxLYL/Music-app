'use client';

import { useAudio } from '@/hooks/useAudio';
import { useRouter } from 'next/navigation';
import { addFavorite, removeFavorite, isFavorite, recordInteraction } from '@/lib/db/indexeddb';
import { useState, useEffect, useCallback } from 'react';

export default function FullPlayer() {
  const {
    currentSong, isPlaying, currentTime, duration,
    volume, queueIndex, queue,
    pause, resume, stop, prev, next, seek, setVolume, volumeUp, volumeDown,
  } = useAudio();
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
        <div className="text-center">
          <p className="text-7xl mb-4">🐾</p>
          <p className="text-text-muted text-lg">还没有播放歌曲哦</p>
          <p className="mt-2 text-sm text-text-muted">去首页刷一刷，发现好音乐 🎵</p>
        </div>
      </div>
    );
  }

  const toggleLike = () => {
    if (liked) { removeFavorite(currentSong.id); setLiked(false); }
    else { addFavorite(currentSong.id); setLiked(true); recordInteraction(currentSong.id, 'like'); }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  }, [duration, seek]);

  const coverStyle: React.CSSProperties = {
    boxShadow: '0 20px 80px rgba(0,0,0,0.5), 0 0 0 8px rgba(8,20,40,0.6), 0 0 0 10px rgba(56,200,232,0.3), 0 0 60px rgba(50,152,240,0.4)',
    animation: isPlaying ? 'spin 14s linear infinite' : 'none',
  };
  if (currentSong.coverUrl) {
    coverStyle.backgroundImage = `url(${currentSong.coverUrl})`;
    coverStyle.backgroundSize = 'cover';
    coverStyle.backgroundPosition = 'center';
  } else {
    coverStyle.background = 'linear-gradient(135deg, #3298f0, #38c8e8, #ff6e8a)';
  }

  return (
    <div className="relative flex min-h-screen flex-col ocean-gradient overflow-hidden">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute top-20 right-8 text-4xl opacity-20" style={{ animation: 'twinkle 3s ease-in-out infinite' }}>⭐</span>
        <span className="absolute top-1/3 right-12 text-3xl opacity-12" style={{ animation: 'twinkle 4s ease-in-out 1s infinite' }}>🌟</span>
        <span className="absolute bottom-1/3 left-8 text-2xl opacity-10" style={{ animation: 'twinkle 2.5s ease-in-out 0.5s infinite' }}>✨</span>
        <span className="absolute top-32 left-10 text-2xl opacity-12" style={{ animation: 'floatSparkle 5s ease-in-out infinite' }}>🌺</span>
      </div>

      {/* Ocean glow */}
      <div className="absolute top-0 left-0 right-0 h-[60%] opacity-20" style={{
        background: 'linear-gradient(180deg, #3298f0, #38c8e8, #ff6e8a, transparent)',
        filter: 'blur(120px)',
        transform: 'scale(1.6)',
      }} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 text-text-secondary">
        <button onClick={() => router.back()} className="rounded-full p-2 text-xl transition-colors hover:bg-white/10">✕</button>
        <span className="text-xs font-medium">
          {queue.length > 1 ? `${queueIndex + 1} / ${queue.length}` : '正在播放'}
        </span>
        <button onClick={toggleLike} className="rounded-full p-2 text-lg transition-colors" style={{ color: liked ? '#ff6e8a' : '#aaa' }}>
          {liked ? '💙' : '🤍'}
        </button>
      </div>

      {/* Album cover */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        <div style={{ perspective: '1000px' }}>
          <div className="absolute -inset-8 rounded-full opacity-25" style={{
            background: 'conic-gradient(from 0deg, #1a3050, #0b1d3a, #1a3050, #0b1d3a, #1a3050)',
            animation: isPlaying ? 'spin 14s linear infinite' : 'none',
          }} />

          <div className={`relative z-10 h-[280px] w-[280px] rounded-full flex items-center justify-center ${isPlaying ? 'cover-glow' : ''}`} style={coverStyle}>
            {!currentSong.coverUrl && <span className="text-9xl">🐾</span>}
            <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background border-2 border-[#1a2a3a]" />
          </div>
        </div>

        {/* Song info */}
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold text-white">{currentSong.title}</h1>
          <p className="mt-2 text-base text-text-secondary">
            {currentSong.artist}
            {currentSong.type !== 'original' && (
              <span className="ml-2 inline-block rounded-full bg-white/10 px-3 py-0.5 text-xs text-text-secondary">
                {currentSong.type === 'instrumental' ? '🎹 伴奏' : currentSong.type === 'pure_music' ? '🎻 纯音乐' : '🎙 翻唱'}
              </span>
            )}
          </p>
          {currentSong.sourceLabel && (
            <span className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{
                background: currentSong.sourceLabel.includes('完整') ? 'rgba(107,203,119,0.15)' : 'rgba(255,165,2,0.15)',
                color: currentSong.sourceLabel.includes('完整') ? '#6bcb77' : '#ffa502',
              }}>
              {currentSong.sourceLabel.includes('完整') ? '🎧 完整歌曲' : '⏱ 试听'}
            </span>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 px-6 pb-4">
        {/* Progress bar — seekable */}
        <div className="mb-2">
          <div
            className="group relative h-2 w-full cursor-pointer rounded-full bg-white/10"
            onClick={handleSeek}
          >
            <div className="h-full rounded-full" style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #3298f0, #38c8e8)',
            }} />
            {/* Seek handle */}
            <div className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 8px)` }} />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-text-muted">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume — up/down buttons */}
        <div className="flex items-center gap-2 mb-4 px-4">
          <button onClick={volumeDown} className="text-sm text-text-muted hover:text-white transition-colors px-1">🔈</button>
          <div
            className="flex-1 h-1.5 rounded-full bg-white/10 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              setVolume(ratio);
            }}
          >
            <div className="h-full rounded-full" style={{
              width: `${volume * 100}%`,
              background: 'linear-gradient(90deg, #3298f0, #38c8e8)',
            }} />
          </div>
          <button onClick={volumeUp} className="text-sm text-text-muted hover:text-white transition-colors px-1">🔊</button>
          <span className="text-[11px] text-text-muted w-10 text-right">{Math.round(volume * 100)}%</span>
        </div>

        {/* Main controls — prev / play / next */}
        <div className="flex items-center justify-center gap-8">
          <button onClick={prev} className="text-2xl text-white transition-transform active:scale-90 hover:text-primary transition-colors">
            ⏮
          </button>
          <button onClick={() => isPlaying ? pause() : resume()}
            className="flex h-16 w-16 items-center justify-center rounded-full text-3xl text-white transition-transform active:scale-95"
            style={{ background: 'linear-gradient(135deg, #3298f0, #1a6fc4)', boxShadow: isPlaying ? '0 0 50px rgba(50,152,240,0.5), 0 0 90px rgba(56,200,232,0.2)' : '0 4px 20px rgba(50,152,240,0.2)' }}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={next} className="text-2xl text-white transition-transform active:scale-90 hover:text-primary transition-colors">
            ⏭
          </button>
        </div>

        {/* Bottom actions */}
        <div className="mt-6 flex items-center justify-around text-sm">
          <button onClick={toggleLike} className="flex flex-col items-center gap-1 transition-colors" style={{ color: liked ? '#ff6e8a' : '#8baac8' }}>
            <span className="text-lg">{liked ? '💙' : '🤍'}</span>
            <span className="text-xs">{liked ? '已收藏' : '收藏'}</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-text-secondary transition-colors hover:text-white">
            <span className="text-lg">📋</span>
            <span className="text-xs">歌词</span>
          </button>
          <button onClick={() => { recordInteraction(currentSong.id, 'share'); navigator.share?.({ title: currentSong.title }); }} className="flex flex-col items-center gap-1 text-text-secondary transition-colors hover:text-white">
            <span className="text-lg">🔗</span>
            <span className="text-xs">分享</span>
          </button>
        </div>
      </div>
    </div>
  );
}
