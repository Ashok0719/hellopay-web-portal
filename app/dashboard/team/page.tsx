'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Copy, Share2, MessageCircle, MessageSquare, Send, Users, TrendingUp, DollarSign, Calendar, Search, ShieldCheck, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';
import api from '@/lib/api';

export default function TeamPage() {
  const router = useRouter();
  const { user, setUser }: any = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState({ isOpen: false, title: '', message: '' });

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/auth/referrals');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch referral analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const copyCode = () => {
    const code = stats?.referralCode || user?.referralCode;
    if (code) {
      navigator.clipboard.writeText(code);
      setNotice({
         isOpen: true,
         title: "Access Code Copied",
         message: "Your unique neural referral access code has been successfully bound to the clipboard."
      });
    }
  };

  const filteredReferrals = stats?.referralList?.filter((ref: any) => 
    ref.userIdNumber?.toString().includes(searchQuery) ||
    ref.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading && !stats) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Syncing Network...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans max-w-lg mx-auto shadow-2xl border-x border-slate-200">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-emerald-600 italic uppercase">Team Terminal</h1>
        <div className="w-10" />
      </header>

      <div className="p-4 space-y-6">
        {/* Total Commissions Card (Priority Telemetry) */}
        <div className="bg-emerald-600 rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 text-center mb-8">
            <h2 className="text-3xl font-black italic tabular-nums text-white">Total Commission Earned: ₹{(stats?.referralEarnings || 0).toLocaleString()}</h2>
            <div className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mt-2 opacity-60 italic">Real-Time Yield Synchronization</div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 relative z-10">
            <InsightCard label="Referrals" val={stats?.totalReferrals || 0} icon={<Users size={14}/>} />
            <InsightCard label="Active Nodes" val={stats?.activeUsersCount || 0} icon={<ShieldCheck size={14}/>} />
            <InsightCard label="Business Vol" val={`₹${stats?.totalBusinessVolume?.toLocaleString() || 0}`} icon={<TrendingUp size={14}/>} />
            <InsightCard label="Yield Signal" val="4.0%" icon={<DollarSign size={14}/>} />
          </div>
        </div>

        {/* Invitation & Code */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
           <div className="flex items-center justify-between">
              <div>
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Invitation Hub</h4>
                 <p className="text-lg font-black text-slate-800 tracking-tighter uppercase italic">{stats?.referralCode || user?.referralCode}</p>
              </div>
              <button onClick={copyCode} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center gap-2">
                 <Copy size={14} /> COPY
              </button>
           </div>
        </div>

        {/* Downline Registry Terminal (The List) */}
        <div className="space-y-4 pt-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2 font-mono">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 Neural Downline
              </h3>
              <div className="relative w-40">
                 <input 
                   type="text" 
                   placeholder="FILTER ID" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full bg-slate-100 border-none rounded-2xl py-2 pl-8 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                 />
                 <Search size={12} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
           </div>

           <div className="space-y-4">
              {filteredReferrals.length > 0 ? filteredReferrals.map((ref: any) => (
                <div key={ref._id} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 group hover:border-emerald-200 transition-all">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic text-xl ${ref.isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-400 opacity-50'}`}>
                            {ref.name?.[0]?.toUpperCase() || 'U'}
                         </div>
                         <div>
                            <h4 className="text-lg font-black text-slate-900 leading-none mb-1 italic">{ref.name}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ref.userIdNumber}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-lg font-black text-emerald-600 tabular-nums leading-none mb-1">₹{ref.commission?.toLocaleString()}</div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Commission Log</p>
                      </div>
                   </div>
                   
                    <div className="grid grid-cols-3 gap-3 mb-8 pt-6 border-t border-slate-50">
                       <MetricBox label="24H SIGNAL" val={`₹${ref.dailyDeposit || 0}`} active={ref.dailyDeposit > 0} />
                       <MetricBox label="WKLY YIELD" val={`₹${ref.weeklyDeposit || 0}`} active={ref.weeklyDeposit > 0} />
                       <MetricBox label="MNTHLY" val={`₹${ref.monthlyDeposit || 0}`} active={ref.monthlyDeposit > 0} />
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                       <div className="flex items-center gap-2 text-slate-400">
                          <Calendar size={12} className="opacity-40" />
                          <span className="text-[9px] font-black uppercase tracking-widest">ACTIVATED {new Date(ref.createdAt).toLocaleDateString()}</span>
                       </div>
                       <div className="text-right">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TOTAL VOLUME: </span>
                          <span className="text-[10px] font-black text-slate-900 tracking-tighter italic ml-1">₹{ref.totalDeposit?.toLocaleString() || '0'}</span>
                       </div>
                    </div>
                </div>
              )) : (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[40px]">
                   <Users className="text-slate-200 mx-auto mb-4" size={32} />
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">No Downline Signals Detected</p>
                </div>
              )}
           </div>
        </div>

        {/* Support Access Propagation */}
        <div className="bg-slate-900 rounded-[40px] p-8 shadow-2xl text-center relative overflow-hidden neo-card">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
           <h3 className="text-[10px] font-black mb-8 text-slate-500 uppercase tracking-[0.4em] italic leading-none">Signal Propagation Hub</h3>
           <div className="grid grid-cols-4 gap-4">
              <ShareIcon icon={<Send className="text-white fill-white" size={24}/>} label="Telegram" color="bg-blue-400" />
              <ShareIcon icon={<MessageSquare className="text-white fill-white" size={24}/>} label="Facebook" color="bg-blue-600" />
              <ShareIcon icon={<MessageCircle className="text-white fill-white" size={24}/>} label="Whatsapp" color="bg-green-500" />
              <ShareIcon icon={<Share2 className="text-white" size={24}/>} label="Copy Node" color="bg-gradient-to-br from-indigo-500 to-purple-600" />
           </div>
        </div>
      </div>

      <NeuralNotice 
         isOpen={notice.isOpen} 
         title={notice.title} 
         message={notice.message} 
         onClose={() => setNotice({ ...notice, isOpen: false })} 
      />
    </div>
  );
}

function InsightCard({ label, val, icon }: any) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center flex flex-col items-center">
      <div className="text-emerald-300 mb-1 opacity-60">{icon}</div>
      <span className="text-[8px] text-emerald-100 block uppercase font-black tracking-widest mb-1 opacity-50">{label}</span>
      <span className="text-lg font-black tabular-nums leading-none tracking-tighter text-white">{val}</span>
    </div>
  );
}

function NeuralNotice({ isOpen, title, message, onClose }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
       <motion.div 
         initial={{ scale: 0.9, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
       >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-6 shadow-inner">
             <AlertCircle size={48} className="drop-shadow-sm" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-4 italic">{title}</h3>
          <p className="text-sm font-bold text-slate-500 leading-relaxed mb-8">{message}</p>
          <button 
             onClick={onClose}
             className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all hover:bg-slate-800"
          >
             Understood Signal
          </button>
       </motion.div>
    </div>
  );
}

function MetricBox({ label, val, active }: any) {
  return (
    <div className={`p-4 rounded-2xl border ${active ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'} text-center transition-all`}>
       <span className={`text-[7px] font-black uppercase tracking-widest block mb-1 ${active ? 'text-emerald-500' : 'text-slate-400'}`}>{label}</span>
       <span className={`text-[11px] font-black tabular-nums tracking-tighter ${active ? 'text-emerald-700' : 'text-slate-600'}`}>{val}</span>
    </div>
  );
}

function ShareIcon({ icon, label, color }: any) {
  return (
    <div className="flex flex-col items-center gap-3 group cursor-pointer active:scale-95 transition-transform">
       <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-lg transition-all group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:-translate-y-1`}>
         {icon}
       </div>
       <span className="text-[8px] font-black uppercase text-slate-500 italic tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">{label}</span>
    </div>
  );
}
