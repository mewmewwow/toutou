import { forwardRef, HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface UnitLockProps extends HTMLAttributes<HTMLDivElement> {
  unitNumber: number;
  wordCount: number;
  isAccessible: boolean;
  isCompleted?: boolean;
  progress?: number; // 0-100
  onSelect?: () => void;
}

export const UnitLock = forwardRef<HTMLDivElement, UnitLockProps>(
  (
    {
      unitNumber,
      wordCount,
      isAccessible,
      isCompleted = false,
      progress = 0,
      onSelect,
      className,
      ...props
    },
    ref,
  ) => {
    const handleClick = () => {
      if (isAccessible && onSelect) {
        onSelect();
      }
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'relative rounded-lg border-2 p-4 transition-all',
          isAccessible
            ? 'border-gray-200 bg-white cursor-pointer hover:border-primary-300 hover:shadow-sm'
            : 'border-gray-100 bg-gray-50 cursor-not-allowed',
          isCompleted && 'border-green-300 bg-green-50',
          className,
        )}
        onClick={handleClick}
        role={isAccessible ? 'button' : undefined}
        tabIndex={isAccessible ? 0 : undefined}
        onKeyDown={(e) => {
          if (isAccessible && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClick();
          }
        }}
        {...props}
      >
        <div className="flex items-center justify-between">
          {/* Unit Info */}
          <div className="flex items-center gap-3">
            {/* Unit Number / Status Icon */}
            <div
              className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isAccessible
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-gray-200 text-gray-400',
              )}
            >
              {isCompleted ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                unitNumber
              )}
            </div>

            <div>
              <div className="font-medium text-gray-900">
                第 {unitNumber} 单元
              </div>
              <div className="text-sm text-gray-500">{wordCount} 词</div>
            </div>
          </div>

          {/* Lock / Arrow Icon */}
          <div>
            {!isAccessible ? (
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Progress Bar (if started) */}
        {isAccessible && progress > 0 && progress < 100 && (
          <div className="mt-3">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-gray-500 text-right">
              {progress}% 完成
            </div>
          </div>
        )}

        {/* Locked Overlay Message */}
        {!isAccessible && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 rounded-lg">
            <span className="text-sm text-gray-500">注册解锁</span>
          </div>
        )}
      </div>
    );
  },
);

UnitLock.displayName = 'UnitLock';
