import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLearningStore } from '../../stores/learningStore';

/**
 * LearningCompletePage - Shown when a learning session is completed
 */
const LearningCompletePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get('bookId');
  const unitNumber = searchParams.get('unit');

  const { session, resetSession } = useLearningStore();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetSession();
    };
  }, [resetSession]);

  const handleBackToBook = () => {
    if (bookId) {
      navigate(`/books/${bookId}`);
    } else {
      navigate('/');
    }
  };

  const handlePracticeAgain = () => {
    if (bookId && unitNumber) {
      resetSession();
      navigate(`/learn/recognition/${bookId}?unit=${unitNumber}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Congratulations message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Great job!
        </h1>
        <p className="text-gray-600 mb-8">
          You have completed this learning session.
        </p>

        {/* Stats */}
        {session && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {session.wordsCompleted}
                </p>
                <p className="text-sm text-gray-500">Words Learned</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {Math.round(session.effectiveSeconds / 60)}
                </p>
                <p className="text-sm text-gray-500">Minutes</p>
              </div>
            </div>
          </div>
        )}

        {/* Encouragement */}
        <div className="bg-yellow-50 rounded-lg p-4 mb-8">
          <p className="text-yellow-800 text-sm">
            Keep up the great work! Regular practice helps build long-term memory.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handlePracticeAgain}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg
              hover:bg-blue-700 transition-colors"
          >
            Practice More Words
          </button>

          <button
            onClick={handleBackToBook}
            className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg
              hover:bg-gray-200 transition-colors"
          >
            Back to Book
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearningCompletePage;
