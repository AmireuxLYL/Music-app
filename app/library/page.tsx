'use client';

import { useState, useEffect } from 'react';
import DownloadManager from '@/components/download/DownloadManager';
import { useAudio } from '@/hooks/useAudio';
import { getAllFavorites, getHistory, removeFavorite } from '@/lib/db/indexeddb';
import { getTrending } from '@/lib/api/client';
import type { Song } from '@/lib/types';

const TABS = [
  { key: 'downloads', label: '下载', icon: '📥' },
  { key: 'favorites', label: '收藏', icon: '💙' },
  { key: 'history', label: '历史', icon: '🕐' },
  { key: 'settings', label: '设置', icon: '⚙️' },
];

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState('downloads');
  const [favSongs, setFavSongs] = useState<Song[]>([]);
  const [historyItems, setHistoryItems] = useState<{ songId: string; playedAt: number }[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
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
    document.cookie = `jamendo_client_id=${jamendoKey.trim()}; path=/; max-age=31536000`;
  };

  const loadFavorites = async () => {
    const ids = await getAllFavorites();
    if (allSongs.length === 0) {
      try {
        const trending = await getTrending();
        setAllSongs(trending);
        setFavSongs(trending.filter((s) => ids.includes(s.id)));
      } catch {
        setFavSongs([]);
      }
    } else {
      setFavSongs(allSongs.filter((s) => ids.includes(s.id)));
    }
  };

  const loadHistory = async () => {
    const items = await getHistory(50);
    setHistoryItems(items);
    // Load songs for history display
    if (allSongs.length === 0) {
      try {
        const trending = await getTrending();
        setAllSongs(trending);
      } catch {}
    }
  };

  useEffect(() => {
    if (activeTab === 'favorites') loadFavorites();
    if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  const typeLabel: Record<string, string> = {
    original: '原唱', instrumental: '伴奏', pure_music: '纯音乐', cover: '翻唱',
  };
  const typeColor: Record<string, string> = {
    original: '#3298f0', instrumental: '#38c8e8', pure_music: '#8b7cf0', cover: '#ff6e8a',
  };

  const getGrad = (s: string) => {
    const p: [string, string][] = [
      ['#3298f0', '#38c8e8'], ['#ff6e8a', '#8b7cf0'], ['#3298f0', '#1a6fc4'],
      ['#38c8e8', '#3298f0'], ['#8b7cf0', '#ff6e8a'], ['#ff6e8a', '#3298f0'],
    ];
    return p[s.length > 0 ? s.charCodeAt(0) % p.length : 0];
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Decorative orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-20 right-10 h-64 w-64 opacity-[0.06] blur-3xl"
          style={{ background: 'radial-gradient(circle, #ff6e8a, transparent)' }} />
        <div className="absolute top-1/3 -left-16 h-56 w-56 opacity-[0.05] blur-3xl"
          style={{ background: 'radial-gradient(circle, #3298f0, transparent)' }} />
      </div>

      <div className="relative z-10 px-5 pt-6 pb-36">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 24 C7 18 2 14.5 2 10 C2 6.5 4.5 4 7.5 4 C10 4 12 6 14 8 C16 6 18 4 20.5 4 C23.5 4 26 6.5 26 10 C26 14.5 21 18 14 24Z"
                fill="#3298f0"
              />
              <path
                d="M14 21 C9 16.5 5 13.5 5 10 C5 7.8 6.5 6.2 8.5 6.2 C10.5 6.2 12 7.8 14 9.5 C16 7.8 17.5 6.2 19.5 6.2 C21.5 6.2 23 7.8 23 10 C23 13.5 19 16.5 14 21Z"
                fill="#ff6e8a" fillOpacity="0.6"
              />
              <line x1="7" y1="12" x2="9" y2="14" stroke="#38c8e8" strokeWidth="0.8" strokeLinecap="round" />
              <line x1="9" y1="12" x2="7" y2="14" stroke="#38c8e8" strokeWidth="0.8" strokeLinecap="round" />
              <line x1="19" y1="12" x2="21" y2="14" stroke="#38c8e8" strokeWidth="0.8" strokeLinecap="round" />
              <line x1="21" y1="12" x2="19" y2="14" stroke="#38c8e8" strokeWidth="0.8" strokeLinecap="round" />
            </svg>
            我的音乐
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            🐾 离线也能听，随时随地
            {favSongs.length > 0 && <span className="ml-2 text-xs text-text-muted opacity-60">已收藏 {favSongs.length} 首</span>}
          </p>
        </div>

        {/* Tabs — pill style */}
        <div className="mb-5 flex gap-1 rounded-2xl p-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-300 relative"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: isActive ? '#fff' : '#666',
                  boxShadow: isActive ? '0 2px 12px rgba(50,152,240,0.2)' : 'none',
                }}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Downloads */}
        {activeTab === 'downloads' && <DownloadManager />}

        {/* Favorites */}
        {activeTab === 'favorites' && (
          favSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 fade-in">
              <svg width="64" height="64" viewBox="0 0 28 28" fill="none" className="mb-4 opacity-20">
                <path d="M14 24 C7 18 2 14.5 2 10 C2 6.5 4.5 4 7.5 4 C10 4 12 6 14 8 C16 6 18 4 20.5 4 C23.5 4 26 6.5 26 10 C26 14.5 21 18 14 24Z" fill="#4a90d9" />
              </svg>
              <p className="text-lg font-medium text-text-muted">还没有收藏歌曲</p>
              <p className="mt-1 text-xs text-text-muted">在首页双击就能收藏啦</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 fade-in">
              {favSongs.map((song) => {
                const [g1, g2] = getGrad(song.id);
                return (
                  <div key={song.id}
                    className="group relative flex items-center gap-4 rounded-2xl p-3 transition-all duration-300 card-hover"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <div
                      className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-lg"
                      style={{
                        background: song.coverUrl
                          ? `url(${song.coverUrl}) center/cover`
                          : `linear-gradient(135deg, ${g1}, ${g2})`,
                      }}
                    >
                      {!song.coverUrl && '🐾'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{song.title}</p>
                      <p className="truncate text-xs text-text-secondary">{song.artist}</p>
                      <span
                        className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: `${typeColor[song.type]}22`, color: typeColor[song.type] }}
                      >
                        {typeLabel[song.type]}
                      </span>
                    </div>
                    <button
                      onClick={() => play(song)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm transition-all hover:scale-105"
                      style={{ background: 'rgba(255,255,255,0.08)', color: '#3298f0' }}
                    >
                      ▶
                    </button>
                    <button
                      onClick={async () => { await removeFavorite(song.id); loadFavorites(); }}
                      className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      style={{ background: 'rgba(255,255,255,0.1)', color: '#888' }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* History */}
        {activeTab === 'history' && (
          historyItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 fade-in">
              <p className="text-5xl mb-3 opacity-30">🕐</p>
              <p className="text-lg font-medium text-text-muted">暂无播放记录</p>
              <p className="mt-1 text-xs text-text-muted">听过的歌曲会出现在这里</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 fade-in">
              {historyItems.map((item) => {
                const song = allSongs.find((s) => s.id === item.songId);
                const [g1, g2] = getGrad(item.songId);
                return (
                  <div key={item.songId + '-' + item.playedAt}
                    className="flex items-center gap-4 rounded-2xl p-3 transition-all duration-300"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <div
                      className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center"
                      style={{
                        background: song?.coverUrl
                          ? `url(${song.coverUrl}) center/cover`
                          : `linear-gradient(135deg, ${g1}, ${g2})`,
                      }}
                    >
                      {!song?.coverUrl && '🐾'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{song?.title || item.songId}</p>
                      <p className="truncate text-xs text-text-muted">
                        {song?.artist || '未知'} · {new Date(item.playedAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    {song && (
                      <button
                        onClick={() => play(song)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs transition-all hover:scale-105"
                        style={{ background: 'rgba(255,255,255,0.08)', color: '#3298f0' }}
                      >
                        ▶
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="fade-in space-y-4">
            {/* API Key */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-base font-semibold text-white mb-1">🎵 完整歌曲音源</h3>
              <p className="text-sm text-text-muted mb-4 leading-relaxed">
                当前使用 iTunes + 互联网档案馆提供试听片段。如需完整歌曲，请注册免费的 Jamendo API 密钥。
              </p>

              <div className="mb-3">
                <label className="text-xs text-text-secondary mb-1.5 block font-medium">Jamendo 客户端 ID</label>
                <input
                  type="text"
                  value={jamendoKey}
                  onChange={(e) => setJamendoKey(e.target.value)}
                  placeholder="在此粘贴你的 Jamendo Client ID..."
                  className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none transition-all duration-300 focus:border-[#4a90d9]"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: keySaved ? 'rgba(74,222,160,0.3)' : 'rgba(255,255,255,0.1)',
                  }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={saveKey}
                  className="rounded-xl px-6 py-2.5 text-sm font-medium text-white transition-all active:scale-95"
                  style={{
                    background: keySaved
                      ? 'linear-gradient(135deg, #4adea0, #38b278)'
                      : 'linear-gradient(135deg, #3298f0, #1a6fc4)',
                    boxShadow: '0 4px 15px rgba(50,152,240,0.3)',
                  }}
                >
                  {keySaved ? '✅ 已保存' : '保存密钥'}
                </button>
                <a
                  href="https://devportal.jamendo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:text-white flex items-center"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#888' }}
                >
                  获取免费密钥 →
                </a>
              </div>

              {keySaved && (
                <p className="mt-3 text-xs" style={{ color: '#4adea0' }}>
                  ✅ 密钥已保存！搜索时将自动获取完整歌曲。刷新页面后生效。
                </p>
              )}
            </div>

            {/* Current sources */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-base font-semibold text-white mb-3">📡 当前音源状态</h3>
              <div className="space-y-3">
                {[
                  { label: 'Apple iTunes（30秒试听）', active: true, color: '#3298f0' },
                  { label: '互联网档案馆（完整歌曲）', active: true, color: '#38c8e8' },
                  { label: `Jamendo（完整歌曲）${jamendoKey ? ' — 已配置 ✅' : ' — 需免费密钥'}`, active: !!jamendoKey, color: jamendoKey ? '#4adea0' : '#555' },
                ].map((src) => (
                  <div key={src.label} className="flex items-center gap-3">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{
                        background: src.active ? src.color : '#444',
                        boxShadow: src.active ? `0 0 8px ${src.color}` : 'none',
                      }}
                    />
                    <span className="text-sm text-text-secondary">{src.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* About */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-base font-semibold text-white mb-2">🐾 关于 MusicFlow</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                史迪仔主题音乐播放器 · 上下滑动发现好音乐 · 双击收藏 · 支持下载离线播放
              </p>
              <p className="mt-3 text-xs text-text-muted opacity-70">
                内置音频引擎 · PWA 可安装到手机桌面 · 多音源聚合 · 免注册即用
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
