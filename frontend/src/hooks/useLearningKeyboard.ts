import { useEffect, useCallback, useRef } from 'react';

interface KeyboardHandlers {
  onNext?: () => void;           // Enter - next word
  onSubmit?: () => void;         // Enter - submit answer
  onRating?: (rating: number) => void;  // 1-4 - self-rating
  onToggleAnswer?: () => void;   // Tab - toggle answer
  onPlayAudio?: () => void;      // Ctrl - play audio
  onPlaySentence?: () => void;   // Shift - play sentence audio
  onSkip?: () => void;           // Escape - skip word
}

interface UseLearningKeyboardOptions {
  enabled?: boolean;
  showingAnswer?: boolean;
  handlers: KeyboardHandlers;
}

/**
 * Hook for handling keyboard shortcuts in learning modules
 *
 * Shortcuts:
 * - Enter: Submit answer or move to next word
 * - 1-4: Self-rating (Again, Hard, Good, Easy)
 * - Tab: Toggle answer visibility
 * - Ctrl: Play word audio
 * - Shift: Play sentence audio
 * - Escape: Skip current word
 */
export const useLearningKeyboard = ({
  enabled = true,
  showingAnswer = false,
  handlers,
}: UseLearningKeyboardOptions) => {
  const handlersRef = useRef(handlers);

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in an input field (except for specific shortcuts)
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // These shortcuts work even in input fields
      if (event.key === 'Control') {
        event.preventDefault();
        handlersRef.current.onPlayAudio?.();
        return;
      }

      if (event.key === 'Shift' && !event.repeat) {
        // Shift alone (not with other keys)
        if (!event.ctrlKey && !event.altKey && !event.metaKey) {
          handlersRef.current.onPlaySentence?.();
        }
        return;
      }

      // Don't process other shortcuts when in input field
      if (isInputField) {
        // Only allow Enter for submission
        if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
          // Let the input field handle submit via its own handler
          return;
        }
        return;
      }

      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          if (showingAnswer) {
            handlersRef.current.onNext?.();
          } else {
            handlersRef.current.onSubmit?.();
          }
          break;

        case 'Tab':
          event.preventDefault();
          handlersRef.current.onToggleAnswer?.();
          break;

        case 'Escape':
          event.preventDefault();
          handlersRef.current.onSkip?.();
          break;

        case '1':
        case '2':
        case '3':
        case '4':
          if (showingAnswer) {
            event.preventDefault();
            const rating = parseInt(event.key, 10);
            handlersRef.current.onRating?.(rating);
          }
          break;

        default:
          break;
      }
    },
    [enabled, showingAnswer],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

/**
 * Rating descriptions for display
 */
export const RATING_INFO = {
  1: {
    label: 'Again',
    shortcut: '1',
    description: 'Did not remember',
    color: 'red',
  },
  2: {
    label: 'Hard',
    shortcut: '2',
    description: 'Recalled with difficulty',
    color: 'orange',
  },
  3: {
    label: 'Good',
    shortcut: '3',
    description: 'Recalled correctly',
    color: 'green',
  },
  4: {
    label: 'Easy',
    shortcut: '4',
    description: 'Recalled easily',
    color: 'blue',
  },
} as const;

interface RatingButtonsProps {
  onRate: (rating: number) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * RatingButtons component for self-rating
 */
export const RatingButtons: React.FC<RatingButtonsProps> = ({
  onRate,
  disabled = false,
  className = '',
}) => {
  const colorClasses = {
    red: 'bg-red-100 hover:bg-red-200 text-red-700 border-red-200',
    orange: 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200',
    green: 'bg-green-100 hover:bg-green-200 text-green-700 border-green-200',
    blue: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200',
  };

  return (
    <div className={`flex gap-2 justify-center ${className}`}>
      {([1, 2, 3, 4] as const).map((rating) => {
        const info = RATING_INFO[rating];
        return (
          <button
            key={rating}
            onClick={() => onRate(rating)}
            disabled={disabled}
            className={`
              flex flex-col items-center px-4 py-3 rounded-lg border-2
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              ${colorClasses[info.color]}
            `}
            title={info.description}
          >
            <span className="text-sm font-bold">{info.label}</span>
            <span className="text-xs opacity-75">({info.shortcut})</span>
          </button>
        );
      })}
    </div>
  );
};

// Re-export for convenience
import React from 'react';
