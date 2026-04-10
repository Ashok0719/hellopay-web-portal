'use client';

import { Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Smartphone, CheckCircle, Clock, Upload, ShieldCheck, Zap, AlertCircle, Copy, Check, QrCode as QrIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

function AppButton({ icon, label, onClick, color }: { icon: string, label: string, onClick: () => void, color: string }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-[24px] shadow-sm hover:shadow-xl hover:border-slate-200 transition-all group relative overflow-hidden h-32"
    >
      <div className={`absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity ${color}`} />
      <div className="w-14 h-14 flex items-center justify-center mb-3">
        <img src={icon} alt={label} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-900 transition-colors">{label}</span>
      <div className="absolute bottom-2 right-4 opacity-0 group-hover:opacity-10 scale-0 group-hover:scale-100 transition-all">
         <Zap size={40} className="fill-slate-900 text-slate-900" />
      </div>
    </motion.button>
  );
}

function PayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const upiIntent = searchParams.get('upiIntent') || '';
  const transactionId = searchParams.get('txnId');
  const sellerIdNum = searchParams.get('sellerId');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [sellerQr, setSellerQr] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [notice, setNotice] = useState({ isOpen: false, title: '', message: '', type: 'alert' as 'alert' | 'confirm', onConfirm: () => {} });

  useEffect(() => {
    const fetchTx = async () => {
      if (!transactionId) return;
      try {
        const { data } = await api.get(`/stocks/transactions/${transactionId}`);
        if (data.success) {
           setCreatedAt(data.transaction.createdAt);
           setSellerQr(data.transaction.sellerId?.qrCode || null);
           setTxStatus(data.transaction.status);
           if (data.transaction.utr) setUtr(data.transaction.utr);
        }
      } catch (err) {
        console.error('Neural Fetch Failure:', err);
      }
    };
    fetchTx();
  }, [transactionId]);

  useEffect(() => {
    if (!createdAt) return;
    const endTime = new Date(createdAt).getTime() + 20 * 60 * 1000;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(diff);
      
      if (diff <= 0) {
        clearInterval(interval);
        setError('SESSION TIMEOUT: Decentralized window closed. Redirecting to hub...');
        setTimeout(() => router.push('/dashboard'), 3000);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [createdAt, router]);

  const [file, setFile] = useState<File | null>(null);
  const [utr, setUtr] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'verifying' | 'success' | 'failed'>('idle');
  const [showAppSelector, setShowAppSelector] = useState(false);

  const receiverUpi = upiIntent ? (upiIntent.split('pa=')[1] ? upiIntent.split('pa=')[1].split('&')[0] : 'Loading...') : 'Loading...';

  const [timeSpent, setTimeSpent] = useState<number>(0);

  const handlePayNow = (app?: string) => {
    if (!upiIntent) {
      setError("Neural Signal Lost: UPI Intent data is missing. Please re-initiate the payment.");
      return;
    }
    
    // Normalize and handle deep linking
    let finalIntent = upiIntent.startsWith('upi%3A') ? decodeURIComponent(upiIntent) : upiIntent;
    
    // Feature 2: Start Timing
    const startTime = Date.now();
    localStorage.setItem("upi_txn_start", startTime.toString());

    // Deep-linking protocol mapping
    if (app === 'paytm') finalIntent = finalIntent.replace(/upi:\/\//i, 'paytmmp://');
    else if (app === 'phonepe') finalIntent = finalIntent.replace(/upi:\/\//i, 'phonepe://');
    else if (app === 'gpay') {
      // Neural Fix: GPay (Tez) protocol varies by device, upi:// is safest fallback but tez:// forces gPay
      finalIntent = finalIntent.replace(/upi:\/\//i, 'tez://upi/'); 
    }
    else if (app === 'freecharge') {
      finalIntent = finalIntent.replace(/upi:\/\//i, 'freecharge://');
    }
    
    console.log('[Neural Redirect]', finalIntent);
    
    try {
      // 1. Direct location change (Standard for most mobile browsers)
      window.location.href = finalIntent;
      
      // 2. Fallback instructions if app doesn't open
      setTimeout(() => {
        setNotice({
          isOpen: true,
          title: "App Link Signal Weak",
          message: "Could not establish neural link to the app automatically. Please copy the UPI ID and pay manually to secure your position.",
          type: 'alert',
          onConfirm: () => {}
        });
      }, 5000);
    } catch (e) {
      console.error('Redirect Error:', e);
    }

    setShowAppSelector(false);
  };

  const copyUpi = () => {
    if (receiverUpi) {
      navigator.clipboard.writeText(decodeURIComponent(receiverUpi));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const verifyPayment = async () => {
    if (!utr) {
      setError('Neural Protocol: UTR string required for signal validation.');
      return;
    }
    
    if (utr.length < 10 || utr.length > 22) {
      setError('Invalid Signal: UTR must be between 10-22 digits.');
      return;
    }

    if (!transactionId) return;
    
    setLoading(true);
    setStatus('verifying'); // This triggers the simulated polling UI
    setError('');

    try {
      // Feature: Simulated Neural Polling (UX Requirement: 3-5 retries)
      // We perform one real upload, but we'll simulate the "Neural Bottling"
      
      const formData = new FormData();
      if (file) formData.append('screenshot', file);
      formData.append('utr', utr.trim());
      formData.append('timeSpent', timeSpent.toString());

      const { data } = await api.post(`/stocks/transactions/${transactionId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Simulation of Neural Sync (3 seconds)
      await new Promise(r => setTimeout(r, 3000));

      if (data.success && data.status === 'SUCCESS') {
        setStatus('success');
      } else if (data.status === 'PENDING_REVIEW') {
        setStatus('idle'); // Status handled by the PENDING_REVIEW screen in main loop
        setTxStatus('PENDING_REVIEW');
      } else {
        setStatus('failed');
        setError(data.message || 'Verification Mismatch: Neural OCR Signal Fault.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Neural Link Fault: Connection Terminated.');
    } finally {
      setLoading(false);
    }
  };

    const handleCancelBuy = async () => {
    if (['PENDING_REVIEW', 'SUCCESS', 'FAILED'].includes(txStatus || '')) {
       setNotice({
          isOpen: true,
          title: "Restriction Active",
          message: "Cancellation is disabled because your signal is already being validated by a Neural Node.",
          type: 'alert',
          onConfirm: () => {}
       });
       return;
    }

    setNotice({
       isOpen: true,
       title: "Neural Alert",
       message: "Are you sure you want to cancel this rotation session and release the split units?",
       type: 'confirm',
       onConfirm: async () => {
          try {
            await api.post(`/stocks/transactions/${transactionId}/cancel`);
            router.push('/dashboard');
          } catch (err: any) {
            setNotice({ 
              isOpen: true, 
              title: "Link Fault", 
              message: err.response?.data?.message || "Could not establish cancel protocol.", 
              type: 'alert', 
              onConfirm: () => {} 
            });
          }
       }
    });
  };

  if (status === 'success' || txStatus === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-xs">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-10 mx-auto shadow-2xl shadow-emerald-200">
            <CheckCircle className="text-white" size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Rotation Bound!</h1>
          <p className="text-slate-500 font-bold mt-4 leading-relaxed">Neural Protocol Completed. ₹{amount} has been merged into your asset wallet.</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-12 px-10 py-6 bg-slate-900 rounded-[32px] text-white font-black uppercase italic shadow-2xl active:scale-95 transition-all w-full tracking-widest text-xs"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  if (txStatus === 'PENDING_REVIEW') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xs">
          <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mb-10 mx-auto shadow-2xl shadow-amber-200 anim-float">
            <Clock className="text-white" size={48} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">Signal In Review</h1>
          <p className="text-slate-500 font-bold mt-4 leading-relaxed italic text-sm">Our Neural OCR detected discrepancies. An admin is verifying your payment manually. Please wait...</p>
          <div className="mt-8 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
             <span className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">UTR SUBMITTED</span>
             <span className="text-lg font-black text-slate-700 italic font-mono">{utr}</span>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-12 px-10 py-5 border border-slate-200 bg-white rounded-[32px] text-slate-600 font-black uppercase italic shadow-sm active:scale-95 transition-all w-full tracking-widest text-xs"
          >
            Monitor From Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 max-w-lg mx-auto shadow-2xl border-x border-slate-100">
      
      {/* Dynamic Header */}
      <div className="bg-white p-6 flex items-center justify-between sticky top-0 z-50 border-b border-slate-50 shadow-sm">
        <button onClick={() => router.back()} className="p-2 border border-slate-100 rounded-2xl text-slate-400 hover:bg-slate-50 transition-all">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black italic uppercase text-slate-800 tracking-tighter leading-none">Security Checkout</h1>
          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">HelloPay Neural Protected</p>
        </div>
        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
           <ShieldCheck size={24} />
        </div>
      </div>

      <div className="p-6">
        {/* Real-time Countdown Heartbeat */}
        {timeLeft !== null && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-amber-50 border border-amber-100 rounded-[32px] p-6 flex items-center justify-between shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-full bg-amber-500/5 -skew-x-12 translate-x-16 group-hover:translate-x-0 transition-transform duration-1000" />
            <div className="flex items-center gap-4 relative z-10">
              <div className={`p-4 bg-white rounded-2xl shadow-sm ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-amber-500 anim-float'}`}>
                <Clock size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-amber-600 tracking-[0.2em] italic mb-1">Decentralized Window</span>
                <span className={`text-3xl font-black italic tracking-tighter tabular-nums leading-none ${timeLeft < 300 ? 'text-red-600' : 'text-slate-800'}`}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${timeLeft < 300 ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-white text-slate-400 border border-slate-100 shadow-sm'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${timeLeft < 300 ? 'bg-white animate-ping' : 'bg-amber-400'}`} />
              {timeLeft < 300 ? 'Urgent Signal' : 'Signal Active'}
            </div>
          </motion.div>
        )}

        {/* Transaction Telemetry Card */}
        <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden mb-8 group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px]" />
           <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-[80px]" />
           
           <div className="relative z-10 text-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 block italic">Settlement Signal</span>
              <div className="text-6xl font-black italic tracking-tighter tabular-nums mb-4 drop-shadow-[0_4px_12px_rgba(255,255,255,0.1)]">₹{(Number(amount) || 0).toLocaleString()}</div>
              
              <div className="inline-flex flex-col items-center gap-2 p-6 bg-white/5 border border-white/10 rounded-[32px] w-full">
                 <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest italic opacity-80">You are paying to node:</h4>
                 <div className="text-xl font-black italic text-white tracking-widest leading-none mb-1 shadow-glow">{sellerIdNum || 'SYSTEM_HUB'}</div>
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Digital Asset ID Binding Verified</p>
              </div>
           </div>
        </div>

        {/* Payment Logic Matrix */}
        <div className="space-y-6">
           <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 mb-8 relative overflow-hidden">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Receiver Terminal</h3>
                  <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-widest">Online Signal</div>
               </div>

               <div className="mt-8 flex items-center gap-4 bg-slate-50 px-8 py-5 rounded-[24px] border border-slate-100 w-full group">
                 <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600"><Smartphone size={20} /></div>
                 <div className="flex-1 overflow-hidden">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">UPI Identity Profile</p>
                    <p className="text-sm font-black text-slate-700 truncate tracking-tight">{receiverUpi}</p>
                 </div>
                 <button onClick={copyUpi} className={`p-3 rounded-2xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 hover:text-emerald-600 shadow-sm'}`}>
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                 </button>
               </div>
           </div>

           <div className="space-y-4">
              <button 
                onClick={() => setShowAppSelector(!showAppSelector)}
                className="w-full py-6 bg-emerald-600 text-white rounded-[32px] flex items-center justify-center gap-4 font-black uppercase italic shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all group"
              >
                <Zap className="fill-white group-hover:animate-bounce" size={24} /> PAY WITH UPI APP
              </button>
              
              <AnimatePresence>
                 {showAppSelector && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6 overflow-hidden"
                    >
                       <div className="flex items-center justify-between px-2">
                          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] italic">Select Payment App</h4>
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <AppButton icon="https://www.vectorlogo.zone/logos/google_pay/google_pay-icon.svg" label="Google Pay" color="bg-blue-500" onClick={() => handlePayNow('gpay')} />
                          <AppButton icon="https://www.vectorlogo.zone/logos/phonepe/phonepe-icon.svg" label="PhonePe" color="bg-indigo-600" onClick={() => handlePayNow('phonepe')} />
                          <AppButton icon="https://www.vectorlogo.zone/logos/paytm/paytm-icon.svg" label="Paytm" color="bg-sky-400" onClick={() => handlePayNow('paytm')} />
                          <AppButton icon="https://img.icons8.com/color/48/freecharge.png" label="Freecharge" color="bg-orange-600" onClick={() => handlePayNow('freecharge')} />
                       </div>
                       <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest italic leading-relaxed px-8">
                         Neural Redirection: Your chosen app will initialize with target unit amount and identity pre-filled.
                       </p>
                    </motion.div>
                 )}
              </AnimatePresence>
           </div>

           <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 italic">Confirmation Portal</h3>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block ml-4 mb-3 italic">Reference ID (UTR String)</label>
                    <input 
                      type="text" 
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      placeholder="12-22 DIGIT UTR NUMBER"
                      className="w-full bg-slate-50 border border-slate-200 rounded-[24px] px-8 py-5 text-sm font-black tracking-widest focus:outline-emerald-500 placeholder:opacity-30 placeholder:italic italic"
                    />
                 </div>
                 
                 <div className="flex items-center gap-4 py-2">
                    <div className="h-px bg-slate-100 flex-1" />
                    <span className="text-[9px] font-black text-slate-300 uppercase italic">Neural Sync Or</span>
                    <div className="h-px bg-slate-100 flex-1" />
                 </div>

                 {!file ? (
                   <label className="block p-12 border-4 border-dashed border-slate-50 rounded-[40px] cursor-pointer hover:border-emerald-200 hover:bg-emerald-50/50 transition-all text-center group">
                     <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                     <div className="w-20 h-20 bg-slate-50 rounded-[32px] mx-auto flex items-center justify-center mb-6 text-slate-300 group-hover:text-emerald-500 transition-all group-hover:scale-110 shadow-inner">
                        <Upload size={32} />
                     </div>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-emerald-600 transition-colors">Attach Evidence</span>
                   </label>
                 ) : (
                   <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[32px] flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><CheckCircle size={24} /></div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Evidence Synced</span>
                            <span className="text-[9px] font-bold text-emerald-400 truncate max-w-[120px]">{file.name}</span>
                         </div>
                      </div>
                      <button onClick={() => setFile(null)} className="p-4 bg-white rounded-2xl text-slate-300 hover:text-red-500 transition-all shadow-sm">
                         <AlertCircle size={20} />
                      </button>
                   </div>
                 )}

                 {error && (
                   <div className="p-5 bg-red-50 border border-red-100 rounded-3xl text-red-500 text-[10px] font-bold leading-relaxed flex items-start gap-4">
                      <AlertCircle size={18} className="shrink-0" />
                      <div>
                         <span className="uppercase tracking-[0.2em] font-black block mb-1 underline decoration-red-200">Protocol Fault Mismatch</span>
                         {error}
                      </div>
                   </div>
                 )}

                  <p className="px-6 py-4 bg-amber-50 rounded-2xl text-[10px] font-black text-amber-600 uppercase tracking-widest text-center italic border border-amber-100">
                    Neural Instruction: After successful payment, please wait 30 seconds for signal propagation before submitting UTR.
                  </p>

                  <button 
                     onClick={verifyPayment}
                     disabled={loading || !utr}
                     className="w-full py-6 bg-slate-900 text-white font-black rounded-[32px] uppercase italic tracking-[0.1em] shadow-2xl active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-4"
                  >
                    {status === 'verifying' ? (
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                         <span className="animate-pulse tracking-[0.4em]">NEURAL SYNC...</span>
                      </div>
                    ) : (
                      <>SUBMIT IDENTITY SIGNAL <ArrowLeft className="rotate-180" size={20} /></>
                    )}
                  </button>

                  <button 
                    onClick={handleCancelBuy}
                    className="w-full py-4 bg-white border border-slate-100 text-slate-400 font-black rounded-[32px] uppercase italic tracking-[0.1em] active:scale-95 transition-all text-[10px]"
                  >
                    Cancel Order
                  </button>
              </div>
           </div>
        </div>

        <div className="mt-12 text-center">
           <div className="flex items-center justify-center gap-6 opacity-30 grayscale mb-6">
               <img src="https://www.vectorlogo.zone/logos/phonepe/phonepe-icon.svg" className="h-4" />
               <img src="https://www.vectorlogo.zone/logos/paytm/paytm-icon.svg" className="h-4" />
               <img src="https://www.vectorlogo.zone/logos/google_pay/google_pay-icon.svg" className="h-4" />
               <img src="https://img.icons8.com/color/48/amazon-pay.png" className="h-4" />
               <img src="https://img.icons8.com/color/48/freecharge.png" className="h-4" />
           </div>
           <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300 italic flex items-center justify-center gap-2">
              <ShieldCheck size={12} className="text-emerald-500" /> Neural Security Mesh Protected
           </p>
        </div>

        <NeuralNotice 
           isOpen={notice.isOpen}
           title={notice.title}
           message={notice.message}
           type={notice.type}
           onConfirm={() => {
              setNotice({ ...notice, isOpen: false });
              notice.onConfirm();
           }}
           onClose={() => setNotice({ ...notice, isOpen: false })}
        />
      </div>
    </div>
  );
}

function NeuralNotice({ isOpen, title, message, type, onConfirm, onClose }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
       <motion.div 
         initial={{ scale: 0.9, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
       >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-6 shadow-inner">
             <AlertCircle size={48} className="drop-shadow-sm" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-4 italic">{title}</h3>
          <p className="text-sm font-bold text-slate-500 leading-relaxed mb-8">{message}</p>
          
          <div className="flex flex-col gap-3">
             <button 
                onClick={onConfirm}
                className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all hover:bg-slate-800"
             >
                {type === 'confirm' ? 'Confirm Signal' : 'Understood Signal'}
             </button>
             {type === 'confirm' && (
                <button 
                   onClick={onClose}
                   className="w-full py-4 bg-white text-slate-400 rounded-[24px] font-black uppercase tracking-widest text-[9px] active:scale-95 transition-all"
                >
                   Abort
                </button>
             )}
          </div>
       </motion.div>
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