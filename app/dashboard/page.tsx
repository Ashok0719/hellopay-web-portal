'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Send, Download, History, TrendingUp, Settings, 
  ChevronRight, ArrowUpRight, Zap, RefreshCcw, Bell, 
  ShieldCheck, CreditCard, LayoutDashboard, Globe, Layers,
  User as UserIcon, Copy, Sparkles, LogOut, Search, Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';
import api from '@/lib/api';
import Navbar from '../components/Navbar';
import WalletModal from '../components/modals/WalletModal';
import WithdrawalModal from '../components/modals/WithdrawalModal';
import SupportChatModal from '../components/modals/SupportChatModal';
import NeuralNotice from '../components/NeuralNotice';
import SafetyPinModal from './SafetyPinModal';
import WithdrawModal from './WithdrawModal';
import { io } from 'socket.io-client';

export default function DashboardPage() {
  const { user, token, setUser, setToken, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('home');
  const [history, setHistory] = useState([]);
  const [listings, setListings] = useState([]);
  const [config, setConfig] = useState<any>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notice, setNotice] = useState({ isOpen: false, title: '', message: '' });
  const [pinModal, setPinModal] = useState({ isOpen: false, targetId: null, type: 'claim' });
  const [isClaiming, setIsClaiming] = useState(false);
  
  const router = useRouter();

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    setIsSyncing(true);
    try {
      const [uResp, txResp, stocksResp, configResp] = await Promise.allSettled([
        api.get('/auth/profile'),
        api.get('/transactions/history'),
        api.get('/stocks'),
        api.get('/wallet/config')
      ]);

      if (uResp.status === 'fulfilled') setUser(uResp.value.data);
      if (txResp.status === 'fulfilled') setHistory(txResp.value.data || []);
      if (stocksResp.status === 'fulfilled') setListings(stocksResp.value.data.stocks || []);
      if (configResp.status === 'fulfilled') setConfig(configResp.value.data);
    } catch (err) {
      console.error('Handshake failed');
    } finally {
      setIsSyncing(false);
    }
  }, [token, setUser]);

  useEffect(() => {
    setIsHydrated(true);

    if (!token) {
      const stored = localStorage.getItem('hellopay-auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.state?.token) {
           setToken(parsed.state.token);
           setUser(parsed.state.user);
        } else {
           handleGuestOnboarding();
        }
      } else {
        handleGuestOnboarding();
      }
    } else {
      fetchDashboardData();
    }
    
    // 🛰️ Neural Telepathy Pulse: Socket.io Listener for Real-Time Admin Changes
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://hellopay-neural-api.onrender.com';
    const socket = io(apiBase);

    socket.on('configUpdated', (newConfig) => {
       console.log('[NEURAL] Admin Configuration Sync Received');
       setConfig(newConfig);
       setNotice({ isOpen: true, title: "System Synchronized", message: "Admin setting update detected. Your dashboard has been re-calibrated in real-time." });
    });

    socket.on('userStatusChanged', () => {
       console.log('[NEURAL] Identity Pulse Detected. Refreshing data...');
       fetchDashboardData();
    });

    return () => { socket.disconnect(); };
  }, [token, fetchDashboardData]);

  const handleGuestOnboarding = async () => {
    try {
      const { data } = await api.post('/auth/guest-login');
      localStorage.setItem('hellopay-auth-storage', JSON.stringify({
        state: { user: data, token: data.token, isAuthenticated: true },
        version: 0
      }));
      window.location.reload();
    } catch (err) {
      router.push('/login');
    }
  };

  const handleClaim = (stockId: string) => {
    setPinModal({ isOpen: true, targetId: stockId as any, type: 'claim' });
  };

  const processClaim = async (pin: string) => {
    if (!pinModal.targetId) return;
    setIsClaiming(true);
    try {
      await api.post(`/stocks/claim/${pinModal.targetId}`, { pin });
      setNotice({ isOpen: true, title: "Yield Claimed", message: "Neural verification successful. Assets have been rotated into your wallet." });
      fetchDashboardData();
    } catch (err: any) {
      setNotice({ isOpen: true, title: "Access Refused", message: err.response?.data?.message || "Invalid Safety PIN" });
    } finally {
      setIsClaiming(false);
      setPinModal({ ...pinModal, isOpen: false });
    }
  };

  if (!isHydrated) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-outfit pb-24 overflow-x-hidden">
      {/* Dynamic Header / Stat Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-xl">
               <Zap className="text-white fill-current" size={20} />
            </div>
            <h1 className="text-xl font-black italic tracking-tighter text-slate-900">HELLOPAY</h1>
         </div>
         <div className="flex items-center gap-4">
            <button onClick={() => fetchDashboardData()} className={`text-slate-400 hover:text-indigo-600 transition-all ${isSyncing ? 'animate-spin' : ''}`}>
               <RefreshCcw size={20} />
            </button>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
               <Bell size={18} className="text-slate-500" />
            </div>
         </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <HomeView 
            user={user} 
            history={history} 
            listings={listings} 
            config={config} 
            setActiveTab={setActiveTab}
            handleClaim={handleClaim}
            router={router}
            forceSync={fetchDashboardData}
            isSyncing={isSyncing}
            setNotice={setNotice}
          />
        )}
        {activeTab === 'wallet' && <WalletView user={user} config={config} setShowDepositModal={setShowDepositModal} setShowWithdrawModal={setShowWithdrawModal} />}
        {activeTab === 'history' && <HistoryView history={history} />}
        {activeTab === 'settings' && <SettingsView user={user} logout={logout} setNotice={setNotice} />}
      </AnimatePresence>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modals */}
      <WithdrawModal 
        isOpen={showWithdrawModal} 
        onClose={() => setShowWithdrawModal(false)} 
        user={user}
        config={config}
        onWithdraw={(newBalance: number) => {
           setUser({ ...user, walletBalance: newBalance } as any);
           fetchDashboardData();
        }}
      />
      
      <NeuralNotice 
        isOpen={notice.isOpen} 
        title={notice.title} 
        message={notice.message} 
        onClose={() => setNotice({ ...notice, isOpen: false })} 
      />

      <SafetyPinModal
        isOpen={pinModal.isOpen}
        onClose={() => setPinModal({ ...pinModal, isOpen: false })}
        onConfirm={processClaim}
        isLoading={isClaiming}
      />
    </div>
  );
}

// --- Home View ---
function HomeView({ user, history, listings, config, setActiveTab, handleClaim, router, forceSync, isSyncing, setNotice }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-6"
    >
      {/* 👑 PREMIUM IDENTITY HUB */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden border border-white/10">
         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
         <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -ml-5 -mb-5" />
         
         <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center p-1">
               <div className="w-full h-full bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                  <UserIcon size={40} fill="currentColor" />
               </div>
            </div>
            <div className="flex flex-col">
               <h2 className="text-3xl font-black text-white italic tracking-tight">{user?.name}</h2>
               <div className="flex items-center gap-3 mt-1">
                  <div 
                    onClick={() => {
                      if (user?.userIdNumber) {
                        navigator.clipboard.writeText(user.userIdNumber);
                        setNotice({ isOpen: true, title: "ID COPIED", message: "Your unique node signature has been saved to the clipboard." });
                      }
                    }}
                    className="flex items-center gap-2 bg-indigo-500/20 px-4 py-1.5 rounded-full border border-indigo-500/30 active:scale-95 transition-all cursor-pointer group"
                  >
                     <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">NODE-ID: {user?.userIdNumber || '000000'}</p>
                     <Copy size={12} className="text-indigo-400 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-1">
                     <ShieldCheck size={12} /> SECURED
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Balance Hub */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Neural Wallet Balance</p>
            <h3 className="text-5xl font-black text-slate-900 tracking-tighter mb-8">₹{user?.walletBalance?.toLocaleString('en-IN') || '0'}</h3>
            <div className="grid grid-cols-2 gap-4 w-full">
               <button onClick={() => setActiveTab('wallet')} className="py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all">DEPOSIT</button>
               <button onClick={() => setActiveTab('wallet')} className="py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-widest active:scale-95 transition-all">WITHDRAW</button>
            </div>
        </div>
      </div>

      {/* Active Listings */}
      <div className="space-y-4">
         <div className="flex justify-between items-center px-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Yield Operations</h4>
            <Sparkles size={16} className="text-indigo-500" />
         </div>

         {listings.length === 0 ? (
           <div className="p-10 rounded-[2.5rem] bg-white border border-dashed border-slate-200 text-center">
              <Layers className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-xs font-bold text-slate-400 italic">No neural assets detected in orbit.</p>
           </div>
         ) : (
           <div className="space-y-3">
             {listings.map((stock: any) => (
                <div key={stock._id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="text-indigo-600" size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset #{stock._id.slice(-6).toUpperCase()}</p>
                        <h5 className="text-lg font-black text-slate-900 tracking-tight">₹{stock.currentPrice}</h5>
                      </div>
                   </div>
                   <button 
                     disabled={!stock.isActive || isClaiming}
                     onClick={() => handleClaim(stock._id)}
                     className="px-8 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-30"
                   >
                     {stock.isActive ? 'CLAIM' : 'LOCKED'}
                   </button>
                </div>
             ))}
           </div>
         )}
      </div>
    </motion.div>
  );
}

// Placeholder views
function WalletView({ user, config, setShowDepositModal, setShowWithdrawModal }: any) { return <div className="p-4">Wallet Content (Legacy Sync)</div> }
function HistoryView({ history }: any) { return <div className="p-4">History Content (Legacy Sync)</div> }
function SettingsView({ user, logout, setNotice }: any) { 
  return (
    <div className="p-8 space-y-10">
       <div className="text-center">
          <h2 className="text-3xl font-black tracking-tighter italic">Identity Control</h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Node Management Protocol</p>
       </div>
       <div className="space-y-4">
          <button onClick={() => logout()} className="w-full py-6 bg-red-500/10 text-red-600 rounded-[2rem] border border-red-500/20 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group hover:bg-red-600 hover:text-white transition-all">
             <LogOut size={18} /> DE-AUTHORIZE SESSION
          </button>
       </div>
    </div>
  );
}
