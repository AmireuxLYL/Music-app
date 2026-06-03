'use client';

const FILTERS = [
  { key: 'all', label: '全部', icon: '🐾' },
  { key: 'original', label: '原唱', icon: '🎤' },
  { key: 'instrumental', label: '伴奏', icon: '🎹' },
  { key: 'pure_music', label: '纯音乐', icon: '🎻' },
  { key: 'cover', label: '翻唱', icon: '🎙' },
];

interface TagFilterProps {
  active: string;
  onChange: (key: string) => void;
}

export default function TagFilter({ active, onChange }: TagFilterProps) {
  return (
    <div className="mb-5 flex gap-2 overflow-x-auto scrollbar-hide">
      {FILTERS.map((f) => {
        const isActive = active === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className="group relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 select-none"
            style={{
              background: isActive
                ? 'linear-gradient(135deg, #4a90d9, #2d6fb4)'
                : 'rgba(255,255,255,0.05)',
              color: isActive ? '#fff' : '#888',
              boxShadow: isActive ? '0 4px 20px rgba(74,144,217,0.35)' : 'none',
              border: isActive ? '1px solid rgba(74,144,217,0.3)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span className="mr-1 text-xs">{f.icon}</span>
            {f.label}
            {/* Hover gradient glow */}
            {!isActive && (
              <div className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: 'linear-gradient(135deg, rgba(74,144,217,0.15), rgba(244,114,182,0.1))' }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
