import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { api } from '../services/api';

// Types matching API contracts
export type TestMode = 'normal' | 'speed' | 'ultimate';
export type QuestionType = 'en_to_cn' | 'cn_to_en';

export interface TestQuestion {
  questionId: string;
  type: QuestionType;
  prompt: string;
  correctAnswer: string;
  options: string[];
  wordId: string;
}

export interface TestSession {
  attemptId: string;
  questions: TestQuestion[];
  mode: TestMode;
  moduleType: number;
  startedAt: string;
  timeLimitMs: number | null;
}

export interface TestResult {
  attemptId: string;
  score: number;
  percentage: number;
  speedBonus: number;
  finalScore: number;
  passed: boolean;
  stars: number;
  maxStars: number;
  correctCount: number;
  totalQuestions: number;
  timeTakenMs: number;
  timeLimitMs: number | null;
  isNewRecord: boolean;
}

export interface TestAttempt {
  id: string;
  userId: string;
  bookId: string;
  unitNumber: number;
  moduleType: number;
  mode: TestMode;
  totalQuestions: number;
  correctCount: number | null;
  score: number | null;
  percentage: number | null;
  speedBonus: number | null;
  passed: boolean | null;
  stars: number | null;
  timeTakenMs: number | null;
  startedAt: string;
  submittedAt: string | null;
}

export interface UnitTestSummary {
  moduleStars: Array<{
    moduleType: number;
    stars: number;
    maxStars: number;
  }>;
  totalStars: number;
  maxTotalStars: number;
}

// API functions
async function startTest(
  bookId: string,
  unitNumber: number,
  mode: TestMode,
  moduleType: number,
): Promise<TestSession> {
  const response = await api.post<TestSession>('/tests/start', {
    bookId,
    unitNumber,
    mode,
    moduleType,
  });
  return response.data;
}

async function submitTest(
  attemptId: string,
  answers: Record<string, string>,
  timeTakenMs: number,
): Promise<TestResult> {
  const response = await api.post<TestResult>(`/tests/${attemptId}/submit`, {
    answers,
    timeTakenMs,
  });
  return response.data;
}

async function getTestAttempt(attemptId: string): Promise<TestAttempt> {
  const response = await api.get<TestAttempt>(`/tests/${attemptId}`);
  return response.data;
}

async function getTestHistory(
  bookId?: string,
  unitNumber?: number,
  limit: number = 20,
): Promise<TestAttempt[]> {
  const params: Record<string, string | number> = { limit };
  if (bookId) params.bookId = bookId;
  if (unitNumber !== undefined) params.unitNumber = unitNumber;

  const response = await api.get<TestAttempt[]>('/tests', { params });
  return response.data;
}

async function getBestScore(
  bookId: string,
  unitNumber: number,
  moduleType: number,
  mode: TestMode,
): Promise<TestAttempt | null> {
  const response = await api.get<TestAttempt>(
    `/tests/best/${bookId}/${unitNumber}/${moduleType}/${mode}`,
  );
  return response.data;
}

async function getUnitTestSummary(
  bookId: string,
  unitNumber: number,
): Promise<UnitTestSummary> {
  const response = await api.get<UnitTestSummary>(
    `/tests/unit-summary/${bookId}/${unitNumber}`,
  );
  return response.data;
}

// Hooks

/**
 * Hook to start a test
 */
export function useStartTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookId,
      unitNumber,
      mode,
      moduleType,
    }: {
      bookId: string;
      unitNumber: number;
      mode: TestMode;
      moduleType: number;
    }) => startTest(bookId, unitNumber, mode, moduleType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
    },
  });
}

/**
 * Hook to submit test answers
 */
export function useSubmitTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attemptId,
      answers,
      timeTakenMs,
    }: {
      attemptId: string;
      answers: Record<string, string>;
      timeTakenMs: number;
    }) => submitTest(attemptId, answers, timeTakenMs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      queryClient.invalidateQueries({ queryKey: ['test-summary'] });
    },
  });
}

/**
 * Hook to get test attempt details
 */
export function useTestAttempt(attemptId: string | undefined): UseQueryResult<TestAttempt, Error> {
  return useQuery({
    queryKey: ['test', attemptId],
    queryFn: () => getTestAttempt(attemptId!),
    enabled: !!attemptId,
  });
}

/**
 * Hook to get test history
 */
export function useTestHistory(
  bookId?: string,
  unitNumber?: number,
  limit: number = 20,
): UseQueryResult<TestAttempt[], Error> {
  return useQuery({
    queryKey: ['tests', 'history', { bookId, unitNumber, limit }],
    queryFn: () => getTestHistory(bookId, unitNumber, limit),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get best score
 */
export function useBestScore(
  bookId: string | undefined,
  unitNumber: number | undefined,
  moduleType: number | undefined,
  mode: TestMode,
): UseQueryResult<TestAttempt | null, Error> {
  return useQuery({
    queryKey: ['test', 'best', { bookId, unitNumber, moduleType, mode }],
    queryFn: () => getBestScore(bookId!, unitNumber!, moduleType!, mode),
    enabled: !!bookId && unitNumber !== undefined && moduleType !== undefined,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get unit test summary
 */
export function useUnitTestSummary(
  bookId: string | undefined,
  unitNumber: number | undefined,
): UseQueryResult<UnitTestSummary, Error> {
  return useQuery({
    queryKey: ['test-summary', { bookId, unitNumber }],
    queryFn: () => getUnitTestSummary(bookId!, unitNumber!),
    enabled: !!bookId && unitNumber !== undefined,
    staleTime: 5 * 60 * 1000,
  });
}
