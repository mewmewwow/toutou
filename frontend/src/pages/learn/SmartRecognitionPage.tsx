import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLearningStore } from '../../stores/learningStore';
import { WordDisplay } from '../../components/learning/WordDisplay';
import { DefinitionOptions } from '../../components/learning/DefinitionCard';
import { SentenceDisplay } from '../../components/learning/SentenceDisplay';
import { BatchProgress } from '../../components/learning/BatchProgress';
import { LearningTimer, useResponseTimer } from '../../components/learning/LearningTimer';
import { VocabReinforcement, ReinforcementBadge } from '../../components/learning/VocabReinforcement';
import { useLearningKeyboard, RatingButtons } from '../../hooks/useLearningKeyboard';

/**
 * SmartRecognitionPage - Module 1 (形→义)
 * User sees the word form and selects the correct meaning
 */
const SmartRecognitionPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const unitNumber = parseInt(searchParams.get('unit') || '1', 10);

  const {
    session,
    currentWords,
    currentWordIndex,
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

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [options, setOptions] = useState<Array<{ pos: string; meaning: string }>>([]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [showReinforcement, setShowReinforcement] = useState(false);
  const { reset: resetTimer, getElapsedMs } = useResponseTimer();

  const word = currentWord();

  // Initialize session
  useEffect(() => {
    if (bookId && !session) {
      startSession(bookId, unitNumber, 1); // Module 1 = SmartRecognition
    }
  }, [bookId, unitNumber, session, startSession]);

  // Generate options when word changes
  useEffect(() => {
    if (word && currentWords.length > 0) {
      // Get distractors from other words in the batch
      const otherDefs = currentWords
        .filter((w) => w.id !== word.id)
        .flatMap((w) => w.definitions)
        .slice(0, 3);

      // Shuffle correct answer with distractors
      const allOptions = [...word.definitions.slice(0, 1), ...otherDefs];
      const shuffled = allOptions.sort(() => Math.random() - 0.5);
      const correctIdx = shuffled.findIndex(
        (def) => def.meaning === word.definitions[0]?.meaning,
      );

      setOptions(shuffled.slice(0, 4));
      setCorrectIndex(correctIdx >= 0 ? correctIdx : 0);
      setSelectedIndex(null);
      setShowResult(false);
      resetTimer();
    }
  }, [word, currentWords, resetTimer]);

  // Check for reinforcement trigger
  useEffect(() => {
    if (isReinforcement && !showReinforcement) {
      setShowReinforcement(true);
    }
  }, [isReinforcement, showReinforcement]);

  const handleSelect = useCallback(
    async (index: number) => {
      if (showResult || !word) return;

      setSelectedIndex(index);
      setShowResult(true);

      const isCorrect = index === correctIndex;
      const rating = isCorrect ? 3 : 1; // Good if correct, Again if wrong

      await submitAnswer(word.id, rating, getElapsedMs(), undefined, isCorrect);
    },
    [showResult, word, correctIndex, submitAnswer, getElapsedMs],
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
      if (!showResult || !word) return;
      // Re-submit with updated rating based on self-assessment
      handleNext();
    },
    [showResult, word, handleNext],
  );

  // Keyboard shortcuts
  useLearningKeyboard({
    enabled: !showReinforcement,
    showingAnswer: showResult,
    handlers: {
      onNext: handleNext,
      onRating: handleRating,
      onToggleAnswer: () => setShowResult((prev) => !prev),
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

  if (showReinforcement && isReinforcement) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <VocabReinforcement
          words={[]} // Would come from reinforcement service
          message="Some words need extra practice!"
          onContinue={() => setShowReinforcement(false)}
        />
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
        {/* Word display */}
        <div className="text-center mb-8">
          <WordDisplay
            word={word.word}
            phoneticUs={word.phoneticUs}
            phoneticUk={word.phoneticUk}
            audioUs={word.audioUs}
            audioUk={word.audioUk}
            size="large"
          />
        </div>

        {/* Definition options */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4 text-center">
            Select the correct meaning:
          </h3>
          <DefinitionOptions
            definitions={options}
            correctIndex={correctIndex}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
            showResult={showResult}
          />
        </div>

        {/* Show sentence after answer */}
        {showResult && word.sentences.length > 0 && (
          <div className="mb-8">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Example:</h4>
            <SentenceDisplay
              sentences={word.sentences}
              highlightWord={word.word}
              showOnlyPrimary
            />
          </div>
        )}

        {/* Rating buttons after answer */}
        {showResult && (
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

export default SmartRecognitionPage;
