'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, ArrowRight, Zap, Mail, ShieldCheck, UserCircle, HandCoins, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Suspense } from 'react';

function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    const particleCount = 60;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      x: number; y: number; vx: number; vy: number; size: number;
      constructor() {
        this.x = Math.random() * (canvas?.width || window.innerWidth);
        this.y = Math.random() * (canvas?.height || window.innerHeight);
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.size = Math.random() * 2 + 1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > (canvas?.width || window.innerWidth)) this.vx *= -1;
        if (this.y < 0 || this.y > (canvas?.height || window.innerHeight)) this.vy *= -1;
      }
      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(79, 70, 229, 0.4)';
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) particles.push(new Particle());
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            ctx.strokeStyle = `rgba(79, 70, 229, ${0.15 * (1 - dist/180)})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    init();
    animate();
    return () => window.removeEventListener('resize', resize);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-50" />;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-black uppercase tracking-widest text-[10px]">Syncing Neural Mesh...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') || '';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    pin: ['', '', '', ''],
    referralCode: refCode
  });

  useEffect(() => {
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }));
    }
  }, [refCode]);
  const [config, setConfig] = useState<any>(null);
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get('/admin/config');
        setConfig(data);
      } catch (err) {
        console.error('Config fetch failed');
      }
    };
    fetchConfig();
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const { setToken, setUser } = useAuthStore();
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const newPin = [...formData.pin];
    newPin[index] = digit;
    setFormData({ ...formData, pin: newPin });
    if (digit && index < 3) pinRefs.current[index + 1]?.focus();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinString = formData.pin.join('');
    
    if (formData.password.length < 6) return setError('Password must be at least 6 characters');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    if (pinString.length !== 4) return setError('Safety PIN must be 4 digits');
    
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
      setSuccessData(data);
      setTimeout(() => {
        // Manual sync to localStorage for immediate api interceptor detection
        localStorage.setItem('hellopay-auth-storage', JSON.stringify({
          state: { user: data, token: data.token, isAuthenticated: true },
          version: 0
        }));
        setToken(data.token);
        setUser(data);
        router.push('/dashboard');
      }, 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration sequence aborted');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      const { data } = await api.post('/auth/firebase-login', { idToken });
      setToken(data.token);
      setUser(data);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Google Auth Failed:', err);
      setError(err.response?.data?.message || 'Google Authentication Refused');
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center px-6 font-sans relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
         <motion.div 
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="w-full max-w-[520px] p-12 rounded-[56px] bg-slate-900/50 backdrop-blur-3xl border border-emerald-500/20 text-center relative z-10"
         >
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
               <CheckCircle2 className="text-emerald-500" size={56} />
            </div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Activation Success</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-10">Your neural identity is now live</p>
            
            <div className="bg-black/40 border border-white/5 rounded-3xl p-8 mb-10 shadow-inner">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Your Unique User ID</p>
               <h3 className="text-5xl font-black text-indigo-400 tracking-tighter italic">{successData.userIdNumber}</h3>
            </div>
            
            <button 
              onClick={() => { setToken(successData.token); setUser(successData); router.push('/dashboard'); }}
              className="w-full py-5 bg-emerald-600 text-white font-black rounded-3xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all text-xs uppercase tracking-widest"
            >
               Enter Dashboard
            </button>
            <p className="mt-6 text-[9px] font-black text-slate-600 uppercase tracking-widest animate-pulse">Redirecting to node in 5s...</p>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center py-10 sm:py-20 px-6 font-sans relative overflow-x-hidden overflow-y-auto">
      <NeuralBackground />
      
      {/* 3D Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ x: [0, -120, 0], y: [0, -80, 0], scale: [1, 1.3, 1] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[140px]" 
        />
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, 60, 0] }} 
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 -left-40 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[100px]" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* Brand Node */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 flex flex-col items-center mb-10"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[24px] flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.3)] border border-indigo-400/30">
           <Zap className="text-white fill-white drop-shadow-md" size={40} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[520px] p-1 shadow-[0_20px_80px_rgba(0,0,0,0.5)] rounded-[48px] bg-slate-900/60 backdrop-blur-3xl border border-indigo-500/20 relative z-10 mx-auto"
      >
        <div className="p-10 sm:p-12">
            <div className="text-center mb-10">
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-3 drop-shadow-lg">New Node Activation</h2>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-[0.2em]">Bind your identity to the network</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 mb-8 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-inner"
              >
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
              
              {/* Full Width Name */}
              <div className="group relative">
                  <div className="absolute inset-y-0 left-6 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                      <UserCircle size={20} />
                  </div>
                  <input
                      required
                      type="text"
                      placeholder="FULL NAME"
                      className="w-full bg-black/30 border border-white/10 rounded-3xl py-6 sm:py-5 pl-16 pr-8 text-white font-black placeholder:text-slate-600 outline-none transition-all focus:border-indigo-500 shadow-inner text-base sm:text-xs tracking-widest uppercase"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
              </div>

              {/* 2 Column: Email & Referral */}
              <div className="group relative">
                  <div className="absolute inset-y-0 left-6 flex items-center text-slate-500 group-focus-within:text-blue-400 transition-colors">
                      <Mail size={20} />
                  </div>
                  <input
                      required
                      type="email"
                      placeholder="EMAIL ADDRESS"
                      className="w-full bg-black/30 border border-white/10 rounded-3xl py-6 sm:py-5 pl-16 pr-8 text-white font-black placeholder:text-slate-600 outline-none transition-all focus:border-blue-500 shadow-inner text-base sm:text-xs tracking-widest uppercase"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
              </div>

              {/* Password Section */}
              <div className="space-y-4">
                  <div className="group relative">
                      <div className="absolute inset-y-0 left-6 flex items-center text-slate-500 group-focus-within:text-amber-400 transition-colors">
                          <Lock size={18} />
                      </div>
                      <input
                          required
                          type="password"
                          placeholder="CREATE PASSWORD"
                          className="w-full bg-black/30 border border-white/10 rounded-3xl py-6 sm:py-5 pl-14 pr-6 text-white font-black placeholder:text-slate-600 outline-none transition-all focus:border-amber-500 shadow-inner text-base sm:text-xs tracking-widest uppercase"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                  </div>
                  <div className="group relative">
                      <div className="absolute inset-y-0 left-6 flex items-center text-slate-500 group-focus-within:text-amber-400 transition-colors">
                          <Lock size={18} />
                      </div>
                      <input
                          required
                          type="password"
                          placeholder="CONFIRM PASSWORD"
                          className="w-full bg-black/30 border border-white/10 rounded-3xl py-6 sm:py-5 pl-14 pr-6 text-white font-black placeholder:text-slate-600 outline-none transition-all focus:border-amber-500 shadow-inner text-base sm:text-xs tracking-widest uppercase"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      />
                  </div>
              </div>

              {/* 4-Digit Security PIN */}
              <div className="space-y-4 bg-white/5 p-6 rounded-[32px] border border-white/5 relative overflow-hidden">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block italic ml-2">Define Safety PIN (4 Digits)</label>
                <div className="flex gap-4 justify-center">
                  {[0, 1, 2, 3].map((idx) => (
                    <input
                      key={idx}
                      ref={(el) => { pinRefs.current[idx] = el; }}
                      type="password"
                      maxLength={1}
                      inputMode="numeric"
                      className="w-14 h-16 bg-black/40 border border-white/10 rounded-2xl text-center text-white font-bold text-2xl focus:border-indigo-500 outline-none transition-all"
                      value={formData.pin[idx]}
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

              {/* Referral Section */}
              <div className="group relative bg-indigo-500/10 border border-indigo-400/20 rounded-3xl overflow-hidden mt-2">
                  <div className="absolute bottom-4 left-6 flex items-center text-indigo-400 pointer-events-none">
                      <HandCoins size={20} />
                  </div>
                  <input
                      type="text"
                      placeholder="ENTER VIP CODE"
                      className="w-full bg-transparent py-7 pb-4 pl-16 pr-8 text-white font-black placeholder:text-indigo-400/50 outline-none text-sm tracking-[0.2em] uppercase"
                      value={formData.referralCode}
                      onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/4 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                     <Sparkles size={12} className="text-white fill-white animate-pulse" />
                     <span className="text-[9px] font-black text-white uppercase tracking-widest">+₹{formData.referralCode ? (config?.referralBonus || 100) : '0'} BONUS</span>
                  </div>
              </div>

              <div className="pt-8 space-y-6">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-black rounded-3xl shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4 text-xs uppercase tracking-[0.2em]"
                >
                    {loading ? 'SYNCHRONIZING MESH...' : 'ACTIVATE NEURAL LINK'}
                    <ArrowRight size={20} />
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.3em]">
                    <span className="bg-slate-900/60 backdrop-blur-3xl px-4 text-slate-500">Quick Identity Sync</span>
                  </div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-5 bg-white text-slate-900 font-black rounded-3xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    Connect with Google
                </button>
                
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-6 text-center">
                  Already bound? <Link href="/login" className="text-indigo-400 hover:text-indigo-300 underline decoration-indigo-400/30 underline-offset-4 transition-colors">Initialize Login Signal</Link>
                </p>
              </div>
            </form>
        </div>
      </motion.div>

      {/* Footer Info */}
      <div className="relative z-10 mt-16 text-center opacity-50 group-hover:opacity-100 transition-opacity">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic mb-4">Neural Registry Connection: Encrypted</p>
        <div className="flex items-center justify-center gap-3 text-slate-800">
           <ShieldCheck size={14} />
           <span className="text-[8px] font-black uppercase tracking-widest">Global ISO-27001 Security Protocol</span>
        </div>
      </div>
    </div>
  );
}
