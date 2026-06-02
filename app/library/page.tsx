'use client';

import { useState, useEffect } from 'react';
import DownloadManager from '@/components/download/DownloadManager';
import { useAudio } from '@/hooks/useAudio';
import { getAllFavorites, getHistory, removeFavorite } from '@/lib/db/indexeddb';
import { getTrending } from '@/lib/api/client';
import type { Song } from '@/lib/types';

const TABS = [
  { key: 'downloads', label: '📥 下载' },
  { key: 'favorites', label: '💙 收藏' },
  { key: 'history', label: '🕐 历史' },
  { key: 'settings', label: '⚙️ 设置' },
];

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState('downloads');
  const [favSongs, setFavSongs] = useState<Song[]>([]);
  const [historyItems, setHistoryItems] = useState<{ songId: string; playedAt: number }[]>([]);
  const { play } = useAudio();

  // Jamendo key settings
  const [jamendoKey, setJamendoKey] = useState('');
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('jamendo_client_id');
    if (saved) {
      setJamendoKey(saved);
      setKeySaved(true);
    }
  }, []);

  const saveKey = () => {
    localStorage.setItem('jamendo_client_id', jamendoKey.trim());
    setKeySaved(true);
    // Also set as cookie for API routes
    document.cookie = `jamendo_client_id=${jamendoKey.trim()}; path=/; max-age=31536000`;
  };

  const loadFavorites = async () => {
    const ids = await getAllFavorites();
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
    <div className="min-h-screen px-5 pt-5 bg-background">
      <h1 className="mb-1 text-2xl font-extrabold text-white">我的音乐</h1>
      <p className="mb-4 text-sm text-text-muted">🐾 离线也能听，随时随地</p>

      <div className="mb-4 flex gap-1.5">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-200"
            style={{
              background: activeTab === tab.key ? 'linear-gradient(135deg, #4a90d9, #2d6fb4)' : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.key ? '#fff' : '#aaa',
              boxShadow: activeTab === tab.key ? '0 4px 15px rgba(74,144,217,0.3)' : 'none',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'downloads' && <DownloadManager />}

      {activeTab === 'favorites' && (
        favSongs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-5xl mb-3">🐾</p>
            <p className="text-text-muted">还没有收藏歌曲</p>
            <p className="mt-1 text-xs text-text-muted">在首页双击就能收藏啦</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 fade-in">
            {favSongs.map((song) => (
              <div key={song.id} className="flex items-center gap-3 rounded-xl p-3 card-hover" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="h-11 w-11 shrink-0 rounded-full flex items-center justify-center text-lg"
                  style={{ background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'linear-gradient(135deg, #4a90d9, #7ec8e3)' }}>
                  {!song.coverUrl && <span>🐾</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{song.title}</p>
                  <p className="text-xs text-text-secondary">{song.artist}</p>
                </div>
                <button onClick={() => play(song)} className="rounded-full p-2.5 text-lg transition-colors hover:bg-white/10" style={{ color: '#4a90d9' }}>▶️</button>
                <button onClick={async () => { await removeFavorite(song.id); loadFavorites(); }} className="rounded-full p-2 text-sm text-text-muted transition-colors hover:text-red-400">✕</button>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'history' && (
        historyItems.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-5xl mb-3">🕐</p>
            <p className="text-text-muted">暂无播放记录</p>
            <p className="mt-1 text-xs text-text-muted">听过的歌曲会出现在这里</p>
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
                  {song && <button onClick={() => play(song)} className="rounded-full p-2 text-lg" style={{ color: '#4a90d9' }}>▶️</button>}
                </div>
              );
            })}
          </div>
        )
      )}

      {activeTab === 'settings' && (
        <div className="fade-in">
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <h3 className="text-lg font-semibold text-white mb-1">🎵 完整歌曲音源</h3>
            <p className="text-sm text-text-muted mb-4">
              当前使用 iTunes + 互联网档案馆，提供试听片段。如需完整歌曲，请在下方填入 Jamendo 密钥（免费注册）。
            </p>

            <div className="mb-3">
              <label className="text-xs text-text-secondary mb-1 block">Jamendo 客户端 ID</label>
              <input
                type="text"
                value={jamendoKey}
                onChange={(e) => setJamendoKey(e.target.value)}
                placeholder="在此粘贴你的 Jamendo Client ID..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#4a90d9] transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={saveKey}
                className="rounded-xl px-6 py-2.5 text-sm font-medium text-white transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #4a90d9, #2d6fb4)' }}
              >
                {keySaved ? '✅ 已保存' : '保存密钥'}
              </button>
              <a
                href="https://devportal.jamendo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:text-white"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                获取免费密钥 →
              </a>
            </div>

            {keySaved && (
              <p className="mt-3 text-xs text-success">
                ✅ 密钥已保存！搜索时将自动获取完整歌曲。刷新页面生效。
              </p>
            )}
          </div>

          <div className="mt-4 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <h3 className="text-lg font-semibold text-white mb-2">📡 当前音源</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-success text-lg">●</span>
                <span className="text-text-secondary">Apple iTunes（试听片段 30秒）</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-success text-lg">●</span>
                <span className="text-text-secondary">互联网档案馆（完整歌曲）</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: jamendoKey ? '#6bcb77' : '#666' }} className="text-lg">●</span>
                <span className="text-text-secondary">
                  Jamendo（完整歌曲）{jamendoKey ? ' — 已配置 ✅' : ' — 需密钥'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <h3 className="text-lg font-semibold text-white mb-2">🐾 关于 MusicFlow</h3>
            <p className="text-sm text-text-muted">
              史迪仔主题音乐播放器 · 上下滑动发现好音乐 · 双击收藏 · 支持下载离线播放
            </p>
            <p className="mt-3 text-xs text-text-muted">
              内置音频引擎 · PWA 可安装到手机桌面 · 免注册即用
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
