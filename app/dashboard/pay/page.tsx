'use client';

import { Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Zap, AlertCircle, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { io } from 'socket.io-client';
import NeuralNotice from '@/components/NeuralNotice';
import { AnimatePresence } from 'framer-motion';

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
  const [txStatus, setTxStatus] = useState<'PENDING' | 'PENDING_AUDIT' | 'SUCCESS' | 'FAILED'>('PENDING');
  const txStatusStr = txStatus as string; // cast for comparison checks
  const [transaction, setTransaction] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes
  const [rejectReason, setRejectReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [notice, setNotice] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(4);

  // 0. Neural Socket Listener
  useEffect(() => {
    const backendUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) 
      ? 'http://localhost:5000' 
      : 'https://hellopay-neural-api.onrender.com';
    
    const socket = io(backendUrl);

    socket.on('payment_settled', (data: any) => {
      if (data.transactionId === transactionId) {
        if (data.status === 'SUCCESS') {
           setTxStatus('SUCCESS');
           setShowSuccessPopup(true);
           // Native APK bridge — fires toast + redirect on Android WebView
           if (typeof (window as any).AndroidBridge !== 'undefined') {
             (window as any).AndroidBridge.showPaymentSuccess(data.amount || amount);
           }
        } else if (data.status === 'FAILED') {
           setRejectReason(data.reason || 'Verification Failed');
           setTxStatus('FAILED');
        }
      }
    });

    return () => { socket.disconnect(); };
  }, [transactionId]);

  // Auto-redirect countdown when success popup is shown
  useEffect(() => {
    if (!showSuccessPopup) return;
    setRedirectCountdown(4);
    const interval = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuccessPopup]);

  // 0b. Notify admin that user entered payment section
  useEffect(() => {
    // Fire-and-forget — never block or error the payment flow
    api.post('/stocks/notify-payment-entry', { amount, type: stockId ? 'stock_buy' : 'wallet_recharge' })
      .catch(() => {}); // Silent fail
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1. Fetch Transaction & Seller Info
  useEffect(() => {
    if (!transactionId) {
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
          if (data.transaction.status === 'PENDING_VERIFICATION') {
            setTxStatus('PENDING_AUDIT');
          }
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
      autoCancel();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const autoCancel = async () => {
    try {
      if (stockId && transactionId) {
        await api.post(`/stocks/transactions/${transactionId}/cancel`);
      }
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (err) {
      router.push('/dashboard');
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // 3. App Redirect Logic
  const handleAppRedirect = (app: string) => {
    if (txStatus === 'PENDING_AUDIT') return;
    
    const upiId = transaction?.sellerId?.upiId || config?.receiverUpiId || 'neural.pay@bank';
    const upiUrl = `upi://pay?pa=${upiId}&pn=HelloPay&am=${amount}&cu=INR&tr=${transactionId || 'RECHARGE'}`;
    
    if (app === 'freecharge') {
      window.location.href = `freecharge://upi/pay?pa=${upiId}&pn=HelloPay&am=${amount}&cu=INR`;
    } else if (app === 'mobikwik') {
      window.location.href = `mobikwik://upi/pay?pa=${upiId}&pn=HelloPay&am=${amount}&cu=INR`;
    } else {
      window.location.href = upiUrl;
    }
    
    setTimeout(() => {
      window.location.href = upiUrl;
    }, 2000);
  };

  const handleManualSubmit = async () => {
    if (txStatus === 'PENDING_AUDIT') return;
    
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
    if (txStatus === 'PENDING_AUDIT') return;
    
    const stockId = searchParams.get('stockId');
    const transactionId = searchParams.get('txnId');
    
    if (stockId && transactionId) {
       api.post(`/stocks/transactions/${transactionId}/cancel`).catch(console.error);
    }
    router.push('/dashboard');
  };

  if (txStatus === 'SUCCESS' && !showSuccessPopup) {
    // Already redirecting via popup countdown, show blank
    return <div className="min-h-screen bg-slate-950" />;  
  }

  if (txStatus === 'FAILED') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-xs">
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mb-10 mx-auto shadow-2xl shadow-red-600/20">
            <XCircle className="text-white" size={48} />
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Rejected</h1>
          <p className="text-slate-500 font-bold mt-4 leading-relaxed">{rejectReason || 'Neural signals mismatched. Node released.'}</p>
          <button onClick={() => router.push('/dashboard')} className="mt-12 px-10 py-6 bg-red-700 rounded-[32px] text-white font-black uppercase italic shadow-2xl active:scale-95 transition-all w-full tracking-widest text-xs">Home Page</button>
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
            <p className="mt-4 text-[9px] text-amber-500/60 uppercase font-black animate-pulse">DO NOT RE-UPLOAD OR REFRESH</p>
            <button onClick={() => router.push('/dashboard')} className="mt-12 px-8 py-5 bg-white/5 border border-white/10 text-white rounded-[28px] font-black uppercase text-xs tracking-[0.3em] w-full">Back to Dashboard</button>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-24 max-w-lg mx-auto border-x border-white/5">
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-white/10 rounded-[40px] p-8 max-w-sm w-full shadow-2xl">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
                 <AlertCircle className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-2">Release Node?</h3>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest leading-relaxed mb-8">This node will be released back to the marketplace. Are you sure you want to abort?</p>
              <div className="flex gap-4">
                 <button onClick={() => setShowCancelModal(false)} className="flex-1 py-4 bg-white/5 rounded-2xl text-slate-400 font-black uppercase text-[10px] tracking-widest">Back</button>
                 <button onClick={handleCancel} className="flex-1 py-4 bg-red-600 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-600/20">Confirm</button>
              </div>
           </motion.div>
        </div>
      )}

      <div className="p-4 flex items-center justify-between sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
        <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><ArrowLeft size={20} /></button>
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
          
          <div className="mt-10 p-5 bg-black/40 rounded-3xl border border-white/5">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 text-center">
                {transaction?.sellerId ? `Target Node: ${transaction.sellerId.name}` : 'Neural Registry: Admin Node'}
             </p>
             <div className="flex items-center justify-between group">
                <span className="text-sm font-black text-indigo-400 font-mono tracking-tight select-all">{transaction?.sellerId?.upiId || config?.receiverUpiId || 'neural.pay@bank'}</span>
                <button onClick={() => { 
                  const copyId = transaction?.sellerId?.upiId || config?.receiverUpiId || '';
                  navigator.clipboard.writeText(copyId); 
                  setNotice({ isOpen: true, title: 'Identity Copied', message: 'The receiving node address has been bound to your clipboard for deployment.', type: 'info' });
                }} className="text-[8px] font-black bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-lg border border-indigo-500/20 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Copy</button>
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
                  disabled={txStatus === 'PENDING_AUDIT'}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Screenshot Proof</label>
                
                {screenshot ? (
                  // Show actual image preview
                  <div className="relative w-full rounded-3xl overflow-hidden border-2 border-emerald-500 bg-black">
                    <img
                      src={URL.createObjectURL(screenshot)}
                      alt="Payment Screenshot"
                      className="w-full max-h-64 object-contain"
                    />
                    {/* Overlay controls */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center gap-4 opacity-0 hover:opacity-100">
                      <button
                        onClick={() => { if (txStatusStr !== 'PENDING_AUDIT') document.getElementById('ss-node')?.click(); }}
                        className="px-4 py-2 bg-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl"
                        disabled={txStatusStr === 'PENDING_AUDIT'}
                      >Change</button>
                      <button
                        onClick={() => setScreenshot(null)}
                        className="px-4 py-2 bg-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl"
                        disabled={txStatusStr === 'PENDING_AUDIT'}
                      >Remove</button>
                    </div>
                    {/* Verified badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 bg-emerald-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <CheckCircle size={12} className="text-white" />
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">Captured</span>
                    </div>
                    <p className="absolute bottom-3 left-3 text-[9px] font-black text-white/60 uppercase tracking-widest bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
                      {screenshot.name.slice(0, 28)}{screenshot.name.length > 28 ? '...' : ''}
                    </p>
                  </div>
                ) : (
                  // Upload prompt
                  <div 
                    onClick={() => txStatusStr !== 'PENDING_AUDIT' && document.getElementById('ss-node')?.click()} 
                    className={`w-full h-32 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-2 transition-all ${txStatusStr === 'PENDING_AUDIT' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer border-white/10 bg-black/40 hover:border-indigo-500 hover:bg-indigo-500/5'}`}
                  >
                    <Zap size={24} className="text-slate-600" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tap to Attach Screenshot</span>
                  </div>
                )}
                <input id="ss-node" type="file" hidden onChange={(e) => setScreenshot(e.target.files?.[0] || null)} accept="image/*" disabled={txStatusStr === 'PENDING_AUDIT'} />
             </div>
          </div>

          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-shake">{error}</div>}

          <div className="flex gap-4">
             <button 
               onClick={() => setShowCancelModal(true)}
               className="flex-1 h-16 bg-white/5 border border-white/10 rounded-2xl text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
               disabled={txStatusStr === 'PENDING_AUDIT'}
             >
                Cancel
             </button>
             <button 
               onClick={handleManualSubmit}
               disabled={loading || !utr || !screenshot || timeLeft <= 0 || txStatus === 'PENDING_AUDIT'}
               className="flex-[2] h-16 bg-indigo-600 rounded-2xl text-white font-black uppercase italic text-xs tracking-[0.2em] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
             >
                {loading ? 'AUDITING...' : txStatus === 'PENDING_AUDIT' ? 'SIGNAL SUBMITTED' : 'Submit Verification'}
             </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {notice.isOpen && (
          <NeuralNotice 
            isOpen={notice.isOpen} 
            title={notice.title} 
            message={notice.message}
            type={notice.type}
            onClose={() => setNotice({ ...notice, isOpen: false })} 
          />
        )}
      </AnimatePresence>

      {/* Payment Success Popup */}
      <AnimatePresence>
        {showSuccessPopup && (
          <NeuralNotice
            isOpen={showSuccessPopup}
            title="Payment Successful! 🎉"
            message={`₹${amount} has been settled. Your wallet has been credited. Redirecting to home in ${redirectCountdown}s...`}
            type="info"
            onClose={() => { setShowSuccessPopup(false); router.push('/dashboard'); }}
          />
        )}
      </AnimatePresence>
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