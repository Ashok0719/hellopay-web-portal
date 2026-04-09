import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

// Custom storage for IndexedDB (More stable for PWAs)
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

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
        // No need to clear all localStorage here, del handled by zustand persist
      },
    }),
    {
      name: 'hellopay-auth-storage',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
