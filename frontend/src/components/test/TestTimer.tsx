import { useEffect, useState } from 'react';

interface TestTimerProps {
  startTime: Date;
  timeLimitMs: number | null;
  onTimeUp?: () => void;
}

/**
 * Countdown timer for timed tests
 */
export function TestTimer({ startTime, timeLimitMs, onTimeUp }: TestTimerProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const start = new Date(startTime).getTime();
      const elapsed = now - start;
      setElapsedMs(elapsed);

      // Check if time is up
      if (timeLimitMs && elapsed >= timeLimitMs && onTimeUp) {
        onTimeUp();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, timeLimitMs, onTimeUp]);

  if (!timeLimitMs) {
    // No time limit - show elapsed time
    return (
      <div className="text-sm text-gray-600">
        用时: {formatTime(elapsedMs)}
      </div>
    );
  }

  const remainingMs = Math.max(0, timeLimitMs - elapsedMs);
  const percentRemaining = (remainingMs / timeLimitMs) * 100;
  const isWarning = percentRemaining < 20;
  const isDanger = percentRemaining < 10;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              isDanger
                ? 'bg-red-500'
                : isWarning
                ? 'bg-orange-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${percentRemaining}%` }}
          />
        </div>
      </div>
      <span
        className={`text-sm font-medium ${
          isDanger
            ? 'text-red-600'
            : isWarning
            ? 'text-orange-600'
            : 'text-gray-700'
        }`}
      >
        {formatTime(remainingMs)}
      </span>
    </div>
  );
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default TestTimer;
