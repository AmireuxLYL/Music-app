'use client';

import { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
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
    <div className="relative">
      <div className="flex items-center gap-2 rounded-2xl border px-4 py-3" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)' }}>
        <span style={{ color: '#666' }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="搜索歌曲、歌手、伴奏..."
          className="flex-1 bg-transparent text-sm text-white outline-hidden placeholder:text-[#666]"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); onSearch(''); }}
            style={{ color: '#666' }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
