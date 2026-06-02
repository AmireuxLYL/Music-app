'use client';

import { useAudio } from '@/hooks/useAudio';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function MiniPlayer() {
  const { currentSong, isPlaying, currentTime, duration, volume, setVolume, pause, resume } = useAudio();
  const router = useRouter();
  const [showVolume, setShowVolume] = useState(false);

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-[calc(3.5rem+4px)] left-0 right-0 z-50 mx-3">
      {/* Volume slider */}
      {showVolume && (
        <div className="glass-strong mb-1 mx-2 rounded-xl px-4 py-2 flex items-center gap-2 slide-up-enter"
          onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-text-muted">🔈</span>
          <input type="range" min="0" max="1" step="0.05" value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1" style={{ accentColor: '#4a90d9' }} />
          <button onClick={() => setShowVolume(false)} className="text-xs text-text-muted">✕</button>
        </div>
      )}

      <div className="glass-strong cursor-pointer flex items-center gap-3 rounded-2xl px-3 py-2"
        onClick={() => router.push(`/player/${currentSong.id}`)}>
        {/* Mini Stitch cover */}
        <div className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center text-lg ${isPlaying ? 'vinyl-spin' : ''}`}
          style={{
            background: currentSong.coverUrl ? `url(${currentSong.coverUrl}) center/cover` : 'linear-gradient(135deg, #4a90d9, #7ec8e3)',
            boxShadow: '0 0 0 2px rgba(0,0,0,0.5), 0 0 0 3px rgba(244,114,182,0.4), 0 0 12px rgba(74,144,217,0.3)',
          }}>
          {!currentSong.coverUrl && <span>🐾</span>}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{currentSong.title}</p>
          <p className="truncate text-xs text-text-secondary">
            {currentSong.artist} · {isPlaying ? '播放中' : '已暂停'}
          </p>
        </div>

        <button onClick={(e) => { e.stopPropagation(); setShowVolume(!showVolume); }}
          className="shrink-0 p-2 text-sm text-text-muted hover:text-white transition-colors">
          {volume < 0.2 ? '🔈' : volume < 0.6 ? '🔉' : '🔊'}
        </button>

        <button onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : resume(); }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-transform active:scale-90"
          style={{ background: 'linear-gradient(135deg, #4a90d9, #2d6fb4)', boxShadow: isPlaying ? '0 0 16px rgba(74,144,217,0.5)' : 'none' }}>
          <span className="text-sm">{isPlaying ? '⏸' : '▶'}</span>
        </button>
      </div>

      <div className="mx-2 mt-0.5 h-1 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #4a90d9, #f472b6)',
        }} />
      </div>
    </div>
  );
}
