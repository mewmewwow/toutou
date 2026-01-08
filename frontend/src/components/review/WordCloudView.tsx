import { useState, useMemo } from 'react';
import { WordStats } from '../../hooks/useReview';
import { WordHoverCard } from './WordHoverCard';

interface WordCloudViewProps {
  words: WordStats[];
  onWordClick?: (word: WordStats) => void;
}

/**
 * Word cloud view with words sized by review count and colored by retrievability
 */
export function WordCloudView({ words, onWordClick }: WordCloudViewProps) {
  const [hoveredWord, setHoveredWord] = useState<WordStats | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  // Calculate min/max for scaling
  const { minReviews, maxReviews } = useMemo(() => {
    if (words.length === 0) return { minReviews: 0, maxReviews: 1 };
    const counts = words.map((w) => w.reviewCount);
    return {
      minReviews: Math.min(...counts),
      maxReviews: Math.max(...counts),
    };
  }, [words]);

  // Calculate font size based on review count
  const getFontSize = (reviewCount: number): number => {
    const range = maxReviews - minReviews || 1;
    const normalized = (reviewCount - minReviews) / range;
    return 12 + normalized * 20; // 12px to 32px
  };

  // Get color based on retrievability
  const getColor = (retrievability: number): string => {
    if (retrievability >= 0.9) return 'text-green-600 hover:text-green-700';
    if (retrievability >= 0.7) return 'text-yellow-600 hover:text-yellow-700';
    if (retrievability >= 0.5) return 'text-orange-500 hover:text-orange-600';
    return 'text-red-500 hover:text-red-600';
  };

  const handleMouseEnter = (word: WordStats, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    });
    setHoveredWord(word);
  };

  const handleMouseLeave = () => {
    setHoveredWord(null);
  };

  if (words.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <p className="text-gray-500">暂无复习数据</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 relative">
      <h3 className="text-sm font-medium text-gray-700 mb-4">词汇云</h3>

      <div className="flex flex-wrap gap-2 items-center justify-center min-h-[200px]">
        {words.map((word) => (
          <button
            key={word.wordId}
            className={`font-medium transition-all cursor-pointer ${getColor(word.retrievability)}`}
            style={{ fontSize: `${getFontSize(word.reviewCount)}px` }}
            onClick={() => onWordClick?.(word)}
            onMouseEnter={(e) => handleMouseEnter(word, e)}
            onMouseLeave={handleMouseLeave}
          >
            {word.word}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-500">强</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-500">中</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-gray-500">弱</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-500">危</span>
        </div>
      </div>

      {/* Hover card */}
      {hoveredWord && (
        <div
          className="fixed z-50"
          style={{
            left: hoverPosition.x - 128, // Half of card width
            top: hoverPosition.y,
          }}
        >
          <WordHoverCard word={hoveredWord} onClose={() => setHoveredWord(null)} />
        </div>
      )}
    </div>
  );
}

export default WordCloudView;
