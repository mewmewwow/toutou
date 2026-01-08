import React, { useState } from 'react';

interface DraggableWordProps {
  word: string;
  index: number;
  isPlaced?: boolean;
  isCorrect?: boolean | null;
  showResult?: boolean;
  onDragStart?: (index: number) => void;
  onDragEnd?: () => void;
  onClick?: (index: number) => void;
  className?: string;
}

/**
 * DraggableWord component for sentence ordering exercises
 * Supports both drag-and-drop and click-to-select interactions
 */
export const DraggableWord: React.FC<DraggableWordProps> = ({
  word,
  index,
  isPlaced = false,
  isCorrect = null,
  showResult = false,
  onDragStart,
  onDragEnd,
  onClick,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(index);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  const handleClick = () => {
    if (!isPlaced) {
      onClick?.(index);
    }
  };

  const getStateClass = () => {
    if (showResult && isCorrect !== null) {
      return isCorrect
        ? 'bg-green-100 border-green-400 text-green-800'
        : 'bg-red-100 border-red-400 text-red-800';
    }

    if (isPlaced) {
      return 'bg-blue-100 border-blue-400 text-blue-800';
    }

    if (isDragging) {
      return 'bg-gray-200 border-gray-400 opacity-50';
    }

    return 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-md';
  };

  return (
    <div
      draggable={!isPlaced}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={`
        inline-flex items-center px-3 py-2
        border-2 rounded-lg cursor-pointer
        transition-all duration-200
        select-none font-medium
        ${getStateClass()}
        ${isPlaced ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
        ${className}
      `}
    >
      <span>{word}</span>
      {showResult && isCorrect !== null && (
        <span className="ml-2">
          {isCorrect ? (
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </span>
      )}
    </div>
  );
};

interface WordBankProps {
  words: string[];
  placedIndices: Set<number>;
  onWordSelect: (index: number) => void;
  className?: string;
}

/**
 * WordBank component - shows available words to arrange
 */
export const WordBank: React.FC<WordBankProps> = ({
  words,
  placedIndices,
  onWordSelect,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg min-h-[80px] ${className}`}>
      {words.map((word, index) => (
        <DraggableWord
          key={index}
          word={word}
          index={index}
          isPlaced={placedIndices.has(index)}
          onClick={onWordSelect}
          className={placedIndices.has(index) ? 'opacity-30 cursor-not-allowed' : ''}
        />
      ))}
    </div>
  );
};
