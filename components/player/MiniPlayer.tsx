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
      <div className="glass-strong flex items-center gap-3 rounded-2xl px-4 py-2.5">
        <div
          className={`h-11 w-11 shrink-0 rounded-xl ${isPlaying ? 'pulse-playing' : ''}`}
          style={{
            background: currentSong.coverUrl
              ? `url(${currentSong.coverUrl}) center/cover`
              : 'linear-gradient(135deg, #ff6b6b, #ffa502)',
          }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {currentSong.title}
          </p>
          <p className="truncate text-xs text-text-secondary">
            {currentSong.artist} · {isPlaying ? '正在播放' : '已暂停'}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            isPlaying ? pause() : resume();
          }}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-transform active:scale-90 ${
            isPlaying ? 'neon-glow' : ''
          }`}
          style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff6348)' }}
        >
          <span className="text-sm">{isPlaying ? '⏸' : '▶'}</span>
        </button>
      </div>
      <div className="mx-4 mt-0.5 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #ff6b6b, #ffa502, #ff6348)',
          }}
        />
      </div>
    </div>
  );
}
