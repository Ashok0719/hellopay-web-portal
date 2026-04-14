'use client';

import { Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

function PayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const amount = searchParams.get('amount') || '0';
  const transactionId = searchParams.get('txnId');
  const stockId = searchParams.get('stockId');
  
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [paymentApp, setPaymentApp] = useState('freecharge');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txStatus, setTxStatus] = useState<'PENDING' | 'PENDING_AUDIT' | 'SUCCESS'>('PENDING');
  const [transaction, setTransaction] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes

  // 1. Fetch Transaction & Seller Info
  useEffect(() => {
    if (!transactionId) {
      // If no transactionId, this is likely a wallet recharge. Fetch admin config.
      const fetchConfig = async () => {
        try {
          const { data } = await api.get('/wallet/config');
          setConfig(data);
        } catch (err) {
          console.error('Neural Config Loss:', err);
        }
      };
      fetchConfig();
      return;
    }
    const fetchTx = async () => {
      try {
        const { data } = await api.get(`/stocks/transactions/${transactionId}`);
        if (data.success) {
          setTransaction(data.transaction);
        }
      } catch (err) {
        console.error('Neural Sync Loss:', err);
      }
    };
    fetchTx();
  }, [transactionId]);

  // 2. 20-Minute Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setError('Neural Window Expired: This node has been released.');
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // 3. App Redirect Logic
  const handleAppRedirect = (app: string) => {
    const upiId = transaction?.sellerId?.upiId || config?.receiverUpiId || 'neural.pay@bank';
    const upiUrl = `upi://pay?pa=${upiId}&pn=HelloPay&am=${amount}&cu=INR&tr=${transactionId || 'RECHARGE'}`;
    
    // Attempt deep link for specific apps if possible, otherwise generic UPI
    if (app === 'freecharge') {
      window.location.href = `freecharge://upi/pay?pa=${upiId}&pn=HelloPay&am=${amount}&cu=INR`;
    } else if (app === 'mobikwik') {
      window.location.href = `mobikwik://upi/pay?pa=${upiId}&pn=HelloPay&am=${amount}&cu=INR`;
    } else {
      window.location.href = upiUrl;
    }
    
    // Fallback to generic UPI after 2 seconds if deep link fails (mobile only)
    setTimeout(() => {
      window.location.href = upiUrl;
    }, 2000);
  };

  const handleManualSubmit = async () => {
    if (!utr || !screenshot) {
      setError('Neural signals missing: UTR and Screenshot required.');
      return;
    }
    if (utr.length < 12) {
      setError('Invalid UTR: Minimum 12 characters required.');
      return;
    }

    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('utr', utr);
    formData.append('screenshot', screenshot);
    formData.append('paymentApp', paymentApp);
    if (stockId) formData.append('stockId', stockId);

    try {
      const endpoint = stockId ? `/stocks/transactions/${transactionId}/upload` : '/payments/submit-proof';
      const { data } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.success) {
        setTxStatus('PENDING_AUDIT');
      } else {
        setError(data.message || 'Submission failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Neural Gateway Timeout.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure? This node will be available for other participants.')) return;
    try {
      if (stockId && transactionId) {
        await api.post(`/stocks/transactions/${transactionId}/cancel`);
      }
      router.push('/dashboard');
    } catch (err) {
      router.push('/dashboard');
    }
  };

  if (txStatus === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-xs">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-10 mx-auto shadow-2xl shadow-emerald-500/20">
            <CheckCircle className="text-white" size={48} />
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Settled!</h1>
          <p className="text-slate-500 font-bold mt-4 leading-relaxed">Neural Protocol Completed. ₹{amount} has been merged.</p>
          <button onClick={() => router.push('/dashboard')} className="mt-12 px-10 py-6 bg-emerald-600 rounded-[32px] text-white font-black uppercase italic shadow-2xl active:scale-95 transition-all w-full tracking-widest text-xs">Back to Dashboard</button>
        </motion.div>
      </div>
    );
  }

  if (txStatus === 'PENDING_AUDIT') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white">
         <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-xs">
            <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mb-10 mx-auto shadow-2xl shadow-amber-500/20 animate-pulse">
               <Zap className="text-white fill-white" size={40} />
            </div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">Auditing Signal...</h1>
            <p className="text-slate-500 font-bold mt-4 leading-relaxed italic uppercase text-[10px] tracking-[0.2em]">Our neural nodes are auditing your signal. Settlement will occur instantly upon validation.</p>
            <button onClick={() => router.push('/dashboard')} className="mt-12 px-8 py-5 bg-white/5 border border-white/10 text-white rounded-[28px] font-black uppercase text-xs tracking-[0.3em] w-full">Back to Dashboard</button>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-24 max-w-lg mx-auto border-x border-white/5">
      <div className="p-4 flex items-center justify-between sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
        <button onClick={handleCancel} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><ArrowLeft size={20} /></button>
        <div className="text-center">
          <h1 className="text-sm font-black italic uppercase tracking-tighter">Neural Verification</h1>
          <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">P2P Secure Settlement</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full border border-red-500/20">
           <AlertCircle size={12} className="text-red-500" />
           <span className="text-[10px] font-black font-mono text-red-500">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-slate-900 rounded-[40px] p-8 text-center border border-white/5 shadow-2xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-[60px]" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Payable</p>
          <div className="text-6xl font-black italic tracking-tighter text-white mb-2">₹{amount}</div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
             <ShieldCheck size={12} className="text-emerald-500" />
             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">AI Secure Escrow</span>
          </div>
          
          <div className="mt-10 p-5 bg-black/40 rounded-3xl border border-white/5">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 text-center">Receiver Address</p>
             <div className="flex items-center justify-between group">
                <span className="text-sm font-black text-indigo-400 font-mono tracking-tight select-all">{transaction?.sellerId?.upiId || config?.receiverUpiId || 'neural.pay@bank'}</span>
                <button onClick={() => { navigator.clipboard.writeText(transaction?.sellerId?.upiId || config?.receiverUpiId || ''); alert('Copied!'); }} className="text-[8px] font-black bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-lg border border-indigo-500/20 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Copy</button>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 h-20">
             <button onClick={() => handleAppRedirect('freecharge')} className="bg-slate-900 border border-white/10 rounded-3xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 group shadow-xl">
                <img src="https://upload.wikimedia.org/wikipedia/en/2/23/Freecharge_Logo.png" className="w-8 h-8 rounded-lg brightness-110" alt="Freecharge" />
                <div className="text-left">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Pay with</p>
                   <p className="text-xs font-black italic uppercase text-white leading-none">Freecharge</p>
                </div>
             </button>
             <button onClick={() => handleAppRedirect('mobikwik')} className="bg-slate-900 border border-white/10 rounded-3xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 group shadow-xl">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/4c/MobiKwik_Logo.png" className="w-8 h-8 rounded-lg" alt="Mobikwik" />
                <div className="text-left">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Pay with</p>
                   <p className="text-xs font-black italic uppercase text-white leading-none">Mobikwik</p>
                </div>
             </button>
          </div>

          <div className="bg-white/5 rounded-[40px] p-8 border border-white/5 space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">UTR Number (12-Digit)</label>
                <input 
                  type="text"
                  placeholder="Order Verification Signal"
                  className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-white font-black italic tracking-widest focus:border-indigo-500 outline-none transition-all"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                />
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Screenshot Proof</label>
                <div onClick={() => document.getElementById('ss-node')?.click()} className={`w-full h-32 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${screenshot ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 bg-black/40 hover:border-indigo-500 hover:bg-indigo-500/5'}`}>
                   <input id="ss-node" type="file" hidden onChange={(e) => setScreenshot(e.target.files?.[0] || null)} accept="image/*" />
                   {screenshot ? (
                     <>
                        <CheckCircle size={24} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Signal Captured</span>
                     </>
                   ) : (
                     <>
                        <Zap size={24} className="text-slate-600" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attach Proof Signal</span>
                     </>
                   )}
                </div>
             </div>
          </div>

          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-shake">{error}</div>}

          <div className="flex gap-4">
             <button 
               onClick={handleCancel}
               className="flex-1 h-16 bg-white/5 border border-white/10 rounded-2xl text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all"
             >
                Cancel
             </button>
             <button 
               onClick={handleManualSubmit}
               disabled={loading || !utr || !screenshot || timeLeft <= 0}
               className="flex-[2] h-16 bg-indigo-600 rounded-2xl text-white font-black uppercase italic text-xs tracking-[0.2em] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
             >
                {loading ? 'AUDITING...' : 'Submit Verification'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center font-black text-emerald-600 uppercase tracking-[0.5em] animate-pulse italic">Neural Signal Initializing...</div>}>
      <PayContent />
    </Suspense>
  );
}