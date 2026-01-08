import React, { useState, useRef, useEffect } from 'react';

interface SpellingInputProps {
  targetWord: string;
  onSubmit: (input: string, isCorrect: boolean) => void;
  showAnswer: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

/**
 * SpellingInput component for typing word spelling
 * Validates input against target word
 */
export const SpellingInput: React.FC<SpellingInputProps> = ({
  targetWord,
  onSubmit,
  showAnswer,
  disabled = false,
  autoFocus = true,
  className = '',
}) => {
  const [input, setInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Reset on targetWord change
  useEffect(() => {
    setInput('');
    setIsCorrect(null);
  }, [targetWord]);

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

  const getInputClass = () => {
    if (!showAnswer) {
      return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
    }
    return isCorrect
      ? 'border-green-500 bg-green-50'
      : 'border-red-500 bg-red-50';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || showAnswer}
          placeholder="Type the word..."
          autoComplete="off"
          spellCheck={false}
          className={`
            w-full px-4 py-3 text-xl text-center font-mono
            border-2 rounded-lg
            focus:outline-none focus:ring-2
            transition-colors
            ${getInputClass()}
          `}
        />

        {showAnswer && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isCorrect ? (
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
      </div>

      {showAnswer && !isCorrect && (
        <div className="text-center">
          <p className="text-gray-600 mb-1">Correct answer:</p>
          <p className="text-2xl font-bold text-green-600">{targetWord}</p>
        </div>
      )}

      {!showAnswer && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg
            hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
            transition-colors"
        >
          Submit (Enter)
        </button>
      )}
    </div>
  );
};

interface LetterByLetterInputProps {
  targetWord: string;
  onComplete: (isCorrect: boolean) => void;
  showHint?: boolean;
  className?: string;
}

/**
 * LetterByLetterInput component for character-by-character input
 * Used in more advanced spelling exercises
 */
export const LetterByLetterInput: React.FC<LetterByLetterInputProps> = ({
  targetWord,
  onComplete,
  showHint = false,
  className = '',
}) => {
  const [letters, setLetters] = useState<string[]>(Array(targetWord.length).fill(''));
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset on word change
  useEffect(() => {
    setLetters(Array(targetWord.length).fill(''));
    setCurrentIndex(0);
    inputRefs.current[0]?.focus();
  }, [targetWord]);

  const handleChange = (index: number, value: string) => {
    const char = value.slice(-1).toLowerCase();
    const newLetters = [...letters];
    newLetters[index] = char;
    setLetters(newLetters);

    // Move to next input
    if (char && index < targetWord.length - 1) {
      setCurrentIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }

    // Check completion
    if (newLetters.every((l) => l)) {
      const isCorrect = newLetters.join('') === targetWord.toLowerCase();
      onComplete(isCorrect);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !letters[index] && index > 0) {
      setCurrentIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className={`flex justify-center gap-2 ${className}`}>
      {targetWord.split('').map((char, index) => (
        <div key={index} className="relative">
          <input
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            value={letters[index]}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            maxLength={1}
            className={`
              w-10 h-12 text-center text-xl font-mono
              border-2 rounded-lg
              focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200
              ${letters[index] ? 'border-gray-400' : 'border-gray-200'}
            `}
          />
          {showHint && (
            <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
              {char}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
