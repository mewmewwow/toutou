import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLearningStore } from '../../stores/learningStore';
import { SentenceBuilder } from '../../components/learning/WordOrderArea';
import { BatchProgress } from '../../components/learning/BatchProgress';
import { useSentenceTimer, SentenceTimerDisplay } from '../../hooks/useSentenceTimer';
import { ReinforcementBadge } from '../../components/learning/VocabReinforcement';
import { RatingButtons } from '../../hooks/useLearningKeyboard';

/**
 * SentenceTranslationPage - Module 8 (例句翻译)
 * User sees Chinese translation and arranges English words
 */
const SentenceTranslationPage: React.FC = () => {
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

  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [scrambledWords, setScrambledWords] = useState<string[]>([]);
  const [correctOrder, setCorrectOrder] = useState<number[]>([]);

  const word = currentWord();
  const sentence = word?.sentences?.[0];

  const { elapsedSeconds, maxSeconds, getElapsedMs, reset: resetTimer } = useSentenceTimer({
    sentence: sentence?.contentEn || '',
    onTimeUp: () => handleTimeUp(),
  });

  // Initialize session
  useEffect(() => {
    if (bookId && !session) {
      startSession(bookId, unitNumber, 8); // Module 8 = SentenceTranslation
    }
  }, [bookId, unitNumber, session, startSession]);

  // Scramble sentence when word changes
  useEffect(() => {
    if (sentence) {
      const words = sentence.contentEn.split(/\s+/).filter((w) => w.length > 0);
      const indices = words.map((_, i) => i);

      // Fisher-Yates shuffle
      const shuffled = [...indices];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      setScrambledWords(shuffled.map((i) => words[i]));
      setCorrectOrder(indices);
      setShowResult(false);
      setIsCorrect(false);
      resetTimer();
    }
  }, [sentence, resetTimer]);

  const handleTimeUp = () => {
    if (!showResult && word) {
      handleComplete([], false);
    }
  };

  const handleComplete = useCallback(
    async (userOrder: number[], correct: boolean) => {
      if (!word) return;

      setShowResult(true);
      setIsCorrect(correct);

      const rating = correct ? 3 : 1;
      await submitAnswer(word.id, rating, getElapsedMs(), userOrder.join(','), correct);
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
    (rating: number) => {
      if (!showResult) return;
      handleNext();
    },
    [showResult, handleNext],
  );

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
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-100 rounded-lg">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!word || !sentence) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No sentences available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <ReinforcementBadge isReinforcement={isReinforcement} />
            <SentenceTimerDisplay elapsedSeconds={elapsedSeconds} maxSeconds={maxSeconds} />
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
        {/* Word display */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{word.word}</h2>
          <p className="text-gray-500">{word.definitions[0]?.meaning}</p>
        </div>

        {/* Chinese sentence prompt */}
        <div className="mb-8 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-700 mb-1">Translate to English:</p>
          <p className="text-xl text-gray-900">{sentence.contentCn}</p>
        </div>

        {/* Sentence builder */}
        <div className="mb-8">
          <SentenceBuilder
            scrambledWords={scrambledWords}
            correctOrder={correctOrder}
            onComplete={handleComplete}
            showResult={showResult}
          />
        </div>

        {/* Show correct sentence after answer */}
        {showResult && (
          <div className={`mb-8 p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
              <span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-1">Correct answer:</p>
            <p className="text-lg text-gray-900">{sentence.contentEn}</p>
          </div>
        )}

        {/* Rating buttons */}
        {showResult && (
          <div className="space-y-4">
            <p className="text-center text-gray-600 text-sm">
              How well did you do?
            </p>
            <RatingButtons onRate={handleRating} />
          </div>
        )}
      </main>
    </div>
  );
};

export default SentenceTranslationPage;
