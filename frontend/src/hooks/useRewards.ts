import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// ==================== Types ====================

export interface CoinBalance {
  totalCoins: number;
  dailyTotal: number;
  dailyRemaining: number;
  dailyCap: number;
  hasReachedCap: boolean;
}

export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  type: string;
  description: string;
  referenceId: string | null;
  createdAt: string;
}

export interface DailyStats {
  dailyTotal: number;
  dailyRemaining: number;
  dailyCap: number;
  hasReachedCap: boolean;
  earnRates: {
    learning: number;
    review: number;
    test: number;
    daily_login: number;
    streak: number;
  };
}

export interface MedalInfo {
  tier: string;
  daysActive: number;
  nextTier: string | null;
  daysToNextTier: number;
  tierPoints: number;
  display: {
    name: string;
    color: string;
    icon: string;
  };
  progressPercentage: number;
}

export interface MedalThresholds {
  thresholds: Record<string, number>;
  displays: Record<string, { name: string; color: string; icon: string }>;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string | null;
  isActive: boolean;
  daysSinceLastLogin: number;
  nextMilestone: number;
  daysToNextMilestone: number;
  bonusCoins: number;
  milestones: number[];
}

export interface StreakRecordResult {
  currentStreak: number;
  longestStreak: number;
  isNewRecord: boolean;
  streakBroken: boolean;
  previousStreak?: number;
  alreadyLoggedToday: boolean;
  bonusCoins: number;
  isMilestone: boolean;
  message: string;
}

export interface Certificate {
  id: string;
  userId: string;
  bookId: string | null;
  unitNumber: number | null;
  type: string;
  metadata: Record<string, any> | null;
  awardedAt: string;
  display: {
    title: string;
    description: string;
    color: string;
    icon: string;
  };
}

export interface RewardsSummary {
  coins: {
    totalCoins: number;
    dailyTotal: number;
    dailyRemaining: number;
    dailyCap: number;
  };
  medal: MedalInfo;
  streak: Omit<StreakInfo, 'milestones'>;
  certificates: {
    total: number;
    recent: Certificate[];
  };
}

// ==================== API Functions ====================

// Coins
async function getCoinBalance(): Promise<CoinBalance> {
  const response = await api.get<CoinBalance>('/rewards/coins/balance');
  return response.data;
}

async function getCoinTransactions(limit?: number): Promise<{
  transactions: CoinTransaction[];
  total: number;
}> {
  const params = limit ? { limit } : {};
  const response = await api.get<{
    transactions: CoinTransaction[];
    total: number;
  }>('/rewards/coins/transactions', { params });
  return response.data;
}

async function getDailyStats(): Promise<DailyStats> {
  const response = await api.get<DailyStats>('/rewards/coins/daily-stats');
  return response.data;
}

// Medals
async function getCurrentMedal(): Promise<MedalInfo> {
  const response = await api.get<MedalInfo>('/rewards/medals/current');
  return response.data;
}

async function getMedalThresholds(): Promise<MedalThresholds> {
  const response = await api.get<MedalThresholds>('/rewards/medals/thresholds');
  return response.data;
}

async function getMedalProgress(): Promise<{
  currentTier: string;
  nextTier: string | null;
  daysToNextTier: number;
  progressPercentage: number;
  daysActive: number;
}> {
  const response = await api.get('/rewards/medals/progress');
  return response.data;
}

// Streaks
async function recordDailyLogin(): Promise<StreakRecordResult> {
  const response = await api.post<StreakRecordResult>(
    '/rewards/streaks/record-login',
  );
  return response.data;
}

async function getStreakInfo(): Promise<StreakInfo> {
  const response = await api.get<StreakInfo>('/rewards/streaks/info');
  return response.data;
}

async function getStreakMilestones(): Promise<{
  milestones: number[];
  bonuses: Record<number, number>;
}> {
  const response = await api.get('/rewards/streaks/milestones');
  return response.data;
}

// Certificates
async function getCertificates(type?: string): Promise<{
  certificates: Certificate[];
  total: number;
}> {
  const params = type ? { type } : {};
  const response = await api.get<{
    certificates: Certificate[];
    total: number;
  }>('/rewards/certificates', { params });
  return response.data;
}

async function getRecentCertificates(limit?: number): Promise<{
  certificates: Certificate[];
  total: number;
}> {
  const params = limit ? { limit } : {};
  const response = await api.get<{
    certificates: Certificate[];
    total: number;
  }>('/rewards/certificates/recent', { params });
  return response.data;
}

async function getCertificateCount(type?: string): Promise<{
  total: number;
  type: string;
}> {
  const params = type ? { type } : {};
  const response = await api.get<{ total: number; type: string }>(
    '/rewards/certificates/count',
    { params },
  );
  return response.data;
}

async function getCertificate(id: string): Promise<{
  certificate: Certificate;
  display: Certificate['display'];
}> {
  const response = await api.get(`/rewards/certificates/${id}`);
  return response.data;
}

async function getBookCertificates(bookId: string): Promise<{
  certificates: Certificate[];
  total: number;
  bookId: string;
}> {
  const response = await api.get(`/rewards/certificates/book/${bookId}`);
  return response.data;
}

async function getUnitCertificates(
  bookId: string,
  unitNumber: number,
): Promise<{
  certificates: Certificate[];
  total: number;
  bookId: string;
  unitNumber: number;
}> {
  const response = await api.get(
    `/rewards/certificates/book/${bookId}/unit/${unitNumber}`,
  );
  return response.data;
}

// Summary
async function getRewardsSummary(): Promise<RewardsSummary> {
  const response = await api.get<RewardsSummary>('/rewards/summary');
  return response.data;
}

// ==================== Hooks ====================

// Coins
export function useCoinBalance() {
  return useQuery({
    queryKey: ['rewards', 'coins', 'balance'],
    queryFn: getCoinBalance,
  });
}

export function useCoinTransactions(limit?: number) {
  return useQuery({
    queryKey: ['rewards', 'coins', 'transactions', limit],
    queryFn: () => getCoinTransactions(limit),
  });
}

export function useDailyStats() {
  return useQuery({
    queryKey: ['rewards', 'coins', 'daily-stats'],
    queryFn: getDailyStats,
  });
}

// Medals
export function useCurrentMedal() {
  return useQuery({
    queryKey: ['rewards', 'medals', 'current'],
    queryFn: getCurrentMedal,
  });
}

export function useMedalThresholds() {
  return useQuery({
    queryKey: ['rewards', 'medals', 'thresholds'],
    queryFn: getMedalThresholds,
    staleTime: Infinity, // Thresholds don't change
  });
}

export function useMedalProgress() {
  return useQuery({
    queryKey: ['rewards', 'medals', 'progress'],
    queryFn: getMedalProgress,
  });
}

// Streaks
export function useRecordDailyLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordDailyLogin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards', 'streaks'] });
      queryClient.invalidateQueries({ queryKey: ['rewards', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['rewards', 'coins'] });
    },
  });
}

export function useStreakInfo() {
  return useQuery({
    queryKey: ['rewards', 'streaks', 'info'],
    queryFn: getStreakInfo,
  });
}

export function useStreakMilestones() {
  return useQuery({
    queryKey: ['rewards', 'streaks', 'milestones'],
    queryFn: getStreakMilestones,
    staleTime: Infinity, // Milestones don't change
  });
}

// Certificates
export function useCertificates(type?: string) {
  return useQuery({
    queryKey: ['rewards', 'certificates', type],
    queryFn: () => getCertificates(type),
  });
}

export function useRecentCertificates(limit?: number) {
  return useQuery({
    queryKey: ['rewards', 'certificates', 'recent', limit],
    queryFn: () => getRecentCertificates(limit),
  });
}

export function useCertificateCount(type?: string) {
  return useQuery({
    queryKey: ['rewards', 'certificates', 'count', type],
    queryFn: () => getCertificateCount(type),
  });
}

export function useCertificate(id: string) {
  return useQuery({
    queryKey: ['rewards', 'certificates', id],
    queryFn: () => getCertificate(id),
    enabled: !!id,
  });
}

export function useBookCertificates(bookId: string) {
  return useQuery({
    queryKey: ['rewards', 'certificates', 'book', bookId],
    queryFn: () => getBookCertificates(bookId),
    enabled: !!bookId,
  });
}

export function useUnitCertificates(bookId: string, unitNumber: number) {
  return useQuery({
    queryKey: ['rewards', 'certificates', 'unit', bookId, unitNumber],
    queryFn: () => getUnitCertificates(bookId, unitNumber),
    enabled: !!bookId && unitNumber > 0,
  });
}

// Summary
export function useRewardsSummary() {
  return useQuery({
    queryKey: ['rewards', 'summary'],
    queryFn: getRewardsSummary,
  });
}
