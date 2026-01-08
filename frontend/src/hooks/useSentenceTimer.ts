import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSentenceTimerOptions {
  sentence: string;
  secondsPerChar?: number;
  maxMultiplier?: number;
  onTimeUp?: () => void;
}

interface SentenceTimerResult {
  elapsedSeconds: number;
  remainingSeconds: number;
  maxSeconds: number;
  percentage: number;
  isTimeUp: boolean;
  reset: () => void;
  pause: () => void;
  resume: () => void;
  getElapsedMs: () => number;
}

/**
 * Hook for managing sentence exercise timer
 * Time limit = character count × 2 seconds
 */
export const useSentenceTimer = ({
  sentence,
  secondsPerChar = 2,
  maxMultiplier = 3,
  onTimeUp,
}: UseSentenceTimerOptions): SentenceTimerResult => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate max time based on character count
  const charCount = sentence.replace(/\s/g, '').length;
  const baseMaxSeconds = charCount * secondsPerChar;
  const maxSeconds = Math.max(30, baseMaxSeconds * maxMultiplier); // Minimum 30 seconds

  // Timer logic
  useEffect(() => {
    if (isRunning && !isTimeUp) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= maxSeconds) {
            setIsTimeUp(true);
            onTimeUp?.();
            return maxSeconds;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isTimeUp, maxSeconds, onTimeUp]);

  // Reset when sentence changes
  useEffect(() => {
    setElapsedSeconds(0);
    setIsTimeUp(false);
    setIsRunning(true);
    startTimeRef.current = Date.now();
  }, [sentence]);

  const reset = useCallback(() => {
    setElapsedSeconds(0);
    setIsTimeUp(false);
    setIsRunning(true);
    startTimeRef.current = Date.now();
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    setIsRunning(true);
  }, []);

  const getElapsedMs = useCallback(() => {
    return Date.now() - startTimeRef.current;
  }, []);

  const remainingSeconds = Math.max(0, maxSeconds - elapsedSeconds);
  const percentage = (elapsedSeconds / maxSeconds) * 100;

  return {
    elapsedSeconds,
    remainingSeconds,
    maxSeconds,
    percentage,
    isTimeUp,
    reset,
    pause,
    resume,
    getElapsedMs,
  };
};

interface SentenceTimerDisplayProps {
  elapsedSeconds: number;
  maxSeconds: number;
  className?: string;
}

/**
 * SentenceTimerDisplay component
 */
export const SentenceTimerDisplay: React.FC<SentenceTimerDisplayProps> = ({
  elapsedSeconds,
  maxSeconds,
  className = '',
}) => {
  const remaining = maxSeconds - elapsedSeconds;
  const percentage = (elapsedSeconds / maxSeconds) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getColorClass = () => {
    if (percentage >= 80) return 'text-red-600';
    if (percentage >= 60) return 'text-orange-500';
    return 'text-gray-600';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        className={`w-5 h-5 ${getColorClass()}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className={`text-sm font-medium ${getColorClass()}`}>
        {formatTime(remaining)}
      </span>

      {/* Progress bar */}
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            percentage >= 80 ? 'bg-red-500' : percentage >= 60 ? 'bg-orange-500' : 'bg-blue-500'
          }`}
          style={{ width: `${100 - percentage}%` }}
        />
      </div>
    </div>
  );
};

// React import for component
import React from 'react';
