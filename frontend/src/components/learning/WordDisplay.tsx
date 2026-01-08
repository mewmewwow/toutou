import React from 'react';
import { AudioButton } from './AudioButton';

interface WordDisplayProps {
  word: string;
  phoneticUs?: string | null;
  phoneticUk?: string | null;
  audioUs?: string | null;
  audioUk?: string | null;
  showWord?: boolean;
  size?: 'normal' | 'large';
  className?: string;
}

/**
 * WordDisplay component for showing word with phonetics and audio
 */
export const WordDisplay: React.FC<WordDisplayProps> = ({
  word,
  phoneticUs,
  phoneticUk,
  audioUs,
  audioUk,
  showWord = true,
  size = 'normal',
  className = '',
}) => {
  const wordSizeClass = size === 'large' ? 'text-4xl' : 'text-2xl';
  const phoneticSizeClass = size === 'large' ? 'text-lg' : 'text-base';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {showWord && (
        <h2 className={`font-bold text-gray-900 ${wordSizeClass}`}>{word}</h2>
      )}

      <div className="flex items-center gap-4 mt-2">
        {phoneticUs && (
          <div className="flex items-center gap-1">
            <span className={`text-gray-500 ${phoneticSizeClass}`}>
              US {phoneticUs}
            </span>
            {audioUs && (
              <AudioButton
                audioUrl={audioUs}
                accent="us"
                size="small"
              />
            )}
          </div>
        )}

        {phoneticUk && (
          <div className="flex items-center gap-1">
            <span className={`text-gray-500 ${phoneticSizeClass}`}>
              UK {phoneticUk}
            </span>
            {audioUk && (
              <AudioButton
                audioUrl={audioUk}
                accent="uk"
                size="small"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
