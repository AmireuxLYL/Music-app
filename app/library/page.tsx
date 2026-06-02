'use client';

import { useState, useEffect } from 'react';
import type { Song } from '@/lib/types';
import DownloadManager from '@/components/download/DownloadManager';
import { useAudio } from '@/hooks/useAudio';
import { getAllFavorites, getHistory, removeFavorite } from '@/lib/db/indexeddb';
import { getTrending } from '@/lib/api/client';

const TABS = [
  { key: 'downloads', label: '下载' },
  { key: 'favorites', label: '收藏' },
  { key: 'history', label: '历史' },
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
    <div className="min-h-screen px-4 pt-4">
      <h1 className="mb-4 text-2xl font-bold text-white">我的音乐</h1>

      <div className="mb-4 flex rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
            style={{
              background: activeTab === tab.key ? '#ff6b6b' : 'transparent',
              color: activeTab === tab.key ? '#fff' : '#aaa',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'downloads' && <DownloadManager />}

      {activeTab === 'favorites' && (
        favSongs.length === 0 ? (
          <div className="py-12 text-center">
            <p style={{ color: '#666' }}>还没有收藏的歌曲</p>
            <p className="mt-1 text-xs" style={{ color: '#666' }}>在推荐流中双击即可收藏</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {favSongs.map((song) => (
              <div key={song.id} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div
                  className="h-10 w-10 shrink-0 rounded-lg"
                  style={{ background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'linear-gradient(135deg, #ff6b6b, #ffa502)' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{song.title}</p>
                  <p className="text-xs" style={{ color: '#aaa' }}>{song.artist}</p>
                </div>
                <button onClick={() => play(song)} className="rounded-full p-2 text-lg" style={{ color: '#aaa' }}>▶️</button>
                <button onClick={async () => { await removeFavorite(song.id); loadFavorites(); }} className="rounded-full p-2 text-sm" style={{ color: '#666' }}>🗑</button>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'history' && (
        historyItems.length === 0 ? (
          <div className="py-12 text-center">
            <p style={{ color: '#666' }}>暂无播放记录</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {historyItems.map((item) => {
              const song = favSongs.find((s) => s.id === item.songId);
              return (
                <div key={item.songId + '-' + item.playedAt} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{song?.title || item.songId}</p>
                    <p className="text-xs" style={{ color: '#666' }}>
                      {new Date(item.playedAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
