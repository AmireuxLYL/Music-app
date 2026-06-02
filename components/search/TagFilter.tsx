'use client';

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'original', label: '🎤 原唱' },
  { key: 'instrumental', label: '🎹 伴奏' },
  { key: 'pure_music', label: '🎻 纯音乐' },
  { key: 'cover', label: '🎙 翻唱' },
];

interface TagFilterProps {
  active: string;
  onChange: (key: string) => void;
}

export default function TagFilter({ active, onChange }: TagFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className="shrink-0 rounded-full px-4 py-1.5 text-sm transition-all duration-200"
          style={{
            background: active === f.key
              ? 'linear-gradient(135deg, #4a90d9, #2d6fb4)'
              : 'rgba(255,255,255,0.06)',
            color: active === f.key ? '#fff' : '#aaa',
            boxShadow: active === f.key ? '0 2px 12px rgba(74,144,217,0.3)' : 'none',
          }}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
