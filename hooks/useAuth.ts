import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  userIdNumber?: number;
  referralCode?: string;
  walletBalance: number;
  rewardBalance?: number;
  totalRewards?: number;
  totalDeposited?: number;
  totalWithdrawn?: number;
  totalSales?: number;
  totalCommission?: number;
  isBlocked?: boolean;
  isSeller?: boolean;
  isOpenSelling?: boolean;
  verifiedUpiId?: string;
  upiId?: string;
  pin?: string;
  referralPercent?: number;
  profitPercent?: number;
  referralEarnings?: number;
  referralBonusAmount?: number;
  [key: string]: any; // allow additional backend fields
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },
      setToken: (token) => {
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
        set({ token });
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('token');
        localStorage.removeItem('hellopay-auth-storage');
      },
    }),
    {
      name: 'hellopay-auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Sync token to localStorage on hydration for the interceptor
        if (state?.token) {
          localStorage.setItem('token', state.token);
        }
      }
    }
  )
);
