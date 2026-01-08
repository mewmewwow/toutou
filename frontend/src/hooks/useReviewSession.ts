import { useState, useCallback, useEffect, useRef } from 'react';
import { useDueCards, useSubmitReview, DueCard, ReviewResult } from './useReview';

export interface ReviewSessionState {
  currentCard: DueCard | null;
  currentIndex: number;
  totalCards: number;
  completedCards: number;
  isLoading: boolean;
  isSubmitting: boolean;
  isComplete: boolean;
  isBlocked: boolean;
  blockingMessage?: string;
  error: Error | null;
  sessionStats: {
    correctCount: number;
    totalTimeMs: number;
    ratings: number[];
  };
}

export interface ReviewSessionActions {
  submitRating: (rating: number) => Promise<ReviewResult | null>;
  skipCard: () => void;
  restartSession: () => void;
  startTimer: () => void;
  getElapsedTime: () => number;
}

/**
 * Hook for managing a review session
 */
export function useReviewSession(moduleType?: number, limit: number = 20) {
  const { data, isLoading, error, refetch } = useDueCards(moduleType, limit);
  const submitReviewMutation = useSubmitReview();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCards, setCompletedCards] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    correctCount: 0,
    totalTimeMs: 0,
    ratings: [] as number[],
  });
  const [isComplete, setIsComplete] = useState(false);

  // Timer management
  const startTimeRef = useRef<number>(0);
  const [timerStarted, setTimerStarted] = useState(false);

  // Get cards from response
  const cards = data?.cards ?? [];
  const totalCards = cards.length;
  const isBlocked = data?.isBlocked ?? false;
  const blockingMessage = data?.blockingMessage;

  // Current card
  const currentCard = currentIndex < cards.length ? cards[currentIndex] : null;

  // Start timer for current card
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setTimerStarted(true);
  }, []);

  // Get elapsed time
  const getElapsedTime = useCallback(() => {
    if (!timerStarted) return 0;
    return Date.now() - startTimeRef.current;
  }, [timerStarted]);

  // Submit rating
  const submitRating = useCallback(
    async (rating: number): Promise<ReviewResult | null> => {
      if (!currentCard) return null;

      const responseTimeMs = getElapsedTime();

      try {
        const result = await submitReviewMutation.mutateAsync({
          cardId: currentCard.cardId,
          rating,
          responseTimeMs,
        });

        // Update stats
        setSessionStats((prev) => ({
          correctCount: prev.correctCount + (rating >= 3 ? 1 : 0),
          totalTimeMs: prev.totalTimeMs + responseTimeMs,
          ratings: [...prev.ratings, rating],
        }));

        setCompletedCards((prev) => prev + 1);

        // Move to next card
        if (currentIndex < cards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setTimerStarted(false);
        } else {
          setIsComplete(true);
        }

        return result;
      } catch (err) {
        console.error('Failed to submit review:', err);
        return null;
      }
    },
    [currentCard, currentIndex, cards.length, getElapsedTime, submitReviewMutation],
  );

  // Skip current card
  const skipCard = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimerStarted(false);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, cards.length]);

  // Restart session
  const restartSession = useCallback(() => {
    setCurrentIndex(0);
    setCompletedCards(0);
    setSessionStats({
      correctCount: 0,
      totalTimeMs: 0,
      ratings: [],
    });
    setIsComplete(false);
    setTimerStarted(false);
    refetch();
  }, [refetch]);

  // Auto-start timer when card changes
  useEffect(() => {
    if (currentCard && !timerStarted) {
      startTimer();
    }
  }, [currentCard, timerStarted, startTimer]);

  const state: ReviewSessionState = {
    currentCard,
    currentIndex,
    totalCards,
    completedCards,
    isLoading,
    isSubmitting: submitReviewMutation.isPending,
    isComplete,
    isBlocked,
    blockingMessage,
    error: error ?? null,
    sessionStats,
  };

  const actions: ReviewSessionActions = {
    submitRating,
    skipCard,
    restartSession,
    startTimer,
    getElapsedTime,
  };

  return { state, actions };
}
