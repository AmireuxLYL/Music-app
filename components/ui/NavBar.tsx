'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Stitch-themed SVG icons
function StitchDiscoverIcon({ active }: { active: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      {/* Stitch head silhouette */}
      <ellipse cx="14" cy="14" rx="9" ry="10" fill={active ? '#3298f0' : '#3a6088'} />
      {/* Left ear with notch */}
      <path d="M6 6 L1 1 L8 3 L9 7 Z" fill={active ? '#3298f0' : '#3a6088'} />
      <circle cx="2.5" cy="4.5" r="1.2" fill="#081428" />
      {/* Right ear with notch */}
      <path d="M22 6 L27 1 L20 3 L19 7 Z" fill={active ? '#3298f0' : '#3a6088'} />
      <circle cx="25.5" cy="4.5" r="1.2" fill="#081428" />
      {/* Inner ear pink */}
      <path d="M7.5 7.5 L3.5 4 L7 5.5 L8 8 Z" fill={active ? '#ff6e8a' : '#4a3a58'} />
      <path d="M20.5 7.5 L24.5 4 L21 5.5 L20 8 Z" fill={active ? '#ff6e8a' : '#4a3a58'} />
      {/* Big eyes */}
      <ellipse cx="11" cy="14" rx="3.5" ry="3.8" fill="#081428" />
      <ellipse cx="17" cy="14" rx="3.5" ry="3.8" fill="#081428" />
      <ellipse cx="11" cy="14" rx="2.2" ry="2.5" fill="#0b1d3a" />
      <ellipse cx="17" cy="14" rx="2.2" ry="2.5" fill="#0b1d3a" />
      <circle cx="11" cy="13" r="1.1" fill="white" />
      <circle cx="17" cy="13" r="1.1" fill="white" />
      {/* Wide nose */}
      <ellipse cx="14" cy="19" rx="3" ry="2" fill={active ? '#1a6fc4' : '#2a4a68'} />
      {/* Mouth grin */}
      <path d="M10 20.5 Q14 24 18 20.5" stroke={active ? '#1a6fc4' : '#2a4a68'} strokeWidth="0.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function StitchSearchIcon({ active }: { active: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      {/* Magnifying glass body */}
      <circle cx="12" cy="12" r="8" stroke={active ? '#3298f0' : '#3a6088'} strokeWidth="2.2" fill="none" />
      {/* Glass shine */}
      <path d="M8 10 Q10 7 12 7" stroke="white" strokeWidth="0.8" strokeOpacity="0.3" fill="none" strokeLinecap="round" />
      {/* Handle with Stitch ear notch */}
      <path d="M18 18 L25 25" stroke={active ? '#3298f0' : '#3a6088'} strokeWidth="2.5" strokeLinecap="round" />
      {/* Stitch ear detail on handle */}
      <circle cx="21" cy="21" r="1.5" fill="#081428" stroke={active ? '#ff6e8a' : '#4a3a58'} strokeWidth="0.8" />
      {/* Small decorative paw dots around glass */}
      <circle cx="4" cy="12" r="1.2" fill={active ? '#38c8e8' : '#3a6088'} />
      <circle cx="12" cy="4" r="1.2" fill={active ? '#38c8e8' : '#3a6088'} />
      <circle cx="20" cy="8" r="1" fill={active ? '#38c8e8' : '#3a6088'} />
    </svg>
  );
}

function StitchLibraryIcon({ active }: { active: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      {/* Heart with Stitch elements */}
      <path
        d="M14 24 C7 18 2 14.5 2 10 C2 6.5 4.5 4 7.5 4 C10 4 12 6 14 8 C16 6 18 4 20.5 4 C23.5 4 26 6.5 26 10 C26 14.5 21 18 14 24Z"
        fill={active ? '#3298f0' : '#3a6088'}
      />
      {/* Inner heart highlight */}
      <path
        d="M14 21 C9 16.5 5 13.5 5 10 C5 7.8 6.5 6.2 8.5 6.2 C10.5 6.2 12 7.8 14 9.5 C16 7.8 17.5 6.2 19.5 6.2 C21.5 6.2 23 7.8 23 10 C23 13.5 19 16.5 14 21Z"
        fill={active ? '#ff6e8a' : '#4a3a58'}
        fillOpacity="0.6"
      />
      {/* Stitch "sewing" marks — crosses around the heart */}
      <line x1="7" y1="12" x2="9" y2="14" stroke={active ? '#38c8e8' : '#3a6088'} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="9" y1="12" x2="7" y2="14" stroke={active ? '#38c8e8' : '#3a6088'} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="19" y1="12" x2="21" y2="14" stroke={active ? '#38c8e8' : '#3a6088'} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="21" y1="12" x2="19" y2="14" stroke={active ? '#38c8e8' : '#3a6088'} strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: '/', name: '推荐' },
  { href: '/search', name: '搜索' },
  { href: '/library', name: '我的' },
];

const iconComponents = [
  StitchDiscoverIcon,
  StitchSearchIcon,
  StitchLibraryIcon,
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="glass-strong fixed bottom-0 left-0 right-0 z-40 safe-bottom h-14">
      {/* Subtle Stitch-blue glow bar on top of nav */}
      <div className="absolute left-1/2 top-0 h-[1px] w-3/4 -translate-x-1/2 rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent, #3298f0, #38c8e8, #ff6e8a, #3298f0, transparent)', opacity: 0.5 }} />
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {NAV_ITEMS.map((item, idx) => {
          const active = pathname === item.href;
          const IconComp = iconComponents[idx];
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 px-8 py-1 transition-all duration-200"
            >
              <span className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                <IconComp active={active} />
              </span>
              <span className="text-[11px] font-semibold" style={{
                background: active ? 'linear-gradient(135deg, #4db8ff, #38c8e8)' : 'none',
                WebkitBackgroundClip: active ? 'text' : 'none',
                WebkitTextFillColor: active ? 'transparent' : '#4a6a8a',
              }}>
                {item.name}
              </span>
              {active && (
                <div className="absolute -top-1 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #3298f0, #38c8e8)', boxShadow: '0 0 10px rgba(50,152,240,0.5)' }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
