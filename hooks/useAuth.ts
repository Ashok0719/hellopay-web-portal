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
  verifiedUpiId?: string;
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
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.clear(); // Ensure all persistence is cleared on logout
      },
    }),
    {
      name: 'hellopay-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
