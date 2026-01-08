import React from 'react';

interface BatchProgressProps {
  completed: number;
  total: number;
  batchNumber: number;
  batchSize?: number;
  className?: string;
}

/**
 * BatchProgress component for showing learning progress
 */
export const BatchProgress: React.FC<BatchProgressProps> = ({
  completed,
  total,
  batchNumber,
  batchSize = 10,
  className = '',
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const wordsInBatch = Math.min(batchSize, total - (batchNumber - 1) * batchSize);
  const completedInBatch = Math.min(completed - (batchNumber - 1) * batchSize, wordsInBatch);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Overall progress */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Total: {completed}/{total}
        </span>
        <span>{percentage}%</span>
      </div>

      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Batch indicator */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Batch {batchNumber}</span>
        <span>
          {Math.max(0, completedInBatch)}/{wordsInBatch} in this batch
        </span>
      </div>

      {/* Word dots for current batch */}
      <div className="flex gap-1 justify-center">
        {Array.from({ length: wordsInBatch }).map((_, index) => (
          <div
            key={index}
            className={`
              w-2.5 h-2.5 rounded-full transition-colors
              ${index < completedInBatch ? 'bg-blue-500' : 'bg-gray-200'}
            `}
          />
        ))}
      </div>
    </div>
  );
};

interface MiniProgressProps {
  current: number;
  total: number;
  className?: string;
}

/**
 * MiniProgress component for compact progress display
 */
export const MiniProgress: React.FC<MiniProgressProps> = ({
  current,
  total,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700">
        {current}/{total}
      </span>
      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
};
