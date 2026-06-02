'use client';

import type { Song } from '@/lib/types';
import { useAudio } from '@/hooks/useAudio';
import CoverArt from '@/components/ui/CoverArt';

interface SearchResultsProps {
  results: Song[];
  loading: boolean;
}

export default function SearchResults({ results, loading }: SearchResultsProps) {
  const { play, currentSong } = useAudio();

  const typeLabel: Record<string, string> = {
    original: '原唱',
    instrumental: '伴奏',
    pure_music: '纯音乐',
    cover: '翻唱',
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: '#ff6b6b', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-12 text-center">
        <p style={{ color: '#666' }}>输入关键词搜索歌曲</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {results.map((song) => (
        <div
          key={song.id}
          className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[rgba(255,255,255,0.06)]"
          style={currentSong?.id === song.id ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,107,107,0.2)' } : {}}
        >
          <CoverArt src={song.coverUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{song.title}</p>
            <p className="truncate text-xs" style={{ color: '#aaa' }}>
              {song.artist} · {typeLabel[song.type] || song.type}
            </p>
          </div>
          <button
            onClick={() => play(song)}
            className="rounded-full p-2 text-lg transition-colors hover:bg-white/10"
            style={{ color: currentSong?.id === song.id ? '#ff6b6b' : '#aaa' }}
          >
            {currentSong?.id === song.id ? '⏸' : '▶️'}
          </button>
        </div>
      ))}
    </div>
  );
}
