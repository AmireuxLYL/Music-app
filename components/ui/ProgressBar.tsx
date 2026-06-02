interface ProgressBarProps {
  current: number;
  total: number;
  onSeek?: (time: number) => void;
  className?: string;
}

export default function ProgressBar({ current, total, onSeek, className = '' }: ProgressBarProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={className}>
      <div
        className="group relative h-1.5 w-full cursor-pointer rounded-full bg-white/10"
        onClick={(e) => {
          if (!onSeek) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          onSeek(ratio * total);
        }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #4a90d9, #f472b6)',
          }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs" style={{ color: '#5a7a9a' }}>
        <span>{formatTime(current)}</span>
        <span>{formatTime(total)}</span>
      </div>
    </div>
  );
}
