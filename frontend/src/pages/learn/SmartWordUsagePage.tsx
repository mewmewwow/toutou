import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLearningStore } from '../../stores/learningStore';
import { AudioButton } from '../../components/learning/AudioButton';
import { BatchProgress } from '../../components/learning/BatchProgress';
import { useSentenceTimer, SentenceTimerDisplay } from '../../hooks/useSentenceTimer';
import { ReinforcementBadge } from '../../components/learning/VocabReinforcement';
import { RatingButtons } from '../../hooks/useLearningKeyboard';

/**
 * SmartWordUsagePage - Module 10 (智能用词)
 * User fills in the blank with the target word
 */
const SmartWordUsagePage: React.FC = () => {
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
  const inputRef = useRef<HTMLInputElement>(null);

  const word = currentWord();
  const sentence = word?.sentences?.[0];

  const { elapsedSeconds, maxSeconds, getElapsedMs, reset: resetTimer } = useSentenceTimer({
    sentence: sentence?.contentEn || '',
    secondsPerChar: 1, // Faster for fill-in-blank
    onTimeUp: () => handleTimeUp(),
  });

  // Initialize session
  useEffect(() => {
    if (bookId && !session) {
      startSession(bookId, unitNumber, 10); // Module 10 = SmartWordUsage
    }
  }, [bookId, unitNumber, session, startSession]);

  // Reset on word change
  useEffect(() => {
    if (word) {
      setShowResult(false);
      setIsCorrect(false);
      setUserInput('');
      resetTimer();
      inputRef.current?.focus();
    }
  }, [word, resetTimer]);

  const handleTimeUp = () => {
    if (!showResult) {
      handleSubmit();
    }
  };

  // Create sentence with blank
  const createSentenceWithBlank = (sentenceText: string, targetWord: string) => {
    const regex = new RegExp(`\\b${targetWord}\\b`, 'gi');
    const parts = sentenceText.split(regex);
    return { parts, blankCount: parts.length - 1 };
  };

  const handleSubmit = useCallback(async () => {
    if (!word) return;

    const correct = userInput.trim().toLowerCase() === word.word.toLowerCase();
    setShowResult(true);
    setIsCorrect(correct);

    const rating = correct ? 3 : 1;
    await submitAnswer(word.id, rating, getElapsedMs(), userInput, correct);
  }, [word, userInput, submitAnswer, getElapsedMs]);

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
    if (e.key === 'Enter' && !showResult) {
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

  const { parts } = createSentenceWithBlank(sentence.contentEn, word.word);

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
        {/* Definition prompt */}
        <div className="text-center mb-8">
          <p className="text-gray-600 mb-2">Fill in the blank with the word meaning:</p>
          <div className="inline-block px-4 py-2 bg-blue-100 rounded-lg">
            <span className="text-blue-800 font-medium">
              {word.definitions[0]?.pos} {word.definitions[0]?.meaning}
            </span>
          </div>
        </div>

        {/* Sentence with blank */}
        <div className="mb-8 p-6 rounded-lg bg-white shadow-sm">
          <div className="text-lg leading-relaxed flex flex-wrap items-center gap-1">
            {parts.map((part, index) => (
              <React.Fragment key={index}>
                <span>{part}</span>
                {index < parts.length - 1 && (
                  <span className="inline-block mx-1">
                    {showResult ? (
                      <span
                        className={`
                          inline-block px-3 py-1 rounded font-bold
                          ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                        `}
                      >
                        {isCorrect ? userInput : (
                          <>
                            {userInput && <span className="line-through mr-2">{userInput}</span>}
                            <span className="text-green-700">{word.word}</span>
                          </>
                        )}
                      </span>
                    ) : (
                      <input
                        ref={inputRef}
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="______"
                        autoComplete="off"
                        spellCheck={false}
                        className="
                          w-32 px-3 py-1 text-center font-bold
                          border-2 border-dashed border-blue-400 rounded
                          focus:outline-none focus:border-blue-600
                          bg-blue-50
                        "
                        style={{ minWidth: `${Math.max(word.word.length * 12, 100)}px` }}
                      />
                    )}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Chinese translation */}
          <p className="text-gray-500 mt-4">{sentence.contentCn}</p>

          {/* Audio */}
          {sentence.audioUrl && (
            <div className="mt-4">
              <AudioButton audioUrl={sentence.audioUrl} size="small" />
            </div>
          )}
        </div>

        {/* Hints */}
        {!showResult && (
          <div className="text-center text-gray-400 text-sm mb-6">
            <span>First letter: <strong className="text-gray-600">{word.word[0].toUpperCase()}</strong></span>
            <span className="mx-2">|</span>
            <span>Letters: <strong className="text-gray-600">{word.word.length}</strong></span>
          </div>
        )}

        {/* Submit button */}
        {!showResult && (
          <button
            onClick={handleSubmit}
            disabled={!userInput.trim()}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg
              hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors"
          >
            Check Answer (Enter)
          </button>
        )}

        {/* Result and word info */}
        {showResult && (
          <div className="space-y-4 mb-8">
            {/* Result indicator */}
            <div className={`text-center p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center justify-center gap-2">
                {isCorrect ? (
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={`text-lg font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              {!isCorrect && (
                <p className="mt-2 text-gray-600">
                  The correct word is: <strong className="text-green-600">{word.word}</strong>
                </p>
              )}
            </div>

            {/* Word audio */}
            <div className="flex justify-center gap-4">
              {word.audioUs && (
                <AudioButton audioUrl={word.audioUs} accent="us" size="medium" />
              )}
              {word.audioUk && (
                <AudioButton audioUrl={word.audioUk} accent="uk" size="medium" />
              )}
            </div>
          </div>
        )}

        {/* Rating buttons */}
        {showResult && (
          <div className="space-y-4">
            <p className="text-center text-gray-600 text-sm">
              How well did you know this word?
            </p>
            <RatingButtons onRate={handleRating} />
          </div>
        )}
      </main>
    </div>
  );
};

export default SmartWordUsagePage;
