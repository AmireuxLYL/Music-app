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
    instrumental: '伴奏',
    pure_music: '纯音乐',
    cover: '翻唱',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0a1628' }}
      onClick={handleTap}
    >
      {/* Stitch-themed decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-8 right-6 text-3xl opacity-15">⭐</div>
        <div className="absolute top-1/4 left-4 text-2xl opacity-10">🌟</div>
        <div className="absolute bottom-1/3 right-8 text-xl opacity-10">✨</div>
        <div className="absolute top-1/3 left-10 text-lg opacity-10">🌴</div>
      </div>

      {/* Blurred background color blob */}
      <div className="blur-bg" style={{
        background: 'radial-gradient(circle at center, #4a90d9 0%, #f472b6 50%, transparent 70%)',
        opacity: 0.35,
      }} />

      {/* Cover art - Stitch vinyl */}
      <div className="relative z-10 mb-6" style={{ perspective: '1000px' }}>
        {/* Outer vinyl ring */}
        <div className={`vinyl-ring absolute -inset-6 ${isThisPlaying ? 'vinyl-spin' : ''}`}
          style={{ opacity: 0.3 }} />

        {/* Album cover */}
        <div
          className={`relative z-10 h-[260px] w-[260px] rounded-full flex items-center justify-center text-8xl ${
            isThisPlaying ? 'vinyl-spin cover-glow' : 'vinyl-spin-slow vinyl-paused'
          }`}
          style={{
            background: 'linear-gradient(135deg, #4a90d9 0%, #7ec8e3 35%, #f472b6 100%)',
            boxShadow: '0 20px 80px rgba(0,0,0,0.5), 0 0 0 8px rgba(0,0,0,0.3), 0 0 0 10px rgba(244,114,182,0.3), 0 0 50px rgba(74,144,217,0.35)',
          }}
        >
          🐾
        </div>

        {/* Floating music note */}
        {isThisPlaying && (
          <div className="absolute -right-6 top-1/4 z-20 text-2xl opacity-60 animate-bounce" style={{ color: '#f472b6' }}>
            ♪
          </div>
        )}
      </div>

      {/* Heart burst */}
      {showHeart && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <span className="heart-burst text-8xl">❤️</span>
        </div>
      )}

      {/* Song info */}
      <div className="z-10 w-full px-8 text-center">
        <h2 className="text-2xl font-bold text-white tracking-tight truncate">{song.title}</h2>
        <p className="mt-2 text-base text-text-secondary">
          {song.artist}
          {typeLabel[song.type] && (
            <span className="ml-2 rounded-full px-2.5 py-0.5 text-xs" style={{ background: 'rgba(244,114,182,0.2)', color: '#f472b6' }}>{typeLabel[song.type]}</span>
          )}
        </p>

        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-text-muted">
          {liked && <span style={{ color: '#f472b6' }}>❤️ 已收藏</span>}
          {!liked && <span>🐾 双击收藏</span>}
          <span>{isThisPlaying ? '🎵 播放中' : '👆 点击播放'}</span>
        </div>

        {/* Stitch paw trail */}
        <div className="mt-3 flex justify-center gap-2 text-text-muted opacity-30 text-xs">
          <span>🐾</span><span>🐾</span><span>🐾</span>
        </div>
      </div>
    </motion.div>
  );
}
