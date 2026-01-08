import React from 'react';
import { useCoinBalance, useDailyStats } from '../../hooks/useRewards';

interface CoinBalanceProps {
  showDailyStats?: boolean;
  compact?: boolean;
}

export const CoinBalance: React.FC<CoinBalanceProps> = ({
  showDailyStats = true,
  compact = false,
}) => {
  const { data: balance, isLoading: balanceLoading } = useCoinBalance();
  const { data: stats, isLoading: statsLoading } = useDailyStats();

  if (balanceLoading || (showDailyStats && statsLoading)) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!balance) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-2xl">🪙</span>
        <span className="text-lg font-bold text-yellow-600">
          {balance.totalCoins.toLocaleString()}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🪙</span>
          <div>
            <h3 className="text-sm text-gray-600">我的金币</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {balance.totalCoins.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {showDailyStats && stats && (
        <div className="mt-4 pt-4 border-t border-yellow-200">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">今日已获得</span>
              <span className="font-semibold text-yellow-700">
                {stats.dailyTotal} / {stats.dailyCap}
              </span>
            </div>
            <div className="w-full bg-yellow-100 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{
                  width: `${(stats.dailyTotal / stats.dailyCap) * 100}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                剩余 {stats.dailyRemaining} 金币
              </span>
              {stats.hasReachedCap && (
                <span className="text-orange-600 font-medium">已达上限</span>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white rounded p-2">
              <span className="text-gray-500">学习</span>
              <span className="ml-1 font-semibold">+{stats.earnRates.learning}</span>
            </div>
            <div className="bg-white rounded p-2">
              <span className="text-gray-500">复习</span>
              <span className="ml-1 font-semibold">+{stats.earnRates.review}</span>
            </div>
            <div className="bg-white rounded p-2">
              <span className="text-gray-500">测试</span>
              <span className="ml-1 font-semibold">+{stats.earnRates.test}</span>
            </div>
            <div className="bg-white rounded p-2">
              <span className="text-gray-500">打卡</span>
              <span className="ml-1 font-semibold">+{stats.earnRates.daily_login}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoinBalance;
