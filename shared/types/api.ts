import type { ModuleTypeValue } from '../constants/modules';

// ============ Common Types ============

export type MemberType = 'guest' | 'free' | 'trial' | 'paid';
export type PronunciationType = 'us' | 'uk';
export type CardStatus = 'new' | 'learning' | 'review' | 'graduated';
export type SessionStatus = 'active' | 'paused' | 'completed';
export type TestMode = 'normal' | 'speed' | 'ultimate';
export type ReviewType = 'learning' | 'review' | 'relearning';

// ============ Auth Types ============

export interface EmailRegisterRequest {
  email: string;
  password: string;
  username: string;
  deviceFingerprint?: string;
}

export interface PhoneRegisterRequest {
  phone: string;
  verificationCode: string;
  username: string;
  deviceFingerprint?: string;
}

export interface LoginRequest {
  credential: string; // email or phone
  password: string;
  deviceFingerprint?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface GuestMigrateRequest {
  deviceFingerprint: string;
}

export interface GuestMigrateResponse {
  cardsImported: number;
  revlogsImported: number;
}

// ============ User Types ============

export interface User {
  id: string;
  email?: string;
  phone?: string;
  username: string;
  avatar?: string;
  totalCoins: number;
  totalCredits: number;
  level: number;
  memberType: MemberType;
  memberExpireAt?: string;
  trialDaysRemaining?: number;
  pronunciationPref: PronunciationType;
}

export interface UserUpdate {
  username?: string;
  avatar?: string;
  birthday?: string;
  pronunciationPref?: PronunciationType;
}

export interface Device {
  id: string;
  deviceName?: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

// ============ Book Types ============

export interface Book {
  id: string;
  name: string;
  code: string;
  description?: string;
  totalWords: number;
  totalUnits: number;
  isFree: boolean;
  coverImage?: string;
}

export interface BookDetail extends Book {
  units: UnitInfo[];
}

export interface UnitInfo {
  number: number;
  wordCount: number;
  isAccessible: boolean;
}

export interface Word {
  id: string;
  word: string;
  phoneticUs?: string;
  phoneticUk?: string;
  audioUs?: string;
  audioUk?: string;
  definitions: Definition[];
  sentences: Sentence[];
}

export interface Definition {
  pos: string;
  meaning: string;
}

export interface Sentence {
  id: string;
  contentEn: string;
  contentCn: string;
  isPrimary: boolean;
  audioUrl?: string;
}

// ============ Learning Types ============

export interface LearningSession {
  id: string;
  bookId: string;
  unitNumber: number;
  moduleType: ModuleTypeValue;
  status: SessionStatus;
  wordsCompleted: number;
  wordsTotal: number;
  effectiveSeconds: number;
}

export interface LearningWord extends Word {
  cardStatus: CardStatus;
}

export interface SessionProgress {
  completed: number;
  total: number;
  batchNumber: number;
}

export interface LearningBatchResponse {
  words: LearningWord[];
  isReinforcement: boolean;
  progress: SessionProgress;
}

export interface LearningSubmission {
  wordId: string;
  rating: number; // 0-4 FSRS rating
  responseTimeMs: number;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface LearningResult {
  cardId: string;
  newStatus: CardStatus;
  stability: number;
  difficulty: number;
  nextDue?: string;
  coinsEarned: number;
}

// ============ Review Types ============

export interface ReviewSummary {
  totalDue: number;
  totalOverdue: number;
  isBlocking: boolean;
  byModule: Record<number, { due: number; overdue: number }>;
}

export interface ReviewCard {
  id: string;
  wordId: string;
  moduleType: ModuleTypeValue;
  word: Word;
  stability: number;
  difficulty: number;
  retrievability: number; // percentage 0-100
  dueAt: string;
  reviewCount: number;
  errorCount: number;
}

export interface ReviewSubmission {
  rating: number; // 0-4 FSRS rating
  responseTimeMs: number;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface ReviewResult {
  cardId: string;
  newStability: number;
  newDifficulty: number;
  nextDue: string;
  intervalDays: number;
}

export interface TrackingData {
  cards: TrackingCard[];
}

export interface TrackingCard {
  word: string;
  stability: number;
  retrievability: number;
  dueAt: string;
  reviewCount: number;
  errorCount: number;
  urgencyLevel: 'overdue' | 'due_today' | 'due_soon' | 'stable';
}

// ============ Test Types ============

export interface TestSession {
  id: string;
  bookId: string;
  unitNumber: number;
  moduleType: ModuleTypeValue;
  testMode: TestMode;
  questions: TestQuestion[];
  totalTimeMs: number;
  perQuestionTimeMs?: number;
}

export interface TestQuestion {
  id: string;
  type: 'en_to_cn' | 'cn_to_en' | 'dictation' | 'writing';
  prompt: string;
  audioUrl?: string;
  options?: TestOption[];
}

export interface TestOption {
  id: string;
  text: string;
}

export interface TestAnswer {
  questionId: string;
  answer: string;
  timeMs: number;
}

export interface TestResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  passed: boolean;
  starsEarned: number;
  coinsEarned: number;
  isNewHighScore: boolean;
}

// ============ Reward Types ============

export interface CoinInfo {
  balance: number;
  todayEarned: number;
  todayLearningEarned: number;
  dailyLearningCap: number;
}

export interface CoinTransaction {
  id: string;
  amount: number;
  balanceAfter: number;
  type: string;
  description: string;
  createdAt: string;
}

export interface CoinHistory {
  transactions: CoinTransaction[];
  pagination: Pagination;
}

export interface MedalInfo {
  currentWeekCoins: number;
  currentMedal?: string;
  nextMedal?: string;
  coinsToNextMedal?: number;
  weekStartDate: string;
  weekEndDate: string;
}

export interface Certificate {
  id: string;
  bookId: string;
  bookName: string;
  type: 'word_recognition' | 'word_dictation' | 'word_writing' | 'sentence' | 'all_round';
  score: number;
  earnedAt: string;
}

export interface LoginStreak {
  currentMonthDays: number;
  loginDates: string[];
  claimedMilestones: number[];
  availableMilestones: number[];
}

// ============ Common Response Types ============

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ReviewBlockingError extends ErrorResponse {
  overdueCount: number;
  threshold: number;
}
