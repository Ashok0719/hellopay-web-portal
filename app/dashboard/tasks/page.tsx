'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Zap, Trophy, Clock, CheckCircle2, TrendingUp, Calendar, Target, Sparkles, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import NeuralNotice from '@/components/NeuralNotice';

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [notice, setNotice] = useState({ isOpen: false, title: '', message: '' });

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (err) {
      console.error('Failed to sync task telemetry', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleClaim = async (type: string) => {
    try {
      const { data } = await api.post(`/tasks/claim/${type}`);
      setNotice({ isOpen: true, title: "Neural Credit Sync", message: data.message });
      fetchTasks();
    } catch (err: any) {
      setNotice({ isOpen: true, title: "Access Denied", message: err.response?.data?.message || "Signal strength insufficient for claim." });
    }
  };

  if (loading) return (
     <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
     </div>
  );

  const currentTask = tasks?.[activeTab];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans max-w-lg mx-auto shadow-2xl border-x border-slate-200">
      {/* Premium Header */}
      <header className="p-6 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-emerald-600 italic uppercase tracking-tighter">Yield Terminal</h1>
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
           <Trophy size={20} />
        </div>
      </header>

      <div className="p-6 space-y-8">
        {/* Cycle Tabs */}
        <div className="bg-white p-2 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-between gap-1">
           {(['daily', 'weekly', 'monthly'] as const).map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab}
              </button>
           ))}
        </div>

        {/* Task Card Container */}
        <AnimatePresence mode="wait">
           <motion.div 
             key={activeTab}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             className="space-y-6"
           >
              {/* Goal Status Card */}
              <div className="bg-slate-900 rounded-[44px] p-10 text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-colors" />
                 <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                             {activeTab === 'daily' && <Zap size={24} className="text-emerald-400" />}
                             {activeTab === 'weekly' && <TrendingUp size={24} className="text-emerald-400" />}
                             {activeTab === 'monthly' && <Calendar size={24} className="text-emerald-400" />}
                          </div>
                          <div>
                             <h2 className="text-xl font-bold italic tracking-tight">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Challenge</h2>
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target: ₹{currentTask?.goal.toLocaleString()}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">REWARD</p>
                          <p className="text-2xl font-black text-yellow-400 italic">₹{currentTask?.reward}</p>
                       </div>
                    </div>

                    <div className="space-y-4 mb-8">
                       <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span>PROGRESS SIGNAL</span>
                          <span className={currentTask?.current >= currentTask?.goal ? 'text-emerald-400' : ''}>
                             ₹{currentTask?.current.toLocaleString()} / ₹{currentTask?.goal.toLocaleString()}
                          </span>
                       </div>
                       <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (currentTask?.current / currentTask?.goal) * 100)}%` }}
                            className={`h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-lg shadow-emerald-500/20`}
                          />
                       </div>
                    </div>

                    <button 
                      onClick={() => handleClaim(activeTab)}
                      disabled={currentTask?.claimed || currentTask?.current < currentTask?.goal}
                      className={`w-full py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl transition-all flex items-center justify-center gap-3 ${
                        currentTask?.claimed 
                          ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5' 
                          : currentTask?.current >= currentTask?.goal 
                             ? 'bg-white text-slate-900 active:scale-95 group-hover:shadow-emerald-500/20' 
                             : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5'
                      }`}
                    >
                       {currentTask?.claimed ? (
                          <>CLAIMED <CheckCircle2 size={16} /></>
                       ) : currentTask?.current >= currentTask?.goal ? (
                          <>REDEEM YIELD <Target size={16} /></>
                       ) : (
                          <>TARGET NOT REACHED <Clock size={16} /></>
                       )}
                    </button>
                 </div>
              </div>

              {/* Task Details Info */}
              <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                       <Target size={24} />
                    </div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">Challenge Protocol</h3>
                 </div>
                 
                 <div className="space-y-6">
                    <TaskTip 
                      title="Requirement" 
                      desc={
                        activeTab === 'daily' ? "Deposit exactly ₹5000 in a single cycle (24h) to activate the 100 credit signal." : 
                        activeTab === 'weekly' ? "Accumulate ₹15,000+ in deposit signals within the current week to unlock 500 bonus." : 
                        "Maintain a monthly rotation volume of ₹50,000 to redeem the 1,000 network yield."
                      } 
                    />
                    <TaskTip 
                      title="Reset Cycle" 
                      desc={
                        activeTab === 'daily' ? "This task resets every 24 hours at 00:00. Claims must be processed before the next signal reset." : 
                        activeTab === 'weekly' ? "Weekly counters reset every Monday at 00:00. Ensure all requirements are met by Sunday EOD." : 
                        "Monthly telemetry resets on the 1st of every month."
                      } 
                    />
                 </div>
              </div>
           </motion.div>
        </AnimatePresence>

        {/* Footnote */}
        <div className="text-center pt-8">
           <div className="inline-flex items-center gap-2 px-6 py-2 bg-slate-100 rounded-full text-slate-400 mb-4">
              <ShieldCheck size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Neural Reward Protocol Active</span>
           </div>
           <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.4em]">© 2026 HELLOPAY NEURAL SYSTEMS</p>
        </div>
      </div>

      <NeuralNotice 
        isOpen={notice.isOpen} 
        onClose={() => setNotice({ ...notice, isOpen: false })} 
        title={notice.title} 
        message={notice.message} 
      />
    </div>
  );
}

function TaskTip({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="space-y-2">
       <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1 h-1 bg-emerald-500 rounded-full" />
          {title}
       </div>
       <div className="text-xs font-bold text-slate-500 leading-relaxed pl-3 border-l border-slate-100">{desc}</div>
    </div>
  );
}
