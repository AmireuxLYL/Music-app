'use client';

import type { Song } from '@/lib/types';
import { useAudio } from '@/hooks/useAudio';

interface SearchResultsProps {
  results: Song[];
  loading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  total?: number;
  onLoadMore?: () => void;
}

function getGrad(id: string): [string, string] {
  const palettes: [string, string][] = [
    ['#4a90d9', '#7ec8e3'],
    ['#f472b6', '#c084fc'],
    ['#4a90d9', '#2d6fb4'],
    ['#f472b6', '#e056a0'],
    ['#7ec8e3', '#4a90d9'],
    ['#c084fc', '#f472b6'],
    ['#2d6fb4', '#7ec8e3'],
    ['#e056a0', '#c084fc'],
  ];
  const idx = id.length > 0 ? id.charCodeAt(0) : 0;
  return palettes[idx % palettes.length];
}

export default function SearchResults({ results, loading, loadingMore, hasMore, total, onLoadMore }: SearchResultsProps) {
  const { play, currentSong, isPlaying, pause, resume } = useAudio();

  const typeLabel: Record<string, string> = {
    original: '原唱',
    instrumental: '伴奏',
    pure_music: '纯音乐',
    cover: '翻唱',
  };

  const typeColor: Record<string, string> = {
    original: '#4a90d9',
    instrumental: '#7ec8e3',
    pure_music: '#c084fc',
    cover: '#f472b6',
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shimmer rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
                <div className="h-2 w-1/2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        {/* Stitch silhouette empty state */}
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mb-4 opacity-30">
          <ellipse cx="40" cy="40" rx="24" ry="26" fill="#4a90d9" />
          <path d="M18 18 L6 6 L22 12 L24 20 Z" fill="#4a90d9" />
          <path d="M62 18 L74 6 L58 12 L56 20 Z" fill="#4a90d9" />
          <ellipse cx="33" cy="38" rx="8" ry="9" fill="#0f0f0f" />
          <ellipse cx="47" cy="38" rx="8" ry="9" fill="#0f0f0f" />
          <circle cx="33" cy="36" r="3" fill="white" />
          <circle cx="47" cy="36" r="3" fill="white" />
          <ellipse cx="40" cy="50" rx="6" ry="4" fill="#2d6fb4" />
        </svg>
        <p className="text-lg font-medium text-text-muted">输入关键词搜索歌曲</p>
        <p className="mt-1 text-xs text-text-muted">支持原唱、伴奏、纯音乐分类搜索</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 fade-in pb-20">
      {/* Result count */}
      {total != null && total > 0 && (
        <p className="text-xs text-text-muted px-1">
          共 {total} 首，已显示 {results.length} 首
        </p>
      )}
      {results.map((song, i) => {
        const isCurrent = currentSong?.id === song.id;
        const [gradFrom, gradTo] = getGrad(song.id);

        return (
          <div
            key={song.id}
            className="group relative overflow-hidden rounded-2xl transition-all duration-300"
            style={{
              background: isCurrent ? 'rgba(74,144,217,0.12)' : 'rgba(255,255,255,0.03)',
              border: isCurrent ? '1px solid rgba(74,144,217,0.25)' : '1px solid transparent',
              transform: `translateY(0px)`,
              animationDelay: `${i * 60}ms`,
              animation: 'fadeIn 0.4s ease forwards',
            }}
          >
            {/* Playing indicator bar */}
            {isCurrent && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                style={{ background: 'linear-gradient(90deg, #4a90d9, #f472b6)' }} />
            )}

            <div className="relative flex items-center gap-4 p-3">
              {/* Album art or gradient circle */}
              <div
                className={`relative h-14 w-14 shrink-0 rounded-xl overflow-hidden ${isCurrent && isPlaying ? 'shadow-lg' : ''}`}
                style={{
                  background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
                  boxShadow: isCurrent && isPlaying ? `0 0 24px ${gradFrom}66` : 'none',
                }}
              >
                {song.coverUrl ? (
                  <div
                    className={`h-full w-full bg-cover bg-center ${isCurrent && isPlaying ? 'vinyl-spin' : ''}`}
                    style={{ backgroundImage: `url(${song.coverUrl})` }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl">
                    {song.type === 'instrumental' ? '🎹' : song.type === 'pure_music' ? '🎻' : song.type === 'cover' ? '🎙' : '🎵'}
                  </div>
                )}
                {/* Quality badge */}
                <div className="absolute bottom-0 right-0 rounded-tl-md px-1.5 py-0.5 text-[9px] font-bold text-white"
                  style={{ background: 'rgba(0,0,0,0.5)' }}>
                  {song.sources[0]?.quality || '?'}
                </div>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-semibold ${isCurrent ? '' : 'text-white'}`}
                  style={{ color: isCurrent ? '#4a90d9' : undefined }}>
                  {song.title}
                </p>
                <p className="truncate text-xs text-text-secondary mt-0.5">
                  {song.artist}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: `${typeColor[song.type]}22`,
                      color: typeColor[song.type],
                    }}
                  >
                    {typeLabel[song.type]}
                  </span>
                  {song.sourceLabel && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        background: song.sourceLabel.includes('完整') ? 'rgba(107,203,119,0.15)' : 'rgba(255,165,2,0.15)',
                        color: song.sourceLabel.includes('完整') ? '#6bcb77' : '#ffa502',
                      }}
                    >
                      {song.sourceLabel === '完整' ? '🎧 完整' : '⏱ 试听30s'}
                    </span>
                  )}
                  {song.duration > 0 && (
                    <span className="text-[10px] text-text-muted">
                      {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>

              {/* Play button */}
              <button
                onClick={() => {
                  if (isCurrent) {
                    isPlaying ? pause() : resume();
                  } else {
                    play(song);
                  }
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg transition-all duration-300 hover:scale-105"
                style={{
                  background: isCurrent && isPlaying
                    ? 'linear-gradient(135deg, #4a90d9, #f472b6)'
                    : 'rgba(255,255,255,0.08)',
                  color: isCurrent ? '#fff' : '#888',
                  boxShadow: isCurrent && isPlaying ? '0 4px 20px rgba(74,144,217,0.4)' : 'none',
                }}
              >
                {isCurrent && isPlaying ? '⏸' : '▶'}
              </button>
            </div>
          </div>
        );
      })}

      {/* Load More button */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-3 pb-28">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="rounded-full px-8 py-3 text-sm font-medium text-white transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #4a90d9, #2d6fb4)',
              boxShadow: '0 4px 20px rgba(74,144,217,0.25)',
            }}
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                加载中...
              </span>
            ) : (
              '加载更多歌曲 ↓'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
