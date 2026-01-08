import React from 'react';
import { useCurrentMedal, useMedalThresholds } from '../../hooks/useRewards';

interface MedalDisplayProps {
  compact?: boolean;
  showProgress?: boolean;
}

export const MedalDisplay: React.FC<MedalDisplayProps> = ({
  compact = false,
  showProgress = true,
}) => {
  const { data: medal, isLoading: medalLoading } = useCurrentMedal();
  const { data: thresholds, isLoading: thresholdsLoading } = useMedalThresholds();

  if (medalLoading || thresholdsLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!medal) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-2xl">{medal.display.icon}</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: medal.display.color }}>
            {medal.display.name}
          </p>
          <p className="text-xs text-gray-500">{medal.daysActive} 天活跃</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{medal.display.icon}</span>
          <div>
            <h3 className="text-sm text-gray-600">当前勋章</h3>
            <p
              className="text-2xl font-bold"
              style={{ color: medal.display.color }}
            >
              {medal.display.name}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              活跃 {medal.daysActive} 天 · {medal.tierPoints} 积分
            </p>
          </div>
        </div>
      </div>

      {showProgress && medal.nextTier && (
        <div className="mt-4 pt-4 border-t border-purple-200">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">下一级勋章</span>
              <span className="font-semibold text-purple-700">
                {thresholds?.displays[medal.nextTier]?.name}
              </span>
            </div>
            <div className="w-full bg-purple-100 rounded-full h-2.5">
              <div
                className="bg-purple-500 h-2.5 rounded-full transition-all"
                style={{ width: `${medal.progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>还需 {medal.daysToNextTier} 天</span>
              <span>{medal.progressPercentage}%</span>
            </div>
          </div>
        </div>
      )}

      {!medal.nextTier && (
        <div className="mt-4 pt-4 border-t border-purple-200">
          <p className="text-sm text-center text-purple-600 font-medium">
            🏆 已达到最高级别！
          </p>
        </div>
      )}
    </div>
  );
};

export default MedalDisplay;
