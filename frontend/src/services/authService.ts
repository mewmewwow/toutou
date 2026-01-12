import { api, setAccessToken, getAccessToken } from './api';
import { LoginDto, RegisterDto, AuthResponse, User } from 'shared/types/user';

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    const { accessToken, refreshToken, user } = response.data;
    
    setAccessToken(accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    
    return response.data;
  },

  /**
   * Login user
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    const { accessToken, refreshToken, user } = response.data;
    
    setAccessToken(accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    
    return response.data;
  },

  /**
   * Logout user
   */
  logout() {
    setAccessToken(null);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!getAccessToken();
  },
  
  /**
   * Migrate guest data
   */
  async migrateGuest(guestUserId: string): Promise<any> {
    const response = await api.post('/auth/guest/migrate', { guestUserId });
    return response.data;
  }
};
