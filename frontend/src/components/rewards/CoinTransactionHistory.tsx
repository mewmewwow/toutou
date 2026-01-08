import React from 'react';
import { useCoinTransactions } from '../../hooks/useRewards';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface CoinTransactionHistoryProps {
  limit?: number;
}

export const CoinTransactionHistory: React.FC<CoinTransactionHistoryProps> = ({
  limit = 50,
}) => {
  const { data, isLoading } = useCoinTransactions(limit);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  if (!data || data.transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>暂无交易记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-yellow-300 transition-colors"
        >
          <div className="flex-1">
            <p className="font-medium text-gray-900">{tx.description}</p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(tx.createdAt), {
                addSuffix: true,
                locale: zhCN,
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-lg font-bold ${
                tx.amount > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {tx.amount > 0 ? '+' : ''}
              {tx.amount}
            </span>
            <span className="text-sm text-gray-500">
              余额: {tx.balanceAfter}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CoinTransactionHistory;
