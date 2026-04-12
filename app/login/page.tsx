'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Zap, ArrowRight, UserCircle, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    const particleCount = 40;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      x: number; y: number; vx: number; vy: number; size: number;
      constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > window.innerWidth) this.vx *= -1;
        if (this.y < 0 || this.y > window.innerHeight) this.vy *= -1;
      }
      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) particles.push(new Particle());
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 * (1 - dist/150)})`;
            ctx.lineWidth = 1;
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

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  
  const [setupMode, setSetupMode] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  
  const [setupData, setSetupData] = useState({ name: '', password: '', confirmPassword: '', pin: ['', '', '', ''] });
  const [resetData, setResetData] = useState({ email: '', newPassword: '', pin: ['', '', '', ''] });
  const [tempUser, setTempUser] = useState<any>(null);
  
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const setupPinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const resetPinRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const authData = localStorage.getItem('hellopay-auth-storage');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          if (parsed.state?.token) {
            router.replace('/dashboard');
            return;
          }
        } catch (e) {}
      }
    };
    checkAuth();
    api.get('/health').catch(() => {});
  }, [router]);

  const handlePinChange = (index: number, value: string, mode: 'login' | 'setup' | 'reset' = 'login') => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    
    if (mode === 'setup') {
      const newPin = [...setupData.pin];
      newPin[index] = digit;
      setSetupData({ ...setupData, pin: newPin });
      if (digit && index < 3) setupPinRefs.current[index + 1]?.focus();
    } else if (mode === 'reset') {
      const newPin = [...resetData.pin];
      newPin[index] = digit;
      setResetData({ ...resetData, pin: newPin });
      if (digit && index < 3) resetPinRefs.current[index + 1]?.focus();
    } else {
      const newPin = [...pin];
      newPin[index] = digit;
      setPin(newPin);
      if (digit && index < 3) pinRefs.current[index + 1]?.focus();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinString = pin.join('');
    if (!identifier) return setError('Email Address is required');
    if (!password) return setError('Password is required');
    if (pinString.length !== 4) return setError('Safety PIN is required');
    
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { 
        identifier, 
        password,
        pin: pinString
      });
      
      setToken(data.token);
      setUser(data);

      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Neural Identification Refused';
      if (msg.includes('Passkey mismatch')) {
        setError('Passkey mismatch. If you used Google to sign up, please use "Continue with Google".');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinString = resetData.pin.join('');
    if (pinString.length !== 4) return setError('4-digit PIN is required');
    
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password-pin', {
        email: resetData.email,
        newPassword: resetData.newPassword,
        pin: pinString
      });
      alert('Password Reset Successful! You can now log in.');
      setResetMode(false);
      setIdentifier(resetData.email);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Identity Reset Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      const { data } = await api.post('/auth/firebase-login', { idToken });
      
      if (data.needsSetup) {
        setTempUser(data);
        setSetupMode(true);
      } else {
        setToken(data.token);
        setUser(data);
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      // Displaying Firebase error codes directly which are more informative
      const errorCode = err.code || 'unknown';
      if (errorCode === 'auth/popup-blocked') {
        setError('Popup Blocked: Please enable popups for this site.');
      } else if (errorCode === 'auth/cancelled-popup-request') {
        // Silently handle user cancellation
      } else {
        setError(`Auth Error [${errorCode}]: ${err.message}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinString = setupData.pin.join('');
    if (setupData.password !== setupData.confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/complete-profile', {
        userId: tempUser._id,
        name: setupData.name,
        password: setupData.password,
        pin: pinString
      }, {
        headers: { Authorization: `Bearer ${tempUser.token}` }
      });
      setToken(tempUser.token);
      setUser(data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Profile Update Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 overflow-hidden bg-[#020617] font-outfit">
      <NeuralBackground />
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="text-center mb-10">
              <motion.div whileHover={{ rotate: 90, scale: 1.1 }} className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)] mb-6">
                <Zap className="text-white fill-current" size={30} />
              </motion.div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-3">
                HelloPay <span className="text-[10px] uppercase font-black tracking-widest bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">Node 2.0</span>
              </h1>
              <p className="text-slate-500 text-[10px] uppercase tracking-[0.4em] mt-3 font-semibold">Neural Wallet Matrix</p>
            </div>

            {resetMode ? (
              <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleResetPassword} className="space-y-6">
                <div className="text-center"><h2 className="text-xl font-bold text-white mb-2">Reset Passkey</h2><p className="text-[10px] text-slate-500 uppercase tracking-widest">Verify with 4-Digit PIN</p></div>
                <div className="space-y-4">
                  <input type="email" placeholder="Your Registered Email" required className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-indigo-500/50 font-bold" value={resetData.email} onChange={(e) => setResetData({ ...resetData, email: e.target.value })} />
                  <input type="password" placeholder="New Secret Passkey" required className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-emerald-500/50 font-bold" value={resetData.newPassword} onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })} />
                </div>
                <div className="flex gap-3 justify-center">
                  {[0, 1, 2, 3].map((idx) => (
                    <input key={idx} ref={(el) => { resetPinRefs.current[idx] = el; }} type="password" maxLength={1} inputMode="numeric" className="w-12 h-14 bg-slate-950/50 border border-white/10 rounded-2xl text-center text-white font-bold text-xl focus:border-indigo-500 outline-none" value={resetData.pin[idx]} onChange={(e) => handlePinChange(idx, e.target.value, 'reset')} onKeyDown={(e) => { if (e.key === 'Backspace' && !resetData.pin[idx] && idx > 0) resetPinRefs.current[idx - 1]?.focus(); }} />
                  ))}
                </div>
                {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">{error}</div>}
                <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all">{loading ? 'RESETTING...' : 'UPDATE PASSKEY'}</button>
                <button type="button" onClick={() => setResetMode(false)} className="w-full text-xs text-slate-500 uppercase font-black tracking-widest hover:text-white transition-colors">Cancel</button>
              </motion.form>
            ) : !setupMode ? (
              <div className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Identity Node</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center text-slate-500 group-focus-within:text-indigo-500 transition-colors"><UserCircle size={18} /></div>
                      <input type="email" placeholder="Email Address" required className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-white outline-none focus:border-indigo-500/50 font-bold" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Access Token</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center text-slate-500 group-focus-within:text-indigo-500 transition-colors"><Lock size={18} /></div>
                      <input type="password" placeholder="Passkey" required className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-white outline-none focus:border-indigo-500/50 font-bold" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className="text-right pr-2">
                      <button type="button" onClick={() => setResetMode(true)} className="text-[10px] text-indigo-400 font-black uppercase tracking-widest hover:text-indigo-300">Forgot Passkey?</button>
                    </div>
                  </div>
                  <div className="space-y-3 bg-white/5 p-5 rounded-3xl border border-white/5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block text-center">Safety PIN</label>
                    <div className="flex gap-3 justify-center">
                      {[0, 1, 2, 3].map((idx) => (
                        <input key={idx} ref={(el) => { pinRefs.current[idx] = el; }} type="password" maxLength={1} inputMode="numeric" className="w-12 h-14 bg-slate-950/50 border border-white/10 rounded-2xl text-center text-white font-bold text-xl focus:border-indigo-500 outline-none" value={pin[idx]} onChange={(e) => handlePinChange(idx, e.target.value)} onKeyDown={(e) => { if (e.key === 'Backspace' && !pin[idx] && idx > 0) pinRefs.current[idx - 1]?.focus(); }} />
                      ))}
                    </div>
                  </div>
                  {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-bold tracking-tight">{error}</div>}
                  <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3">
                    {loading ? 'LINKING...' : 'INITIALIZE LINK'} <ArrowRight size={20} />
                  </button>
                </form>
                <div className="relative py-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div><div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.3em]"><span className="bg-[#020617] px-4 text-slate-700">or</span></div></div>
                <button type="button" onClick={handleGoogleLogin} disabled={googleLoading} className="w-full py-4 bg-white text-slate-900 font-bold rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-slate-50">
                  {googleLoading ? <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" /> : <><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" /> Continue with Google</>}
                </button>
                <p className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">New Identity? <Link href="/register" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-400/30">Create Node</Link></p>
              </div>
            ) : (
              <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleCompleteSetup} className="space-y-6">
                <div className="text-center"><h2 className="text-xl font-bold text-white mb-2">Finalize Profile</h2><p className="text-[10px] text-slate-500 uppercase tracking-widest">Register your identity</p></div>
                <input type="text" placeholder="Full Name" required className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold" value={setupData.name} onChange={(e) => setSetupData({ ...setupData, name: e.target.value })} />
                <input type="password" placeholder="Create Secret Passkey" required className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold" value={setupData.password} onChange={(e) => setSetupData({ ...setupData, password: e.target.value })} />
                <input type="password" placeholder="Confirm Passkey" required className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold" value={setupData.confirmPassword} onChange={(e) => setSetupData({ ...setupData, confirmPassword: e.target.value })} />
                <div className="flex gap-3 justify-center">
                  {[0, 1, 2, 3].map((idx) => (
                    <input key={idx} ref={(el) => { setupPinRefs.current[idx] = el; }} type="password" maxLength={1} inputMode="numeric" className="w-12 h-14 bg-slate-950/50 border border-white/10 rounded-2xl text-center text-white font-bold text-xl focus:border-indigo-500 outline-none" value={setupData.pin[idx]} onChange={(e) => handlePinChange(idx, e.target.value, 'setup')} onKeyDown={(e) => { if (e.key === 'Backspace' && !setupData.pin[idx] && idx > 0) setupPinRefs.current[idx - 1]?.focus(); }} />
                  ))}
                </div>
                {error && <div className="p-4 bg-red-500/10 text-red-400 text-xs text-center rounded-xl">{error}</div>}
                <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl active:scale-95 transition-all">FINALIZE NODE</button>
                <button type="button" onClick={() => setSetupMode(false)} className="w-full text-xs text-slate-500 uppercase font-black">Back</button>
              </motion.form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
