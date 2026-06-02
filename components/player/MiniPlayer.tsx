'use client';

import { useAudio } from '@/hooks/useAudio';
import { useRouter } from 'next/navigation';

export default function MiniPlayer() {
  const { currentSong, isPlaying, currentTime, duration, pause, resume } = useAudio();
  const router = useRouter();

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="fixed bottom-[calc(3.5rem+4px)] left-0 right-0 z-50 mx-3 cursor-pointer slide-up-enter"
      onClick={() => router.push(`/player/${currentSong.id}`)}
    >
      <div className="glass-strong flex items-center gap-3 rounded-2xl px-3 py-2">
        {/* Mini vinyl cover */}
        <div className={`h-11 w-11 shrink-0 rounded-full ${isPlaying ? 'vinyl-spin' : ''}`}
          style={{
            background: 'linear-gradient(135deg, #ff6b6b, #ff6348)',
            boxShadow: '0 0 0 2px rgba(0,0,0,0.5), 0 0 0 3px rgba(255,255,255,0.08)',
          }}
        >
          <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0f0f0f]" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{currentSong.title}</p>
          <p className="truncate text-xs text-text-secondary">{currentSong.artist}</p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : resume(); }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-transform active:scale-90"
          style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff6348)', boxShadow: isPlaying ? '0 0 16px rgba(255,107,107,0.5)' : 'none' }}
        >
          <span className="text-sm">{isPlaying ? '⏸' : '▶'}</span>
        </button>
      </div>

      <div className="mx-2 mt-0.5 h-1 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #ff6b6b, #ffa502)',
        }} />
      </div>
    </div>
  );
}
