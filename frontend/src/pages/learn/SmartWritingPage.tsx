import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLearningStore } from '../../stores/learningStore';
import { DefinitionCard } from '../../components/learning/DefinitionCard';
import { SentenceDisplay } from '../../components/learning/SentenceDisplay';
import { SpellingInput } from '../../components/learning/SpellingInput';
import { BatchProgress } from '../../components/learning/BatchProgress';
import { LearningTimer, useResponseTimer } from '../../components/learning/LearningTimer';
import { ReinforcementBadge } from '../../components/learning/VocabReinforcement';
import { useLearningKeyboard, RatingButtons } from '../../hooks/useLearningKeyboard';
import { WordCorrection } from '../../components/learning/FillInBlank';
import { WordDisplay } from '../../components/learning/WordDisplay';

/**
 * SmartWritingPage - Module 3 (义→形)
 * User sees the meaning and types the word
 */
const SmartWritingPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const unitNumber = parseInt(searchParams.get('unit') || '1', 10);

  const {
    session,
    progress,
    isReinforcement,
    isLoading,
    error,
    startSession,
    submitAnswer,
    nextWord,
    currentWord,
    isSessionComplete,
  } = useLearningStore();

  const [showAnswer, setShowAnswer] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const { reset: resetTimer, getElapsedMs } = useResponseTimer();

  const word = currentWord();

  // Initialize session
  useEffect(() => {
    if (bookId && !session) {
      startSession(bookId, unitNumber, 3); // Module 3 = SmartWriting
    }
  }, [bookId, unitNumber, session, startSession]);

  // Reset state on word change
  useEffect(() => {
    if (word) {
      setShowAnswer(false);
      setUserInput('');
      setIsCorrect(null);
      resetTimer();
    }
  }, [word, resetTimer]);

  const handleSubmit = useCallback(
    async (input: string, correct: boolean) => {
      if (!word) return;

      setUserInput(input);
      setIsCorrect(correct);
      setShowAnswer(true);

      const rating = correct ? 3 : 1; // Good if correct, Again if wrong
      await submitAnswer(word.id, rating, getElapsedMs(), input, correct);
    },
    [word, submitAnswer, getElapsedMs],
  );

  const handleNext = useCallback(() => {
    if (isSessionComplete()) {
      navigate(`/learn/complete?bookId=${bookId}&unit=${unitNumber}`);
    } else {
      nextWord();
    }
  }, [isSessionComplete, navigate, bookId, unitNumber, nextWord]);

  const handleRating = useCallback(
    async (rating: number) => {
      if (!showAnswer) return;
      handleNext();
    },
    [showAnswer, handleNext],
  );

  // Keyboard shortcuts
  useLearningKeyboard({
    enabled: true,
    showingAnswer: showAnswer,
    handlers: {
      onNext: handleNext,
      onRating: handleRating,
    },
  });

  if (isLoading && !word) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-100 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No words available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <ReinforcementBadge isReinforcement={isReinforcement} />
            <LearningTimer maxSeconds={60} />
          </div>

          {progress && (
            <span className="text-sm text-gray-600">
              {progress.completed + 1}/{progress.total}
            </span>
          )}
        </div>
      </header>

      {/* Progress bar */}
      {progress && (
        <div className="max-w-3xl mx-auto px-4 py-2">
          <BatchProgress
            completed={progress.completed}
            total={progress.total}
            batchNumber={progress.batchNumber}
          />
        </div>
      )}

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Definition prompt */}
        <div className="mb-8">
          <p className="text-gray-600 text-center mb-4">
            Type the word that matches this meaning:
          </p>
          <DefinitionCard
            definitions={word.definitions}
            className="max-w-lg mx-auto"
          />
        </div>

        {/* Hint: first letter */}
        {!showAnswer && (
          <div className="text-center mb-6">
            <span className="text-gray-400 text-sm">
              First letter: <span className="font-bold text-gray-600">{word.word[0].toUpperCase()}</span>
              {' | '}
              Letters: <span className="font-bold text-gray-600">{word.word.length}</span>
            </span>
          </div>
        )}

        {/* Spelling input */}
        <div className="mb-8">
          <SpellingInput
            targetWord={word.word}
            onSubmit={handleSubmit}
            showAnswer={showAnswer}
          />
        </div>

        {/* Show correction if wrong */}
        {showAnswer && !isCorrect && (
          <div className="mb-8">
            <WordCorrection
              userAnswer={userInput}
              correctAnswer={word.word}
            />
          </div>
        )}

        {/* Show word info after answer */}
        {showAnswer && (
          <div className="space-y-4 mb-8">
            <WordDisplay
              word={word.word}
              phoneticUs={word.phoneticUs}
              phoneticUk={word.phoneticUk}
              audioUs={word.audioUs}
              audioUk={word.audioUk}
              size="large"
              className="text-center"
            />

            {word.sentences.length > 0 && (
              <SentenceDisplay
                sentences={word.sentences}
                highlightWord={word.word}
                showOnlyPrimary
              />
            )}
          </div>
        )}

        {/* Rating buttons after answer */}
        {showAnswer && (
          <div className="space-y-4">
            <p className="text-center text-gray-600 text-sm">
              How well did you know this word?
            </p>
            <RatingButtons onRate={handleRating} />
            <p className="text-center text-gray-400 text-xs">
              Press 1-4 or click to rate, Enter to continue
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SmartWritingPage;
