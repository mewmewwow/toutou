interface StarDisplayProps {
  stars: number;
  maxStars: number;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Display stars with filled/empty icons
 */
export function StarDisplay({ stars, maxStars, size = 'md' }: StarDisplayProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const starSize = sizeClasses[size];

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }, (_, i) => (
        <svg
          key={i}
          className={`${starSize} ${i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          viewBox="0 0 20 20"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
      <span className="ml-2 text-sm text-gray-600">
        {stars}/{maxStars}
      </span>
    </div>
  );
}

export default StarDisplay;
