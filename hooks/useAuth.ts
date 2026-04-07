import { create } from 'zustand';

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
