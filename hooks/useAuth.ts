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
        idbStorage.removeItem('hellopay-auth-storage');
      },
    }),
    {
      name: 'hellopay-auth-storage',
      storage: createJSONStorage(() => idbStorage),
      onRehydrateStorage: () => (state) => {
        // Sync token to localStorage on hydration for the interceptor
        if (state?.token) {
          localStorage.setItem('token', state.token);
        }
      }
    }
  )
);
