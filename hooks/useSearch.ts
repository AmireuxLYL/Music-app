'use client';

import { useState, useCallback, useRef } from 'react';
import type { Song } from '@/lib/types';
import { searchSongs } from '@/lib/api/client';

export function useSearch() {
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const lastQuery = useRef('');

  const search = useCallback(async (query: string, filter?: string) => {
    const q = query.trim();
    const f = filter ?? activeFilter;

    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }

    lastQuery.current = q;
    setLoading(true);

    try {
      const res = await searchSongs(q, f === 'all' ? undefined : f);
      if (q === lastQuery.current) {
        setResults(res.results);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  const changeFilter = useCallback((filter: string) => {
    setActiveFilter(filter);
    if (lastQuery.current) {
      search(lastQuery.current, filter);
    }
  }, [search]);

  return { results, loading, activeFilter, search, changeFilter };
}
