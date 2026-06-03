'use client';

import SwipeFeed from '@/components/feed/SwipeFeed';

export default function HomePage() {
  return (
    <div className="relative h-screen bg-background">
      {/* Ocean atmosphere glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/3 top-0 h-96 w-96 -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl"
          style={{ background: 'radial-gradient(circle, #3298f0, transparent 70%)' }} />
        <div className="absolute right-1/4 top-1/3 h-80 w-80 rounded-full opacity-[0.08] blur-3xl"
          style={{ background: 'radial-gradient(circle, #ff6e8a, transparent 70%)' }} />
        <div className="absolute bottom-1/4 left-1/4 h-72 w-72 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: 'radial-gradient(circle, #38c8e8, transparent 70%)' }} />
      </div>

      <SwipeFeed />
    </div>
  );
}
