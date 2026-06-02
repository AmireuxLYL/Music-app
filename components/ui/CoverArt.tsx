interface CoverArtProps {
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  gradient?: string;
  className?: string;
}

const sizes: Record<string, string> = {
  sm: 'w-12 h-12',
  md: 'w-36 h-36',
  lg: 'w-48 h-48',
};

export default function CoverArt({
  src,
  size = 'md',
  gradient = 'from-[#ff6b6b] to-[#ffa502]',
  className = '',
}: CoverArtProps) {
  const style: React.CSSProperties = {};
  if (src) {
    style.backgroundImage = `url(${src})`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
  }

  return (
    <div
      className={`${sizes[size]} ${className} rounded-[16px] shrink-0 bg-linear-to-br ${gradient}`}
      style={{
        ...style,
        boxShadow: '0 8px 40px rgba(255,107,107,0.5)',
      }}
    />
  );
}
