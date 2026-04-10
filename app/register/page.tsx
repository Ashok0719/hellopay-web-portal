'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Mail, Lock, User, ShieldCheck, Fingerprint, HandCoins, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/hooks/useAuth';
import api from '@/lib/api';
import NeuralBackground from '../../components/NeuralBackground';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    pin: ['', '', '', ''],
    confirmPin: ['', '', '', ''],
    referralCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const pinRefs = useRef<Array<HTMLInputElement | null>>([]);
  const confirmPinRefs = useRef<Array<HTMLInputElement | null>>([]);
  const { setToken, setUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const handlePinChange = (idx: number, val: string, type: 'pin' | 'confirm') => {
    if (!/^\d*$/.test(val)) return;
    const newPin = [...(type === 'pin' ? formData.pin : formData.confirmPin)];
    newPin[idx] = val.slice(-1);
    
    if (type === 'pin') {
      setFormData({ ...formData, pin: newPin });
      if (val && idx < 3) pinRefs.current[idx + 1]?.focus();
    } else {
      setFormData({ ...formData, confirmPin: newPin });
      if (val && idx < 3) confirmPinRefs.current[idx + 1]?.focus();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinString = formData.pin.join('');
    const confirmPinString = formData.confirmPin.join('');
    
    if (pinString !== confirmPinString) return setError('Safety PINs do not match');
    if (pinString.length < 4) return setError('Complete your 4-Digit Safety PIN');
    
    setLoading(true);
    setError('');
    
    try {
      const { data } = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        pin: pinString,
        referralCode: formData.referralCode
      });
      
      localStorage.setItem('hellopay-auth-storage', JSON.stringify({
        state: { user: data, token: data.token, isAuthenticated: true },
        version: 0
      }));
      setToken(data.token);
      setUser(data);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Neural Link Error: Registry Denied');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 py-20 overflow-hidden bg-[#020617] font-outfit selection:bg-indigo-500 selection:text-white">
      <NeuralBackground />
      
      {/* Background Glows */}
      <div className="absolute top-[10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-[10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/10 rounded-full blur-[150px] animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[4rem] p-12 border border-white/5 shadow-2xl relative overflow-hidden group">
          
          <div className="text-center mb-12">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6"
            >
              <Fingerprint className="text-white" size={32} />
            </motion.div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              Initialize <span className="text-emerald-500">Node</span>
            </h1>
            <p className="text-slate-500 text-[9px] uppercase tracking-[0.6em] mt-3 font-bold">Registry Initialization Protocol</p>
          </div>

          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Column 1: Core Identity */}
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">Full Identity Name</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={16} />
                    <input 
                      type="text" required placeholder="User Alpha"
                      className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white text-sm outline-none focus:border-emerald-500/50 transition-all font-bold placeholder:text-slate-800"
                      value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">Neural Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={16} />
                    <input 
                      type="email" required placeholder="name@matrix.com"
                      className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white text-sm outline-none focus:border-emerald-500/50 transition-all font-bold placeholder:text-slate-800"
                      value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">Master Passkey</label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={16} />
                    <input 
                      type="password" required placeholder="••••••••"
                      className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white text-sm outline-none focus:border-emerald-500/50 transition-all font-bold"
                      value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">VIP Invite Code</label>
                  <div className="relative group">
                    <HandCoins className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={16} />
                    <input 
                      type="text" placeholder="OPTIONAL"
                      className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold uppercase placeholder:text-slate-800"
                      value={formData.referralCode} onChange={(e) => setFormData({...formData, referralCode: e.target.value.toUpperCase()})}
                    />
                  </div>
               </div>
            </div>

            {/* Column 2: Safety Protocol (PINs) */}
            <div className="space-y-8 bg-black/20 rounded-3xl p-6 border border-white/5">
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Define Safety PIN</label>
                     <ShieldCheck className="text-emerald-500" size={14} />
                   </div>
                   <div className="flex gap-3 justify-between">
                      {formData.pin.map((digit, idx) => (
                        <input
                          key={idx} ref={(el) => { pinRefs.current[idx] = el; }}
                          type="password" maxLength={1} inputMode="numeric" required
                          className="w-full h-12 bg-slate-950 border border-white/5 rounded-xl text-center text-white font-black text-xl outline-none focus:border-emerald-500 transition-all"
                          value={digit} onChange={(e) => handlePinChange(idx, e.target.value, 'pin')}
                        />
                      ))}
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Confirm Safety PIN</label>
                   <div className="flex gap-3 justify-between">
                      {formData.confirmPin.map((digit, idx) => (
                        <input
                          key={idx} ref={(el) => { confirmPinRefs.current[idx] = el; }}
                          type="password" maxLength={1} inputMode="numeric" required
                          className="w-full h-12 bg-slate-950 border border-white/5 rounded-xl text-center text-white font-black text-xl outline-none focus:border-emerald-500 transition-all"
                          value={digit} onChange={(e) => handlePinChange(idx, e.target.value, 'confirm')}
                        />
                      ))}
                   </div>
                </div>

                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <p className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest leading-relaxed">
                       PRO TIP: Your Safety PIN is required for every asset rotation. Keep it secret.
                    </p>
                </div>
            </div>

            {error && (
              <div className="md:col-span-2 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase text-center rounded-2xl tracking-widest">
                {error}
              </div>
            )}

            <button 
              type="submit" disabled={loading}
              className="md:col-span-2 py-6 bg-gradient-to-r from-emerald-600 to-teal-800 text-white font-black rounded-full shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4 text-xs uppercase tracking-[0.3em] group"
            >
              {loading ? 'INITIALIZING...' : 'Establish Neural Link'}
              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </form>

          <p className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-10">
            Node Already Exists? <Link href="/login" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-8 decoration-emerald-400/30 font-black tracking-[0.2em]">Access Repository</Link>
          </p>
        </div>
        
        <div className="mt-8 text-center">
            <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.5em] flex items-center justify-center gap-2">
               <Sparkles size={10} /> Neural Matrix Identity Protection Enabled
            </p>
        </div>
      </motion.div>
    </div>
  );
}
