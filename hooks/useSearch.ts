'use client';

import { useState, useCallback, useRef } from 'react';
import type { Song } from '@/lib/types';
import { searchSongs } from '@/lib/api/client';

export function useSearch() {
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const lastQuery = useRef('');

  const search = useCallback(async (query: string, filter?: string, pageNum: number = 1) => {
    const q = query.trim();
    const f = filter ?? activeFilter;

    if (!q) {
      setResults([]);
      setTotal(0);
      setHasMore(false);
      setLoading(false);
      return;
    }

    lastQuery.current = q;
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await searchSongs(q, f === 'all' ? undefined : f, pageNum);
      if (q === lastQuery.current) {
        if (pageNum === 1) {
          setResults(res.results);
        } else {
          setResults(prev => [...prev, ...res.results]);
        }
        setTotal(res.total);
        setPage(pageNum);
        setHasMore(res.total > pageNum * 10);
      }
    } catch (err) {
      console.error('Search failed:', err);
      if (pageNum === 1) setResults([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeFilter]);

  const loadMore = useCallback(() => {
    if (lastQuery.current && hasMore && !loadingMore) {
      search(lastQuery.current, undefined, page + 1);
    }
  }, [search, page, hasMore, loadingMore]);

  const changeFilter = useCallback((filter: string) => {
    setActiveFilter(filter);
    if (lastQuery.current) {
      search(lastQuery.current, filter, 1);
    }
  }, [search]);

  return { results, loading, loadingMore, activeFilter, total, hasMore, search, loadMore, changeFilter };
}
