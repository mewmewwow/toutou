import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLearningStore } from '../../stores/learningStore';
import { AudioButton } from '../../components/learning/AudioButton';
import { BatchProgress } from '../../components/learning/BatchProgress';
import { useSentenceTimer, SentenceTimerDisplay } from '../../hooks/useSentenceTimer';
import { ReinforcementBadge } from '../../components/learning/VocabReinforcement';
import { RatingButtons } from '../../hooks/useLearningKeyboard';

/**
 * SentenceDictationPage - Module 9 (例句听写)
 * User listens to sentence and types it out
 */
const SentenceDictationPage: React.FC = () => {
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
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const word = currentWord();
  const sentence = word?.sentences?.[0];

  const { elapsedSeconds, maxSeconds, getElapsedMs, reset: resetTimer } = useSentenceTimer({
    sentence: sentence?.contentEn || '',
    onTimeUp: () => handleTimeUp(),
  });

  // Initialize session
  useEffect(() => {
    if (bookId && !session) {
      startSession(bookId, unitNumber, 9); // Module 9 = SentenceDictation
    }
  }, [bookId, unitNumber, session, startSession]);

  // Reset on word change
  useEffect(() => {
    if (sentence) {
      setShowResult(false);
      setIsCorrect(false);
      setUserInput('');
      setScore(0);
      resetTimer();
      inputRef.current?.focus();
    }
  }, [sentence, resetTimer]);

  const handleTimeUp = () => {
    if (!showResult) {
      handleSubmit();
    }
  };

  const compareSentences = (original: string, input: string): { score: number; isCorrect: boolean } => {
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[.,!?;:'"]/g, '').replace(/\s+/g, ' ').trim();

    const normalizedOriginal = normalize(original);
    const normalizedInput = normalize(input);

    if (normalizedOriginal === normalizedInput) {
      return { score: 100, isCorrect: true };
    }

    // Calculate word-level accuracy
    const originalWords = normalizedOriginal.split(' ');
    const inputWords = normalizedInput.split(' ');

    let correctCount = 0;
    const maxLen = Math.max(originalWords.length, inputWords.length);

    for (let i = 0; i < originalWords.length; i++) {
      if (inputWords[i] === originalWords[i]) {
        correctCount++;
      }
    }

    const wordScore = Math.round((correctCount / originalWords.length) * 100);
    return { score: wordScore, isCorrect: wordScore >= 90 };
  };

  const handleSubmit = useCallback(async () => {
    if (!word || !sentence) return;

    const result = compareSentences(sentence.contentEn, userInput);
    setShowResult(true);
    setIsCorrect(result.isCorrect);
    setScore(result.score);

    const rating = result.isCorrect ? 3 : result.score >= 70 ? 2 : 1;
    await submitAnswer(word.id, rating, getElapsedMs(), userInput, result.isCorrect);
  }, [word, sentence, userInput, submitAnswer, getElapsedMs]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && !showResult) {
      e.preventDefault();
      handleSubmit();
    }
  };

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

        {/* Audio section */}
        <div className="flex justify-center mb-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Listen and type the sentence:</p>
            {sentence.audioUrl && (
              <AudioButton
                audioUrl={sentence.audioUrl}
                size="large"
                autoPlay
                shortcutKey="Control"
              />
            )}
          </div>
        </div>

        {/* Chinese hint */}
        <div className="mb-6 p-3 rounded-lg bg-gray-100 text-center">
          <p className="text-gray-600">{sentence.contentCn}</p>
        </div>

        {/* Input area */}
        <div className="mb-6">
          <textarea
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={showResult}
            placeholder="Type the sentence you hear..."
            className={`
              w-full p-4 text-lg border-2 rounded-lg resize-none
              focus:outline-none focus:ring-2 focus:ring-blue-200
              ${showResult
                ? isCorrect
                  ? 'border-green-400 bg-green-50'
                  : 'border-red-400 bg-red-50'
                : 'border-gray-300 focus:border-blue-400'
              }
            `}
            rows={3}
          />
        </div>

        {/* Submit button */}
        {!showResult && (
          <button
            onClick={handleSubmit}
            disabled={!userInput.trim()}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg
              hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors"
          >
            Check Answer (Ctrl+Enter)
          </button>
        )}

        {/* Result display */}
        {showResult && (
          <div className="space-y-4 mb-8">
            {/* Score */}
            <div className="text-center">
              <span className={`text-4xl font-bold ${score >= 90 ? 'text-green-600' : score >= 70 ? 'text-orange-500' : 'text-red-600'}`}>
                {score}%
              </span>
              <p className="text-gray-500">Accuracy</p>
            </div>

            {/* Correct answer */}
            <div className="p-4 rounded-lg bg-gray-100">
              <p className="text-sm text-gray-500 mb-1">Correct sentence:</p>
              <p className="text-lg text-gray-900">{sentence.contentEn}</p>
            </div>

            {/* Your answer */}
            <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm text-gray-500 mb-1">Your answer:</p>
              <p className="text-lg">{userInput || '(empty)'}</p>
            </div>
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

export default SentenceDictationPage;
