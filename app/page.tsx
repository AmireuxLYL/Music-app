'use client';

import SwipeFeed from '@/components/feed/SwipeFeed';

export default function HomePage() {
  return (
    <div className="relative h-screen bg-[#0a1628]">
      {/* Stitch header */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-5 pt-5">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            <span style={{
              background: 'linear-gradient(135deg, #4a90d9, #f472b6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>🐾 MusicFlow</span>
          </h1>
        </div>
      </div>

      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #4a90d9, #f472b6, transparent)' }} />

      <SwipeFeed />
    </div>
  );
}
