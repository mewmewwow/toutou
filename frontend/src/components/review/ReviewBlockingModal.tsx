import { ReviewStatus } from '../../hooks/useReview';

interface ReviewBlockingModalProps {
  status: ReviewStatus;
  onStartReview: () => void;
  onDismiss?: () => void;
}

/**
 * Modal shown when user has too many overdue reviews (>25)
 */
export function ReviewBlockingModal({
  status,
  onStartReview,
  onDismiss,
}: ReviewBlockingModalProps) {
  if (!status.isBlocked) return null;

  const excessCount = status.overdueCount - status.threshold;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-xl">
        {/* Warning icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
          复习优先
        </h2>

        {/* Message */}
        <p className="text-center text-gray-600 mb-4">
          {status.blockingMessage || `您有 ${status.overdueCount} 个单词需要复习，超出阈值 ${excessCount} 个。请先完成复习再学习新单词。`}
        </p>

        {/* Stats */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">待复习单词</span>
            <span className="text-lg font-semibold text-orange-600">
              {status.overdueCount}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">阈值</span>
            <span className="text-gray-900">{status.threshold}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">预计用时</span>
            <span className="text-gray-900">
              约 {status.estimatedMinutes} 分钟
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500"
              style={{
                width: `${Math.min(100, (status.overdueCount / status.threshold) * 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            复习完成后即可继续学习新单词
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onStartReview}
            className="w-full py-3 px-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            开始复习
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="w-full py-3 px-4 text-gray-600 hover:text-gray-900 transition-colors"
            >
              稍后再说
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewBlockingModal;
