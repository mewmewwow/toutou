import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { HomePage } from './pages/home/HomePage';
import { BookDetailPage } from './pages/home/BookDetailPage';
import { UnitSelectPage } from './pages/learn/UnitSelectPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { LoginPage } from './pages/auth/LoginPage';

// Lazy load learning modules for better performance
// Word-based modules (1-3)
const SmartRecognitionPage = lazy(() => import('./pages/learn/SmartRecognitionPage'));
const SmartDictationPage = lazy(() => import('./pages/learn/SmartDictationPage'));
const SmartWritingPage = lazy(() => import('./pages/learn/SmartWritingPage'));
// Sentence-based modules (7-10)
const SentenceListeningPage = lazy(() => import('./pages/learn/SentenceListeningPage'));
const SentenceTranslationPage = lazy(() => import('./pages/learn/SentenceTranslationPage'));
const SentenceDictationPage = lazy(() => import('./pages/learn/SentenceDictationPage'));
const SmartWordUsagePage = lazy(() => import('./pages/learn/SmartWordUsagePage'));
// Completion page
const LearningCompletePage = lazy(() => import('./pages/learn/LearningCompletePage'));
// Review pages
const ReviewDashboardPage = lazy(() => import('./pages/review/ReviewDashboardPage'));
const SmartReviewPage = lazy(() => import('./pages/review/SmartReviewPage'));

// Loading spinner for lazy-loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
  </div>
);

/**
 * Application router configuration
 * Phase 2: Learning module routes
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/books/:bookId',
    element: <BookDetailPage />,
  },
  {
    path: '/books/:bookId/modules/:moduleType',
    element: <UnitSelectPage />,
  },
  // Learning module routes
  {
    path: '/learn/recognition/:bookId',
    element: (
      <Suspense fallback={<PageLoader />}>
        <SmartRecognitionPage />
      </Suspense>
    ),
  },
  {
    path: '/learn/dictation/:bookId',
    element: (
      <Suspense fallback={<PageLoader />}>
        <SmartDictationPage />
      </Suspense>
    ),
  },
  {
    path: '/learn/writing/:bookId',
    element: (
      <Suspense fallback={<PageLoader />}>
        <SmartWritingPage />
      </Suspense>
    ),
  },
  {
    path: '/learn/complete',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LearningCompletePage />
      </Suspense>
    ),
  },
  // Sentence learning modules (7-10)
  {
    path: '/learn/sentence-listening/:bookId',
    element: (
      <Suspense fallback={<PageLoader />}>
        <SentenceListeningPage />
      </Suspense>
    ),
  },
  {
    path: '/learn/sentence-translation/:bookId',
    element: (
      <Suspense fallback={<PageLoader />}>
        <SentenceTranslationPage />
      </Suspense>
    ),
  },
  {
    path: '/learn/sentence-dictation/:bookId',
    element: (
      <Suspense fallback={<PageLoader />}>
        <SentenceDictationPage />
      </Suspense>
    ),
  },
  {
    path: '/learn/word-usage/:bookId',
    element: (
      <Suspense fallback={<PageLoader />}>
        <SmartWordUsagePage />
      </Suspense>
    ),
  },
  // Review routes
  {
    path: '/review',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ReviewDashboardPage />
      </Suspense>
    ),
  },
  {
    path: '/review/session',
    element: (
      <Suspense fallback={<PageLoader />}>
        <SmartReviewPage />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  // 404 fallback
  {
    path: '*',
    element: (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-4">页面不存在</p>
          <a href="/" className="text-primary-500 hover:underline">
            返回首页
          </a>
        </div>
      </div>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
