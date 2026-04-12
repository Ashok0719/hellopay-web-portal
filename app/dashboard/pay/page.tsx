'use client';

import { Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Smartphone, CheckCircle, Clock, Upload, ShieldCheck, Zap, AlertCircle, Copy, Check, QrCode as QrIcon, ChevronLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

function AppButton({ icon, label, onClick, color }: { icon: string, label: string, onClick: () => void, color: string }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.button 
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-[24px] shadow-sm hover:shadow-xl hover:border-slate-200 transition-all group relative overflow-hidden h-32"
    >
      <div className={`absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity ${color}`} />
      <div className="w-14 h-14 flex items-center justify-center mb-3">
        {!imgError ? (
          <img 
            src={icon} 
            alt={label} 
            onError={() => setImgError(true)}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
             <Smartphone size={32} />
          </div>
        )}
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-900 transition-colors text-center">{label}</span>
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
  const [sellerName, setSellerName] = useState<string | null>(null);
  const [sellerIdDisplay, setSellerIdDisplay] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [notice, setNotice] = useState({ isOpen: false, title: '', message: '', type: 'alert' as 'alert' | 'confirm', onConfirm: () => {} });
  const [isIntentModalOpen, setIsIntentModalOpen] = useState(false);
  const [currentIntentUrl, setCurrentIntentUrl] = useState('');
  const [selectedAppName, setSelectedAppName] = useState('');


  useEffect(() => {
    const fetchTx = async () => {
      if (!transactionId) return;
      try {
        const { data } = await api.get(`/stocks/transactions/${transactionId}`);
        if (data.success) {
           setCreatedAt(data.transaction.createdAt);
           setSellerQr(data.transaction.sellerId?.qrCode || null);
           setSellerName(data.transaction.sellerId?.name || null);
           setSellerIdDisplay(data.transaction.sellerId?.userIdNumber || null);
           if (data.transaction.status === 'SUCCESS') {
          router.push('/dashboard');
          return;
        }
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
  const [scanResults, setScanResults] = useState<{ amountMatch?: boolean, utrMatch?: boolean, upiMatch?: boolean } | null>(null);
  const [showAppSelector, setShowAppSelector] = useState(false);

  const receiverUpi = upiIntent ? (upiIntent.split('pa=')[1] ? upiIntent.split('pa=')[1].split('&')[0] : 'Loading...') : 'Loading...';

  const [timeSpent, setTimeSpent] = useState<number>(0);

  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isPaidConfirmed, setIsPaidConfirmed] = useState(false);

  const handlePayNow = (app?: string) => {
    if (isCooldown) return;
    if (!upiIntent) {
      setError("Neural Signal Lost: UPI Intent data is missing. Please re-initiate the payment.");
      return;
    }
    
    // Feature: ANTI-MULTI-CLICK / COOLDOWN (As Requested)
    setIsCooldown(true);
    setCooldownRemaining(10);
    const cooldownTimer = setInterval(() => {
       setCooldownRemaining(prev => {
          if (prev <= 1) {
             clearInterval(cooldownTimer);
             setIsCooldown(false);
             return 0;
          }
          return prev - 1;
       });
    }, 1000);

    // Standardize deep linking (Requirement: Bypass ERR_UNKNOWN_URL_SCHEME)
    let finalIntent = upiIntent.startsWith('upi%3A') ? decodeURIComponent(upiIntent) : upiIntent;
    
    // Feature: Pattern Detection Bypass (Requirement: Verified Note)
    const uniqueNote = `HPY${Date.now().toString().slice(-6)}`;
    if (finalIntent.includes('?')) finalIntent += `&tn=${uniqueNote}`;
    else finalIntent += `?tn=${uniqueNote}`;

    setCurrentIntentUrl(finalIntent);
    setSelectedAppName(app?.toUpperCase() || 'UPI APP');
    setIsIntentModalOpen(true);

    // Requirement: WEB + APK Communication (JS Bridge)
    if ((window as any).AndroidBridge) {
        (window as any).AndroidBridge.startUPIPayment(amount, receiverUpi, "HelloPay");
        setIsCooldown(true);
        // Cooldown handled in native too but we lock web UI
    } else if (isMobile) {
      window.location.href = finalIntent;
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
      // Feature: Instant UTR Settlement (Requirement: No Screenshot Necessary)
      const formData = new FormData();
      if (file) formData.append('screenshot', file);
      formData.append('utr', utr.trim());
      formData.append('timeSpent', timeSpent.toString());

      // We allow submission even without 'file' - Backend will handle UTR-only verification
      const { data } = await api.post(`/stocks/transactions/${transactionId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Extract results from neural engine
      if (data.results) {
         setScanResults(data.results);
      }

      if (data.success && data.status === 'SUCCESS') {
        setStatus('success');
      } else if (data.status === 'PENDING_VERIFICATION') {
        setStatus('idle'); 
        setTxStatus('PENDING_VERIFICATION');
      } else {
        setStatus('failed');
        setError(data.message || 'Verification Mismatch: Neural OCR Signal Fault.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Neural Link Fault: Connection Terminated.';
      setError(msg);
      
      // Feature: Fraud Ejection (Requirement: Failed & Auto-Redirect)
      if (msg.includes('Fraud Detected')) {
         setStatus('failed');
         setTimeout(() => router.push('/dashboard'), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

    const handleCancelBuy = async () => {
    if (['PENDING_VERIFICATION', 'SUCCESS', 'FAILED'].includes(txStatus || '')) {
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
      <div className="bg-white p-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-50 shadow-sm">
        <button onClick={() => router.back()} className="p-1.5 border border-slate-100 rounded-xl text-slate-400 hover:bg-slate-50 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-base font-black italic uppercase text-slate-800 tracking-tighter leading-none">Security Checkout</h1>
          <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">HelloPay Neural Protected</p>
        </div>
        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
           <ShieldCheck size={20} />
        </div>
      </div>

      <div className="p-4">
        {/* Real-time Countdown Heartbeat */}
        {timeLeft !== null && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-amber-50 border border-amber-100 rounded-[24px] p-4 flex items-center justify-between shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-full bg-amber-500/5 -skew-x-12 translate-x-16 group-hover:translate-x-0 transition-transform duration-1000" />
            <div className="flex items-center gap-3 relative z-10">
              <div className={`p-3 bg-white rounded-xl shadow-sm ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-amber-500 anim-float'}`}>
                <Clock size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-amber-600 tracking-[0.2em] italic mb-0.5">Neural Session</span>
                <span className={`text-2xl font-black italic tracking-tighter tabular-nums leading-none ${timeLeft < 300 ? 'text-red-600' : 'text-slate-800'}`}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${timeLeft < 300 ? 'bg-red-500 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 shadow-sm'}`}>
              {timeLeft < 300 ? 'Urgent' : 'Active'}
            </div>
          </motion.div>
        )}

        {/* Transaction Telemetry Card */}
        <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl relative overflow-hidden mb-4 group">
           <div className="absolute top-0 right-0 w-32 h-24 bg-emerald-500/10 rounded-full blur-[50px]" />
           
           <div className="relative z-10 text-center">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 block italic">Settlement Signal</span>
              <div className="text-4xl font-black italic tracking-tighter tabular-nums mb-3 drop-shadow-[0_4px_12px_rgba(255,255,255,0.1)]">₹{(Number(amount) || 0).toLocaleString()}</div>
              
              <div className="inline-flex flex-col items-center gap-1.5 p-4 bg-white/5 border border-white/10 rounded-[24px] w-full">
                 <h4 className="text-[8px] font-black uppercase text-emerald-400 tracking-widest italic opacity-80">Receiving Node:</h4>
                 <div className="text-base font-black italic text-white tracking-widest leading-none mb-0.5">{sellerName || 'SYSTEM_HUB'}</div>
                 <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Digital Asset Binding Verified</p>
              </div>
           </div>
        </div>

        {/* Payment Logic Matrix */}
        <div className="space-y-4">
           <div className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 mb-4 relative overflow-hidden text-center">
               <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 italic">Receiver Identity</h3>

               <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-[20px] border border-slate-100 w-full group">
                 <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-600"><Smartphone size={16} /></div>
                 <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-black text-slate-700 truncate tracking-tight">{receiverUpi}</p>
                 </div>
                 <button onClick={copyUpi} className={`p-2 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 hover:text-emerald-600 shadow-sm'}`}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                 </button>
               </div>
           </div>

           <div className="space-y-4">
               <button 
                 onClick={() => !isCooldown && setShowAppSelector(!showAppSelector)}
                 disabled={isCooldown}
                 className={`w-full py-6 text-white rounded-[32px] flex items-center justify-center gap-4 font-black uppercase italic shadow-2xl transition-all group disabled:opacity-50 ${isCooldown ? 'bg-slate-500 cursor-not-allowed' : 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700 active:scale-95'}`}
               >
                 {isCooldown ? (
                    <>
                      <Clock className="animate-spin" size={24} /> 
                      PROCESSING... ({cooldownRemaining}s)
                    </>
                 ) : (
                    <>
                      <Zap className="fill-white group-hover:animate-bounce" size={24} /> 
                      PAY WITH UPI APP
                    </>
                 )}
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
                           <AppButton icon="/logos/freecharge.png" label="Freecharge" color="bg-orange-600" onClick={() => handlePayNow('freecharge')} />
                           <AppButton icon="https://upload.wikimedia.org/wikipedia/commons/9/91/MobiKwik_logo.png" label="Mobikwik" color="bg-blue-700" onClick={() => handlePayNow('mobikwik')} />
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest italic leading-relaxed px-8">
                          Neural Redirection: Your chosen app will initialize with target unit amount and identity pre-filled.
                        </p>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>

            {/* Step 2: Confirmation Gate (Requirement 4) */}
            {!isPaidConfirmed && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="mt-4 p-5 bg-amber-50 rounded-[32px] border border-amber-100 text-center"
               >
                  <p className="text-[9px] font-black uppercase text-amber-600 tracking-widest mb-4 italic leading-relaxed">
                     Switch back after paying to submit reference ID.
                  </p>
                  <button 
                    onClick={() => setIsPaidConfirmed(true)}
                    className="w-full py-4 bg-white border border-amber-200 text-amber-600 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                     <CheckCircle size={16} /> I HAVE PAID
                  </button>
               </motion.div>
            )}

            <AnimatePresence>
               {isPaidConfirmed && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 mt-8 overflow-hidden"
                  >
                     {/* Feature: Neural Auto-Verify HUD (Requirement: Fix UI mismatch) */}
                     {(typeof window !== 'undefined' && (window as any).AndroidBridge) ? (
                        <div className="flex flex-col items-center py-6 text-center space-y-6">
                           <div className="relative">
                              <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                 <Zap className="text-indigo-500 fill-indigo-500 animate-pulse" size={28} />
                              </div>
                           </div>
                           
                           <div>
                              <h3 className="text-lg font-black text-slate-900 italic uppercase tracking-tighter mb-1">Neural Auto-Verify Active</h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed px-4">
                                 NPCI SECURITY PROTOCOL: IF AUTO-REDIRECT IS BLOCKED, USE THE BUTTON BELOW.
                              </p>
                           </div>

                           <motion.button 
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                 const bridge = (window as any).AndroidBridge;
                                 if (bridge) {
                                    bridge.copyToClipboard(receiverUpi);
                                    bridge.startUPIPayment(amount, receiverUpi, sellerName || 'HelloPay Merchant');
                                 }
                              }}
                              className="w-full py-5 px-6 bg-slate-900 text-white rounded-[24px] font-black uppercase italic tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-indigo-500/20"
                           >
                              <Copy size={20} /> Copy ID & Open GPay
                           </motion.button>
                           
                           <p className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-4 py-2 rounded-lg uppercase tracking-widest animate-pulse">
                              Signal Detection Active: No Need to Submit UTR
                           </p>
                        </div>
                     ) : (
                        <>
                           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 italic">Confirmation Portal</h3>
                        </>
                     )}
                  </motion.div>
               )}
            </AnimatePresence>

                     <div className="space-y-6">
                        {/* Manual Verification Gate (Hidden in APK) */}
                        {!(typeof window !== 'undefined' && (window as any).AndroidBridge) && (
                          <>
                             <div className="mt-4">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block ml-4 mb-2 italic">Transaction ID (UTR)</label>
                                <input 
                                  type="text" 
                                  value={utr}
                                  onChange={(e) => setUtr(e.target.value)}
                                  placeholder="12-DIGIT ID"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-[20px] px-6 py-4 text-sm font-black tracking-[0.2em] focus:outline-emerald-500 placeholder:opacity-30 italic"
                                />
                             </div>
                             
                             <div className="flex items-center gap-4 py-1">
                                <div className="h-px bg-slate-100 flex-1" />
                                <span className="text-[8px] font-black text-slate-300 uppercase italic">Or Pulse Evidence</span>
                                <div className="h-px bg-slate-100 flex-1" />
                             </div>
 
                             {!file ? (
                               <label className="block p-5 border-2 border-dashed border-slate-100 rounded-[32px] cursor-pointer hover:border-emerald-200 hover:bg-emerald-50/50 transition-all text-center group">
                                 <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                 <div className="flex items-center justify-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-emerald-500 transition-all shadow-inner">
                                       <Upload size={20} />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-emerald-600 transition-colors">Attach Proof</span>
                                 </div>
                               </label>
                             ) : (
                               <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-[24px] flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><CheckCircle size={20} /></div>
                                     <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">Evidence Synced</span>
                                     </div>
                                  </div>
                                  <button onClick={() => setFile(null)} className="p-2 bg-white rounded-xl text-slate-300 hover:text-red-500 transition-all shadow-sm">
                                     <AlertCircle size={16} />
                                  </button>
                               </div>
                             )}
 
                              <button 
                                 onClick={verifyPayment}
                                 disabled={loading || !utr}
                                 className="w-full py-5 bg-slate-900 text-white font-black rounded-[28px] uppercase italic tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-4 text-xs"
                              >
                                {status === 'verifying' ? (
                                  <span className="animate-pulse tracking-[0.3em]">SYNCHRONIZING...</span>
                                ) : (
                                  <>SUBMIT SIGNAL <Zap size={16} className="fill-white" /></>
                                )}
                              </button>
                          </>
                        )}
                        
                        <button 
                           onClick={handleCancelBuy}
                           className="w-full py-4 bg-white border border-slate-100 text-slate-400 font-black rounded-[32px] uppercase italic tracking-[0.1em] active:scale-95 transition-all text-[10px]"
                        >
                           Cancel Order
                        </button>
                     </div>
        </div>

        <div className="mt-12 text-center">
           <div className="flex items-center justify-center gap-6 opacity-30 grayscale mb-6">
               <img src="/logos/freecharge.png" className="h-4" />
               <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/MobiKwik_logo.png" className="h-4" />
           </div>
           <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300 italic flex items-center justify-center gap-2">
              <ShieldCheck size={12} className="text-emerald-500" /> Neural Security Mesh Protected
           </p>
        </div>

        {txStatus === 'PENDING_VERIFICATION' && (
           <div className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center p-8 text-center">
              <div className="relative mb-10 scale-125">
                 <div className="w-24 h-24 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck className="text-emerald-500" size={32} />
                 </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter mb-4">Verifying Signal</h2>
              
              {/* Neural Scan HUD */}
              <div className="w-full max-w-xs space-y-3 mb-10">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-400">Asset Value</span>
                    <span className={`text-[10px] font-black uppercase ${scanResults?.amountMatch ? 'text-emerald-500' : 'text-amber-500'}`}>
                       {scanResults ? (scanResults.amountMatch ? 'COMPLETE' : 'FAILED') : 'SCANNING...'}
                    </span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-400">Reference Signal</span>
                    <span className={`text-[10px] font-black uppercase ${scanResults?.utrMatch ? 'text-emerald-500' : 'text-amber-500'}`}>
                       {scanResults ? (scanResults.utrMatch ? 'COMPLETE' : 'FAILED') : 'SEARCHING...'}
                    </span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-400">Receiver Identity</span>
                    <span className={`text-[10px] font-black uppercase ${scanResults?.upiMatch ? 'text-emerald-500' : 'text-amber-500'}`}>
                       {scanResults ? (scanResults.upiMatch ? 'COMPLETE' : 'FAILED') : 'VERIFYING...'}
                    </span>
                 </div>
              </div>

              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed max-w-xs mb-10">
                 The Neural OCR engine is analyzing your proof. Check the results matrix above for real-time status.
              </p>
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-10 py-4 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Return to Node
              </button>
           </div>
        )}

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

        <PaymentIntentModal 
           isOpen={isIntentModalOpen}
           onClose={() => setIsIntentModalOpen(false)}
           amount={amount || '0'}
           upiId={receiverUpi || ''}
           intentUrl={currentIntentUrl}
           sellerName={sellerName || 'HelloPay Merchant'}
           appName={selectedAppName}
           orderId={orderId || 'HP_ORD_XXX'}
        />
      </div>
    </div>
  );
}

function PaymentIntentModal({ isOpen, onClose, amount, upiId, intentUrl, sellerName, appName, orderId }: any) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isOpen && isMobile) {
      const timer = setTimeout(() => {
        window.location.href = intentUrl;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, intentUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(decodeURIComponent(upiId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const canvas = document.querySelector('.aide-qr-hidden svg');
    if (!canvas) return;
    
    const svgData = new XMLSerializer().serializeToString(canvas);
    const canvasElement = document.createElement('canvas');
    const ctx = canvasElement.getContext('2d');
    const img = new (window as any).Image();
    
    img.onload = () => {
      canvasElement.width = img.width;
      canvasElement.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvasElement.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `HelloPay_QR_${orderId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="fixed bottom-32 right-6 z-[2000] sm:bottom-10 sm:right-10">
       <div className="aide-qr-hidden hidden">
          <QRCodeSVG value={intentUrl} size={300} level="H" />
       </div>

       <motion.div 
         drag
         dragConstraints={{ left: -300, right: 0, top: -500, bottom: 0 }}
         dragElastic={0.1}
         whileDrag={{ scale: 1.05, opacity: 0.9 }}
         initial={{ scale: 0.5, opacity: 0, x: 50 }}
         animate={{ scale: 1, opacity: 1, x: 0 }}
         className="pointer-events-auto bg-slate-900 shadow-2xl rounded-[32px] p-4 flex flex-col gap-3 min-w-[200px] border border-white/10 relative group overflow-hidden cursor-move active:cursor-grabbing"
       >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          <div className="flex items-center justify-between gap-4 px-2 pointer-events-none">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">Paying Node (Draggable)</span>
                <span className="text-sm font-black text-white italic tracking-tighter">₹{amount}</span>
             </div>
             <button onClick={onClose} className="pointer-events-auto p-1.5 bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors">
                <ChevronLeft className="rotate-[270deg]" size={14} />
             </button>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 flex items-center justify-between gap-3 border border-white/5 pointer-events-none">
             <div className="flex flex-col truncate">
                <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">UPI Identity</span>
                <span className="text-[10px] font-mono text-slate-300 truncate w-24 tracking-tighter">{decodeURIComponent(upiId)}</span>
             </div>
             <button 
               onClick={handleCopy}
               className={`pointer-events-auto shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                 copied ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/10 text-slate-300 active:scale-90 hover:bg-white/20'
               }`}
             >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
             </button>
          </div>

          <div className="flex flex-col gap-2 px-1">
             <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => window.location.href = intentUrl}
                  className="pointer-events-auto py-2.5 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                   <Zap size={10} /> Retry
                </button>
                <button 
                  onClick={handleDownload}
                  className="pointer-events-auto py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 text-[8px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                   <Upload className="rotate-180" size={10} /> QR Code
                </button>
             </div>
             <p className="text-[7px] font-bold text-slate-500 uppercase text-center opacity-40 italic pointer-events-none">
                Aide Active: Open {appName} to settle
             </p>
          </div>
       </motion.div>
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
                   className="w-full py-4 bg-white text-slate-400 rounded-[24px] font-black uppercase tracking-widest text-[9px] active:scale-90 transition-all"
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