'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Song } from '@/lib/types';
import { useAudio } from '@/hooks/useAudio';
import { getAllFavorites } from '@/lib/db/indexeddb';
import MusicCard from './MusicCard';

const FILTERS = [
  { key: '', label: '🎲 随机' },
  { key: '华语流行', label: '🇨🇳 华语' },
  { key: '欧美', label: '🌍 欧美' },
  { key: '韩语', label: '🇰🇷 韩语' },
  { key: '日语', label: '🇯🇵 日语' },
  { key: '摇滚', label: '🎸 摇滚' },
  { key: '民谣', label: '🪕 民谣' },
  { key: '说唱', label: '🎤 说唱' },
  { key: '电音', label: '🎛 电音' },
  { key: '经典', label: '📻 经典' },
  { key: 'R&B', label: '🎶 R&B' },
  { key: '爵士', label: '🎷 爵士' },
];

// Static seed songs — shown instantly while API loads
const SEED_SONGS: Song[] = [
  { id:'seed-1', title:'晴天', artist:'周杰伦', coverUrl:'', type:'original', duration:269, sources:[{platform:'other',streamUrl:'',downloadUrl:'',quality:'320'}], tags:['华语','经典'], popularity:98, sourceLabel:'完整' },
  { id:'seed-2', title:'Blinding Lights', artist:'The Weeknd', coverUrl:'', type:'original', duration:200, sources:[{platform:'other',streamUrl:'',downloadUrl:'',quality:'320'}], tags:['欧美','流行'], popularity:95, sourceLabel:'完整' },
  { id:'seed-3', title:'孤勇者', artist:'陈奕迅', coverUrl:'', type:'original', duration:227, sources:[{platform:'other',streamUrl:'',downloadUrl:'',quality:'320'}], tags:['华语','励志'], popularity:96, sourceLabel:'完整' },
  { id:'seed-4', title:'夜曲', artist:'周杰伦', coverUrl:'', type:'original', duration:226, sources:[{platform:'other',streamUrl:'',downloadUrl:'',quality:'320'}], tags:['华语','经典'], popularity:94, sourceLabel:'完整' },
  { id:'seed-5', title:'Shape of You', artist:'Ed Sheeran', coverUrl:'', type:'original', duration:234, sources:[{platform:'other',streamUrl:'',downloadUrl:'',quality:'320'}], tags:['欧美','流行'], popularity:90, sourceLabel:'完整' },
];

export default function SwipeFeed() {
  const [songs, setSongs] = useState<Song[]>(SEED_SONGS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false); // Start with seed data visible
  const [activeFilter, setActiveFilter] = useState('');
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dataSource, setDataSource] = useState<'seed' | 'api'>('seed');
  const [winW, setWinW] = useState(375); // SSR-safe default
  const { playAll } = useAudio();
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const initialLoadDone = useRef(false);

  useEffect(() => { setWinW(window.innerWidth); }, []);

  // Load real data in background
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    loadReal();
  }, []);

  // Reload when filter changes
  useEffect(() => {
    if (!initialLoadDone.current) return;
    loadInitial(activeFilter);
  }, [activeFilter]);

  const loadReal = async () => {
    try {
      const res = await fetch('/api/trending?offset=0', { signal: AbortSignal.timeout(6000) });
      const data = await res.json();
      if (data.songs?.length > 0) {
        setSongs(data.songs);
        setNextOffset(data.nextOffset || data.songs.length);
        setHasMore(data.hasMore !== false);
        setDataSource('api');
      }
    } catch { /* keep seed data */ }
  };

  const loadInitial = async (filter: string) => {
    // Only show loading if we have no songs at all
    if (songs.length === 0) setLoading(true);
    setCurrentIndex(0);
    setNextOffset(0);
    setHasMore(true);
    try {
      const url = filter
        ? `/api/trending?filter=${encodeURIComponent(filter)}&offset=0`
        : '/api/trending?offset=0';

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.songs?.length > 0) {
        setSongs(data.songs);
        setNextOffset(data.nextOffset || data.songs.length);
        setHasMore(data.hasMore !== false);
      }
    } catch (err: any) {
      console.error('Load failed:', err.message);
      // Keep existing songs, don't empty the list
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoadingMore(true);

    try {
      const filter = activeFilter || '';
      const url = filter
        ? `/api/trending?filter=${encodeURIComponent(filter)}&offset=${nextOffset}`
        : `/api/trending?offset=${nextOffset}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      const data = await res.json();

      if (data.songs?.length > 0) {
        setSongs(prev => [...prev, ...data.songs]);
        setNextOffset(data.nextOffset || nextOffset + data.songs.length);
        setHasMore(data.hasMore !== false);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Load more failed:', err);
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [nextOffset, hasMore, activeFilter]);

  // Auto-load more when approaching end
  useEffect(() => {
    if (songs.length > 0 && currentIndex >= songs.length - 5 && hasMore && !loadingMore) {
      loadMore();
    }
  }, [currentIndex, songs.length, hasMore, loadingMore, loadMore]);

  // Play current song
  useEffect(() => {
    if (songs.length > 0 && currentIndex >= 0 && currentIndex < songs.length) {
      playAll(songs, currentIndex);
    }
  }, [currentIndex, songs.length]);

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= songs.length || isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTranslateX(0);
    setTimeout(() => setIsAnimating(false), 350);
  }, [songs.length, isAnimating]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const deltaX = e.touches[0].clientX - touchStart.x;
    const deltaY = Math.abs(e.touches[0].clientY - touchStart.y);
    if (deltaY > Math.abs(deltaX) * 1.5) return;
    setTranslateX(deltaX);
  };

  const handleTouchEnd = () => {
    if (!touchStart) return;
    const threshold = winW * 0.35;
    if (Math.abs(translateX) > threshold) {
      if (translateX < 0) goTo(currentIndex + 1);
      else goTo(currentIndex - 1);
    }
    setTouchStart(null);
    setTranslateX(0);
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 ocean-gradient">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full"
            style={{ background: 'conic-gradient(from 0deg, #3298f0, #38c8e8, #ff6e8a, #8b7cf0, #3298f0)', boxShadow: '0 0 40px rgba(50,152,240,0.5), 0 0 80px rgba(56,200,232,0.2)' }} />
          <div className="absolute inset-2 rounded-full bg-[#081428] flex items-center justify-center">
            <span className="text-2xl">🐾</span>
          </div>
        </div>
        <p className="text-sm font-medium text-text-secondary">正在潜入音乐海洋...</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden ocean-gradient">
      {/* Filter bar — floating glass */}
      <div className="absolute left-0 right-0 top-0 z-20 pt-5 pb-1" style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-1 px-3">
          <button onClick={() => { const el = filterScrollRef.current; if (el) el.scrollBy({ left: -120, behavior: 'smooth' }); }}
            className="shrink-0 rounded-full p-1 text-white/25 hover:text-white/50 text-xs transition-colors">◂</button>
          <div ref={filterScrollRef} className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-1 py-1">
            {FILTERS.map((f) => {
              const isActive = activeFilter === f.key;
              return (
                <button key={f.key} onClick={() => setActiveFilter(f.key === activeFilter ? '' : f.key)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all duration-200 select-none whitespace-nowrap"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, #3298f0, #1a6fc4)'
                      : 'rgba(11,29,58,0.5)',
                    color: isActive ? '#fff' : '#8baac8',
                    boxShadow: isActive ? '0 2px 12px rgba(50,152,240,0.35)' : 'none',
                    border: isActive
                      ? '1px solid rgba(56,200,232,0.3)'
                      : '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(8px)',
                  }}>
                  {f.label}
                </button>
              );
            })}
          </div>
          <button onClick={() => { const el = filterScrollRef.current; if (el) el.scrollBy({ left: 120, behavior: 'smooth' }); }}
            className="shrink-0 rounded-full p-1 text-white/25 hover:text-white/50 text-xs transition-colors">▸</button>
          <div className="shrink-0 text-[10px] text-text-muted">{currentIndex + 1}/{songs.length}</div>
        </div>
      </div>

      {/* Song cards */}
      <div className="relative h-full w-full" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {songs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <svg width="64" height="64" viewBox="0 0 28 28" fill="none" className="opacity-30">
              <ellipse cx="14" cy="14" rx="9" ry="10" fill="#3298f0" />
              <ellipse cx="11" cy="14" rx="3.5" ry="3.8" fill="#081428" />
              <ellipse cx="17" cy="14" rx="3.5" ry="3.8" fill="#081428" />
              <circle cx="11" cy="13" r="1.1" fill="white" />
              <circle cx="17" cy="13" r="1.1" fill="white" />
            </svg>
            <p className="text-text-muted text-sm">🐾 暂无推荐歌曲</p>
            <button onClick={() => loadInitial(activeFilter)} className="mt-2 rounded-full px-6 py-2 text-sm font-medium text-white active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #3298f0, #1a6fc4)', boxShadow: '0 4px 15px rgba(50,152,240,0.3)' }}>重新加载</button>
          </div>
        ) : (
          songs.map((song, index) => {
            const offset = index - currentIndex;
            if (Math.abs(offset) > 1) return null;
            const baseX = offset * winW;
            const moveX = offset === 0 ? translateX : 0;
            return (
              <div key={song.id + '-' + index} className="absolute inset-0"
                style={{
                  transform: `translateX(${baseX + moveX}px)`,
                  transition: touchStart === null ? 'transform 350ms ease-out' : 'none',
                }}>
                <MusicCard song={song} isActive={offset === 0} />
              </div>
            );
          })
        )}
      </div>

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="absolute bottom-24 left-0 right-0 z-10 flex justify-center">
          <div className="rounded-full glass px-4 py-1.5 text-xs text-text-secondary">
            🌊 探索更多音乐中...
          </div>
        </div>
      )}
    </div>
  );
}
