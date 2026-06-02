'use client';

import { useState, useEffect } from 'react';
import type { Song } from '@/lib/types';
import DownloadManager from '@/components/download/DownloadManager';
import { useAudio } from '@/hooks/useAudio';
import { getAllFavorites, getHistory, removeFavorite } from '@/lib/db/indexeddb';
import { getTrending } from '@/lib/api/client';

const TABS = [
  { key: 'downloads', label: '📥 下载' },
  { key: 'favorites', label: '❤️ 收藏' },
  { key: 'history', label: '🕐 历史' },
];

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState('downloads');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favSongs, setFavSongs] = useState<Song[]>([]);
  const [historyItems, setHistoryItems] = useState<{ songId: string; playedAt: number }[]>([]);
  const { play } = useAudio();

  const loadFavorites = async () => {
    const ids = await getAllFavorites();
    setFavorites(ids);
    const allSongs = await getTrending();
    setFavSongs(allSongs.filter((s) => ids.includes(s.id)));
  };

  const loadHistory = async () => {
    const items = await getHistory(50);
    setHistoryItems(items);
  };

  useEffect(() => {
    if (activeTab === 'favorites') loadFavorites();
    if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  return (
    <div className="min-h-screen px-5 pt-5">
      <h1 className="mb-1 text-2xl font-extrabold text-white">
        <span className="gradient-text">我的音乐</span>
      </h1>
      <p className="mb-4 text-sm text-text-muted">离线也能听，随时随地</p>

      <div className="mb-4 flex gap-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-200"
            style={{
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, #ff6b6b, #ff6348)'
                : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.key ? '#fff' : '#aaa',
              boxShadow: activeTab === tab.key ? '0 4px 15px rgba(255,107,107,0.3)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'downloads' && <DownloadManager />}

      {activeTab === 'favorites' && (
        favSongs.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-3 text-5xl">💔</div>
            <p className="text-text-muted">还没有收藏的歌曲</p>
            <p className="mt-1 text-xs text-text-muted">在推荐流中双击即可收藏</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 fade-in">
            {favSongs.map((song) => (
              <div key={song.id} className="flex items-center gap-3 rounded-xl p-3 card-hover" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div
                  className="h-11 w-11 shrink-0 rounded-lg"
                  style={{ background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'linear-gradient(135deg, #ff6b6b, #ffa502)' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{song.title}</p>
                  <p className="text-xs text-text-secondary">{song.artist}</p>
                </div>
                <button onClick={() => play(song)} className="rounded-full p-2.5 text-lg transition-colors hover:bg-white/10 text-text-secondary">▶️</button>
                <button onClick={async () => { await removeFavorite(song.id); loadFavorites(); }} className="rounded-full p-2 text-sm text-text-muted transition-colors hover:text-red-400">✕</button>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'history' && (
        historyItems.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-3 text-5xl">🎧</div>
            <p className="text-text-muted">暂无播放记录</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 fade-in">
            {historyItems.map((item) => {
              const song = favSongs.find((s) => s.id === item.songId);
              return (
                <div key={item.songId + '-' + item.playedAt} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{song?.title || item.songId}</p>
                    <p className="text-xs text-text-muted">{new Date(item.playedAt).toLocaleString('zh-CN')}</p>
                  </div>
                  {song && (
                    <button onClick={() => play(song)} className="rounded-full p-2 text-lg text-text-secondary">▶️</button>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
