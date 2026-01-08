import React from 'react';

interface ReinforcementWord {
  wordId: string;
  word: string;
  definition: string;
  attempts: number;
  isHardWord: boolean;
}

interface VocabReinforcementProps {
  words: ReinforcementWord[];
  message: string;
  onContinue: () => void;
  className?: string;
}

/**
 * VocabReinforcement component (词义强化)
 * Displayed when user makes 3+ consecutive errors on a word
 */
export const VocabReinforcement: React.FC<VocabReinforcementProps> = ({
  words,
  message,
  onContinue,
  className = '',
}) => {
  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
          <svg
            className="w-8 h-8 text-orange-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">词义强化</h2>
        <p className="text-gray-600">{message}</p>
      </div>

      {/* Word list */}
      <div className="space-y-4 mb-8">
        {words.map((word) => (
          <div
            key={word.wordId}
            className={`
              p-4 rounded-lg border-2
              ${word.isHardWord ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}
            `}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{word.word}</h3>
                <p className="text-gray-600 mt-1">{word.definition}</p>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-500">Attempts:</span>
                <span
                  className={`
                    font-bold
                    ${word.attempts >= 3 ? 'text-red-600' : 'text-orange-600'}
                  `}
                >
                  {word.attempts}
                </span>
              </div>
            </div>

            {word.isHardWord && (
              <div className="mt-3 flex items-center gap-1 text-red-600 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Needs extra practice</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-blue-900 mb-2">Learning Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>- Take your time to memorize each word</li>
          <li>- Try to associate words with images or contexts</li>
          <li>- Read the word aloud to help remember</li>
          <li>- Answer correctly to exit reinforcement mode</li>
        </ul>
      </div>

      {/* Continue button */}
      <button
        onClick={onContinue}
        className="w-full py-3 px-4 bg-orange-600 text-white font-medium rounded-lg
          hover:bg-orange-700 transition-colors"
      >
        I understand, let&apos;s practice
      </button>
    </div>
  );
};

interface ReinforcementBadgeProps {
  isReinforcement: boolean;
  className?: string;
}

/**
 * ReinforcementBadge shows when in reinforcement mode
 */
export const ReinforcementBadge: React.FC<ReinforcementBadgeProps> = ({
  isReinforcement,
  className = '',
}) => {
  if (!isReinforcement) return null;

  return (
    <div
      className={`
        inline-flex items-center gap-1 px-2 py-1
        bg-orange-100 text-orange-700 text-sm font-medium rounded
        ${className}
      `}
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
          clipRule="evenodd"
        />
      </svg>
      <span>Reinforcement Mode</span>
    </div>
  );
};
