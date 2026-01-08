import { DueCard } from '../../hooks/useReview';

interface ReviewListViewProps {
  cards: DueCard[];
  onCardClick?: (card: DueCard) => void;
}

/**
 * List view of due cards with status indicators
 */
export function ReviewListView({ cards, onCardClick }: ReviewListViewProps) {
  if (cards.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-gray-600">太棒了！暂无待复习单词</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-700">
          待复习单词 ({cards.length})
        </h3>
      </div>

      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {cards.map((card) => (
          <button
            key={card.cardId}
            className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
            onClick={() => onCardClick?.(card)}
          >
            {/* Retrievability indicator */}
            <div
              className={`w-2 h-10 rounded-full ${getRetrievabilityBg(card.retrievability)}`}
            />

            {/* Word info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{card.word}</span>
                <span className="text-xs text-gray-400">{card.phoneticUs}</span>
              </div>
              <p className="text-sm text-gray-500 truncate">
                {card.definitions.map((d) => `${d.pos} ${d.meaning}`).join('; ')}
              </p>
            </div>

            {/* Module type badge */}
            <span className={`px-2 py-1 text-xs rounded-full ${getModuleBadge(card.moduleType)}`}>
              {getModuleLabel(card.moduleType)}
            </span>

            {/* Due date */}
            <div className="text-right">
              <span className={`text-sm ${getDueDateColor(card.dueAt)}`}>
                {formatDueDate(card.dueAt)}
              </span>
              <p className="text-xs text-gray-400">
                {Math.round(card.retrievability * 100)}%
              </p>
            </div>

            {/* Arrow */}
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

function getRetrievabilityBg(r: number): string {
  if (r >= 0.9) return 'bg-green-500';
  if (r >= 0.7) return 'bg-yellow-500';
  if (r >= 0.5) return 'bg-orange-500';
  return 'bg-red-500';
}

function getModuleBadge(moduleType: number): string {
  switch (moduleType) {
    case 1: return 'bg-blue-100 text-blue-700';
    case 2: return 'bg-purple-100 text-purple-700';
    case 3: return 'bg-pink-100 text-pink-700';
    case 7: return 'bg-green-100 text-green-700';
    case 8: return 'bg-yellow-100 text-yellow-700';
    case 9: return 'bg-orange-100 text-orange-700';
    case 10: return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getModuleLabel(moduleType: number): string {
  switch (moduleType) {
    case 1: return '认读';
    case 2: return '听写';
    case 3: return '拼写';
    case 7: return '例句听组';
    case 8: return '例句翻译';
    case 9: return '例句听写';
    case 10: return '智能用词';
    default: return `模块${moduleType}`;
  }
}

function getDueDateColor(dueAt: string): string {
  const due = new Date(dueAt);
  const now = new Date();
  const diffHours = (now.getTime() - due.getTime()) / (1000 * 60 * 60);

  if (diffHours > 24) return 'text-red-600 font-medium';
  if (diffHours > 0) return 'text-orange-600';
  return 'text-gray-600';
}

function formatDueDate(dueAt: string): string {
  const due = new Date(dueAt);
  const now = new Date();
  const diffMs = now.getTime() - due.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 7) return `逾期${diffDays}天`;
  if (diffDays > 0) return `逾期${diffDays}天`;
  if (diffHours > 0) return `逾期${diffHours}小时`;
  return '刚到期';
}

export default ReviewListView;
