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
      {/* Stitch space decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute top-10 right-8 text-3xl opacity-15">⭐</span>
        <span className="absolute top-1/3 left-6 text-2xl opacity-10">🌟</span>
        <span className="absolute bottom-1/4 right-6 text-xl opacity-10">✨</span>
        <span className="absolute top-1/4 left-12 text-2xl opacity-10">🌺</span>
        <span className="absolute bottom-1/3 left-4 text-lg opacity-8">🌴</span>
      </div>

      {/* Blurred color background */}
      <div className="absolute inset-0 opacity-30" style={{
        filter: 'blur(80px)',
        transform: 'scale(1.5)',
        background: `radial-gradient(circle at center, #4a90d9, #f472b6, transparent 70%)`,
      }} />

      {/* Album cover - Stitch vinyl record */}
      <div className="relative z-10 mb-6" style={{ perspective: '1000px' }}>
        <div className="absolute -inset-6 rounded-full opacity-30"
          style={{
            background: 'conic-gradient(from 0deg, #1a2a3a, #0d1f3c, #1a2a3a, #0d1f3c, #1a2a3a, #0d1f3c, #1a2a3a, #0d1f3c, #1a2a3a)',
            boxShadow: '0 0 30px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.3)',
            animation: isThisPlaying ? 'spin 12s linear infinite' : 'none',
          }}
        />

        {/* Cover */}
        <div className={`relative z-10 h-[260px] w-[260px] rounded-full flex items-center justify-center ${
          isThisPlaying ? 'cover-glow' : ''
        }`}
          style={{
            ...(song.coverUrl
              ? { backgroundImage: `url(${song.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: 'linear-gradient(135deg, #4a90d9, #7ec8e3, #f472b6)' }),
            boxShadow: '0 20px 80px rgba(0,0,0,0.5), 0 0 0 8px rgba(0,0,0,0.3), 0 0 0 10px rgba(244,114,182,0.3), 0 0 50px rgba(74,144,217,0.35)',
            animation: isThisPlaying ? 'spin 12s linear infinite' : 'none',
          } as React.CSSProperties}
        >
          {!song.coverUrl && <span className="text-8xl">🐾</span>}
          <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0a1628] border-2 border-[#1a2a3a]" />
        </div>

        {/* Floating note when playing */}
        {isThisPlaying && (
          <span className="absolute -right-6 top-1/4 z-20 animate-bounce text-2xl opacity-60" style={{ color: '#f472b6' }}>🎵</span>
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
            <span className="ml-2 rounded-full px-2.5 py-0.5 text-xs" style={{ background: 'rgba(244,114,182,0.2)', color: '#f472b6' }}>
              {typeLabel[song.type]}
            </span>
          )}
        </p>

        {/* Hints */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-text-muted">
          {liked ? (
            <span style={{ color: '#f472b6' }}>💙 已收藏</span>
          ) : (
            <span>🐾 双击收藏</span>
          )}
          <span>{isThisPlaying ? '🎵 正在播放' : '👆 轻触播放'}</span>
        </div>

        {/* Stitch paw trail */}
        <div className="mt-3 flex justify-center gap-2 text-xs opacity-30 text-text-muted">
          <span>🐾</span><span>🐾</span><span>🐾</span>
        </div>
      </div>
    </motion.div>
  );
}
