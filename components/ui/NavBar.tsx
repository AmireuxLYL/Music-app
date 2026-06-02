'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: '🏠', name: '推荐' },
  { href: '/search', label: '🔍', name: '搜索' },
  { href: '/library', label: '📂', name: '我的' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="glass-strong fixed bottom-0 left-0 right-0 z-40 safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around py-1.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-0.5 px-8 py-1.5 transition-all duration-200"
              style={{ color: active ? '#ff6b6b' : '#666' }}
            >
              <span className={`text-lg transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                {item.label}
              </span>
              <span className={`text-xs font-medium ${active ? 'gradient-text' : ''}`}>
                {item.name}
              </span>
              {active && (
                <div
                  className="absolute -top-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #ff6b6b, #ffa502)' }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
