import React from 'react';
import { useMedalThresholds, useCurrentMedal } from '../../hooks/useRewards';

export const MedalTierList: React.FC = () => {
  const { data: thresholds, isLoading: thresholdsLoading } = useMedalThresholds();
  const { data: currentMedal, isLoading: medalLoading } = useCurrentMedal();

  if (thresholdsLoading || medalLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  if (!thresholds) return null;

  const tierOrder = [
    'none',
    'bronze',
    'silver',
    'gold',
    'platinum',
    'diamond',
    'master',
    'legend',
  ];

  return (
    <div className="space-y-2">
      {tierOrder.map((tier) => {
        const threshold = thresholds.thresholds[tier];
        const display = thresholds.displays[tier];
        const isCurrent = currentMedal?.tier === tier;
        const isUnlocked =
          currentMedal && currentMedal.daysActive >= threshold;

        return (
          <div
            key={tier}
            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
              isCurrent
                ? 'border-purple-500 bg-purple-50 shadow-md'
                : isUnlocked
                  ? 'border-gray-200 bg-white'
                  : 'border-gray-100 bg-gray-50 opacity-60'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{display.icon}</span>
              <div>
                <p
                  className="font-bold text-lg"
                  style={{ color: isUnlocked ? display.color : '#9CA3AF' }}
                >
                  {display.name}
                </p>
                <p className="text-sm text-gray-500">
                  需要活跃 {threshold} 天
                  {isCurrent && ' · 当前勋章'}
                </p>
              </div>
            </div>
            <div className="text-right">
              {isUnlocked ? (
                <span className="text-green-600 font-semibold">✓ 已获得</span>
              ) : (
                <span className="text-gray-400">未获得</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MedalTierList;
