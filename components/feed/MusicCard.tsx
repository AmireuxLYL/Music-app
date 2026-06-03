'use client';

import { useEffect, useRef, useState } from 'react';
import type { Song } from '@/lib/types';
import { useAudio } from '@/hooks/useAudio';
import { addFavorite, removeFavorite, isFavorite, recordInteraction } from '@/lib/db/indexeddb';
import { motion } from 'framer-motion';

interface MusicCardProps {
  song: Song;
  isActive: boolean;
}

export default function MusicCard({ song, isActive }: MusicCardProps) {
  const { play, currentSong, isPlaying, pause, resume } = useAudio();
  const [liked, setLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);

  const isThisPlaying = isActive && currentSong?.id === song.id && isPlaying;

  useEffect(() => {
    isFavorite(song.id).then(setLiked);
  }, [song.id]);

  useEffect(() => {
    if (isActive && currentSong?.id !== song.id) {
      play(song);
    }
  }, [isActive, song.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (liked) {
        removeFavorite(song.id);
        setLiked(false);
      } else {
        addFavorite(song.id);
        setLiked(true);
        setShowHeart(true);
        recordInteraction(song.id, 'like');
        setTimeout(() => setShowHeart(false), 900);
      }
    } else {
      if (currentSong?.id === song.id) {
        isPlaying ? pause() : resume();
      } else {
        play(song);
      }
    }
    lastTapRef.current = now;
  };

  const typeLabel: Record<string, string> = {
    original: '',
    instrumental: '🎹 伴奏',
    pure_music: '🎻 纯音乐',
    cover: '🎙 翻唱',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-background"
      onClick={handleTap}
    >
      {/* Stitch space decorations — stars & sparkles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute top-12 right-10 text-3xl opacity-20" style={{ animation: 'twinkle 3s ease-in-out infinite' }}>⭐</span>
        <span className="absolute top-1/4 left-8 text-2xl opacity-15" style={{ animation: 'twinkle 4s ease-in-out 1s infinite' }}>🌟</span>
        <span className="absolute bottom-1/3 right-8 text-xl opacity-10" style={{ animation: 'twinkle 2.5s ease-in-out 0.5s infinite' }}>✨</span>
        <span className="absolute top-1/3 left-14 text-2xl opacity-10" style={{ animation: 'floatSparkle 5s ease-in-out infinite' }}>🌺</span>
        <span className="absolute bottom-1/4 left-5 text-lg opacity-8" style={{ animation: 'floatSparkle 6s ease-in-out 2s infinite' }}>🌴</span>
        <span className="absolute top-1/2 right-12 text-lg opacity-10" style={{ animation: 'twinkle 3.5s ease-in-out 1.5s infinite' }}>💙</span>
      </div>

      {/* Ocean depth blurred background */}
      <div className="absolute inset-0 opacity-25" style={{
        filter: 'blur(90px)',
        transform: 'scale(1.6)',
        background: `radial-gradient(ellipse at center, #3298f0 0%, #1a6fc4 30%, #ff6e8a 60%, transparent 85%)`,
      }} />

      {/* Album cover — Stitch ocean vinyl record */}
      <div className="relative z-10 mb-6" style={{ perspective: '1000px' }}>
        {/* Outer vinyl ring */}
        <div className="absolute -inset-6 rounded-full opacity-25"
          style={{
            background: 'conic-gradient(from 0deg, #1a3050, #0d1f3c, #1a3050, #0d1f3c, #1a3050, #0d1f3c, #1a3050, #0d1f3c, #1a3050)',
            boxShadow: '0 0 40px rgba(0,0,0,0.6), inset 0 0 12px rgba(0,0,0,0.4)',
            animation: isThisPlaying ? 'spin 14s linear infinite' : 'none',
          }}
        />

        {/* Cover disc */}
        <div className={`relative z-10 h-[260px] w-[260px] rounded-full flex items-center justify-center ${
          isThisPlaying ? 'cover-glow' : ''
        }`}
          style={{
            ...(song.coverUrl
              ? { backgroundImage: `url(${song.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: 'linear-gradient(160deg, #3298f0, #38c8e8, #ff6e8a, #8b7cf0)' }),
            boxShadow: isThisPlaying
              ? '0 20px 80px rgba(0,0,0,0.5), 0 0 0 8px rgba(8,20,40,0.6), 0 0 0 10px rgba(56,200,232,0.35), 0 0 60px rgba(50,152,240,0.4)'
              : '0 20px 80px rgba(0,0,0,0.5), 0 0 0 8px rgba(8,20,40,0.6), 0 0 0 10px rgba(50,152,240,0.2), 0 0 40px rgba(50,152,240,0.2)',
            animation: isThisPlaying ? 'spin 14s linear infinite' : 'none',
          } as React.CSSProperties}
        >
          {!song.coverUrl && <span className="text-8xl">🐾</span>}
          {/* Center hole */}
          <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#081428] border-2 border-[#1a3050]" />
        </div>

        {/* Floating music notes when playing */}
        {isThisPlaying && (
          <>
            <span className="absolute -right-8 top-1/4 z-20 animate-bounce text-2xl opacity-70" style={{ color: '#ff6e8a' }}>🎵</span>
            <span className="absolute -left-6 bottom-1/3 z-20 animate-bounce text-xl opacity-50" style={{ animationDelay: '0.5s', color: '#38c8e8' }}>🎶</span>
          </>
        )}
      </div>

      {/* Heart burst on double-tap */}
      {showHeart && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <span className="text-8xl" style={{ animation: 'heartBurst 0.8s ease-out forwards' }}>💙</span>
        </div>
      )}

      {/* Song info */}
      <div className="z-10 w-full px-8 text-center">
        <h2 className="truncate text-2xl font-bold tracking-tight text-white">{song.title}</h2>
        <p className="mt-2 text-base text-text-secondary">
          {song.artist}
          {typeLabel[song.type] && (
            <span className="ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{
              background: 'rgba(56,200,232,0.18)',
              color: '#38c8e8',
              border: '1px solid rgba(56,200,232,0.2)'
            }}>
              {typeLabel[song.type]}
            </span>
          )}
        </p>
        {/* Source badge */}
        {song.sourceLabel && (
          <p className="mt-1.5">
            <span className="rounded-full px-3 py-0.5 text-[11px] font-bold"
              style={{
                background: song.sourceLabel.includes('完整') ? 'rgba(74,222,160,0.12)' : 'rgba(56,200,232,0.12)',
                color: song.sourceLabel.includes('完整') ? '#4adea0' : '#38c8e8',
                border: song.sourceLabel.includes('完整') ? '1px solid rgba(74,222,160,0.2)' : '1px solid rgba(56,200,232,0.2)',
              }}>
              {song.sourceLabel.includes('完整') ? '🎧 完整歌曲' : '⏱ 试听 30 秒'}
            </span>
          </p>
        )}

        {/* Hints */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-text-muted">
          {liked ? (
            <span style={{ color: '#ff6e8a' }}>💙 已收藏</span>
          ) : (
            <span>🐾 双击收藏</span>
          )}
          <span>{isThisPlaying ? '🎵 正在播放' : '👆 轻触播放'}</span>
        </div>

        {/* Swipe hint */}
        <div className="mt-2 flex items-center justify-center gap-6 text-xs text-text-muted opacity-40">
          <span>◀ 上一首</span>
          <span>下一首 ▶</span>
        </div>
      </div>
    </motion.div>
  );
}
