import React, { useState } from 'react';
import { DraggableWord } from './DraggableWord';

interface PlacedWord {
  word: string;
  originalIndex: number;
}

interface WordOrderAreaProps {
  placedWords: PlacedWord[];
  correctOrder?: number[];
  showResult?: boolean;
  onRemoveWord?: (position: number) => void;
  onReorderWord?: (fromPosition: number, toPosition: number) => void;
  onDropWord?: (originalIndex: number, position: number) => void;
  className?: string;
}

/**
 * WordOrderArea - Drop zone for arranging words in order
 */
export const WordOrderArea: React.FC<WordOrderAreaProps> = ({
  placedWords,
  correctOrder = [],
  showResult = false,
  onRemoveWord,
  onReorderWord,
  onDropWord,
  className = '',
}) => {
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverPosition(position);
  };

  const handleDragLeave = () => {
    setDragOverPosition(null);
  };

  const handleDrop = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    setDragOverPosition(null);

    const data = e.dataTransfer.getData('text/plain');
    const originalIndex = parseInt(data, 10);

    if (!isNaN(originalIndex)) {
      onDropWord?.(originalIndex, position);
    }
  };

  const isCorrectPosition = (position: number, originalIndex: number): boolean => {
    if (!showResult || correctOrder.length === 0) return true;
    return correctOrder[position] === originalIndex;
  };

  return (
    <div
      className={`
        min-h-[60px] p-4 border-2 border-dashed rounded-lg
        ${placedWords.length === 0 ? 'border-gray-300 bg-gray-50' : 'border-blue-300 bg-blue-50'}
        ${className}
      `}
    >
      {placedWords.length === 0 ? (
        <div
          className="flex items-center justify-center h-full text-gray-400"
          onDragOver={(e) => handleDragOver(e, 0)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 0)}
        >
          <span>Drag words here or click to add</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {placedWords.map((placedWord, position) => (
            <React.Fragment key={position}>
              {/* Drop zone before each word */}
              <div
                className={`
                  w-1 transition-all duration-200
                  ${dragOverPosition === position ? 'w-8 bg-blue-300 rounded' : ''}
                `}
                onDragOver={(e) => handleDragOver(e, position)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, position)}
              />

              <div
                className="relative group"
                onClick={() => !showResult && onRemoveWord?.(position)}
              >
                <DraggableWord
                  word={placedWord.word}
                  index={placedWord.originalIndex}
                  isPlaced
                  isCorrect={isCorrectPosition(position, placedWord.originalIndex)}
                  showResult={showResult}
                />

                {/* Remove button */}
                {!showResult && (
                  <button
                    className="
                      absolute -top-2 -right-2
                      w-5 h-5 rounded-full
                      bg-red-500 text-white
                      flex items-center justify-center
                      opacity-0 group-hover:opacity-100
                      transition-opacity text-xs
                    "
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveWord?.(position);
                    }}
                  >
                    &times;
                  </button>
                )}
              </div>
            </React.Fragment>
          ))}

          {/* Drop zone at end */}
          <div
            className={`
              w-1 transition-all duration-200
              ${dragOverPosition === placedWords.length ? 'w-8 bg-blue-300 rounded' : ''}
            `}
            onDragOver={(e) => handleDragOver(e, placedWords.length)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, placedWords.length)}
          />
        </div>
      )}
    </div>
  );
};

interface SentenceBuilderProps {
  scrambledWords: string[];
  correctOrder: number[];
  onComplete: (userOrder: number[], isCorrect: boolean) => void;
  showResult: boolean;
  className?: string;
}

/**
 * SentenceBuilder - Complete sentence ordering exercise
 */
export const SentenceBuilder: React.FC<SentenceBuilderProps> = ({
  scrambledWords,
  correctOrder,
  onComplete,
  showResult,
  className = '',
}) => {
  const [placedWords, setPlacedWords] = useState<PlacedWord[]>([]);
  const [placedIndices, setPlacedIndices] = useState<Set<number>>(new Set());

  const handleWordSelect = (index: number) => {
    if (placedIndices.has(index)) return;

    const newPlaced = [...placedWords, { word: scrambledWords[index], originalIndex: index }];
    setPlacedWords(newPlaced);
    setPlacedIndices(new Set([...placedIndices, index]));

    // Check if complete
    if (newPlaced.length === scrambledWords.length) {
      const userOrder = newPlaced.map((p) => p.originalIndex);
      const isCorrect = userOrder.every((idx, pos) => correctOrder[pos] === idx);
      onComplete(userOrder, isCorrect);
    }
  };

  const handleRemoveWord = (position: number) => {
    const removed = placedWords[position];
    const newPlaced = placedWords.filter((_, i) => i !== position);
    const newIndices = new Set(placedIndices);
    newIndices.delete(removed.originalIndex);

    setPlacedWords(newPlaced);
    setPlacedIndices(newIndices);
  };

  const handleDropWord = (originalIndex: number, position: number) => {
    if (placedIndices.has(originalIndex)) return;

    const newWord = { word: scrambledWords[originalIndex], originalIndex };
    const newPlaced = [
      ...placedWords.slice(0, position),
      newWord,
      ...placedWords.slice(position),
    ];

    setPlacedWords(newPlaced);
    setPlacedIndices(new Set([...placedIndices, originalIndex]));

    // Check if complete
    if (newPlaced.length === scrambledWords.length) {
      const userOrder = newPlaced.map((p) => p.originalIndex);
      const isCorrect = userOrder.every((idx, pos) => correctOrder[pos] === idx);
      onComplete(userOrder, isCorrect);
    }
  };

  const handleReset = () => {
    setPlacedWords([]);
    setPlacedIndices(new Set());
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Answer area */}
      <div>
        <label className="text-sm font-medium text-gray-600 mb-2 block">
          Your sentence:
        </label>
        <WordOrderArea
          placedWords={placedWords}
          correctOrder={correctOrder}
          showResult={showResult}
          onRemoveWord={handleRemoveWord}
          onDropWord={handleDropWord}
        />
      </div>

      {/* Word bank */}
      <div>
        <label className="text-sm font-medium text-gray-600 mb-2 block">
          Available words:
        </label>
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg min-h-[60px]">
          {scrambledWords.map((word, index) => (
            <DraggableWord
              key={index}
              word={word}
              index={index}
              isPlaced={placedIndices.has(index)}
              onClick={handleWordSelect}
              className={placedIndices.has(index) ? 'opacity-30 pointer-events-none' : ''}
            />
          ))}
        </div>
      </div>

      {/* Reset button */}
      {!showResult && placedWords.length > 0 && (
        <button
          onClick={handleReset}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Reset
        </button>
      )}
    </div>
  );
};
