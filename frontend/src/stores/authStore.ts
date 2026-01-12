import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from 'shared/types/user';
import { authService } from '../services/authService';
import { LoginDto, RegisterDto } from 'shared/types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (data: LoginDto) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(data);
          set({ 
            user: response.user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error: any) {
          const message = error.response?.data?.message || '登录失败，请稍后重试';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterDto) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);
          set({ 
            user: response.user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error: any) {
          const message = error.response?.data?.message || '注册失败，请稍后重试';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        authService.logout();
        set({ user: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        if (!authService.isAuthenticated()) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const user = await authService.getCurrentUser();
          set({ user, isAuthenticated: true });
        } catch (error) {
          // Token invalid or expired
          authService.logout();
          set({ user: null, isAuthenticated: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'cishanjia-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
