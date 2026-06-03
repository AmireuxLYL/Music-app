import type { Metadata, Viewport } from 'next';
import './globals.css';
import AudioProvider from '@/components/player/AudioProvider';
import MiniPlayer from '@/components/player/MiniPlayer';
import NavBar from '@/components/ui/NavBar';
import PwaRegister from '@/components/ui/PwaRegister';

export const metadata: Metadata = {
  title: 'MusicFlow — 发现好音乐',
  description: '像刷抖音一样发现好音乐',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MusicFlow',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f0f0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="referrer" content="no-referrer" />
      </head>
      <body className="min-h-full flex flex-col ocean-gradient">
        <PwaRegister />
        <AudioProvider>
          <main className="flex-1" style={{ paddingBottom: '9rem' }}>{children}</main>
          <MiniPlayer />
          <NavBar />
        </AudioProvider>
      </body>
    </html>
  );
}
