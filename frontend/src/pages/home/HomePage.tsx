import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooks } from '../../hooks/useBooks';
import { BookCard } from '../../components/ui/BookCard';
import { RegistrationPrompt } from '../../components/ui/RegistrationPrompt';
import { useGuestStore } from '../../stores/guestStore';

export function HomePage() {
  const navigate = useNavigate();
  const { data: books, isLoading, error } = useBooks();
  const { fingerprint, initializeFingerprint } = useGuestStore();

  // Initialize fingerprint on mount
  useEffect(() => {
    if (!fingerprint) {
      initializeFingerprint();
    }
  }, [fingerprint, initializeFingerprint]);

  const handleSelectBook = (bookId: string) => {
    navigate(`/books/${bookId}`);
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">加载失败</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary-500 hover:underline"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">词善佳</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogin}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                登录
              </button>
              <button
                onClick={handleRegister}
                className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                注册
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Guest Banner */}
        <div className="mb-8">
          <RegistrationPrompt
            variant="banner"
            title="访客模式"
            message="您正在以访客身份浏览，可以免费试学第一单元"
            onRegister={handleRegister}
            onLogin={handleLogin}
          />
        </div>

        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            智能背单词，高效记忆
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            采用 FSRS 科学记忆算法，7种学习模式，让背单词更轻松、更持久。
            选择一本词书开始吧！
          </p>
        </section>

        {/* Books Grid */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            选择词书
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books?.map((book) => (
              <BookCard
                key={book.id}
                name={book.name}
                code={book.code}
                description={book.description}
                totalWords={book.totalWords}
                totalUnits={book.totalUnits}
                isFree={book.isFree}
                coverImage={book.coverImage}
                onSelect={() => handleSelectBook(book.id)}
              />
            ))}
          </div>

          {books?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              暂无词书
            </div>
          )}
        </section>

        {/* Features Section */}
        <section className="mt-16">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            为什么选择词善佳？
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-xl">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">科学记忆</h4>
              <p className="text-sm text-gray-600">
                FSRS-v6 算法，90%目标记忆率，遗忘前及时复习
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">7种模式</h4>
              <p className="text-sm text-gray-600">
                认读、听写、拼写、造句等多种学习模式
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">激励系统</h4>
              <p className="text-sm text-gray-600">
                金币、勋章、证书，学习更有动力
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-500">
            © 2024 词善佳 - 智能英语词汇学习系统
          </p>
        </div>
      </footer>
    </div>
  );
}
