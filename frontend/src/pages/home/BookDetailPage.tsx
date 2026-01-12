import { useParams, useNavigate } from 'react-router-dom';
import { useBookDetail } from '../../hooks/useBooks';
import { RegistrationPrompt } from '../../components/ui/RegistrationPrompt';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/layout/Header';
import { useAuthStore } from '../../stores/authStore';

// 学习模块定义
const LEARNING_MODULES = [
  { id: 'recognition', name: '智能认读', icon: '👁', description: '看单词选释义' },
  { id: 'dictation', name: '智能听读', icon: '👂', description: '听发音选单词' },
  { id: 'writing', name: '智能拼写', icon: '⌨️', description: '根据释义拼写单词' },
  { id: 'word-usage', name: '智能用法', icon: '📝', description: '学习单词用法例句' },
  { id: 'sentence-listening', name: '句子听力', icon: '🎧', description: '听句子理解含义' },
  { id: 'sentence-translation', name: '句子翻译', icon: '🌐', description: '翻译英文句子' },
  { id: 'sentence-dictation', name: '句子听写', icon: '✍️', description: '听写完整句子' },
];

export function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { data: book, isLoading, error } = useBookDetail(bookId);
  const { isAuthenticated } = useAuthStore();

  const handleSelectModule = (moduleId: string) => {
    navigate(`/books/${bookId}/modules/${moduleId}`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBack onBack={handleBack} title={book.name} />

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

        {/* Guest Banner */}
        {!isAuthenticated && (
          <div className="mb-6">
            <RegistrationPrompt
              variant="banner"
              title="访客模式"
              message="注册后可解锁全部单元和学习模式"
              onRegister={handleRegister}
              onLogin={handleLogin}
            />
          </div>
        )}

        {/* Learning Modules Selection */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            选择学习模式
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LEARNING_MODULES.map((module) => (
              <Card
                key={module.id}
                className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary-300 border-2 border-transparent"
                onClick={() => handleSelectModule(module.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{module.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{module.name}</div>
                    <div className="text-sm text-gray-500">{module.description}</div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
