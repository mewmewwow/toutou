import React, { useState } from 'react';
import { useRewardsSummary } from '../../hooks/useRewards';
import { CoinBalance } from './CoinBalance';
import { MedalDisplay } from './MedalDisplay';
import { StreakTracker } from './StreakTracker';
import { CertificateCard } from './CertificateCard';
import { CoinTransactionHistory } from './CoinTransactionHistory';
import { MedalTierList } from './MedalTierList';
import { CertificateGallery } from './CertificateGallery';

type TabType = 'overview' | 'coins' | 'medals' | 'streak' | 'certificates';

export const RewardsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { data: summary, isLoading } = useRewardsSummary();

  const tabs = [
    { id: 'overview' as TabType, label: '总览', icon: '📊' },
    { id: 'coins' as TabType, label: '金币', icon: '🪙' },
    { id: 'medals' as TabType, label: '勋章', icon: '🏅' },
    { id: 'streak' as TabType, label: '打卡', icon: '🔥' },
    { id: 'certificates' as TabType, label: '证书', icon: '📜' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">奖励中心</h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CoinBalance showDailyStats={true} />
              <MedalDisplay showProgress={true} />
            </div>

            <StreakTracker showCheckInButton={true} />

            {summary && summary.certificates.recent.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">最近获得的证书</h2>
                  <button
                    onClick={() => setActiveTab('certificates')}
                    className="text-purple-500 hover:text-purple-600 text-sm font-medium"
                  >
                    查看全部 →
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {summary.certificates.recent.map((cert) => (
                    <CertificateCard key={cert.id} certificate={cert} />
                  ))}
                </div>
              </div>
            )}

            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 text-center">
                  <p className="text-3xl mb-2">🪙</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {summary.coins.totalCoins.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">总金币</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                  <p className="text-3xl mb-2">🏅</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {summary.medal.tierPoints}
                  </p>
                  <p className="text-sm text-gray-600">勋章积分</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center">
                  <p className="text-3xl mb-2">🔥</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {summary.streak.currentStreak}
                  </p>
                  <p className="text-sm text-gray-600">连续天数</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                  <p className="text-3xl mb-2">📜</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {summary.certificates.total}
                  </p>
                  <p className="text-sm text-gray-600">证书总数</p>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'coins' && (
          <>
            <CoinBalance showDailyStats={true} />
            <div>
              <h2 className="text-xl font-bold mb-4">交易记录</h2>
              <CoinTransactionHistory limit={50} />
            </div>
          </>
        )}

        {activeTab === 'medals' && (
          <>
            <MedalDisplay showProgress={true} />
            <div>
              <h2 className="text-xl font-bold mb-4">勋章等级</h2>
              <MedalTierList />
            </div>
          </>
        )}

        {activeTab === 'streak' && (
          <>
            <StreakTracker showCheckInButton={true} />
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4">打卡说明</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <p>• 每日首次登录自动记录打卡</p>
                <p>• 连续打卡可获得金币奖励</p>
                <p>• 7天: +50金币，30天: +100金币，100天+: +200金币</p>
                <p>• 中断打卡后需重新开始计算连续天数</p>
                <p>• 最长连续记录将被永久保存</p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'certificates' && <CertificateGallery />}
      </div>
    </div>
  );
};

export default RewardsDashboard;
