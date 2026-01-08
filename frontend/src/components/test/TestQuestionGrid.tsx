import { useState } from 'react';
import { TestQuestion } from '../../hooks/useTests';

interface TestQuestionGridProps {
  questions: TestQuestion[];
  answers: Map<string, string>;
  currentIndex: number;
  onAnswerSelect: (questionId: string, answer: string) => void;
  onNavigate: (index: number) => void;
}

/**
 * Grid display for test questions with navigation
 */
export function TestQuestionGrid({
  questions,
  answers,
  currentIndex,
  onAnswerSelect,
  onNavigate,
}: TestQuestionGridProps) {
  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Question navigation grid */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex flex-wrap gap-2 max-w-3xl mx-auto">
          {questions.map((q, index) => {
            const isAnswered = answers.has(q.questionId);
            const isCurrent = index === currentIndex;

            return (
              <button
                key={q.questionId}
                onClick={() => onNavigate(index)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-primary-500 text-white'
                    : isAnswered
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current question */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Question number */}
          <div className="text-center mb-2">
            <span className="text-sm text-gray-500">
              第 {currentIndex + 1} / {questions.length} 题
            </span>
          </div>

          {/* Question type indicator */}
          <div className="text-center mb-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentQuestion.type === 'en_to_cn'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {currentQuestion.type === 'en_to_cn' ? '英译中' : '中译英'}
            </span>
          </div>

          {/* Question prompt */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {currentQuestion.prompt}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, optionIndex) => {
              const isSelected =
                answers.get(currentQuestion.questionId) === optionIndex.toString();

              return (
                <button
                  key={optionIndex}
                  onClick={() =>
                    onAnswerSelect(currentQuestion.questionId, optionIndex.toString())
                  }
                  className={`w-full p-4 text-left rounded-xl border-2 transition-colors ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isSelected
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span className="text-gray-800">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => onNavigate(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← 上一题
            </button>
            <button
              onClick={() => onNavigate(currentIndex + 1)}
              disabled={currentIndex === questions.length - 1}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一题 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact question card for review
 */
export function QuestionCard({
  question,
  selectedAnswer,
  onSelect,
  showNumber,
}: {
  question: TestQuestion;
  selectedAnswer?: string;
  onSelect: (answer: string) => void;
  showNumber?: number;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {showNumber && (
        <span className="text-sm text-gray-500 mb-2 block">
          第 {showNumber} 题
        </span>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {question.prompt}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSelect(index.toString())}
            className={`p-3 text-left rounded-lg border transition-colors ${
              selectedAnswer === index.toString()
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-sm text-gray-700">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default TestQuestionGrid;
