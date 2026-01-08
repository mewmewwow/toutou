import React from 'react';
import { Certificate } from '../../hooks/useRewards';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface CertificateCardProps {
  certificate: Certificate;
  onClick?: () => void;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
  onClick,
}) => {
  const { display, awardedAt, metadata } = certificate;

  return (
    <div
      onClick={onClick}
      className="relative p-6 rounded-lg border-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
      style={{
        borderColor: display.color,
        backgroundColor: `${display.color}10`,
      }}
    >
      <div className="absolute top-2 right-2 text-xs text-gray-500">
        {formatDistanceToNow(new Date(awardedAt), {
          addSuffix: true,
          locale: zhCN,
        })}
      </div>

      <div className="flex items-start gap-4 mt-4">
        <span className="text-5xl">{display.icon}</span>
        <div className="flex-1">
          <h3
            className="text-xl font-bold mb-1"
            style={{ color: display.color }}
          >
            {display.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">{display.description}</p>

          {metadata && Object.keys(metadata).length > 0 && (
            <div className="mt-3 space-y-1">
              {metadata.wordsLearned && (
                <p className="text-xs text-gray-500">
                  学习单词: {metadata.wordsLearned}
                </p>
              )}
              {metadata.testScore !== undefined && (
                <p className="text-xs text-gray-500">
                  测试得分: {metadata.testScore}分
                </p>
              )}
              {metadata.stars && (
                <p className="text-xs text-gray-500">
                  星级: {'⭐'.repeat(metadata.stars)}
                </p>
              )}
              {metadata.streakDays && (
                <p className="text-xs text-gray-500">
                  连续打卡: {metadata.streakDays}天
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateCard;
