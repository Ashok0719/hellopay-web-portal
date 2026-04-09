'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  ArrowLeft, 
  Copy, 
  Check, 
  TrendingUp, 
  Wallet, 
  Activity, 
  Zap,
  ChevronRight,
  Share2,
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function TeamPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/auth/referrals');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch referral node stats');
    } finally {
      setLoading(false);
    }
  };

  const copyRefLink = () => {
    if (!stats?.referralCode) return;
    const refLink = `${window.location.origin}/register?ref=${stats.referralCode}`;
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-24">
      <Navbar />
      
      <main className="max-w-2xl mx-auto px-6 pt-24">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Team Hub</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
               <Activity size={12} className="text-indigo-400" />
               Neural Network Protocol
            </p>
          </div>
          <Link href="/dashboard" className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} className="text-slate-400" />
          </Link>
        </div>

        {/* Unique Referral Link Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-indigo-600 rounded-[40px] p-8 mb-8 relative overflow-hidden shadow-2xl shadow-indigo-600/20"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Zap size={120} className="fill-white" />
          </div>
          
          <div className="relative z-10">
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-4">Your Unique Access Link</p>
            <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md rounded-2xl p-4 mb-6 border border-white/10">
              <input 
                readOnly 
                className="bg-transparent border-none outline-none text-xs font-black truncate flex-1 tracking-wider"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${stats?.referralCode}`}
              />
              <button 
                onClick={copyRefLink}
                className="p-2 bg-white text-indigo-600 rounded-xl hover:scale-105 active:scale-95 transition-all"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <div className="flex items-center gap-4">
                <div className="bg-indigo-500 rounded-2xl py-2 px-4 border border-white/10">
                   <span className="text-[10px] font-black uppercase tracking-widest">Code: {stats?.referralCode}</span>
                </div>
                <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest">
                   Earn {stats?.commRate || 4}% Comm + ₹{stats?.referralBonus || 100} Bonus
                </p>
             </div>
           </div>
         </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-6 backdrop-blur-xl">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                 <Users className="text-blue-500" size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Nodes</p>
              <h3 className="text-3xl font-black italic">{stats?.totalReferrals || 0}</h3>
           </div>
           <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-6 backdrop-blur-xl">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                 <TrendingUp className="text-emerald-500" size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Volume</p>
              <h3 className="text-3xl font-black italic">₹{stats?.totalBusinessVolume || 0}</h3>
           </div>
        </div>

        {/* Earnings Card */}
        <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 mb-10 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/20 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Wallet className="text-indigo-400" size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Commision Earned</p>
                  <h3 className="text-4xl font-black italic text-indigo-400">₹{stats?.referralEarnings || 0}</h3>
                </div>
            </div>
            <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
               <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">Settled</span>
            </div>
          </div>
          <div className="h-px w-full bg-white/5 mb-6" />
          <div className="flex items-center justify-between">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Sub-Nodes</p>
             <p className="text-xs font-black text-white">{stats?.activeUsersCount || 0}</p>
          </div>
        </div>

        {/* Network List */}
        <div className="mb-10">
           <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-xl font-black uppercase tracking-tighter italic">Network Terminal</h2>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sorted by Date</span>
           </div>

           <div className="space-y-4">
              {stats?.referralList?.length > 0 ? stats.referralList.map((node: any, i: number) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={node._id} 
                  className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 p-5 rounded-3xl flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center font-black text-slate-600 text-xs border border-white/5">
                       {node.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight">{node.name}</h4>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{node.userIdNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-indigo-400 italic font-mono">+₹{node.commission}</p>
                    <div className="flex items-center gap-1 justify-end opacity-50">
                       <Activity size={8} />
                       <span className="text-[8px] font-bold uppercase tracking-widest">
                         {new Date(node.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-20 bg-white/[0.02] rounded-[40px] border border-dashed border-white/10">
                   <Trophy className="mx-auto text-slate-800 mb-4" size={48} />
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No nodes detected in your mesh</p>
                </div>
              )}
           </div>
        </div>
      </main>

      {/* Floating Share Button */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={copyRefLink}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 px-10 py-5 bg-white text-black font-black rounded-full shadow-2xl flex items-center gap-4 z-50 text-xs uppercase tracking-widest"
      >
        <Share2 size={18} />
        {copied ? 'Link Copied!' : 'Recruit New Nodes'}
      </motion.button>
    </div>
  );
}
