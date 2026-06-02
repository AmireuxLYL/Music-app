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

// Generate cover gradient from song id for consistency
function getCoverGradient(id: string): string {
  const gradients = [
    'linear-gradient(135deg, #ff6b6b, #ff4757)',
    'linear-gradient(135deg, #ffa502, #ff6348)',
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #2ed573, #1e90ff)',
    'linear-gradient(135deg, #ff6b6b, #ffa502)',
    'linear-gradient(135deg, #e056a0, #764ba2)',
    'linear-gradient(135deg, #00d2d3, #54a0ff)',
    'linear-gradient(135deg, #f368e0, #ff6b6b)',
  ];
  const idx = parseInt(id, 10) || id.charCodeAt(0);
  return gradients[idx % gradients.length];
}

export default function MusicCard({ song, isActive }: MusicCardProps) {
  const { play, currentSong, isPlaying, pause, resume } = useAudio();
  const [liked, setLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);

  const isThisPlaying = isActive && currentSong?.id === song.id && isPlaying;
  const coverGradient = getCoverGradient(song.id);

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
      // Double tap → like
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
      // Single tap → toggle play/pause
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
      style={{ background: '#0f0f0f' }}
      onClick={handleTap}
    >
      {/* Blurred background color blob */}
      <div className="blur-bg" style={{
        background: `radial-gradient(circle at center, ${song.id.charCodeAt(0) % 2 === 0 ? '#ff6b6b' : '#667eea'}22 0%, transparent 70%)`,
      }} />

      {/* Blurred top accent */}
      <div className="absolute top-0 left-0 right-0 h-1/2 opacity-20" style={{
        background: coverGradient,
        filter: 'blur(60px)',
        transform: 'scale(1.5)',
      }} />

      {/* Cover art ring (vinyl effect) */}
      <div className="relative z-10 mb-6" style={{ perspective: '1000px' }}>
        {/* Outer vinyl ring */}
        <div className={`vinyl-ring absolute -inset-6 ${isThisPlaying ? 'vinyl-spin' : ''}`}
          style={{ opacity: 0.3 }} />

        {/* Album cover */}
        <div
          className={`relative z-10 h-[260px] w-[260px] rounded-full ${isThisPlaying ? 'vinyl-spin cover-glow' : 'vinyl-spin-slow vinyl-paused'}`}
          style={{
            background: song.coverUrl
              ? `url(${song.coverUrl}) center/cover`
              : coverGradient,
            boxShadow: '0 20px 80px rgba(0,0,0,0.5), 0 0 0 8px rgba(0,0,0,0.3), 0 0 0 10px rgba(255,255,255,0.05)',
          }}
        >
          {/* Center hole (like a vinyl record) */}
          <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0f0f0f] border-2 border-[#1a1a1a]" />
        </div>

        {/* Floating music note when playing */}
        {isThisPlaying && (
          <div className="absolute -right-8 top-1/4 z-20 text-2xl opacity-60 animate-bounce">
            ♪
          </div>
        )}
      </div>

      {/* Heart burst animation */}
      {showHeart && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <span className="heart-burst text-8xl">❤️</span>
        </div>
      )}

      {/* Song info - minimal */}
      <div className="z-10 w-full px-8 text-center">
        <h2 className="text-2xl font-bold text-white tracking-tight truncate">
          {song.title}
        </h2>
        <p className="mt-2 text-base text-text-secondary">
          {song.artist}
          {typeLabel[song.type] && (
            <span className="ml-2 rounded-full bg-white/10 px-2.5 py-0.5 text-xs">{typeLabel[song.type]}</span>
          )}
        </p>

        {/* Interaction hints */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-text-muted">
          {liked && <span className="text-primary">❤️ 已收藏</span>}
          {!liked && <span>👆 双击收藏</span>}
          <span>{isThisPlaying ? '🎵 播放中' : '👆 点击播放'}</span>
        </div>
      </div>
    </motion.div>
  );
}
