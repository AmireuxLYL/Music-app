'use client';

import { useSearch } from '@/hooks/useSearch';
import SearchBar from '@/components/search/SearchBar';
import TagFilter from '@/components/search/TagFilter';
import SearchResults from '@/components/search/SearchResults';

export default function SearchPage() {
  const { results, loading, loadingMore, activeFilter, total, hasMore, search, loadMore, changeFilter } = useSearch();

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 h-72 w-72 opacity-[0.06] blur-3xl"
          style={{ background: 'radial-gradient(circle, #4a90d9, transparent)' }} />
        <div className="absolute top-40 -right-20 h-64 w-64 opacity-[0.04] blur-3xl"
          style={{ background: 'radial-gradient(circle, #f472b6, transparent)' }} />
      </div>

      <div className="relative z-10 px-5 pt-6 pb-32">
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="-ml-0.5">
              <circle cx="12" cy="12" r="8" stroke="#4a90d9" strokeWidth="2.2" fill="none" />
              <path d="M18 18 L25 25" stroke="#4a90d9" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="21" cy="21" r="1.5" fill="#0f0f0f" stroke="#f472b6" strokeWidth="0.8" />
              <circle cx="4" cy="12" r="1" fill="#7ec8e3" />
              <circle cx="12" cy="4" r="1" fill="#7ec8e3" />
            </svg>
            搜索音乐
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            🐾 QQ音乐 + 网易云 + iTunes 全球曲库
            <span className="ml-2 text-xs text-text-muted opacity-60">1亿+ 曲库</span>
          </p>
        </div>

        <SearchBar onSearch={(q) => search(q)} />
        <TagFilter active={activeFilter} onChange={changeFilter} />

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-text-muted">
            {loading ? '搜索中...' : total > 0 ? `共 ${total} 首` : ''}
          </p>
        </div>

        <SearchResults
          results={results}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          total={total}
          onLoadMore={loadMore}
        />
      </div>
    </div>
  );
}
