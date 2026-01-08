import React from 'react';
import { AudioButton } from './AudioButton';

interface Sentence {
  id: string;
  contentEn: string;
  contentCn: string;
  isPrimary: boolean;
  audioUrl: string | null;
}

interface SentenceDisplayProps {
  sentences: Sentence[];
  highlightWord?: string;
  showTranslation?: boolean;
  showOnlyPrimary?: boolean;
  className?: string;
}

/**
 * Highlight a word within text
 */
const highlightText = (text: string, word: string): React.ReactNode => {
  if (!word) return text;

  const regex = new RegExp(`(${word})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    part.toLowerCase() === word.toLowerCase() ? (
      <span key={index} className="font-bold text-blue-600 underline">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
};

/**
 * SentenceDisplay component for showing example sentences
 */
export const SentenceDisplay: React.FC<SentenceDisplayProps> = ({
  sentences,
  highlightWord,
  showTranslation = true,
  showOnlyPrimary = false,
  className = '',
}) => {
  const displaySentences = showOnlyPrimary
    ? sentences.filter((s) => s.isPrimary)
    : sentences;

  if (displaySentences.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {displaySentences.map((sentence, index) => (
        <div
          key={sentence.id}
          className={`
            p-4 rounded-lg border border-gray-100
            ${sentence.isPrimary ? 'bg-yellow-50' : 'bg-gray-50'}
          `}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className="text-gray-800 leading-relaxed">
                {highlightWord
                  ? highlightText(sentence.contentEn, highlightWord)
                  : sentence.contentEn}
              </p>
              {showTranslation && (
                <p className="text-gray-500 text-sm mt-2">{sentence.contentCn}</p>
              )}
            </div>
            {sentence.audioUrl && (
              <AudioButton
                audioUrl={sentence.audioUrl}
                size="small"
                shortcutKey={index === 0 ? 'Shift' : undefined}
              />
            )}
          </div>
          {sentence.isPrimary && (
            <span className="inline-block mt-2 px-2 py-0.5 text-xs text-yellow-700 bg-yellow-100 rounded">
              Primary
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

interface SentenceBlankProps {
  sentence: Sentence;
  targetWord: string;
  userInput: string;
  onInputChange: (value: string) => void;
  showAnswer: boolean;
  isCorrect: boolean | null;
  className?: string;
}

/**
 * SentenceBlank component for fill-in-the-blank exercises
 */
export const SentenceBlank: React.FC<SentenceBlankProps> = ({
  sentence,
  targetWord,
  userInput,
  onInputChange,
  showAnswer,
  isCorrect,
  className = '',
}) => {
  // Replace the target word with a blank
  const regex = new RegExp(`\\b${targetWord}\\b`, 'gi');
  const parts = sentence.contentEn.split(regex);

  const getInputClass = () => {
    if (!showAnswer) {
      return 'border-blue-300 focus:border-blue-500';
    }
    return isCorrect
      ? 'border-green-500 bg-green-50'
      : 'border-red-500 bg-red-50';
  };

  return (
    <div className={`p-4 rounded-lg bg-gray-50 ${className}`}>
      <div className="text-gray-800 leading-relaxed flex flex-wrap items-center gap-1">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span>{part}</span>
            {index < parts.length - 1 && (
              <span className="inline-flex items-center">
                {showAnswer ? (
                  <span
                    className={`
                      px-2 py-1 rounded font-bold
                      ${isCorrect ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}
                    `}
                  >
                    {isCorrect ? userInput : `${userInput} → ${targetWord}`}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => onInputChange(e.target.value)}
                    className={`
                      w-32 px-2 py-1 border-2 rounded text-center font-bold
                      focus:outline-none transition-colors
                      ${getInputClass()}
                    `}
                    placeholder="___"
                    autoComplete="off"
                    spellCheck={false}
                  />
                )}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
      <p className="text-gray-500 text-sm mt-3">{sentence.contentCn}</p>
      {sentence.audioUrl && (
        <div className="mt-3">
          <AudioButton audioUrl={sentence.audioUrl} size="small" />
        </div>
      )}
    </div>
  );
};
