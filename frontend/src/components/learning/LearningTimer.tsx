import React, { useState, useEffect, useCallback, useRef } from 'react';

interface LearningTimerProps {
  maxSeconds?: number;
  onTimeUp?: () => void;
  onTick?: (seconds: number) => void;
  isRunning?: boolean;
  className?: string;
}

/**
 * LearningTimer component for tracking response time
 * Default 60 second cap per question
 */
export const LearningTimer: React.FC<LearningTimerProps> = ({
  maxSeconds = 60,
  onTimeUp,
  onTick,
  isRunning = true,
  className = '',
}) => {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          onTick?.(next);

          if (next >= maxSeconds) {
            clearInterval(intervalRef.current!);
            onTimeUp?.();
            return maxSeconds;
          }

          return next;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, maxSeconds, onTimeUp, onTick]);

  // Reset timer when maxSeconds changes (new word)
  useEffect(() => {
    setSeconds(0);
  }, [maxSeconds]);

  const percentage = (seconds / maxSeconds) * 100;
  const remaining = maxSeconds - seconds;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return mins > 0 ? `${mins}:${s.toString().padStart(2, '0')}` : `${s}s`;
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

      {/* Progress ring */}
      <div className="relative w-6 h-6">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke={percentage >= 80 ? '#dc2626' : percentage >= 60 ? '#f97316' : '#3b82f6'}
            strokeWidth="2"
            strokeDasharray={62.83}
            strokeDashoffset={62.83 * (1 - percentage / 100)}
            className="transition-all duration-1000"
          />
        </svg>
      </div>
    </div>
  );
};

/**
 * Hook for tracking response time in milliseconds
 */
export const useResponseTimer = () => {
  const startTimeRef = useRef<number>(Date.now());

  const reset = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  const getElapsedMs = useCallback(() => {
    return Date.now() - startTimeRef.current;
  }, []);

  return { reset, getElapsedMs };
};
