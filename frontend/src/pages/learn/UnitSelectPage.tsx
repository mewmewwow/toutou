import { useParams, useNavigate } from 'react-router-dom';
import { useBookDetail } from '../../hooks/useBooks';
import { UnitLock } from '../../components/ui/UnitLock';
import { RegistrationPrompt } from '../../components/ui/RegistrationPrompt';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/layout/Header';
import { useAuthStore } from '../../stores/authStore';

// 模块类型到路由的映射
const MODULE_ROUTES: Record<string, string> = {
  'recognition': 'recognition',
  'dictation': 'dictation',
  'writing': 'writing',
  'word-usage': 'word-usage',
  'sentence-listening': 'sentence-listening',
  'sentence-translation': 'sentence-translation',
  'sentence-dictation': 'sentence-dictation',
};

// 模块类型到名称的映射
const MODULE_NAMES: Record<string, string> = {
  'recognition': '智能认读',
  'dictation': '智能听读',
  'writing': '智能拼写',
  'word-usage': '智能用法',
  'sentence-listening': '句子听力',
  'sentence-translation': '句子翻译',
  'sentence-dictation': '句子听写',
};

export function UnitSelectPage() {
  const { bookId, moduleType } = useParams<{ bookId: string; moduleType: string }>();
  const navigate = useNavigate();
  const { data: book, isLoading, error } = useBookDetail(bookId);
  const { isAuthenticated } = useAuthStore();

  const moduleName = MODULE_NAMES[moduleType || ''] || '学习';
  const moduleRoute = MODULE_ROUTES[moduleType || ''] || 'recognition';

  const handleSelectUnit = (unitNumber: number) => {
    navigate(`/learn/${moduleRoute}/${bookId}?unit=${unitNumber}`);
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleBack = () => {
    navigate(`/books/${bookId}`);
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
          <button onClick={() => navigate('/')} className="text-primary-500 hover:underline">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // 统计可访问单元
  const accessibleUnits = book.units.filter((u) => u.isAccessible).length;
  const lockedUnits = book.units.length - accessibleUnits;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBack onBack={handleBack} title={`${book.name} - ${moduleName}`} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Locked Units Notice - Only show if not authenticated and units are locked */}
        {!isAuthenticated && lockedUnits > 0 && (
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
            选择单元开始 {moduleName}
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
      </main>
    </div>
  );
}
