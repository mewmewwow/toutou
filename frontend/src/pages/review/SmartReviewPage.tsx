import { useNavigate } from 'react-router-dom';
import { useReviewSession } from '../../hooks/useReviewSession';
import { AudioButton } from '../../components/learning/AudioButton';
import { BatchProgress } from '../../components/learning/BatchProgress';

/**
 * Smart review session page - handles card review flow
 */
export function SmartReviewPage() {
  const navigate = useNavigate();
  const { state, actions } = useReviewSession();

  const {
    currentCard,
    currentIndex,
    totalCards,
    completedCards,
    isLoading,
    isSubmitting,
    isComplete,
    isBlocked,
    blockingMessage,
    error,
    sessionStats,
  } = state;

  const { submitRating, restartSession } = actions;

  // Handle rating submission
  const handleRating = async (rating: number) => {
    await submitRating(rating);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">加载失败: {error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary-500 hover:underline"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  // No cards state
  if (!currentCard && !isComplete) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/review')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900">智能复习</h1>
            </div>
          </div>
        </header>

        <main className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">太棒了！</h2>
            <p className="text-gray-600 mb-6">暂无待复习单词</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
            >
              返回首页
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Complete state
  if (isComplete) {
    const accuracy =
      sessionStats.ratings.length > 0
        ? Math.round((sessionStats.correctCount / sessionStats.ratings.length) * 100)
        : 0;
    const avgTime =
      sessionStats.ratings.length > 0
        ? Math.round(sessionStats.totalTimeMs / sessionStats.ratings.length / 1000)
        : 0;

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900 text-center">复习完成</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl p-8 text-center">
            {/* Success icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              复习完成！
            </h2>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-primary-500">{completedCards}</p>
                <p className="text-xs text-gray-500">复习数量</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-green-500">{accuracy}%</p>
                <p className="text-xs text-gray-500">正确率</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-blue-500">{avgTime}s</p>
                <p className="text-xs text-gray-500">平均用时</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={restartSession}
                className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
              >
                继续复习
              </button>
              <button
                onClick={() => navigate('/review')}
                className="w-full py-3 text-gray-600 hover:text-gray-900"
              >
                返回复习中心
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Review session in progress
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/review')}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">智能复习</h1>
            <span className="text-sm text-gray-500">
              {currentIndex + 1} / {totalCards}
            </span>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <BatchProgress current={currentIndex + 1} total={totalCards} />

      {/* Card content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm">
          {/* Word */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {currentCard.word}
            </h2>
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <span>{currentCard.phoneticUs}</span>
              <AudioButton audioUrl={`/api/audio/${currentCard.word}`} />
            </div>
          </div>

          {/* Definitions */}
          <div className="space-y-2 mb-8">
            {currentCard.definitions.map((def, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg text-center"
              >
                <span className="text-xs text-gray-400 mr-2">{def.pos}</span>
                <span className="text-gray-700">{def.meaning}</span>
              </div>
            ))}
          </div>

          {/* Retrievability indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">记忆强度</span>
              <span className={getRetrievabilityColor(currentCard.retrievability)}>
                {Math.round(currentCard.retrievability * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getRetrievabilityBg(currentCard.retrievability)} transition-all`}
                style={{ width: `${currentCard.retrievability * 100}%` }}
              />
            </div>
          </div>

          {/* Rating prompt */}
          <p className="text-center text-gray-600 mb-4">
            你还记得这个单词吗？
          </p>

          {/* Rating buttons */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleRating(1)}
              disabled={isSubmitting}
              className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <span className="block text-lg">1</span>
              <span className="text-xs">忘记</span>
            </button>
            <button
              onClick={() => handleRating(2)}
              disabled={isSubmitting}
              className="p-3 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <span className="block text-lg">2</span>
              <span className="text-xs">模糊</span>
            </button>
            <button
              onClick={() => handleRating(3)}
              disabled={isSubmitting}
              className="p-3 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <span className="block text-lg">3</span>
              <span className="text-xs">记得</span>
            </button>
            <button
              onClick={() => handleRating(4)}
              disabled={isSubmitting}
              className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <span className="block text-lg">4</span>
              <span className="text-xs">简单</span>
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="text-center text-xs text-gray-400 mt-4">
            按 1-4 快速评分 | Ctrl 播放发音
          </p>
        </div>
      </main>
    </div>
  );
}

function getRetrievabilityColor(r: number): string {
  if (r >= 0.9) return 'text-green-600';
  if (r >= 0.7) return 'text-yellow-600';
  if (r >= 0.5) return 'text-orange-600';
  return 'text-red-600';
}

function getRetrievabilityBg(r: number): string {
  if (r >= 0.9) return 'bg-green-500';
  if (r >= 0.7) return 'bg-yellow-500';
  if (r >= 0.5) return 'bg-orange-500';
  return 'bg-red-500';
}

export default SmartReviewPage;
