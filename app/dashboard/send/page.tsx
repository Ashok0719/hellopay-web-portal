'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Zap, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  User as UserIcon,
  Phone,
  Send
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function SendMoneyPage() {
  const router = useRouter();
  const [receiverId, setReceiverId] = useState('');
  const [receiverData, setReceiverData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [step, setStep] = useState(1); // 1: Receiver, 2: Amount, 3: PIN
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const pinRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      setUser(data);
    } catch (err) {}
  };

  // Auto-search logic
  useEffect(() => {
    if (receiverId.length >= 6) {
      const delayDebounceFn = setTimeout(() => {
        searchUser();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setReceiverData(null);
    }
  }, [receiverId]);

  const searchUser = async () => {
    setIsSearching(true);
    setError('');
    try {
      const { data } = await api.get(`/wallet/search-user/${receiverId}`);
      if (data.success) {
        setReceiverData(data.user);
      }
    } catch (err: any) {
      setReceiverData(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    if (digit && index < 3) pinRefs.current[index + 1]?.focus();
  };

  const executeTransfer = async () => {
    setLoading(true);
    setError('');
    const finalPin = pin.join('');
    
    try {
      const { data } = await api.post('/wallet/transfer', {
        receiverIdNumber: receiverId,
        amount: Number(amount),
        pin: finalPin,
        note
      });

      if (data.success) {
        setSuccessData(data);
        setStep(4); // Success State
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Transfer Failed: Neural signal lost');
      setPin(['', '', '', '']);
      pinRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-400/5 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <nav className="p-6 flex items-center justify-between sticky top-0 z-50 bg-slate-50/80 backdrop-blur-xl">
        <button onClick={() => router.back()} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors shadow-sm active:scale-90">
          <ArrowLeft size={20} />
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Neural Transfer Node</span>
        <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
           {user?.qrCode && <img src={user.qrCode} className="w-full h-full object-cover" />}
        </div>
      </nav>

      <div className="max-w-md mx-auto p-6 pb-32">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                 <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase">Send Money <span className="block text-emerald-500 font-normal not-italic text-sm tracking-widest mt-2 uppercase">Instant P2P Ledger</span></h1>
              </div>

              <div className="space-y-6">
                <div className="relative group">
                   <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                      <Search size={22} />
                   </div>
                   <input 
                      value={receiverId}
                      onChange={(e) => setReceiverId(e.target.value)}
                      placeholder="Receiver ID or Phone"
                      className="w-full pl-16 pr-6 py-6 bg-white border border-slate-100 rounded-[32px] text-lg font-bold focus:outline-emerald-500 shadow-sm group-hover:shadow-md transition-all"
                   />
                   {isSearching && (
                      <div className="absolute right-6 top-1/2 -translate-y-1/2">
                         <div className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                      </div>
                   )}
                </div>

                <AnimatePresence>
                   {receiverData && (
                     <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 bg-slate-900 rounded-[40px] text-white flex items-center justify-between border border-white/5 shadow-2xl overflow-hidden relative"
                     >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
                        <div className="flex items-center gap-6 relative z-10">
                           <div className="w-16 h-16 bg-white/10 rounded-[28px] flex items-center justify-center text-emerald-400 border border-white/10">
                              <UserIcon size={32} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1 flex items-center gap-2">Receiver Found <CheckCircle2 size={10} /></p>
                              <h3 className="text-xl font-bold italic tracking-tighter">{receiverData.name}</h3>
                              <p className="text-[10px] font-bold text-slate-500">Node ID: #{receiverData.userIdNumber}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => setStep(2)}
                          className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-slate-900 hover:scale-110 active:scale-90 transition-all shadow-lg"
                        >
                           <Send size={24} className="ml-1" />
                        </button>
                     </motion.div>
                   )}
                </AnimatePresence>
              </div>

              <div className="p-8 bg-white border border-slate-100 rounded-[40px] shadow-sm">
                 <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 italic">Recent Contacts</h3>
                 <div className="text-center py-8">
                    <p className="text-xs font-bold text-slate-300 italic uppercase">Neural contact history is empty</p>
                 </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                 <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-900 transition-colors"><ArrowLeft size={24} /></button>
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter">Enter Amount</h2>
              </div>

              <div className="p-10 bg-white border border-slate-100 rounded-[48px] shadow-sm space-y-8 text-center">
                 <div className="inline-flex items-center gap-4 px-6 py-3 bg-slate-50 rounded-full">
                    <UserIcon size={16} className="text-slate-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600 italic">Paying {receiverData?.name}</span>
                 </div>

                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-4xl font-black text-slate-300 italic">₹</span>
                    <input 
                      type="number"
                      autoFocus
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-6 py-4 text-6xl font-black italic tracking-tighter text-slate-900 focus:outline-none placeholder:text-slate-100"
                    />
                 </div>

                 <div className="space-y-4">
                   <input 
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a Neural Note (optional)"
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-[11px] font-bold text-slate-600 focus:outline-emerald-500 uppercase tracking-widest text-center italic"
                   />
                   <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Available: ₹{user?.walletBalance?.toLocaleString()}</p>
                 </div>

                 <button 
                   disabled={!amount || Number(amount) < 1 || Number(amount) > (user?.walletBalance || 0)}
                   onClick={() => setStep(3)}
                   className="w-full py-6 bg-slate-900 text-white font-black uppercase italic tracking-widest rounded-[32px] shadow-2xl active:scale-95 transition-all text-sm disabled:opacity-20"
                 >
                   Proceed to Authorize
                 </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                 <div className="w-20 h-20 bg-emerald-500 rounded-[32px] mx-auto flex items-center justify-center text-slate-900 shadow-emerald-500/20 shadow-2xl">
                    <ShieldCheck size={40} />
                 </div>
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter">Enter Security PIN</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Authorizing transfer of ₹{amount} to {receiverData?.name}</p>
              </div>

              <div className="flex justify-between gap-4 max-w-xs mx-auto">
                {pin.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { pinRefs.current[idx] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-16 h-20 bg-white border border-slate-100 rounded-[28px] text-center text-2xl font-black italic shadow-sm focus:outline-emerald-500 transition-all"
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                  />
                ))}
              </div>

              {error && (
                <div className="p-5 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4 text-red-600">
                   <AlertCircle size={20} className="shrink-0" />
                   <p className="text-[11px] font-bold italic uppercase tracking-tight">{error}</p>
                </div>
              )}

              <button 
                disabled={loading || pin.join('').length < 4}
                onClick={executeTransfer}
                className="w-full py-6 bg-slate-900 text-white font-black uppercase italic tracking-widest rounded-[32px] shadow-2xl active:scale-95 transition-all text-sm disabled:opacity-20 flex items-center justify-center gap-4"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    <span className="animate-pulse tracking-widest text-xs uppercase">EXECUTING PULSE...</span>
                  </div>
                ) : (
                  <>CONFIRM TRANSFORMATION <Zap size={18} className="fill-emerald-400 text-emerald-400" /></>
                )}
              </button>
              
              <button 
                onClick={() => setStep(2)}
                className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest italic"
              >
                Modify Order
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center p-8 text-center space-y-8"
            >
               <div className="relative">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                    className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center text-white relative z-10"
                  >
                     <CheckCircle2 size={64} />
                  </motion.div>
                  <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" />
               </div>

               <div className="space-y-2">
                  <h2 className="text-4xl font-black italic text-slate-900 tracking-tighter uppercase">Transfer Success</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Neural Liquidity Rotation Complete</p>
               </div>

               <div className="w-full p-8 bg-white border border-slate-100 rounded-[48px] shadow-sm space-y-6">
                  <div className="flex justify-between items-center pb-6 border-b border-slate-50">
                     <span className="text-[10px] font-black text-slate-400 uppercase italic">Amount Transferred</span>
                     <span className="text-3xl font-black italic tracking-tighter text-slate-900">₹{amount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase italic">Recipient Node</span>
                     <span className="text-sm font-black italic text-slate-900">{receiverData?.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase italic">Reference ID</span>
                     <span className="text-[11px] font-black text-emerald-500 italic tracking-widest">{successData?.referenceId}</span>
                  </div>
               </div>

               <button 
                 onClick={() => router.push('/dashboard')}
                 className="w-full py-6 bg-slate-900 text-white font-black uppercase italic tracking-widest rounded-[32px] shadow-2xl active:scale-95 transition-all text-sm"
               >
                 Back to Control Center
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-10 left-0 w-full flex justify-center px-6 pointer-events-none">
         <div className="bg-white/50 backdrop-blur-sm border border-white/20 px-8 py-3 rounded-full flex items-center gap-4 shadow-sm opacity-50">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none mt-0.5">Neural Encryption Active v4.2</span>
         </div>
      </div>
    </div>
  );
}
