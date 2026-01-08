import { create } from 'zustand';
import { api } from '../services/api';

// Types matching API contracts
export interface LearningWord {
  id: string;
  word: string;
  phoneticUs: string | null;
  phoneticUk: string | null;
  audioUs: string | null;
  audioUk: string | null;
  definitions: Array<{ pos: string; meaning: string }>;
  sentences: Array<{
    id: string;
    contentEn: string;
    contentCn: string;
    isPrimary: boolean;
    audioUrl: string | null;
  }>;
  cardStatus: 'new' | 'learning' | 'review' | 'graduated';
}

export interface SessionProgress {
  completed: number;
  total: number;
  batchNumber: number;
}

export interface LearningSession {
  id: string;
  bookId: string;
  unitNumber: number;
  moduleType: number;
  status: 'active' | 'paused' | 'completed';
  wordsCompleted: number;
  wordsTotal: number;
  effectiveSeconds: number;
}

export interface LearningResult {
  cardId: string;
  newStatus: 'new' | 'learning' | 'review' | 'graduated';
  stability: number;
  difficulty: number;
  nextDue: string;
  coinsEarned: number;
}

interface LearningState {
  // Current session state
  session: LearningSession | null;
  currentWords: LearningWord[];
  currentWordIndex: number;
  progress: SessionProgress | null;
  isReinforcement: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  startSession: (bookId: string, unitNumber: number, moduleType: number) => Promise<void>;
  fetchNextBatch: () => Promise<void>;
  submitAnswer: (
    wordId: string,
    rating: number,
    responseTimeMs: number,
    userAnswer?: string,
    isCorrect?: boolean,
  ) => Promise<LearningResult>;
  nextWord: () => void;
  resetSession: () => void;

  // Computed
  currentWord: () => LearningWord | null;
  isSessionComplete: () => boolean;
}

export const useLearningStore = create<LearningState>((set, get) => ({
  session: null,
  currentWords: [],
  currentWordIndex: 0,
  progress: null,
  isReinforcement: false,
  isLoading: false,
  error: null,

  /**
   * Start or resume a learning session
   */
  startSession: async (bookId, unitNumber, moduleType) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post<LearningSession>('/learning/sessions', {
        bookId,
        unitNumber,
        moduleType,
      });

      set({
        session: response.data,
        currentWords: [],
        currentWordIndex: 0,
        isLoading: false,
      });

      // Fetch first batch of words
      await get().fetchNextBatch();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '启动学习会话失败',
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Fetch next batch of words
   */
  fetchNextBatch: async () => {
    const { session } = get();
    if (!session) return;

    set({ isLoading: true, error: null });

    try {
      const response = await api.get<{
        words: LearningWord[];
        isReinforcement: boolean;
        progress: SessionProgress;
      }>(`/learning/sessions/${session.id}/next`);

      set({
        currentWords: response.data.words,
        currentWordIndex: 0,
        isReinforcement: response.data.isReinforcement,
        progress: response.data.progress,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '获取单词失败',
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Submit learning result for current word
   */
  submitAnswer: async (wordId, rating, responseTimeMs, userAnswer, isCorrect) => {
    const { session } = get();
    if (!session) {
      throw new Error('No active session');
    }

    const response = await api.post<LearningResult>(
      `/learning/sessions/${session.id}/submit`,
      {
        wordId,
        rating,
        responseTimeMs,
        userAnswer,
        isCorrect,
      },
    );

    // Update local session progress
    set((state) => ({
      session: state.session
        ? {
            ...state.session,
            wordsCompleted: state.session.wordsCompleted + 1,
          }
        : null,
      progress: state.progress
        ? {
            ...state.progress,
            completed: state.progress.completed + 1,
          }
        : null,
    }));

    return response.data;
  },

  /**
   * Move to next word in current batch
   */
  nextWord: () => {
    const { currentWordIndex, currentWords } = get();

    if (currentWordIndex < currentWords.length - 1) {
      set({ currentWordIndex: currentWordIndex + 1 });
    } else {
      // Batch complete, fetch next batch
      get().fetchNextBatch();
    }
  },

  /**
   * Reset session state
   */
  resetSession: () => {
    set({
      session: null,
      currentWords: [],
      currentWordIndex: 0,
      progress: null,
      isReinforcement: false,
      isLoading: false,
      error: null,
    });
  },

  /**
   * Get current word
   */
  currentWord: () => {
    const { currentWords, currentWordIndex } = get();
    return currentWords[currentWordIndex] || null;
  },

  /**
   * Check if session is complete
   */
  isSessionComplete: () => {
    const { session, currentWords } = get();
    if (!session) return false;

    return (
      session.status === 'completed' ||
      (session.wordsCompleted >= session.wordsTotal && currentWords.length === 0)
    );
  },
}));
