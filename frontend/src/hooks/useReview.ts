import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { api } from '../services/api';

// Types matching API contracts
export interface DueCard {
  cardId: string;
  wordId: string;
  word: string;
  phoneticUs: string;
  definitions: Array<{ pos: string; meaning: string }>;
  moduleType: number;
  dueAt: string;
  retrievability: number;
  status: string;
}

export interface DueCardsResponse {
  cards: DueCard[];
  totalDue: number;
  isBlocked: boolean;
  blockingMessage?: string;
}

export interface ReviewResult {
  cardId: string;
  newStatus: string;
  stability: number;
  difficulty: number;
  nextDue: string;
  retrievability: number;
}

export interface ReviewStatus {
  overdueCount: number;
  threshold: number;
  isBlocked: boolean;
  blockingMessage?: string;
  estimatedMinutes: number;
}

export interface DailyStats {
  date: string;
  reviewCount: number;
  correctCount: number;
  totalTimeSeconds: number;
  averageRating: number;
}

export interface WeeklyStats {
  weekStart: string;
  totalReviews: number;
  dailyAverage: number;
  retentionRate: number;
  streak: number;
}

export interface CalendarData {
  date: string;
  reviewCount: number;
  intensity: number;
}

export interface WordStats {
  wordId: string;
  word: string;
  reviewCount: number;
  lastReviewAt: string | null;
  stability: number;
  difficulty: number;
  status: string;
  retrievability: number;
}

export interface StreakInfo {
  streak: number;
  totalReviews: number;
}

// API functions
async function fetchDueCards(moduleType?: number, limit: number = 20): Promise<DueCardsResponse> {
  const params: Record<string, string | number> = { limit };
  if (moduleType !== undefined) {
    params.moduleType = moduleType;
  }
  const response = await api.get<DueCardsResponse>('/review/due', { params });
  return response.data;
}

async function submitReview(
  cardId: string,
  rating: number,
  responseTimeMs: number,
): Promise<ReviewResult> {
  const response = await api.post<ReviewResult>(`/review/cards/${cardId}`, {
    rating,
    responseTimeMs,
  });
  return response.data;
}

async function fetchReviewStatus(): Promise<ReviewStatus> {
  const response = await api.get<ReviewStatus>('/review/status');
  return response.data;
}

async function fetchDailyStats(date?: string): Promise<DailyStats> {
  const params = date ? { date } : {};
  const response = await api.get<DailyStats>('/review/stats/daily', { params });
  return response.data;
}

async function fetchWeeklyStats(weekStart?: string): Promise<WeeklyStats> {
  const params = weekStart ? { weekStart } : {};
  const response = await api.get<WeeklyStats>('/review/stats/weekly', { params });
  return response.data;
}

async function fetchCalendarData(
  startDate?: string,
  endDate?: string,
): Promise<CalendarData[]> {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get<CalendarData[]>('/review/stats/calendar', { params });
  return response.data;
}

async function fetchWordStats(limit: number = 100): Promise<WordStats[]> {
  const response = await api.get<WordStats[]>('/review/stats/words', {
    params: { limit },
  });
  return response.data;
}

async function fetchStreak(): Promise<StreakInfo> {
  const response = await api.get<StreakInfo>('/review/streak');
  return response.data;
}

// Hooks

/**
 * Hook to fetch due cards for review
 */
export function useDueCards(
  moduleType?: number,
  limit: number = 20,
): UseQueryResult<DueCardsResponse, Error> {
  return useQuery({
    queryKey: ['review', 'due', { moduleType, limit }],
    queryFn: () => fetchDueCards(moduleType, limit),
    staleTime: 30 * 1000, // 30 seconds - due cards change frequently
  });
}

/**
 * Hook to submit a review
 */
export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      rating,
      responseTimeMs,
    }: {
      cardId: string;
      rating: number;
      responseTimeMs: number;
    }) => submitReview(cardId, rating, responseTimeMs),
    onSuccess: () => {
      // Invalidate due cards to refresh the list
      queryClient.invalidateQueries({ queryKey: ['review', 'due'] });
      queryClient.invalidateQueries({ queryKey: ['review', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['review', 'stats'] });
    },
  });
}

/**
 * Hook to fetch review status and blocking info
 */
export function useReviewStatus(): UseQueryResult<ReviewStatus, Error> {
  return useQuery({
    queryKey: ['review', 'status'],
    queryFn: fetchReviewStatus,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch daily statistics
 */
export function useDailyStats(date?: string): UseQueryResult<DailyStats, Error> {
  return useQuery({
    queryKey: ['review', 'stats', 'daily', date],
    queryFn: () => fetchDailyStats(date),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch weekly statistics
 */
export function useWeeklyStats(weekStart?: string): UseQueryResult<WeeklyStats, Error> {
  return useQuery({
    queryKey: ['review', 'stats', 'weekly', weekStart],
    queryFn: () => fetchWeeklyStats(weekStart),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch calendar heatmap data
 */
export function useCalendarData(
  startDate?: string,
  endDate?: string,
): UseQueryResult<CalendarData[], Error> {
  return useQuery({
    queryKey: ['review', 'stats', 'calendar', { startDate, endDate }],
    queryFn: () => fetchCalendarData(startDate, endDate),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch word statistics for word cloud
 */
export function useWordStats(limit: number = 100): UseQueryResult<WordStats[], Error> {
  return useQuery({
    queryKey: ['review', 'stats', 'words', limit],
    queryFn: () => fetchWordStats(limit),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch streak info
 */
export function useStreak(): UseQueryResult<StreakInfo, Error> {
  return useQuery({
    queryKey: ['review', 'streak'],
    queryFn: fetchStreak,
    staleTime: 5 * 60 * 1000,
  });
}
