'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Mail, Lock, ArrowRight, Zap, ShieldCheck, UserCircle, Fingerprint, Sparkles, Box, Compass, Globe, Radio } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';

function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    const particleCount = 40; // Balanced density for performance
    let mouse = { x: 0, y: 0 };
    let frameId: number;

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const Particle = class {
      x: number; y: number; vx: number; vy: number; size: number; baseSize: number;
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.baseSize = Math.random() * 1.2 + 0.4;
        this.size = this.baseSize;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = dx * dx + dy * dy; // Avoid sqrt for distance check
        if (dist < 40000) { // 200^2
          this.x += dx * 0.005;
          this.y += dy * 0.005;
          this.size = this.baseSize * 1.3;
        } else {
          this.size = this.baseSize;
        }

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
        ctx.fill();
      }
    };

    const init = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) particles.push(new (Particle as any)());
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw();
        // Optimized Connection Loop (reduced frequency)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 15000) { // ~120px
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 * (1 - distSq/15000)})`;
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      frameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    resize();
    init();
    animate();
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />;
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const autoAttempted = useRef(false);

  useEffect(() => {
    // Neural Matrix Warmup: Wake up the Render backend immediately
    api.get('/health').catch(() => {});

    const timer = setTimeout(() => {
      if (!identifier && !autoAttempted.current) {
        // Only auto-login if the user hasn't started typing
        handleGuestLogin();
      }
    }, 4000); // 4s delay to allow manual focus
    return () => clearTimeout(timer);
  }, []);

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinString = pin.join('');
    if (!identifier) return setError('ID Required: Mobile or Email');
    if (pinString.length < 4) return setError('Security Failure: PIN Incomplete');
    
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { 
        identifier, 
        otp: "1234", 
        pin: pinString 
      });
      setToken(data.token);
      setUser(data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Neural Identification Refused');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    autoAttempted.current = true;
    setGuestLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/guest');
      setToken(data.token);
      setUser(data);
      // Brief pause for neural sequence animation
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError('Neural Matrix Offline: Guest Signal Lost');
      setGuestLoading(false);
    }
  };


  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 overflow-hidden bg-[#020617] font-outfit">
      <NeuralBackground />
      
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse-slow" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel rounded-[2.5rem] p-10 neural-glow relative overflow-hidden group">
          {/* Animated Internal Border */}
          <div className="absolute inset-0 border border-white/5 rounded-[2.5rem] group-hover:border-indigo-500/20 transition-colors duration-500" />
          
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-10">
              <motion.div 
                whileHover={{ rotate: 90, scale: 1.1 }}
                className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)] mb-6"
              >
                <Zap className="text-white fill-current" size={30} />
              </motion.div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-3">
                HelloPay 
                <span className="text-[10px] uppercase font-black tracking-widest bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">
                  Node 2.0
                </span>
              </h1>
              <p className="text-slate-500 text-[10px] uppercase tracking-[0.4em] mt-3 font-semibold">Neural Wallet Matrix</p>
            </div>

            <AnimatePresence mode="wait">
              {guestLoading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="py-16 flex flex-col items-center justify-center space-y-8"
                >
                  <div className="relative">
                    <div className="w-20 h-20 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" size={24} />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest">Initialising Node</h2>
                    <p className="text-slate-500 text-[8px] uppercase tracking-[0.3em] font-bold animate-pulse">Establishing Secure Uplink...</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-3 animate-shake">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-5">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-5 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                          <UserCircle size={20} />
                        </div>
                        <input
                          type="text"
                          placeholder="MOBILE OR EMAIL"
                          className="w-full input-neural rounded-2xl py-5 pl-14 pr-6 text-sm font-bold tracking-widest uppercase"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                        />
                      </div>

                      <div className="space-y-3 px-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Lock size={12} className="text-indigo-500" /> Secure Node Access PIN
                        </label>
                        <div className="flex justify-between gap-3">
                          {pin.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={(el) => { pinRefs.current[idx] = el }}
                              type="password"
                              maxLength={1}
                              className="w-[22%] aspect-square input-neural rounded-xl text-center text-2xl font-bold text-white shadow-lg"
                              value={digit}
                              onChange={(e) => handlePinChange(idx, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(idx, e)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-neural rounded-2xl py-5 flex items-center justify-center gap-3 text-xs"
                      >
                        {loading ? 'SYNCHRONIZING...' : 'ACTIVATE SIGNAL'}
                        {!loading && <ArrowRight size={18} />}
                      </button>

                      <button
                        type="button"
                        onClick={handleGuestLogin}
                        className="w-full py-4 rounded-2xl border border-white/5 hover:bg-white/5 transition-all text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 group/guest"
                      >
                        <Radio size={14} className="text-emerald-500 group-hover/guest:animate-pulse" />
                        {error ? 'Retry Guest Signal' : 'Enter via Guest Node'}
                      </button>
                    </div>
                  </form>

                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-widest">
              <Link href="/register" className="text-slate-500 hover:text-white transition-colors flex items-center gap-2">
                <Fingerprint size={14} className="text-indigo-500" /> Create Node
              </Link>
              <button className="text-slate-500 hover:text-white transition-all opacity-60">
                Reset Access
              </button>
            </div>
          </div>
        </div>

        {/* Footer Support */}
        <div className="mt-12 text-center space-y-6">
          <div className="flex items-center justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
             <img src="https://img.icons8.com/color/48/visa.png" alt="Visa" className="h-5" />
             <img src="https://img.icons8.com/color/48/mastercard.png" alt="MC" className="h-5" />
             <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-4" />
          </div>
          <div className="flex items-center justify-center gap-2 text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] italic">
            <ShieldCheck size={10} className="text-indigo-500/50" />
            <span>Neural Registry Protected Node</span>
          </div>
        </div>

      </motion.div>
    </div>
  );
}

