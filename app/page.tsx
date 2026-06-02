'use client';

import SwipeFeed from '@/components/feed/SwipeFeed';

export default function HomePage() {
  return (
    <div className="relative h-screen bg-background">
      {/* Header */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 px-5 pt-5">
        <h1 className="text-xl font-extrabold tracking-tight text-white">
          🐾 <span>MusicFlow</span>
        </h1>
      </div>

      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #4a90d9, #f472b6, transparent)' }} />

      <SwipeFeed />
    </div>
  );
}
