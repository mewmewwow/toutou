import React, { useState } from 'react';
import { useCertificates } from '../../hooks/useRewards';
import { CertificateCard } from './CertificateCard';

const CERTIFICATE_TYPES = [
  { value: '', label: '全部证书' },
  { value: 'unit_completion', label: '单元完成' },
  { value: 'perfect_score', label: '满分成就' },
  { value: 'streak_milestone', label: '打卡成就' },
  { value: 'book_completion', label: '教材完成' },
];

export const CertificateGallery: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('');
  const { data, isLoading } = useCertificates(selectedType || undefined);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {CERTIFICATE_TYPES.map((type) => (
            <div
              key={type.value}
              className="animate-pulse h-10 w-24 bg-gray-200 rounded"
            ></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-pulse h-40 bg-gray-200 rounded-lg"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {CERTIFICATE_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === type.value
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
        {data && (
          <p className="text-sm text-gray-600">共 {data.total} 个证书</p>
        )}
      </div>

      {!data || data.certificates.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">📜</span>
          <p className="text-gray-500">
            {selectedType ? '暂无此类证书' : '还没有获得任何证书'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            完成学习任务，获取成就证书！
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.certificates.map((certificate) => (
            <CertificateCard key={certificate.id} certificate={certificate} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificateGallery;
