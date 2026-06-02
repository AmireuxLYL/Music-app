'use client';

import { useSearch } from '@/hooks/useSearch';
import SearchBar from '@/components/search/SearchBar';
import TagFilter from '@/components/search/TagFilter';
import SearchResults from '@/components/search/SearchResults';

export default function SearchPage() {
  const { results, loading, activeFilter, search, changeFilter } = useSearch();

  return (
    <div className="min-h-screen px-5 pt-5">
      <h1 className="mb-1 text-2xl font-extrabold text-white">
        <span className="gradient-text">搜索</span>
      </h1>
      <p className="mb-4 text-sm text-text-muted">发现歌曲、伴奏、纯音乐</p>
      <SearchBar onSearch={(q) => search(q)} />
      <TagFilter active={activeFilter} onChange={changeFilter} />
      <SearchResults results={results} loading={loading} />
    </div>
  );
}
