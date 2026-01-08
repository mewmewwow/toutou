import { useNavigate } from 'react-router-dom';
import {
  useReviewStatus,
  useDueCards,
  useWeeklyStats,
  useCalendarData,
  useWordStats,
  useStreak,
} from '../../hooks/useReview';
import {
  CalendarView,
  WordCloudView,
  ReviewListView,
  ReviewBlockingModal,
} from '../../components/review';

/**
 * Review dashboard page showing overview and statistics
 */
export function ReviewDashboardPage() {
  const navigate = useNavigate();

  const { data: status, isLoading: statusLoading } = useReviewStatus();
  const { data: dueCardsData } = useDueCards(undefined, 20);
  const { data: weeklyStats } = useWeeklyStats();
  const { data: calendarData } = useCalendarData();
  const { data: wordStats } = useWordStats(50);
  const { data: streakInfo } = useStreak();

  const handleStartReview = () => {
    navigate('/review/session');
  };

  const handleCardClick = (card: { cardId: string }) => {
    // Navigate to review with specific card
    navigate(`/review/session?cardId=${card.cardId}`);
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900">复习中心</h1>
            </div>
            <button
              onClick={handleStartReview}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              开始复习
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Due today */}
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">待复习</p>
            <p className="text-2xl font-bold text-gray-900">
              {dueCardsData?.totalDue ?? 0}
            </p>
          </div>

          {/* Streak */}
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">连续天数</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-orange-500">
                {streakInfo?.streak ?? 0}
              </p>
              <span className="text-orange-400">🔥</span>
            </div>
          </div>

          {/* Weekly reviews */}
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">本周复习</p>
            <p className="text-2xl font-bold text-gray-900">
              {weeklyStats?.totalReviews ?? 0}
            </p>
          </div>

          {/* Retention rate */}
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">正确率</p>
            <p className="text-2xl font-bold text-green-600">
              {weeklyStats?.retentionRate ?? 0}%
            </p>
          </div>
        </div>

        {/* Review blocking warning */}
        {status?.isBlocked && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="font-medium text-orange-800">
                  学习已暂停
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  {status.blockingMessage}
                </p>
              </div>
              <button
                onClick={handleStartReview}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
              >
                开始复习
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Calendar heatmap */}
            {calendarData && (
              <CalendarView
                data={calendarData}
                onDateClick={(date) => console.log('Clicked date:', date)}
              />
            )}

            {/* Due cards list */}
            {dueCardsData && (
              <ReviewListView
                cards={dueCardsData.cards}
                onCardClick={handleCardClick}
              />
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Word cloud */}
            {wordStats && (
              <WordCloudView
                words={wordStats}
                onWordClick={(word) => console.log('Clicked word:', word)}
              />
            )}

            {/* Quick stats */}
            <div className="bg-white rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-4">学习统计</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">总复习次数</span>
                  <span className="font-medium">{streakInfo?.totalReviews ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">日均复习</span>
                  <span className="font-medium">{weeklyStats?.dailyAverage ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">预计今日用时</span>
                  <span className="font-medium">{status?.estimatedMinutes ?? 0} 分钟</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Blocking modal */}
      {status?.isBlocked && (
        <ReviewBlockingModal
          status={status}
          onStartReview={handleStartReview}
          onDismiss={() => navigate('/')}
        />
      )}
    </div>
  );
}

export default ReviewDashboardPage;
