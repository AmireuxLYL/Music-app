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
    <div className="flex gap-2 overflow-x-auto py-3">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className="shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors"
          style={{
            background: active === f.key ? '#ff6b6b' : 'rgba(255,255,255,0.06)',
            color: active === f.key ? '#fff' : '#aaa',
          }}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
