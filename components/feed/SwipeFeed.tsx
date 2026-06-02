'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Song } from '@/lib/types';
import { getRecommendations, getTrending } from '@/lib/api/client';
import MusicCard from './MusicCard';

export default function SwipeFeed() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [translateY, setTranslateY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    try {
      const trending = await getTrending();
      setSongs(trending);
      if (trending.length > 0) setCursor('0');
    } catch (err) {
      console.error('Failed to load trending:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    try {
      const res = await getRecommendations(cursor ?? undefined);
      setSongs((prev) => [...prev, ...res.songs]);
      setCursor(res.cursor);
    } catch (err) {
      console.error('Failed to load more:', err);
    }
  }, [cursor]);

  useEffect(() => {
    if (currentIndex >= songs.length - 3 && cursor) {
      loadMore();
    }
  }, [currentIndex, songs.length, cursor, loadMore]);

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= songs.length || isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTranslateY(0);
    setTimeout(() => setIsAnimating(false), 300);
  }, [songs.length, isAnimating]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const delta = e.touches[0].clientY - touchStart;
    setTranslateY(delta);
  };

  const handleTouchEnd = () => {
    const threshold = window.innerHeight * 0.3;
    if (Math.abs(translateY) > threshold) {
      if (translateY < 0) {
        goTo(currentIndex + 1);
      } else {
        goTo(currentIndex - 1);
      }
    }
    setTouchStart(null);
    setTranslateY(0);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: '#ff6b6b', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p style={{ color: '#666' }}>暂无推荐歌曲</p>
      </div>
    );
  }

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-[#0f0f0f]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {songs.map((song, index) => {
        const offset = index - currentIndex;
        if (Math.abs(offset) > 1) return null;

        const baseY = offset * window.innerHeight;
        const moveY = offset === 0 ? translateY : 0;

        return (
          <div
            key={song.id + '-' + index}
            className="absolute inset-0"
            style={{
              transform: `translateY(${baseY + moveY}px)`,
              transition: touchStart === null ? 'transform 300ms ease-out' : 'none',
            }}
          >
            <MusicCard song={song} isActive={offset === 0} />
          </div>
        );
      })}
    </div>
  );
}
