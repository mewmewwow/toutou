import { useParams, useNavigate } from 'react-router-dom';
import { useBookDetail } from '../../hooks/useBooks';
import { UnitLock } from '../../components/ui/UnitLock';
import { RegistrationPrompt } from '../../components/ui/RegistrationPrompt';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { data: book, isLoading, error } = useBookDetail(bookId);

  const handleSelectUnit = (unitNumber: number, moduleType: number = 1) => {
    // 根据模块类型映射到对应的路由
    // 1: 认读, 2: 听读, 3: 拼写
    const moduleRoutes: Record<number, string> = {
      1: 'recognition',
      2: 'dictation',
      3: 'writing',
    };
    const modulePath = moduleRoutes[moduleType] || 'recognition';
    navigate(`/learn/${modulePath}/${bookId}?unit=${unitNumber}`);
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleBack = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            {error?.message || '词书不存在'}
          </p>
          <button onClick={handleBack} className="text-primary-500 hover:underline">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // Count accessible units
  const accessibleUnits = book.units.filter((u) => u.isAccessible).length;
  const lockedUnits = book.units.length - accessibleUnits;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{book.name}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Book Info */}
        <Card className="mb-6">
          <div className="flex gap-4">
            {/* Cover */}
            <div className="w-24 h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center shrink-0">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-2xl font-bold text-primary-400">
                  {book.code.slice(0, 2)}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{book.name}</h2>
                  {book.isFree && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                      免费
                    </span>
                  )}
                </div>
              </div>

              {book.description && (
                <p className="mt-2 text-sm text-gray-600">{book.description}</p>
              )}

              <div className="mt-3 flex gap-4 text-sm text-gray-500">
                <span>{book.totalWords} 词汇</span>
                <span>{book.totalUnits} 单元</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Locked Units Notice */}
        {lockedUnits > 0 && (
          <div className="mb-6">
            <RegistrationPrompt
              variant="banner"
              title={`还有 ${lockedUnits} 个单元被锁定`}
              message="注册解锁全部单元，免费试用14天"
              onRegister={handleRegister}
              onLogin={handleLogin}
            />
          </div>
        )}

        {/* Unit List */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            选择单元
          </h3>

          <div className="space-y-3">
            {book.units.map((unit) => (
              <UnitLock
                key={unit.number}
                unitNumber={unit.number}
                wordCount={unit.wordCount}
                isAccessible={unit.isAccessible}
                onSelect={() => handleSelectUnit(unit.number)}
              />
            ))}
          </div>

          {book.units.length === 0 && (
            <Card className="text-center py-12 text-gray-500">
              暂无单元
            </Card>
          )}
        </section>

        {/* Learning Modules Info */}
        <section className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            学习模式
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card padding="sm" className="text-center">
              <div className="text-2xl mb-1">👁</div>
              <div className="text-sm font-medium">认读</div>
            </Card>
            <Card padding="sm" className="text-center">
              <div className="text-2xl mb-1">👂</div>
              <div className="text-sm font-medium">听读</div>
            </Card>
            <Card padding="sm" className="text-center">
              <div className="text-2xl mb-1">⌨️</div>
              <div className="text-sm font-medium">拼写</div>
            </Card>
            <Card padding="sm" className="text-center opacity-50">
              <div className="text-2xl mb-1">🔒</div>
              <div className="text-sm font-medium text-gray-400">更多模式</div>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        {lockedUnits > 0 && (
          <section className="mt-8">
            <RegistrationPrompt
              title="解锁完整学习体验"
              message="注册成为会员，享受7种学习模式和全部词书内容"
              benefits={[
                '解锁所有单元和词书',
                '7种学习模式自由选择',
                '详细学习数据统计',
                '永久保存学习进度',
              ]}
              onRegister={handleRegister}
              onLogin={handleLogin}
            />
          </section>
        )}
      </main>
    </div>
  );
}
