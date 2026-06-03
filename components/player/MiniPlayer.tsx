'use client';

import { useAudio } from '@/hooks/useAudio';
import { useRouter } from 'next/navigation';
import { useState, useRef, useCallback } from 'react';

export default function MiniPlayer() {
  const {
    currentSong, isPlaying, currentTime, duration,
    volume, pause, resume, prev, next, seek, volumeUp, volumeDown, setVolume,
  } = useAudio();
  const router = useRouter();
  const [showVolume, setShowVolume] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  }, [duration, seek]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-14 left-0 right-0 z-50 mx-2">
      {/* Volume panel */}
      {showVolume && (
        <div className="glass-strong mb-0.5 mx-1 rounded-xl px-3 py-1.5 flex items-center gap-2 slide-up-enter"
          onClick={(e) => e.stopPropagation()}>
          <button onClick={volumeDown} className="text-xs text-text-muted hover:text-white">🔈</button>
          <div className="flex-1 h-1.5 rounded-full bg-white/8 cursor-pointer"
            onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setVolume((e.clientX - r.left) / r.width); }}>
            <div className="h-full rounded-full" style={{ width: volume * 100 + '%', background: 'linear-gradient(90deg, #3298f0, #38c8e8)' }} />
          </div>
          <button onClick={volumeUp} className="text-xs text-text-muted hover:text-white">🔊</button>
          <button onClick={() => setShowVolume(false)} className="text-[10px] text-text-muted ml-1">✕</button>
        </div>
      )}

      {/* Progress bar */}
      <div ref={progressRef} className="mx-1 mb-0.5 h-1 rounded-full bg-white/8 overflow-hidden cursor-pointer" onClick={handleProgressClick}>
        <div className="h-full rounded-full transition-all duration-150" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #3298f0, #38c8e8, #ff6e8a)' }} />
      </div>

      {/* Player bar - compact */}
      <div className="glass-strong flex items-center gap-1.5 rounded-2xl px-2 py-1 cursor-pointer"
        onClick={() => router.push(`/player/${currentSong.id}`)}>
        <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-base ${isPlaying ? 'vinyl-spin' : ''}`}
          style={{
            background: currentSong.coverUrl ? `url(${currentSong.coverUrl}) center/cover` : 'linear-gradient(135deg, #3298f0, #38c8e8)',
            boxShadow: '0 0 0 1.5px rgba(8,20,40,0.6), 0 0 0 2.5px rgba(56,200,232,0.35)',
          }}>
          {!currentSong.coverUrl && <span>🐾</span>}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold text-white leading-tight">{currentSong.title}</p>
          <p className="truncate text-[10px] text-text-secondary leading-tight">{currentSong.artist} · {formatTime(currentTime)}/{formatTime(duration)}</p>
        </div>

        <button onClick={(e) => { e.stopPropagation(); prev(); }} className="shrink-0 p-1.5 text-sm text-text-muted hover:text-white transition-colors">⏮</button>
        <button onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : resume(); }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs transition-transform active:scale-90"
          style={{
            background: 'linear-gradient(135deg, #3298f0, #1a6fc4)',
            boxShadow: isPlaying ? '0 0 12px rgba(50,152,240,0.4)' : '0 2px 8px rgba(50,152,240,0.2)',
          }}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={(e) => { e.stopPropagation(); next(); }} className="shrink-0 p-1.5 text-sm text-text-muted hover:text-white transition-colors">⏭</button>
        <button onClick={(e) => { e.stopPropagation(); setShowVolume(!showVolume); }}
          className="shrink-0 px-0.5 text-xs text-text-muted hover:text-white transition-colors">
          {volume < 0.2 ? '🔈' : volume < 0.6 ? '🔉' : '🔊'}
        </button>
      </div>
    </div>
  );
}
