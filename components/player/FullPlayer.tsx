'use client';

import { useAudio } from '@/hooks/useAudio';
import { useRouter } from 'next/navigation';
import { addFavorite, removeFavorite, isFavorite, recordInteraction } from '@/lib/db/indexeddb';
import { useState, useEffect } from 'react';
import ProgressBar from '@/components/ui/ProgressBar';
import DownloadButton from '@/components/download/DownloadButton';

export default function FullPlayer() {
  const { currentSong, isPlaying, currentTime, duration, volume, setVolume, pause, resume, stop, seek } = useAudio();
  const router = useRouter();
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (currentSong) {
      isFavorite(currentSong.id).then(setLiked);
    }
  }, [currentSong]);

  if (!currentSong) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a1628]">
        <div className="text-center">
          <p className="text-6xl mb-4">💿</p>
          <p className="text-text-muted">没有正在播放的歌曲</p>
          <p className="mt-1 text-xs text-text-muted">去推荐页发现好音乐吧 🎵</p>
        </div>
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
    original: '',
    instrumental: '伴奏',
    pure_music: '纯音乐',
    cover: '翻唱',
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0a1628] overflow-hidden">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top-right Stitch ear */}
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-10" style={{
          background: 'radial-gradient(circle at 30% 40%, #f472b6, transparent 70%)',
        }} />
        {/* Floating stars */}
        <span className="absolute top-20 right-8 text-2xl opacity-20 animate-pulse">⭐</span>
        <span className="absolute top-40 right-16 text-xl opacity-15">🌟</span>
        <span className="absolute bottom-1/3 left-6 text-lg opacity-15">✨</span>
        <span className="absolute top-1/3 left-12 text-xl opacity-20">🌴</span>
      </div>

      {/* Blurred background */}
      <div className="absolute top-0 left-0 right-0 h-[55%] opacity-20" style={{
        background: 'linear-gradient(180deg, #4a90d9 0%, #f472b6 50%, transparent 100%)',
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
          <div className={`vinyl-ring absolute -inset-8 ${isPlaying ? 'vinyl-spin' : ''}`}
            style={{ opacity: 0.25 }}
          />

          <div
            className={`relative z-10 h-[260px] w-[260px] rounded-full flex items-center justify-center text-8xl ${
              isPlaying ? 'vinyl-spin cover-glow' : 'vinyl-spin-slow vinyl-paused'
            }`}
            style={{
              background: 'linear-gradient(135deg, #4a90d9 0%, #7ec8e3 40%, #f472b6 100%)',
              boxShadow: '0 20px 80px rgba(0,0,0,0.5), 0 0 0 8px rgba(0,0,0,0.3), 0 0 0 10px rgba(244,114,182,0.2), 0 0 40px rgba(74,144,217,0.3)',
            }}
          >
            <span>🐾</span>
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

        {/* Stitch paw decorations */}
        <div className="mt-4 flex gap-3 text-text-muted text-xs">
          <span>🐾</span><span>🐾</span><span>🐾</span>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 px-6 pb-4">
        <ProgressBar current={currentTime} total={duration} onSeek={seek} className="mb-3" />

        {/* Volume slider */}
        <div className="flex items-center gap-2 mb-3 px-2">
          <span className="text-sm text-text-muted">🔈</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-[#4a90d9] cursor-pointer"
            style={{
              background: `linear-gradient(90deg, #4a90d9 ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%)`,
              borderRadius: '4px',
              appearance: 'none',
            }}
          />
          <span className="text-sm text-text-muted">🔊</span>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-center gap-10">
          <button className="text-2xl text-text-secondary transition-colors hover:text-white">🔀</button>
          <button className="text-3xl text-white transition-transform active:scale-90" onClick={stop}>⏮</button>
          <button
            onClick={() => (isPlaying ? pause() : resume())}
            className="flex h-16 w-16 items-center justify-center rounded-full text-3xl text-white transition-transform active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #4a90d9, #2d6fb4)',
              boxShadow: isPlaying ? '0 0 30px rgba(74,144,217,0.5), 0 0 60px rgba(74,144,217,0.2)' : 'none',
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="text-3xl text-white transition-transform active:scale-90">⏭</button>
          <button className="text-2xl text-text-secondary transition-colors hover:text-white">🔁</button>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-around text-sm">
          <button onClick={toggleLike} className={`flex flex-col items-center gap-1 transition-colors ${liked ? 'text-[#f472b6]' : 'text-text-secondary hover:text-white'}`}>
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
