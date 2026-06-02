'use client';

import type { Song } from '@/lib/types';
import { useAudio } from '@/hooks/useAudio';

interface SearchResultsProps {
  results: Song[];
  loading: boolean;
}

const GRADS: Record<number, string> = {};
function getGrad(id: string): string {
  const arr = ['#ff6b6b,#ff4757', '#ffa502,#ff6348', '#667eea,#764ba2', '#2ed573,#1e90ff', '#e056a0,#764ba2'];
  const idx = parseInt(id, 10) || id.charCodeAt(0);
  return arr[idx % arr.length];
}

export default function SearchResults({ results, loading }: SearchResultsProps) {
  const { play, currentSong, isPlaying, pause, resume } = useAudio();

  const typeLabel: Record<string, string> = {
    original: '原唱',
    instrumental: '伴奏',
    pure_music: '纯音乐',
    cover: '翻唱',
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: '#ff6b6b', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-4xl mb-3">🎵</p>
        <p className="text-text-muted">输入关键词搜索歌曲</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 fade-in">
      {results.map((song) => {
        const isCurrent = currentSong?.id === song.id;
        const grad = getGrad(song.id);
        return (
          <div
            key={song.id}
            className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[rgba(255,255,255,0.04)]"
            style={isCurrent ? { background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.15)' } : {}}
          >
            {/* Round album cover */}
            <div
              className={`h-12 w-12 shrink-0 rounded-full ${isCurrent && isPlaying ? 'vinyl-spin' : ''}`}
              style={{
                background: `linear-gradient(135deg, ${grad})`,
                boxShadow: isCurrent ? '0 0 16px rgba(255,107,107,0.3)' : 'none',
              }}
            />
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-semibold ${isCurrent ? 'text-primary' : 'text-white'}`}>
                {song.title}
              </p>
              <p className="truncate text-xs text-text-secondary">
                {song.artist} · {typeLabel[song.type]}
              </p>
            </div>
            <button
              onClick={() => {
                if (isCurrent) {
                  isPlaying ? pause() : resume();
                } else {
                  play(song);
                }
              }}
              className="rounded-full p-2 text-lg transition-colors hover:bg-white/10"
              style={{ color: isCurrent ? '#ff6b6b' : '#666' }}
            >
              {isCurrent && isPlaying ? '⏸' : '▶️'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
