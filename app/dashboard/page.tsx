'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SupportChatModal from './SupportChatModal';
import NeuralNotice from './NeuralNotice';
import jsQR from 'jsqr';
import {
  Wallet,
  Send,
  Plus,
  Smartphone,
  History,
  Settings,
  LogOut,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard, 
  Home, 
  User as UserIcon, 
  Zap, 
  HelpCircle,
  Star,
  ArrowRight, 
  ShieldCheck, 
  Trash2, 
  CheckCircle, 
  Lock, 
  RefreshCcw, 
  ChevronRight, 
  Camera,
  Users,
  TrendingUp,
  Search,
  Bell,
  Activity,
  Copy,
  LayoutGrid,
  Target,
  Users,
  MessageSquare,
  Bot,
  TrendingUp,
  CircleUser,
  ArrowUp,
  ArrowDown,
  Clock,
  Check,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/hooks/useAuth';
import api from '@/lib/api';
import { io } from 'socket.io-client';

export default function Dashboard() {
  const { user, setUser, logout, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('home');
  const [history, setHistory] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [referralStats, setReferralStats] = useState<any>({ totalReferrals: 0, referralList: [], referralEarnings: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [notice, setNotice] = useState({ isOpen: false, title: '', message: '' });
  const router = useRouter();

  // Initial data synchronization
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const { data: profile } = await api.get('/auth/profile');
        setUser(profile);

        const [txResp, stocksResp, configResp, refResp] = await Promise.allSettled([
          api.get('/transactions/history'),
          api.get('/stocks'),
          api.get('/wallet/config'),
          api.get('/auth/referrals')
        ]);

        if (txResp.status === 'fulfilled')     setHistory(txResp.value.data || []);
        if (stocksResp.status === 'fulfilled') setListings(stocksResp.value.data.stocks || []);
        if (configResp.status === 'fulfilled') setConfig(configResp.value.data);
        if (refResp.status === 'fulfilled')    setReferralStats(refResp.value.data);

      } catch (err) {
        logout();
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setUser, logout, router, token]);
  
  // Real-time Neural Synchronization (Socket.io)
  useEffect(() => {
    const socketUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || (window as any).Capacitor?.isNativePlatform())
      ? (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000')
      : 'https://api.hellopayapp.com';
    
    const socket = io(socketUrl);

    socket.on('configUpdated', (newConfig) => {
      console.log('Neural Signal: Config Updated', newConfig);
      setConfig(newConfig);
    });

    socket.on('userStatusChanged', (data) => {
      if (user && data.userId === user._id) {
        setUser({ 
          ...user, 
          isBlocked: data.isBlocked !== undefined ? data.isBlocked : user.isBlocked,
          walletBalance: data.walletBalance !== undefined ? data.walletBalance : user.walletBalance,
          totalDeposited: data.totalDeposited !== undefined ? data.totalDeposited : user.totalDeposited,
          totalWithdrawn: data.totalWithdrawn !== undefined ? data.totalWithdrawn : user.totalWithdrawn,
          rewardBalance: data.rewardBalance !== undefined ? data.rewardBalance : user.rewardBalance,
          totalRewards: data.totalRewards !== undefined ? data.totalRewards : user.totalRewards
        });
      }
    });

    socket.on('stock_update', async () => {
      try {
        const [stocksResp, profileResp] = await Promise.allSettled([
          api.get('/stocks'),
          api.get('/auth/profile')
        ]);
        if (stocksResp.status === 'fulfilled')  setListings(stocksResp.value.data.stocks || []);
        if (profileResp.status === 'fulfilled') setUser(profileResp.value.data);
      } catch (e) {
        console.error('Failed to sync after rotation', e);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, setUser]);

  const forceSync = async () => {
    setIsSyncing(true);
    try {

      const [profile, stocks, config, history] = await Promise.allSettled([
        api.get('/auth/profile'),
        api.get('/stocks'),
        api.get('/wallet/config'),
        api.get('/transactions/history')
      ]);
      if (profile.status === 'fulfilled')  setUser(profile.value.data);
      if (stocks.status === 'fulfilled')   setListings(stocks.value.data.stocks || []);
      if (config.status === 'fulfilled')   setConfig(config.value.data);
      if (history.status === 'fulfilled')  setHistory(history.value.data || []);
    } catch (err) {}
    setTimeout(() => setIsSyncing(false), 800);
  };

  const handleClaim = async (idOrAmount: string | number) => {
    // If system defaults bypass
    if (typeof idOrAmount === 'number' || (!idOrAmount.toString().match(/^[0-9a-fA-F]{24}$/) && !isNaN(Number(idOrAmount)))) {
      const amt = Number(idOrAmount);
      router.push(`/dashboard/pay?amount=${amt}&method=phonepe`);
      return;
    }

    try {
      // 1. Neural Select/Lock (1 Minute)
      const selectResp = await api.post('/stocks/select', { stockId: idOrAmount });
      if (!selectResp.data.success) {
        setNotice({
           isOpen: true,
           title: "Node Conflict",
           message: selectResp.data.message || 'This stock unit is currently being claimed by another user node.'
        });
        return;
      }

      // 2. Proceed to Buy
      const { data } = await api.post(`/stocks/buy`, { stockId: idOrAmount });
      if (data.success) {
        const { transaction, stock } = data;
        // Neural Link Generator: pa=UPI, pn=Recipient Name, am=Amount, cu=INR
        const recipientName = encodeURIComponent(stock.ownerId?.name || 'HelloPay Seller');
        const upiIntent = `upi://pay?pa=${stock.ownerId?.upiId || 'admin@upi'}&pn=${recipientName}&am=${transaction.amount}&cu=INR`;
        const sellerId = stock.ownerId?.userIdNumber || '******';
        router.push(`/dashboard/pay?orderId=${transaction.transactionId}&amount=${transaction.amount}&upiIntent=${encodeURIComponent(upiIntent)}&txnId=${transaction._id}&sellerId=${sellerId}`);
      }
    } catch (err: any) {
      setNotice({
         isOpen: true,
         title: "Registry Fault",
         message: err.response?.data?.message || 'The neural identity registry is busy. Failed to initiate claim.'
      });
    }
  };

  if (user?.isBlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
          <Lock className="text-red-500" size={48 } />
        </div>
        <h1 className="text-3xl font-black text-white mb-4 italic uppercase tracking-tighter">Account Locked</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-xs">
          Your neural node has been suspended by the administration. All transactions and asset access are currently frozen.
        </p>
        <button 
          onClick={() => { logout(); router.push('/login'); }}
          className="px-10 py-4 bg-white/5 border border-white/10 rounded-full text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          Logout of Node
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans max-w-lg mx-auto shadow-2xl overflow-hidden relative border-x border-slate-200">
      {/* Dynamic Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <HomeView 
            key="home" 
            user={user} 
            history={history} 
            listings={listings}
            openTeam={() => setShowTeamModal(true)}
            config={config}
            setActiveTab={setActiveTab}
            handleClaim={handleClaim}
            router={router}
            forceSync={forceSync}
            isSyncing={isSyncing}
            setNotice={setNotice}
          />
        )}
        {activeTab === 'statistics' && <StatisticsView key="stats" user={user} config={config} />}
        {activeTab === 'my' && <MyView key="my" user={user} setUser={setUser} logout={() => { logout(); router.push('/login'); }} referralStats={referralStats} setNotice={setNotice} setActiveTab={setActiveTab} router={router} />}
        {activeTab === 'payment' && <PaymentView key="payment" user={user} config={config} handleClaim={handleClaim} listings={listings} />}
        {activeTab === 'wallet' && (
          <WalletView 
            key="wallet" 
            user={user} 
            setUser={setUser} 
            setNotice={setNotice}
            onDeposit={() => setShowDepositModal(true)} 
          />
        )}
      </AnimatePresence>

      {/* Premium Right Side Support Terminal */}
      <div className="fixed bottom-24 right-4 z-[100] group">
        <motion.button 
          onClick={() => setShowSupportChat(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-16 h-16 bg-white rounded-full shadow-[0_12px_48px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center border border-emerald-50 overflow-hidden cursor-pointer active:scale-90 transition-all hover:shadow-emerald-200/50 hover:bg-emerald-50 relative"
        >
          <div className="bg-emerald-500 w-1.5 h-1.5 rounded-full absolute top-2 right-2 animate-ping" />
          <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
             <Bot size={28} />
          </div>
          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-1 uppercase">Support</span>
        </motion.button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-20 bg-white border-t border-slate-100 flex items-center justify-around px-2 z-50">
        <BottomNavItem 
          icon={<HomeIcon active={activeTab === 'home'} />} 
          label="Home" 
          active={activeTab === 'home'} 
          onClick={() => setActiveTab('home')} 
        />
        <BottomNavItem 
          icon={<CreditCard className={activeTab === 'payment' ? 'text-emerald-500' : 'text-slate-400'} size={24} />} 
          label="Payment" 
          active={activeTab === 'payment'} 
          onClick={() => setActiveTab('payment')} 
        />
        
        {/* Middle Wallet Button (Yellow Hub) */}
        <div className="relative -top-3">
          <button 
            onClick={() => setActiveTab('wallet')}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl shadow-yellow-100 border-4 border-slate-50 active:scale-95 hover:scale-105 transition-all ${activeTab === 'wallet' ? 'bg-[#eab308]' : 'bg-[#facc15]'}`}
          >
            <div className="p-2 bg-slate-900/10 rounded-xl">
               <Wallet className="text-slate-800" size={28} />
            </div>
          </button>
        </div>

        <DepositModal 
          isOpen={showDepositModal} 
          onClose={() => setShowDepositModal(false)}
          config={config}
          onSelect={(method: string, amt: string) => {
            router.push(`/dashboard/pay?amount=${amt}&method=${method}`);
            setShowDepositModal(false);
          }}
        />

        <BottomNavItem 
          icon={<Users className={activeTab === 'statistics' ? 'text-emerald-500' : 'text-slate-400'} size={24} />} 
          label="Statistics" 
          active={activeTab === 'statistics'} 
          onClick={() => setActiveTab('statistics')} 
        />
        <BottomNavItem 
          icon={<CircleUser className={activeTab === 'my' ? 'text-emerald-500' : 'text-slate-400'} size={24} />} 
          label="My" 
          active={activeTab === 'my'} 
          onClick={() => setActiveTab('my')} 
        />
      </nav>

      <SupportChatModal isOpen={showSupportChat} onClose={() => setShowSupportChat(false)} user={user} />
      <TeamModal isOpen={showTeamModal} onClose={() => setShowTeamModal(false)} user={user} referralStats={referralStats} />
      <NeuralNotice 
        isOpen={notice.isOpen} 
        title={notice.title} 
        message={notice.message} 
        onClose={() => setNotice({ ...notice, isOpen: false })} 
      />
    </div>
  );
}


// --- Home View ---
function HomeView({ user, history, listings, openTeam, config, setActiveTab, handleClaim, router, forceSync, isSyncing, setNotice }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-4"
    >
      {/* User Header */}
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-100 flex items-center justify-center text-slate-400">
             <UserIcon size={28} fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 leading-tight">{user?.name}</h2>
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-tighter">
              <span>{user?.phone}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <div 
                onClick={() => {
                   if (user?.userIdNumber) {
                      navigator.clipboard.writeText(user.userIdNumber);
                      setNotice({ isOpen: true, title: "Identity Copied", message: `Your unique Neural ID [${user.userIdNumber}] has been successfully bound to the clipboard.` });
                   }
                }}
                className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-700 transition-colors"
              >
                 <span className="text-emerald-600 font-black">ID: {user?.userIdNumber || '******'}</span>
                 <div className="w-4 h-4 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                    <Copy size={8} />
                 </div>
              </div>
              {user?.isSeller && (
                <Link href="/dashboard/seller" className="bg-emerald-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1 ml-2">
                  <ShieldCheck size={10} /> HelloPay Seller
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="relative p-2 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-all">
          <Bell size={22} className="text-slate-600" />
          <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </div>
      </div>

      {/* UPI Identity Verification Signal (PURGED) */}

      {/* Main Balance Card (Emerald Theme) */}
      <div className="relative overflow-hidden rounded-[40px] bg-slate-900 border border-white/5 p-8 text-white shadow-2xl mb-8 neo-card">
        {/* Futuristic Neural Overlay */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-col gap-10">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-6">
                     <div className="w-20 h-20 bg-indigo-600/20 rounded-[32px] flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
                        <Zap size={32} className="text-indigo-400 fill-indigo-400 animate-pulse" />
                     </div>
                     <div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 mb-2">Neural Asset Value</h2>
                        <div className="flex items-center gap-4">
                           <h1 className="text-6xl font-black italic tracking-tighter tabular-nums text-white">₹{(user?.walletBalance || 0).toLocaleString()}</h1>
                           <button 
                             onClick={forceSync}
                             className={`p-2 rounded-full hover:bg-white/10 transition-all ${isSyncing ? 'animate-spin opacity-100' : 'opacity-40'}`}
                           >
                             <RefreshCcw size={20} className="text-indigo-400" />
                           </button>
                        </div>
                     </div>
                  </div>
                  <button onClick={() => setActiveTab('payment')} className="w-16 h-16 bg-white text-slate-950 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all">
                     <Plus size={36} />
                  </button>
               </div>
          </div>
        </div>
      </div>

      {/* Stats Bar (Emerald-Dual Pane) */}
      <div className="bg-[#10b981] rounded-3xl p-4 mb-8 flex items-center justify-between text-white shadow-md relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] w-20 h-20 bg-yellow-400/30 rounded-full blur-xl pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-5%] w-16 h-16 bg-blue-400/20 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex-1 flex flex-col items-center gap-1 border-r border-white/20">
           <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-emerald-100 tracking-widest">
              <ArrowUp size={12} className="text-emerald-200" />
              Deposit
           </div>
           <div className="text-lg font-black tracking-tight">₹{(user?.totalDeposited || 0).toLocaleString()}</div>
        </div>
        
        <div className="flex-1 flex flex-col items-center gap-1">
           <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-emerald-100 tracking-widest">
              <ArrowDown size={12} className="text-red-300" />
              Withdrawal
           </div>
           <div className="text-lg font-black tracking-tight">
             ₹{((user?.totalWithdrawn || 0) + (user?.totalRewards || 0) + (user?.referralEarnings || 0)).toLocaleString()}
           </div>
        </div>
      </div>

      {/* Quick Action Grid (As per Screenshot) */}
      <div className="grid grid-cols-4 gap-4 mb-8 px-2">
        <QuickActionItem 
          icon={<img src="/icons-v2/deposit.png" className="w-14 h-14 object-contain shadow-sm" />} 
          label="Deposit" 
          onClick={() => setActiveTab('payment')}
        />
        <QuickActionItem 
          icon={<img src="/icons-v2/task.png" className="w-14 h-14 object-contain shadow-sm" />} 
          label="Task" 
          onClick={() => router.push('/dashboard/tasks')}
        />
        <QuickActionItem 
          icon={<img src="/icons-v2/team.png" className="w-14 h-14 object-contain shadow-sm" />} 
          label="Team" 
          onClick={openTeam}
        />
        <QuickActionItem 
          icon={<img src="/icons-v2/order.png" className="w-14 h-14 object-contain shadow-sm" />} 
          label="Order" 
          onClick={() => router.push('/dashboard/payment-history')}
        />
      </div>

      {/* Market Fragmentation Listing (Excludes Own Splits) */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4 px-2 mt-4 text-slate-400">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-emerald-500" />
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-800">Active Splits</h3>
          </div>
          <span onClick={() => setActiveTab('payment')} className="text-emerald-600 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:underline bg-emerald-50 px-3 py-1 rounded-full">Explore All</span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
          {(() => {
            // Neural Rule: DO NOT see own split units in marketplace, only available ones
            const otherAvailableSplits = (listings || []).filter(
              (l: any) => l.ownerId?._id !== user?._id && l.status === 'AVAILABLE'
            );

            const displayList = otherAvailableSplits.map((l: any) => ({
              _id: l._id,
              price: l.amount,
              name: `Available from ${l.ownerId?.name || 'User'}`,
              qty: 1
            }));

            return displayList.length > 0 ? displayList.map((plan: any, i: number) => (
              <div 
                key={i} 
                onClick={() => handleClaim(plan._id)}
                className="min-w-[160px] bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group cursor-pointer active:scale-95 transition-all"
              >
                <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/5 rounded-bl-3xl" />
                <div className="text-2xl font-black text-indigo-600 italic mb-2 leading-none">₹{plan.price}</div>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">{plan.name}</div>
                
                <div className="flex justify-between items-center">
                   <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                      <Zap size={14} className="text-white fill-white" />
                   </div>
                   <span className="text-[10px] font-black text-slate-300 uppercase">Qty: {plan.qty}</span>
                </div>
              </div>
            )) : (
               <div className="w-full h-24 bg-slate-50 border border-dashed border-slate-200 rounded-3xl flex items-center justify-center">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Scanning Marketplace...</p>
               </div>
            );
          })()}
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 min-h-[300px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">Transactions</h3>
          <span 
            onClick={() => router.push('/dashboard/payment-history')}
            className="text-emerald-600 text-[11px] font-black uppercase tracking-widest cursor-pointer hover:underline underline-offset-4 decoration-emerald-200"
          >
            See All
          </span>
        </div>

        <div className="space-y-6">
          {history.length > 0 ? history.filter((tx: any) => tx.category === 'Purchase').slice(0, 6).map((tx: any, i: number) => (
             <TransactionItem key={i} tx={tx} />
          )) : (
            <>
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <History size={48} className="mb-2 opacity-20" />
                <p className="text-sm font-medium">No transactions yet</p>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// --- Statistics View ---
function StatisticsView({ user, config }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-4"
    >
      <h2 className="text-2xl font-bold text-center text-[#10b981] mb-6">Statistics</h2>

      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          <h3 className="font-bold flex items-center gap-2">Statistics <span className="text-slate-400 text-sm font-normal">(25/03/2026)</span></h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatBox icon={<Wallet className="text-teal-500" size={16}/>} label="Balance" value={`₹ ${user?.walletBalance || '0'}`} color="bg-teal-600" />
          <StatBox icon={<RefreshCcw className="text-amber-500" size={16}/>} label="Reward" value={`₹ ${user?.rewardBalance || '0'}`} color="bg-amber-500" />
          <StatBox icon={<Target className="text-emerald-500" size={16}/>} label="Deposit" value={`₹ ${user?.totalDeposited || '0'}`} color="bg-emerald-600" />
          <StatBox icon={<Activity className="text-pink-500" size={16}/>} label="Total Rewards" value={`₹ ${user?.totalRewards || '0'}`} color="bg-pink-500" />
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          <h3 className="font-bold">Payment</h3>
        </div>

        <div className="bg-emerald-50 rounded-xl p-3 flex justify-between items-center mb-6">
          <span className="text-emerald-800 text-sm font-medium">Real Time Exchange Rates(INR/USDT)</span>
          <span className="text-emerald-800 font-bold">103</span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <MiniStatBox label="In Process Amount" value="₹ 0.00" />
          <MiniStatBox label="In Process Orders" value="0" />
          <MiniStatBox label="Commission Rate" value={`${user?.referralPercent || config?.globalCashbackPercent || 4}.00 %`} />
          <MiniStatBox label="Estimated Income" value="₹ 0.00" />
        </div>
      </div>

      <button className="w-full py-4 bg-emerald-600 text-white font-bold rounded-full shadow-lg shadow-emerald-200 active:scale-95 transition-transform mb-12">
        Closed Selling
      </button>
    </motion.div>
  );
}

function MyView({ user, setUser, logout, referralStats, setNotice, setActiveTab, setShowWalletHub, router }: any) {
  const [upiId, setUpiId] = useState(user?.upiId || user?.verifiedUpiId || '');
  const [pin, setPin] = useState(user?.pin || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { upiId, currentPin: pin });
      setUser({ ...user, upiId: data.upiId, verifiedUpiId: data.verifiedUpiId });
      
      setNotice({ isOpen: true, title: "Registry Updated", message: "Your neural registry profile has been successfully synchronized." });
    } catch (err: any) {
      setNotice({ isOpen: true, title: "Neural Link Error", message: err.response?.data?.message || "Failed to establish a secure link to save your profile." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-4"
    >
      <h2 className="text-2xl font-bold text-center text-[#10b981] mb-8">My Asset</h2>

      <div className="flex flex-col gap-4 mb-10">
        <div className="grid grid-cols-2 gap-4">
          <AssetCard icon={<CreditCard size={20}/>} label="Deposit" value={`₹ ${user?.totalDeposited || '0'}`} color="text-teal-500" />
          <AssetCard icon={<Wallet size={20}/>} label="Withdraw" value={`₹ ${user?.totalWithdrawn || '0'}`} color="text-emerald-500" />
        </div>
        <AssetCard icon={<RefreshCcw size={20}/>} label="Reward Balance" value={`₹ ${user?.rewardBalance || '0'}`} color="text-amber-500" />
      </div>

      <div className="bg-white rounded-[32px] p-10 shadow-sm border border-slate-100 grid grid-cols-3 gap-y-10 mb-10 relative">
        <MyGridItem 
          icon={<Wallet size={28}/>} 
          label="Wallet" 
          onClick={() => { setActiveTab('wallet'); }} 
        />
        <MyGridItem 
          icon={<Activity size={28}/>} 
          label="Integral" 
          onClick={() => router.push('/dashboard/payment-history')} 
        />
        <MyGridItem icon={<Smartphone size={28}/>} label="Service" href="/dashboard/service" />
        <MyGridItem icon={<MessageSquare size={28}/>} label="Message" href="/dashboard/message" />
        <MyGridItem icon={<Lock size={28}/>} label="Pin" href="/dashboard/pin" />
        
        <span className="absolute bottom-4 right-6 text-[10px] text-slate-300 font-mono">v1.1.4</span>
      </div>

      <button 
        onClick={logout}
        className="w-full py-4 bg-[#10b981] text-white font-bold rounded-full shadow-lg shadow-emerald-100 active:scale-95 transition-transform"
      >
        Logout
      </button>
    </motion.div>
  );
}

// --- Payment View (Virtual Split Marketplace) ---
// Shows ONLY other users' split units. Owner never sees own splits.
function PaymentView({ user, config, handleClaim, listings }: any) {
  const [activeFilter, setActiveFilter] = useState('All');

  // Filter out the current user's own splits for the Payment/Master marketplace
  const otherSplits = (listings || []).filter(
    (l: any) => l.ownerId?._id !== user?._id && l.status === 'AVAILABLE'
  );

  const filterRanges: Record<string, [number, number]> = {
    'All':        [0,     999999],
    '₹100-300':   [100,   300],
    '₹300-500':   [300,   500],
    '₹500-1K':    [500,   1000],
    '₹1K-3K':     [1000,  3000],
    '₹3K-6K':     [3000,  6000],
    '₹6K-10K':    [6000,  10000],
    '₹10K+':      [10000, 999999],
  };

  const filteredSplits = otherSplits.filter((l: any) => {
    const [min, max] = filterRanges[activeFilter] || [0, 999999];
    return l.amount >= min && l.amount <= max;
  });

  const profitRate = user?.profitPercent || config?.profitPercentage || 8;
  const myTradable = Math.floor((user?.walletBalance || 0) / 100) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="w-10" />
        <h2 className="text-2xl font-bold text-center text-emerald-600">Marketplace</h2>
        <Link href="/dashboard/payment-history" className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm">
          <Clock size={24} />
        </Link>
      </div>

      {/* Wallet Status Card */}
      <div className="bg-emerald-600 rounded-[28px] p-5 text-white shadow-xl mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <p className="text-emerald-100 text-xs font-medium mb-1">Your Wallet Balance</p>
          <div className="text-4xl font-black mb-1">₹{(user?.walletBalance || 0).toLocaleString()}</div>
          <p className="text-emerald-200 text-xs">
            ₹{myTradable.toLocaleString()} is virtually split &amp; listed for others · stays untouched until sold
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <p className="text-[10px] text-emerald-100">Profit Rate</p>
            <p className="font-black text-lg">{profitRate}%</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <p className="text-[10px] text-emerald-100">My Splits</p>
            <p className="font-black text-lg">{(listings || []).filter((l: any) => l.ownerId?._id === user?._id).length}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <p className="text-[10px] text-emerald-100">Live Deals</p>
            <p className="font-black text-lg">{otherSplits.length}</p>
          </div>
        </div>
      </div>

      {/* Virtual Split Info Banner */}
      <div className="flex items-start gap-3 text-[11px] text-emerald-700 font-semibold mb-4 px-3 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
        <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
        <p>Your wallet is <strong>never deducted during split</strong>. Money is only deducted from the seller when you confirm payment and the split unit is purchased.</p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
        {Object.keys(filterRanges).map(filter => {
          const [min, max] = filterRanges[filter];
          const count = otherSplits.filter((l: any) => l.amount >= min && l.amount <= max).length;
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-bold text-xs transition-all ${
                activeFilter === filter
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {filter} ({count})
            </button>
          );
        })}
      </div>

      {/* Split Unit Cards */}
      <div className="space-y-3 mb-24 mt-2">
        {filteredSplits.length > 0 ? filteredSplits.map((split: any, idx: number) => {
          const ownerFirstName = split.ownerId?.name?.split(' ')[0] || 'User';
          const profit         = Number((split.amount * profitRate / 100).toFixed(2));
          const totalReturn    = Number((split.amount + profit).toFixed(2));
          const isAvailable = split.status === 'AVAILABLE' || (split.status === 'LOCKED' && split.selectedBy?._id === user?._id);
          const isOtherLocked = split.status === 'LOCKED' && split.selectedBy?._id !== user?._id;

          return (
            <motion.div
              key={split._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`rounded-[22px] p-5 shadow-sm border flex justify-between items-center active:scale-[0.98] transition-all relative ${
                split.isPinned ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'
              } ${isOtherLocked ? 'opacity-60 grayscale' : ''}`}
            >
              {split.isPinned && (
                <div className="absolute -top-2 -right-2 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase shadow-lg flex items-center gap-1">
                  <Star size={8} fill="white" /> Priority
                </div>
              )}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-black ${split.isPinned ? 'text-amber-600' : 'text-emerald-600'}`}>₹{split.amount.toLocaleString()}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded-full tracking-wider">
                    Available from {split.ownerId?.name || 'User'} [Node {split.stockId.substring(split.stockId.length-4)}]
                  </span>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="text-slate-400">Profit: <span className="text-emerald-600 font-bold">+₹{profit}</span></span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-400">Net: <span className="text-slate-800 font-bold">₹{totalReturn.toLocaleString()}</span></span>
                </div>
                {isOtherLocked && (
                   <p className="text-[10px] font-bold text-red-500 italic mt-1">⚠️ Selected by {split.selectedBy?.name}</p>
                )}
              </div>
              <button
                onClick={() => handleClaim(split._id)}
                disabled={isOtherLocked}
                className={`px-5 py-2.5 text-white rounded-full text-sm font-bold shadow-lg active:scale-95 transition-all ${
                  isOtherLocked ? 'bg-slate-300 cursor-not-allowed shadow-none' : 
                  split.isPinned ? 'bg-amber-600 shadow-amber-100 hover:bg-amber-700' : 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700'
                }`}
              >
                {isOtherLocked ? 'LOCKED' : 'Buy'}
              </button>
            </motion.div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-4">
            <Target size={56} className="opacity-30" />
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">No splits available yet</p>
            <p className="text-xs text-center text-slate-400 max-w-xs">When other users have wallet balances, their virtual split units will appear here for you to buy.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// --- Sub-components ---

function QuickActionItem({ icon, label, onClick }: any) {
  return (
    <div onClick={onClick} className="flex flex-col items-center gap-2 cursor-pointer group active:scale-95 transition-all">
      <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-slate-50 flex items-center justify-center group-hover:shadow-md group-hover:-translate-y-0.5 transition-all">
         {icon}
      </div>
      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{label}</span>
    </div>
  );
}

function BottomNavItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 min-w-[60px]">
      <div className="relative">
        {icon}
      </div>
      <span className={`text-[11px] font-bold ${active ? 'text-emerald-500' : 'text-slate-400'}`}>{label}</span>
    </button>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <div className={`transition-colors ${active ? 'text-emerald-500' : 'text-slate-400'}`}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </div>
  );
}

function QuickServiceItem({ icon, label }: any) {
  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform">
      <div className="shadow-sm">
        {icon}
      </div>
      <span className="text-xs font-bold text-slate-600">{label}</span>
    </div>
  );
}

function TransactionItem({ tx }: any) {
  const router = useRouter();
  const isPurchase = tx.category === 'Purchase';
  const isPending = tx.status === 'PENDING';
  
  const handleResume = () => {
    if (isPurchase && isPending && tx.type === 'ROTATION') {
      const seller = tx.sellerId || tx.otherParty;
      const upiId = seller?.upiId || 'admin@upi';
      const sellerName = encodeURIComponent(seller?.name || 'HelloPay Seller');
      const upiIntent = `upi://pay?pa=${upiId}&pn=${sellerName}&am=${tx.amount}&cu=INR`;
      const sellerIdNum = seller?.userIdNumber || '******';
      router.push(`/dashboard/pay?orderId=${tx.transactionId}&amount=${tx.amount}&upiIntent=${encodeURIComponent(upiIntent)}&txnId=${tx._id}&sellerId=${sellerIdNum}`);
    }
  };

  return (
    <div 
      onClick={handleResume}
      className={`flex justify-between items-center group active:scale-[0.98] transition-all p-2 rounded-2xl hover:bg-slate-50 ${isPurchase && isPending ? 'cursor-pointer border-l-2 border-amber-400 pl-3' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl ${tx.direction === 'IN' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'} flex items-center justify-center shadow-sm`}>
           {tx.direction === 'IN' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
        </div>
        <div>
          <div className="font-black text-sm text-slate-800 uppercase tracking-tight">{tx.description || tx.type.replace('_', ' ') + ' INR'}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'Recent • Neural Sync'}
          </div>
        </div>
      </div>
      <div className="text-right flex flex-col items-end gap-1">
        <div className={`font-black tracking-tighter text-lg italic tabular-nums ${tx.direction === 'IN' ? 'text-emerald-600' : 'text-slate-900'}`}>
          {tx.direction === 'IN' ? '+' : '-'} ₹ {tx.amount.toLocaleString()}
        </div>
        <div className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
          tx.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 
          tx.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 
          tx.status === 'CANCELED' ? 'bg-red-50 text-red-500' : 
          'bg-slate-100 text-slate-400'
        }`}>
          {tx.status}
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, color }: any) {
  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg bg-white shadow-sm`}>
           {icon}
        </div>
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-black text-slate-800">{value}</div>
      <div className={`absolute top-0 right-0 w-12 h-12 ${color} opacity-[0.03] rounded-bl-full`} />
    </div>
  );
}

function MiniStatBox({ label, value }: any) {
  return (
    <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col items-center text-center shadow-sm">
      <div className="flex items-center gap-1 mb-2">
        <div className="w-4 h-4 rounded-full border border-amber-300 flex items-center justify-center">
          <span className="text-[8px] text-amber-500 font-bold">$</span>
        </div>
        <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">{label}</span>
      </div>
      <div className="font-bold text-slate-800">{value}</div>
    </div>
  );
}

function AssetCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{label}</span>
        <span className="text-sm font-black text-slate-800">{value}</span>
      </div>
    </div>
  );
}

function MyGridItem({ icon, label, href = '#', onClick }: any) {
  const content = (
    <div onClick={onClick} className="flex flex-col items-center gap-3 cursor-pointer group active:scale-95 transition-all w-full">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors shadow-sm">
        {icon}
      </div>
      <span className="text-xs font-bold text-slate-600 font-sans tracking-tight">{label}</span>
    </div>
  );

  if (onClick) return content;
  return <Link href={href} className="w-full">{content}</Link>;
}

function DepositModal({ isOpen, onClose, onSelect, config }: any) {
  const [selectedPlan, setSelectedPlan] = useState('100');
  const [selectedMethod, setSelectedMethod] = useState('');

  if (!isOpen) return null;

  const methods = [
    { id: 'freecharge', name: 'Freecharge', icon: 'https://img.icons8.com/color/48/freecharge.png', color: '#ff611d' },
    { id: 'phonepe', name: 'Phonepe', icon: 'https://img.icons8.com/color/48/phonepe.png', color: '#5f259f' },
    { id: 'mobikwik', name: 'Mobikwik', icon: 'https://img.icons8.com/color/48/mobikwik.png', color: '#0055a4' },
    { id: 'paytm', name: 'Paytm', icon: 'https://img.icons8.com/color/48/paytm.png', color: '#00baf2' },
    { id: 'paytm_business', name: 'Paytm Business', icon: 'https://img.icons8.com/color/48/paytm.png', color: '#00baf2' },
  ];

  const plans = config?.stockPlans || [
    { amount: 100 }, { amount: 200 }, { amount: 500 }, { amount: 1000 }, { amount: 2000 }
  ];

  const handleClose = () => {
    setSelectedMethod('');
    onClose();
  };

  const handleSure = () => {
    if (selectedMethod && selectedPlan) {
      onSelect(selectedMethod, selectedPlan);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }}
        className="w-full max-w-lg bg-white rounded-t-[40px] p-6 pb-12 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
           <h2 className="text-lg font-bold text-center w-full text-emerald-800">
             Choose <span className="text-emerald-600">payment</span>
           </h2>
           <button onClick={handleClose} className="p-2 -mr-2 text-slate-400 font-bold text-[10px] uppercase hover:text-red-500 transition-colors">Close</button>
        </div>

        <div className="space-y-6 overflow-y-auto no-scrollbar pr-1">
          {/* Enhanced Amount Selector */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {plans.map((p: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedPlan(p.amount.toString())}
                className={`px-6 py-2 rounded-xl font-black italic whitespace-nowrap transition-all border ${
                  selectedPlan === p.amount.toString() 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                  : 'bg-white text-slate-400 border-slate-100 hover:border-emerald-200'
                }`}
              >
                ₹{p.amount}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {methods.map(method => (
              <button 
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  selectedMethod === method.id 
                  ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                  : 'bg-white border-slate-100'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedMethod === method.id 
                  ? 'bg-emerald-600 border-emerald-600' 
                  : 'border-slate-200'
                }`}>
                  {selectedMethod === method.id && <Check size={14} className="text-white" />}
                </div>
                
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                   <img src={method.icon} alt={method.name} className="w-8 h-8 object-contain" />
                </div>
                
                <span className="text font-bold text-slate-800">{method.name}</span>
              </button>
            ))}
          </div>

          <div className="pt-6">
            <button 
              onClick={handleSure}
              disabled={!selectedMethod}
              className={`w-full py-4 rounded-full text-white font-black text-xl shadow-lg transition-all active:scale-95 ${
                selectedMethod ? 'bg-[#108967] hover:bg-[#0a664c]' : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              Sure
            </button>
          </div>

          <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed pt-4 opacity-50">
            Security Node Active<br/>Transaction Binding to Neural Signature
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function WalletView({ user, setUser, onDeposit, setNotice }: any) {
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [pin, setPin] = useState('');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleSaveUpi = async () => {
    if (!upiId || !pin) return setNotice({ 
       isOpen: true, 
       title: "Authorization Required", 
       message: "A 4-digit Security PIN and a valid UPI ID are required to bind your node."
    });
    
    setIsSaving(true);
    const formData = new FormData();
    formData.append('upiId', upiId);
    formData.append('pin', pin);
    formData.append('currentPin', pin);
    if (qrFile) formData.append('qrCode', qrFile);

    try {
      const { data } = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser({ ...user, ...data });
      setNotice({
         isOpen: true,
         title: "Protocol Synced",
         message: "Your neural wallet and visual payment signals have been successfully bound to the rotation engine."
      });
    } catch (err: any) {
      setNotice({
         isOpen: true,
         title: "Sync Failure",
         message: err.response?.data?.message || "The neural link could not be established. Please check your signal."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          setQrFile(file);
        } else {
          setNotice({
             isOpen: true,
             title: "Neural Guard Alert",
             message: "The uploaded image does not contain a valid QR code signal. Please upload a clear QR scanner photo to prevent rotation failure."
          });
          e.target.value = ''; 
          setQrFile(null);
        }
        setIsScanning(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const [verificationState, setVerificationState] = useState<'idle' | 'opening' | 'waiting' | 'success' | 'failed' | 'suspicious'>('idle');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // STEP 1: STRICT REGEX & VALIDATION
  const upiRegex = /^(?!.*\.\.)(?!.*__)(?!.*\.-)(?!.*-\.)[a-z0-9]+([._-]?[a-z0-9]+)*@[a-z]{2,}$/;
  const validHandles = ['okaxis', 'oksbi', 'okhdfcbank', 'okicici', 'ybl', 'ibl', 'axl', 'apl', 'paytm', 'upi'];
  
  const validateUpi = (id: string) => {
    if (!upiRegex.test(id)) return false;
    const [user, handle] = id.split('@');
    if (user.length < 5) return false;
    if (!/\d/.test(user)) return false; // Must contain at least 1 number
    if (!validHandles.includes(handle)) return false;
    return true;
  };

  const isUpiValid = validateUpi(upiId);

  // STEP 3 & 4: APP VERIFICATION FLOW
  const handleVerifyIntent = () => {
    if (!isUpiValid) return;
    
    setVerificationState('opening');
    localStorage.setItem("upi_verify_start", Date.now().toString());
    
    const upiLink = `upi://pay?pa=${upiId}&pn=Verify&am=1&cu=INR`;
    
    // Auto detect return (Step 4)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const startTime = parseInt(localStorage.getItem("upi_verify_start") || "0");
        const duration = (Date.now() - startTime) / 1000;
        
        localStorage.removeItem("upi_verify_start");
        document.removeEventListener("visibilitychange", handleVisibilityChange);

        // STEP 6: SMART LOGIC
        if (duration < 3) {
           setVerificationState('failed');
        } else if (duration >= 5 && duration <= 35) {
           setVerificationState('waiting');
           setShowConfirmModal(true);
        } else {
           setVerificationState('idle');
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.location.href = upiLink;
  };

  const confirmVerification = async (confirmed: boolean) => {
    setShowConfirmModal(false);
    if (!confirmed) {
      setVerificationState('failed');
      return;
    }

    // STEP 7: BACKEND SAVE
    setVerificationState('success');
    setIsSaving(true);
    try {
      const { data } = await api.post('/stocks/save-upi', { upiId, pin });
      if (data.success) {
        setNotice({
          isOpen: true,
          title: "Neural Sync Valid ✅",
          message: "UPI Identity verified via Deep Link Matrix. Registry successfully updated.",
          type: 'alert',
          onConfirm: () => {}
        });
      }
    } catch (err: any) {
      setVerificationState('failed');
      setNotice({
        isOpen: true,
        title: "Protocol Fault",
        message: err.response?.data?.message || "Registry update failed",
        type: 'alert',
        onConfirm: () => {}
      });
    } finally {
      setIsSaving(false);
    }
  };

  const myTradable = Math.floor((user?.walletBalance || 0) / 100) * 100;
  const numUnits = myTradable / 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-4"
    >
      <h2 className="text-2xl font-bold text-center text-emerald-600 mb-6 uppercase italic tracking-tighter">Wallet Hub</h2>

      <div className="bg-slate-900 rounded-[32px] p-8 text-white mb-6 relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Neural Asset Value</p>
         <h3 className="text-6xl font-black italic tracking-tighter mb-6 underline decoration-yellow-500/30 underline-offset-8">₹{(user?.walletBalance || 0).toLocaleString()}</h3>
         
         <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
            <div className="flex justify-between items-center text-[11px] font-black uppercase text-slate-400 mb-2">
               <span>Virtual Split Strategy</span>
               <span className="text-yellow-500 font-bold">1 Unit = ₹100</span>
            </div>
            <p className="text-xs font-bold text-slate-300 leading-relaxed italic">
              You have <span className="text-yellow-400">{numUnits}</span> units listed. Registry status: <span className="text-emerald-400">{user?.isUpiVerified ? 'VERIFIED' : 'PENDING'}</span>
            </p>
         </div>
      </div>

      <div className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm space-y-8 mb-4 relative overflow-hidden">
         {/* STEP 9: UI STATES LIGHTS */}
         {verificationState !== 'idle' && (
           <div className="absolute top-4 right-8 flex items-center gap-2">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{verificationState}...</span>
              <div className={`w-2 h-2 rounded-full animate-pulse ${verificationState === 'success' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
           </div>
         )}

         <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-4 ml-1 flex justify-between">
              Receiving UPI ID
              {upiId && (
                <span className={`text-[9px] ${isUpiValid ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isUpiValid ? 'VALID FORMAT ✅' : 'INVALID UPI ❌'}
                </span>
              )}
            </label>
            <div className="relative">
              <input 
                 value={upiId}
                 onChange={(e) => setUpiId(e.target.value.toLowerCase().trim())}
                 className={`w-full px-8 py-5 rounded-3xl text-sm font-bold transition-all border ${isUpiValid ? 'bg-emerald-50/20 border-emerald-100 focus:outline-emerald-500' : 'bg-slate-50 border-slate-100 focus:outline-yellow-500'}`} 
                 placeholder="name123@upi"
              />
            </div>
            {!isUpiValid && upiId && (
              <p className="text-[8px] font-black text-red-400 mt-3 ml-2 uppercase tracking-widest leading-relaxed">
                Min 5 chars, 1 number, handle: axis/sbi/hdfc/icici/upi/paytm/ybl/ibl/axl/apl
              </p>
            )}
         </div>
         
         <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-4 ml-1">Security PIN</label>
            <input 
               type="password"
               maxLength={4}
               value={pin}
               onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
               className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:outline-yellow-500 bg-white" 
               placeholder="****"
            />
         </div>

         <div className="flex flex-col gap-4">
            <button 
               onClick={handleVerifyIntent}
               disabled={!isUpiValid || verificationState === 'opening'}
               className="w-full py-6 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-3xl shadow-xl active:scale-95 transition-all text-xs flex items-center justify-center gap-3 disabled:opacity-20 translate-y-2"
            >
               <Zap size={18} className="fill-yellow-400 text-yellow-400" /> Verify with UPI App
            </button>

            <button 
               onClick={handleSaveUpi}
               disabled={isSaving || !user?.isUpiVerified && verificationState !== 'success'}
               className="w-full py-5 bg-yellow-400 text-slate-900 font-black uppercase tracking-[0.2em] rounded-3xl shadow-xl shadow-yellow-100 active:scale-95 transition-all text-[11px] mt-4 hover:bg-yellow-500 disabled:grayscale"
            >
               {isSaving ? 'Synchronizing...' : 'Save & Sync Registry'}
            </button>
         </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
           <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl border border-slate-100 italic">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-8 shadow-inner"><HelpCircle size={40} /></div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 mb-4 italic">Confirmation Portal</h3>
              <p className="text-sm font-bold text-slate-500 leading-relaxed mb-10 italic">Did you see the <span className="text-emerald-600">Account Holder Name</span> and <span className="text-slate-800 underline">₹1 verification signal</span> in your UPI app?</p>
              
              <div className="flex flex-col gap-4">
                 <button onClick={() => confirmVerification(true)} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Yes, Verified ✅</button>
                 <button onClick={() => confirmVerification(false)} className="w-full py-4 bg-white text-slate-400 rounded-[24px] font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all underline decoration-slate-200 uppercase">Abort Protocol</button>
              </div>
           </motion.div>
        </div>
      )}

      <p className="text-[9px] text-center text-slate-300 font-bold uppercase tracking-[0.4em] py-10">Neural Rotation Protocol Active v3.2</p>
    </motion.div>
  );
}


function TeamModal({ isOpen, onClose, user, referralStats }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }}
        className="w-full max-w-lg bg-white rounded-t-[40px] p-6 shadow-3xl relative overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
           <h2 className="text-lg font-bold text-center w-full text-slate-800">Team <span className="text-indigo-500">Hub</span></h2>
           <button onClick={onClose} className="px-4 py-2 -mr-2 text-slate-400 font-bold text-[10px] uppercase bg-slate-50 rounded-xl">Close</button>
        </div>

        <div className="overflow-y-auto no-scrollbar pr-1 pb-6">
           <div className="bg-slate-900 border border-white/5 rounded-[40px] p-8 text-white shadow-2xl mb-8 overflow-hidden relative neo-card">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-1">Referral Hub</h3>
                    <p className="text-xl font-bold italic">Node Network</p>
                 </div>
                 <div className="px-5 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-[10px] font-black tracking-widest text-indigo-400">STATUS: ACTIVE</div>
              </div>

              <div className="flex flex-col gap-8 mb-10">
                 <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-3 opacity-50">Share Neural Access Code</label>
                    <div className="flex gap-4">
                       <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 flex items-center justify-between group hover:border-indigo-500/50 transition-all">
                          <span className="text-2xl font-black italic tracking-tighter text-indigo-400">{user?.referralCode}</span>
                          <button onClick={() => { navigator.clipboard.writeText(user?.referralCode); alert('Neural Access Code Copied'); }} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><Copy size={16} /></button>
                       </div>
                    </div>
                 </div>

                 {/* Neural Stat Registry */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-[32px]">
                       <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/20"><Users size={24} className="text-indigo-400" /></div>
                       <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Nodes</p>
                          <p className="text-xl font-black italic text-white">{referralStats.totalReferrals}</p>
                       </div>
                    </div>
                    <div className="flex flex-col items-end justify-center p-5 bg-white/5 border border-white/10 rounded-[32px]">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Business Volume</p>
                        <p className="text-xl font-black italic text-indigo-400">₹{(referralStats.totalBusinessVolume || 0).toLocaleString()}</p>
                    </div>
                 </div>

                 {/* Yield Liquidation Vault */}
                 <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[32px] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <TrendingUp size={20} className="text-emerald-500" />
                       <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Neural Yield Earned</p>
                          <p className="text-2xl font-black italic text-emerald-400">₹{referralStats.referralEarnings}</p>
                        </div>
                    </div>
                    <div className="px-5 py-2 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl text-[9px] font-black tracking-widest text-emerald-400">SETTLED</div>
                 </div>

                 {user?.totalDeposited < 100 && user?.referralBonusAmount > 0 && (
                    <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-[28px] flex items-start gap-4">
                       <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                          <Zap size={20} className="text-emerald-500 animate-pulse" />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest leading-none">Protocol Activation Lock</p>
                          <p className="text-[11px] font-bold text-white/40 leading-tight italic">₹100 Sign-up Bonus is active but locked. Deposit ₹100+ to sync it with your stock units.</p>
                       </div>
                    </div>
                 )}
              </div>

              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 px-2">Sub-Nodes Terminal</h4>
                 <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-3 px-2 pb-4">
                    {referralStats.referralList.length > 0 ? referralStats.referralList.map((ref: any, idx: number) => (
                       <div key={idx} className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-indigo-600/10 rounded-full flex items-center justify-center border border-indigo-500/20 font-black text-[10px] text-indigo-400">{ref.name[0]}</div>
                             <div>
                                <p className="text-sm font-bold text-white">{ref.name}</p>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Activated: {new Date(ref.createdAt).toLocaleDateString()}</p>
                             </div>
                          </div>
                          <span className="text-xs font-black italic text-emerald-400">+₹{(ref.commission || 0).toLocaleString()} Yield</span>
                       </div>
                    )) : (
                       <div className="text-center py-10 text-[10px] font-black uppercase tracking-widest text-slate-700 italic">No nodes detected in your mesh</div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
