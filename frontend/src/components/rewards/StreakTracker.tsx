import React, { useState } from 'react';
import {
  useStreakInfo,
  useRecordDailyLogin,
  useStreakMilestones,
} from '../../hooks/useRewards';

interface StreakTrackerProps {
  showCheckInButton?: boolean;
}

export const StreakTracker: React.FC<StreakTrackerProps> = ({
  showCheckInButton = true,
}) => {
  const { data: streak, isLoading } = useStreakInfo();
  const { data: milestones } = useStreakMilestones();
  const recordLogin = useRecordDailyLogin();
  const [message, setMessage] = useState<string | null>(null);

  const handleCheckIn = async () => {
    try {
      const result = await recordLogin.mutateAsync();
      setMessage(result.message);
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!streak) return null;

  const getNextMilestone = () => {
    if (!milestones) return null;
    return milestones.milestones.find((m) => m > streak.currentStreak);
  };

  const nextMilestone = getNextMilestone();

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-6 shadow-md">
      {message && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm">
          {message}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl">🔥</span>
          <div>
            <h3 className="text-sm text-gray-600">连续打卡</h3>
            <p className="text-3xl font-bold text-orange-600">
              {streak.currentStreak} 天
            </p>
            <p className="text-xs text-gray-500 mt-1">
              最长记录: {streak.longestStreak} 天
            </p>
          </div>
        </div>

        {showCheckInButton && (
          <button
            onClick={handleCheckIn}
            disabled={recordLogin.isPending}
            className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {recordLogin.isPending ? '打卡中...' : '每日打卡'}
          </button>
        )}
      </div>

      {!streak.isActive && streak.daysSinceLastLogin > 1 && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ 已经 {streak.daysSinceLastLogin} 天未打卡，连续记录已中断
          </p>
        </div>
      )}

      {nextMilestone && (
        <div className="mt-4 pt-4 border-t border-orange-200">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">下一个里程碑</span>
              <span className="font-semibold text-orange-700">
                {nextMilestone} 天
                {milestones?.bonuses[nextMilestone] && (
                  <span className="ml-1 text-xs">
                    (+{milestones.bonuses[nextMilestone]} 🪙)
                  </span>
                )}
              </span>
            </div>
            <div className="w-full bg-orange-100 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{
                  width: `${(streak.currentStreak / nextMilestone) * 100}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>还需 {streak.daysToNextMilestone} 天</span>
              <span>
                {Math.round((streak.currentStreak / nextMilestone) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {streak.bonusCoins > 0 && (
        <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            🎁 当前连续打卡奖励: +{streak.bonusCoins} 金币/天
          </p>
        </div>
      )}

      {milestones && (
        <div className="mt-4">
          <p className="text-xs text-gray-600 mb-2">里程碑奖励</p>
          <div className="flex gap-2 flex-wrap">
            {milestones.milestones.map((m) => {
              const reached = streak.currentStreak >= m;
              return (
                <div
                  key={m}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    reached
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {m}天 {reached && '✓'}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakTracker;
