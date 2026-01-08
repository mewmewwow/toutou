import React, { useState, useEffect, useRef } from 'react';

interface FillInBlankProps {
  sentence: string;
  targetWord: string;
  onSubmit: (input: string, isCorrect: boolean) => void;
  showAnswer: boolean;
  className?: string;
}

/**
 * FillInBlank component for sentence fill-in-the-blank exercises
 * Highlights the blank and shows correction feedback
 */
export const FillInBlank: React.FC<FillInBlankProps> = ({
  sentence,
  targetWord,
  onSubmit,
  showAnswer,
  className = '',
}) => {
  const [input, setInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create regex to find the target word (case-insensitive, word boundary)
  const regex = new RegExp(`\\b${targetWord}\\b`, 'gi');

  // Split sentence around the target word
  const parts = sentence.split(regex);

  // Reset on word change
  useEffect(() => {
    setInput('');
    setIsCorrect(null);
    inputRef.current?.focus();
  }, [targetWord, sentence]);

  const handleSubmit = () => {
    const correct = input.trim().toLowerCase() === targetWord.toLowerCase();
    setIsCorrect(correct);
    onSubmit(input.trim(), correct);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showAnswer) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getInputStyle = () => {
    if (!showAnswer) {
      return 'border-blue-400 bg-white focus:border-blue-500';
    }
    return isCorrect
      ? 'border-green-500 bg-green-50'
      : 'border-red-500 bg-red-50';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-lg leading-relaxed">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span>{part}</span>
            {index < parts.length - 1 && (
              <span className="inline-block mx-1">
                {showAnswer ? (
                  <span
                    className={`
                      inline-block px-2 py-1 rounded font-bold
                      ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                    `}
                  >
                    {isCorrect ? input : (
                      <>
                        <span className="line-through">{input}</span>
                        <span className="text-green-700 ml-2">{targetWord}</span>
                      </>
                    )}
                  </span>
                ) : (
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="______"
                    autoComplete="off"
                    spellCheck={false}
                    className={`
                      w-28 px-2 py-1 text-center font-mono
                      border-2 border-dashed rounded
                      focus:outline-none
                      ${getInputStyle()}
                    `}
                    style={{ minWidth: `${Math.max(targetWord.length * 10, 80)}px` }}
                  />
                )}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      {!showAnswer && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg
              hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors"
          >
            Check Answer (Enter)
          </button>
        </div>
      )}

      {showAnswer && !isCorrect && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-gray-600">Your answer:</span>
          <span className="line-through text-red-600">{input || '(empty)'}</span>
          <span className="text-gray-400">→</span>
          <span className="font-bold text-green-600">{targetWord}</span>
        </div>
      )}
    </div>
  );
};

interface WordCorrectionProps {
  userAnswer: string;
  correctAnswer: string;
  className?: string;
}

/**
 * WordCorrection component showing diff between user input and correct answer
 * Highlights incorrect letters
 */
export const WordCorrection: React.FC<WordCorrectionProps> = ({
  userAnswer,
  correctAnswer,
  className = '',
}) => {
  const maxLength = Math.max(userAnswer.length, correctAnswer.length);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* User's answer with incorrect letters highlighted */}
      <div className="flex justify-center">
        <div className="inline-flex gap-0.5">
          {Array.from({ length: maxLength }).map((_, index) => {
            const userChar = userAnswer[index] || '';
            const correctChar = correctAnswer[index] || '';
            const isCorrect = userChar.toLowerCase() === correctChar.toLowerCase();

            return (
              <span
                key={index}
                className={`
                  w-6 h-8 flex items-center justify-center text-lg font-mono
                  ${isCorrect ? 'text-green-600' : 'text-red-600 bg-red-100 rounded'}
                `}
              >
                {userChar || '_'}
              </span>
            );
          })}
        </div>
      </div>

      {/* Arrow */}
      <div className="text-center text-gray-400">
        <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>

      {/* Correct answer */}
      <div className="flex justify-center">
        <div className="inline-flex gap-0.5">
          {correctAnswer.split('').map((char, index) => (
            <span
              key={index}
              className="w-6 h-8 flex items-center justify-center text-lg font-mono text-green-600 bg-green-50 rounded"
            >
              {char}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
