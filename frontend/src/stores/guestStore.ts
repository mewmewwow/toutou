import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateFingerprint } from '../utils/fingerprint/generateFingerprint';

interface GuestState {
  fingerprint: string | null;
  isInitialized: boolean;
  initializeFingerprint: () => Promise<string>;
  clearFingerprint: () => void;
}

/**
 * Store for managing guest user state
 * Persists fingerprint in localStorage for continuity across sessions
 */
export const useGuestStore = create<GuestState>()(
  persist(
    (set, get) => ({
      fingerprint: null,
      isInitialized: false,

      /**
       * Initialize or retrieve device fingerprint
       * Creates a new fingerprint if one doesn't exist
       */
      initializeFingerprint: async () => {
        const { fingerprint } = get();

        if (fingerprint) {
          set({ isInitialized: true });
          return fingerprint;
        }

        const newFingerprint = await generateFingerprint();
        set({ fingerprint: newFingerprint, isInitialized: true });
        return newFingerprint;
      },

      /**
       * Clear fingerprint (used when user registers/logs in)
       */
      clearFingerprint: () => {
        set({ fingerprint: null, isInitialized: false });
      },
    }),
    {
      name: 'cishanjia-guest',
      partialize: (state) => ({ fingerprint: state.fingerprint }),
    },
  ),
);

/**
 * Hook to get fingerprint header for API requests
 */
export function useGuestHeaders(): Record<string, string> {
  const fingerprint = useGuestStore((state) => state.fingerprint);

  if (!fingerprint) {
    return {};
  }

  return {
    'X-Device-Fingerprint': fingerprint,
  };
}
