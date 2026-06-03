'use client';

import { useEffect, useState } from 'react';

export default function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    setIsIOS(/iPhone|iPad|iPod/.test(navigator.userAgent));

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Listen for Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
      // Show after 3 seconds of engagement
      setTimeout(() => setShowInstall(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show manual install prompt after delay (for browsers without beforeinstallprompt)
    const timer = setTimeout(() => {
      if (!installPrompt && !dismissed) {
        setShowInstall(true);
      }
    }, 8000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setShowInstall(false);
      }
      setInstallPrompt(null);
    } else if (isIOS) {
      // iOS can't auto-install, show instructions
      alert('点击 Safari 底部分享按钮 ↑\n然后选择「添加到主屏幕」');
    }
  };

  const handleDismiss = () => {
    setShowInstall(false);
    setDismissed(true);
    // Show again after 30 seconds
    setTimeout(() => { setDismissed(false); setShowInstall(true); }, 30000);
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-24 left-3 right-3 z-[60] slide-up-enter">
      <div className="flex items-center gap-3 rounded-2xl p-4"
        style={{ background: 'linear-gradient(135deg, #4a90d9, #2d6fb4)', boxShadow: '0 8px 32px rgba(74,144,217,0.5)' }}>
        <span className="text-3xl">🐾</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">安装 MusicFlow App</p>
          <p className="text-[11px] text-white/70 truncate">{isIOS ? 'Safari 分享 → 添加到主屏幕' : '一键安装到桌面，全屏使用'}</p>
        </div>
        <button onClick={handleInstall}
          className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-bold"
          style={{ color: '#4a90d9' }}>
          {isIOS ? '查看教程' : '安装'}
        </button>
        <button onClick={handleDismiss} className="shrink-0 text-white/60 text-xs px-1">✕</button>
      </div>
    </div>
  );
}
