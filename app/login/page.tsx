'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, Mail, Lock, ShieldCheck, Eye, EyeOff, Sparkles, Fingerprint } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/hooks/useAuth';
import api from '@/lib/api';
import NeuralBackground from '../components/NeuralBackground';

export default function LoginPage() {
  const [formData, setFormData] = useState({ identifier: '', password: '', pin: ['', '', '', ''] });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const pinRefs = useRef<Array<HTMLInputElement | null>>([]);
  const { setToken, setUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const handlePinChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newPin = [...formData.pin];
    newPin[idx] = val.slice(-1);
    setFormData({ ...formData, pin: newPin });
    if (val && idx < 3) pinRefs.current[idx + 1]?.focus();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinString = formData.pin.join('');
    if (pinString.length < 4) return setError('Complete your 4-Digit Safety PIN');
    
    setLoading(true);
    setError('');
    
    try {
      const { data } = await api.post('/auth/login', {
        identifier: formData.identifier,
        password: formData.password,
        pin: pinString
      });
      
      localStorage.setItem('hellopay-auth-storage', JSON.stringify({
        state: { user: data, token: data.token, isAuthenticated: true },
        version: 0
      }));
      setToken(data.token);
      setUser(data);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Neural Link Error: Access Denied');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestEntry = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/guest-login');
      localStorage.setItem('hellopay-auth-storage', JSON.stringify({
        state: { user: data, token: data.token, isAuthenticated: true },
        version: 0
      }));
      setToken(data.token);
      setUser(data);
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Guest Protocol Failure');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 overflow-hidden bg-[#020617] font-outfit selection:bg-indigo-500 selection:text-white">
      <NeuralBackground />
      
      {/* Dynamic Glow Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden ring-1 ring-white/10">
          
          {/* Header Section */}
          <div className="text-center mb-10">
            <motion.div 
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.8, ease: "circOut" }}
              className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.4)] mb-8 relative group"
            >
              <Zap className="text-white fill-current" size={36} />
              <div className="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
            </motion.div>
            
            <h1 className="text-4xl font-black tracking-tighter text-white italic">
              HELLOPAY <span className="text-indigo-500">2.0</span>
            </h1>
            <p className="text-slate-500 text-[9px] uppercase tracking-[0.6em] mt-4 font-black">Neural Access Terminal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Registry Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="name@neural.com"
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold placeholder:text-slate-700"
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Secure Passkey</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-5 pl-14 pr-14 text-white text-sm outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold placeholder:text-slate-700"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>

            {/* PIN Field */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between px-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Safety PIN</label>
                <div className="flex items-center gap-1">
                   <ShieldCheck className="text-emerald-500" size={12} />
                   <span className="text-[8px] font-bold text-emerald-500/60 uppercase">Encrypted</span>
                </div>
              </div>
              <div className="flex gap-4 justify-between">
                {formData.pin.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { pinRefs.current[idx] = el; }}
                    type="password"
                    maxLength={1}
                    inputMode="numeric"
                    required
                    className="w-full h-16 bg-slate-950/50 border border-white/5 rounded-2xl text-center text-white font-black text-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !formData.pin[idx] && idx > 0) {
                        pinRefs.current[idx - 1]?.focus();
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-black uppercase tracking-wider text-center rounded-2xl"
              >
                {error}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-6 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-black rounded-[2rem] shadow-[0_15px_30px_rgba(79,70,229,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative uppercase tracking-widest text-xs">{loading ? 'Verifying Identity...' : 'Authorize Session'}</span>
              <ArrowRight size={18} className="relative group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Social Bypass (Hidden or subtle) */}
          <div className="mt-8 space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-white/5"></div>
              <span className="absolute bg-[#0b1121] px-4 text-[9px] font-black text-slate-700 uppercase tracking-widest">Protocol Shift</span>
            </div>
            
            <button 
              type="button" 
              onClick={handleGuestEntry}
              className="w-full py-4 bg-white/5 border border-white/10 text-slate-400 font-bold rounded-2xl text-[10px] uppercase tracking-[0.3em] hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 group"
            >
              <Fingerprint size={14} className="group-hover:text-indigo-400 transition-colors" />
              Instant Neural Bypass (Guest)
            </button>

            <p className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest pt-2">
              New Node? <Link href="/register" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-8 decoration-indigo-400/30 font-black">Begin Initialization</Link>
            </p>
          </div>
        </div>

        {/* Support Link */}
        <div className="mt-8 text-center">
            <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.5em] flex items-center justify-center gap-2">
               <Sparkles size={10} /> Powered by HelloPay Neural Cloud v2.1
            </p>
        </div>
      </motion.div>
    </div>
  );
}
