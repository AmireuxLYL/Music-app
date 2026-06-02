'use client';

import { useSearch } from '@/hooks/useSearch';
import SearchBar from '@/components/search/SearchBar';
import TagFilter from '@/components/search/TagFilter';
import SearchResults from '@/components/search/SearchResults';

export default function SearchPage() {
  const { results, loading, activeFilter, search, changeFilter } = useSearch();

  return (
    <div className="min-h-screen px-4 pt-4">
      <h1 className="mb-4 text-2xl font-bold text-white">搜索</h1>
      <SearchBar onSearch={(q) => search(q)} />
      <TagFilter active={activeFilter} onChange={changeFilter} />
      <SearchResults results={results} loading={loading} />
    </div>
  );
}
