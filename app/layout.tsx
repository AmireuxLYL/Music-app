import type { Metadata } from 'next';
import './globals.css';
import AudioProvider from '@/components/player/AudioProvider';
import MiniPlayer from '@/components/player/MiniPlayer';
import NavBar from '@/components/ui/NavBar';

export const metadata: Metadata = {
  title: 'Music App',
  description: 'Discover, play and download music',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col">
        <AudioProvider>
          <main className="min-h-screen pb-32">{children}</main>
          <NavBar />
          <MiniPlayer />
        </AudioProvider>
      </body>
    </html>
  );
}
