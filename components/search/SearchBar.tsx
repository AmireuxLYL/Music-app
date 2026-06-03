'use client';

import { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(value.trim());
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative mb-4">
      {/* Glow behind search bar when focused */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 blur-xl transition-opacity duration-500"
        style={{
          background: 'linear-gradient(135deg, #3298f0, #38c8e8)',
          opacity: focused ? 0.15 : 0,
        }}
      />

      <div
        className="relative flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300"
        style={{
          background: focused ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
          border: focused ? '1px solid rgba(50,152,240,0.4)' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: focused ? '0 0 30px rgba(50,152,240,0.1)' : 'none',
        }}
      >
        {/* Search icon — Stitch eye style */}
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none" className="shrink-0">
          <circle cx="12" cy="12" r="8" stroke={focused ? '#3298f0' : '#4a6a8a'} strokeWidth="2.2" fill="none" />
          <circle cx="8" cy="10" r="1.2" fill={focused ? '#3298f0' : '#4a6a8a'} opacity="0.5" />
          <path d="M18 18 L25 25" stroke={focused ? '#3298f0' : '#4a6a8a'} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="21" cy="21" r="1.5" fill="#081428" stroke={focused ? '#ff6e8a' : '#4a3a58'} strokeWidth="0.8" />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="搜索歌曲、歌手、伴奏..."
          className="flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-[#555]"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); onSearch(''); }}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#888' }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
