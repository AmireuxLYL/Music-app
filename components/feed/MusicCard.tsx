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
  const { play, currentSong } = useAudio();
  const [liked, setLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);

  useEffect(() => {
    isFavorite(song.id).then(setLiked);
  }, [song.id]);

  useEffect(() => {
    if (isActive && currentSong?.id !== song.id) {
      play(song);
      recordInteraction(song.id, 'skip');
    }
  }, [isActive, song.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDoubleClick = () => {
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
        setTimeout(() => setShowHeart(false), 800);
      }
    }
    lastTapRef.current = now;
  };

  const typeLabel: Record<string, string> = {
    original: '🎤 原唱',
    instrumental: '🎹 伴奏',
    pure_music: '🎻 纯音乐',
    cover: '🎙 翻唱',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative flex h-full w-full flex-col items-center justify-end pb-24"
      onClick={handleDoubleClick}
    >
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #0f0f0f 60%)' }} />
      <div className="relative z-10 mb-6">
        <div
          className="h-56 w-56 rounded-2xl"
          style={{
            background: song.coverUrl
              ? `url(${song.coverUrl}) center/cover`
              : 'linear-gradient(135deg, #ff6b6b, #ffa502)',
            boxShadow: '0 12px 60px rgba(255,107,107,0.5)',
          }}
        />
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="animate-ping text-6xl" style={{ color: '#ff6b6b' }}>❤️</span>
          </div>
        )}
      </div>
      <div className="z-10 w-full px-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full border px-3 py-1 text-xs" style={{ background: 'rgba(255,107,107,0.15)', borderColor: 'rgba(255,107,107,0.4)', color: '#ff6b6b' }}>
            🔥 推荐
          </span>
          {liked && <span className="text-sm" style={{ color: '#ff6b6b' }}>❤️</span>}
        </div>
        <h2 className="text-2xl font-bold text-white">{song.title}</h2>
        <p className="mt-1 text-base" style={{ color: '#aaa' }}>{song.artist} · {typeLabel[song.type] || song.type}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {song.tags.map((tag) => (
            <span key={tag} className="rounded-xl px-2.5 py-0.5 text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: '#aaa' }}>{tag}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
