'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, ArrowLeft, ShieldCheck, Zap, QrCode, Upload, CheckCircle, RefreshCw, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';

export default function AddMoneyPage() {
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [step, setStep] = useState(1); // 1: Amount, 2: Payment, 3: Verifying
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR' | 'VERIFYING'>('IDLE');
  const [scanResults, setScanResults] = useState<{ amountMatch?: boolean, utrMatch?: boolean, upiMatch?: boolean } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/wallet/config');
      setConfig(data);
    } catch (err) {
      console.error('Failed to fetch config');
    }
  };

  const generateUpiData = () => {
    if (!config || !amount) return '';
    const pa = config.receiverUpiId || 'admin@okaxis';
    const pn = 'HelloPay Admin';
    const am = amount;
    const cu = 'INR';
    const tn = `Wallet_Recharge_${user?._id?.slice(-6)}`;
    return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}&tn=${tn}`;
  };

  const [matchedSeller, setMatchedSeller] = useState<any>(null);
  
  const handleInitiateLink = async () => {
    if (!amount) return;
    setLoading(true);
    try {
      const { data } = await api.post('/wallet/match-p2p', { amount });
      if (data.success) {
        setMatchedSeller(data.seller);
        setStep(2);
      } else {
        // Fallback or message
        setMatchedSeller(null);
        setStep(2);
      }
    } catch (err) {
      console.error('Match failed, fallback to admin');
      setMatchedSeller(null);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!amount || !utr || !screenshot) {
      setErrorMessage('Neural signals incomplete: Amount, UTR, and Screenshot required.');
      return;
    }
    
    setLoading(true);
    setStep(3);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('utr', utr);
    formData.append('screenshot', screenshot);

    try {
      const { data } = await api.post('/wallet/neural-verify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Feature: Instant Verification HUD Results
      if (data.results) {
         setScanResults(data.results);
      }
      setStatus('VERIFYING');

      if (data.success) {
        setStatus('SUCCESS');
        setTimeout(() => router.push('/dashboard'), 3000);
      } else {
        // Neural Fallback: Manual Audit Required
        setStatus('ERROR');
        setErrorMessage(data.message || 'Signature unclear. Proof submitted for manual audit.');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('ERROR');
      setErrorMessage(err.response?.data?.message || 'Neural verification timed out or failed accuracy check.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiBase = (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')) || 'https://hellopay-neural-api.onrender.com';
    const base = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-3 text-slate-500 hover:text-white mb-12 transition-all font-black uppercase text-xs tracking-[0.2em] group">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center group-hover:bg-blue-600 transition-all">
            <ArrowLeft size={18} /> 
          </div>
          Return to Hub
        </Link>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="bg-slate-900/40 border border-white/5 backdrop-blur-3xl rounded-[48px] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Zap size={120} className="text-blue-500 fill-blue-500" />
              </div>

              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-10 shadow-[0_20px_40px_rgba(37,99,235,0.3)]">
                <CreditCard className="text-white" size={32} />
              </div>

              <h1 className="text-4xl font-black italic tracking-tighter mb-2 italic">Neural Recharge</h1>
              <p className="text-slate-500 mb-12 font-black uppercase text-[10px] tracking-[0.4em]">Initialize balance propagation</p>

              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="relative">
                     <span className="absolute left-8 top-1/2 -translate-y-1/2 text-4xl font-black text-slate-700">₹</span>
                     <input 
                        type="number"
                        placeholder="00"
                        className="w-full bg-slate-950/50 border-2 border-white/5 rounded-[32px] py-10 pl-16 pr-10 text-5xl font-black outline-none focus:border-blue-600 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tracking-tighter"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                     />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   {['500', '1000', '2000'].map(val => (
                     <button 
                      key={val}
                      onClick={() => setAmount(val)}
                      className="py-5 rounded-2xl border border-white/5 bg-slate-900/50 hover:bg-blue-600 hover:border-blue-500 transition-all font-black text-slate-400 hover:text-white italic tracking-tighter"
                     >
                       +₹{val}
                     </button>
                   ))}
                </div>

                <button
                  onClick={handleInitiateLink}
                  disabled={loading || !amount || Number(amount) < (config?.minDeposit || 100)}
                  className="w-full bg-blue-600 py-8 rounded-[28px] text-xl font-black flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_60px_rgba(37,99,235,0.3)] disabled:opacity-30 italic uppercase tracking-widest text-sm"
                >
                  {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Initiate Neural Link'} 
                  {!loading && <Zap size={24} className="fill-white" />}
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/40 border border-white/5 backdrop-blur-3xl rounded-[48px] p-10 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-10">
                 <button onClick={() => setStep(1)} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
                    <ArrowLeft size={20} />
                 </button>
                 <div>
                    <h2 className="text-xl font-black italic tracking-tighter">Neural Gateway 2.0</h2>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500">Auto-Verification Protocol Active</p>
                 </div>
              </div>

              <div className="bg-white/5 rounded-[40px] p-8 border border-white/5 mb-10 text-center">
                  <div className="mb-6 inline-block p-4 bg-white rounded-3xl">
                     {/* Dynamic QR Code from Seller or Config */}
                     <img 
                       src={matchedSeller?.qrCode ? getImageUrl(matchedSeller.qrCode) : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateUpiData())}`} 
                       alt="Payment QR" 
                       className="w-40 h-40"
                     />
                  </div>
                  <div className="flex flex-col gap-2">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                        {matchedSeller ? `Receiver: ${matchedSeller.name}` : 'Receiver Identity (UPI)'}
                     </p>
                     <p className="text-xl font-black font-mono text-blue-400">
                        {matchedSeller?.upiId || config?.receiverUpiId || 'admin@okaxis'}
                     </p>
                  </div>
               </div>

              <div className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-2">UTR Reference (12 Digits)</label>
                    <input 
                      type="text"
                      maxLength={12}
                      placeholder="Enter 12-digit UTR number"
                      className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-5 px-6 font-mono text-lg font-black text-blue-400 placeholder:text-slate-700 focus:border-blue-600 outline-none transition-all"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-2">Signal Proof (Screenshot)</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full py-8 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${screenshot ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-white/5 hover:border-blue-500/30 hover:bg-blue-600/5'}`}
                    >
                       <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                       {screenshot ? (
                         <>
                           <CheckCircle size={32} className="text-emerald-500" />
                           <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">{screenshot.name}</p>
                         </>
                       ) : (
                         <>
                           <Upload size={32} className="text-slate-600" />
                           <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Select Signal Image</p>
                         </>
                       )}
                    </div>
                 </div>

                 <button
                   onClick={handleVerify}
                   disabled={!utr || !screenshot || utr.length < 12}
                   className="w-full bg-white text-black py-6 rounded-3xl text-sm font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-20 flex items-center justify-center gap-3"
                 >
                   {loading ? <RefreshCw className="animate-spin" size={18} /> : null}
                   Execute Verification
                 </button>

                 <div className="flex gap-4 p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                    <Info size={18} className="text-amber-500 shrink-0" />
                    <p className="text-[9px] font-bold text-amber-500/80 leading-relaxed uppercase tracking-tight">
                       Neural 2.0 requires exact amount match. Ensure your screenshot clearly shows the UTR & amount for instant auto-verify.
                    </p>
                 </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/40 border border-white/5 backdrop-blur-3xl rounded-[48px] p-16 shadow-2xl text-center"
            >
              {(status === 'IDLE' || status === 'VERIFYING') && (
                <div className="py-10 flex flex-col items-center gap-8">
                   <div className="relative">
                      <div className="w-24 h-24 rounded-full border-4 border-blue-600/20 animate-ping absolute inset-0"></div>
                      <div className="w-24 h-24 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin relative flex items-center justify-center">
                         <Zap size={32} className="text-blue-500 fill-blue-500" />
                      </div>
                   </div>
                   <div>
                      <h2 className="text-2xl font-black italic tracking-tighter mb-8">Neural Verifying...</h2>
                      
                      {/* Neural Scan HUD */}
                      <div className="w-full max-w-xs space-y-3 mb-10 mx-auto">
                        <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                           <span className="text-[10px] font-black uppercase text-slate-500">Asset Value</span>
                           <span className={`text-[10px] font-black uppercase ${scanResults?.amountMatch ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {scanResults ? (scanResults.amountMatch ? 'COMPLETE' : 'FAILED') : 'SCANNING...'}
                           </span>
                        </div>
                        <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                           <span className="text-[10px] font-black uppercase text-slate-500">Reference Signal</span>
                           <span className={`text-[10px] font-black uppercase ${scanResults?.utrMatch ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {scanResults ? (scanResults.utrMatch ? 'COMPLETE' : 'FAILED') : 'SEARCHING...'}
                           </span>
                        </div>
                        <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                           <span className="text-[10px] font-black uppercase text-slate-500">Receiver Node</span>
                           <span className={`text-[10px] font-black uppercase ${scanResults?.upiMatch ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {scanResults ? (scanResults.upiMatch ? 'COMPLETE' : 'FAILED') : 'VERIFYING...'}
                           </span>
                        </div>
                      </div>

                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Processing UTR & Screenshot Signals</p>
                   </div>
                </div>
              )}

              {status === 'SUCCESS' && (
                 <div className="py-10 flex flex-col items-center gap-8">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center shadow-[0_20px_60px_rgba(16,185,129,0.4)]"
                    >
                       <CheckCircle size={48} className="text-white" />
                    </motion.div>
                    <div>
                       <h2 className="text-3xl font-black italic tracking-tighter text-emerald-500 mb-2">PAYMENT SUCCESSFUL</h2>
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Node Activated & Propagated</p>
                    </div>
                    <button 
                      onClick={() => router.push('/dashboard')}
                      className="px-10 py-5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20"
                    >
                      Return to Dashboard
                    </button>
                 </div>
               )}

              {status === 'ERROR' && (
                <div className="py-10 flex flex-col items-center gap-8">
                   <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-[0_20px_60px_rgba(220,38,38,0.4)]">
                      <AlertCircle size={48} className="text-white" />
                   </div>
                   <div>
                      <div className="flex flex-col gap-4">
                        <button 
                          onClick={() => { setStep(2); setStatus('IDLE'); }}
                          className="px-10 py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-xl"
                        >
                          Re-attempt Propagation
                        </button>
                        <button 
                          onClick={() => router.push('/dashboard')}
                          className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all"
                        >
                          Return to Dashboard
                        </button>
                      </div>
                   </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
