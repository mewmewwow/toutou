import { WordStats } from '../../hooks/useReview';

interface WordHoverCardProps {
  word: WordStats;
  onClose?: () => void;
}

/**
 * Hover card showing word details and FSRS stats
 */
export function WordHoverCard({ word, onClose }: WordHoverCardProps) {
  const retrievabilityPercent = Math.round(word.retrievability * 100);
  const stabilityDays = Math.round(word.stability * 10) / 10;
  const difficultyLevel = getDifficultyLevel(word.difficulty);

  return (
    <div className="absolute z-50 w-64 p-4 bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Word header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold text-gray-900">{word.word}</h4>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Retrievability meter */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">记忆强度</span>
          <span className={`font-medium ${getRetrievabilityColor(word.retrievability)}`}>
            {retrievabilityPercent}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getRetrievabilityBgColor(word.retrievability)} transition-all`}
            style={{ width: `${retrievabilityPercent}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500">稳定性</span>
          <p className="font-medium text-gray-900">{stabilityDays} 天</p>
        </div>
        <div>
          <span className="text-gray-500">难度</span>
          <p className={`font-medium ${difficultyLevel.color}`}>
            {difficultyLevel.label}
          </p>
        </div>
        <div>
          <span className="text-gray-500">复习次数</span>
          <p className="font-medium text-gray-900">{word.reviewCount}</p>
        </div>
        <div>
          <span className="text-gray-500">状态</span>
          <p className="font-medium text-gray-900">{getStatusLabel(word.status)}</p>
        </div>
      </div>

      {/* Last review */}
      {word.lastReviewAt && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            上次复习：{formatDate(word.lastReviewAt)}
          </span>
        </div>
      )}
    </div>
  );
}

function getRetrievabilityColor(r: number): string {
  if (r >= 0.9) return 'text-green-600';
  if (r >= 0.7) return 'text-yellow-600';
  if (r >= 0.5) return 'text-orange-600';
  return 'text-red-600';
}

function getRetrievabilityBgColor(r: number): string {
  if (r >= 0.9) return 'bg-green-500';
  if (r >= 0.7) return 'bg-yellow-500';
  if (r >= 0.5) return 'bg-orange-500';
  return 'bg-red-500';
}

function getDifficultyLevel(d: number): { label: string; color: string } {
  if (d < 3) return { label: '简单', color: 'text-green-600' };
  if (d < 5) return { label: '中等', color: 'text-yellow-600' };
  if (d < 7) return { label: '较难', color: 'text-orange-600' };
  return { label: '困难', color: 'text-red-600' };
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'new': return '新词';
    case 'learning': return '学习中';
    case 'review': return '复习中';
    case 'graduated': return '已掌握';
    default: return status;
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

export default WordHoverCard;
