'use client';

import { Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

function PayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const rzpOrderId = searchParams.get('rzpOrderId');
  const amount = searchParams.get('amount');
  const rzpKey = searchParams.get('rzpKey');
  const transactionId = searchParams.get('txnId');
  const buyerName = searchParams.get('name') || 'HelloPay User';
  const buyerEmail = searchParams.get('email') || 'user@hellopay.io';

  const [paymentMethod, setPaymentMethod] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [paymentApp, setPaymentApp] = useState('freecharge');
  const [config, setConfig] = useState<any>(null);

  // Fetch Payment Config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get('/wallet/config');
        setConfig(data);
      } catch (err) {
        console.error('Neural Link Error:', err);
      }
    };
    fetchConfig();
  }, []);

  // Poll for Transaction Success (after payment)
  useEffect(() => {
    if (!transactionId || txStatus === 'SUCCESS') return;

    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/stocks/transactions/${transactionId}`);
        if (data.success && data.transaction.status === 'SUCCESS') {
          setTxStatus('SUCCESS');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Neural Sync Loss:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [transactionId, txStatus]);

  const handleRazorpayPayment = () => {
    if (!isScriptLoaded || !rzpOrderId || !rzpKey) {
      setError('Neural Link Fault: Razorpay SDK not initialized.');
      return;
    }

    setLoading(true);

    const options = {
      key: rzpKey,
      amount: Number(amount) * 100,
      currency: "INR",
      name: "HelloPay Neural",
      description: "Asset Node Settlement",
      order_id: rzpOrderId,
      handler: async function (response: any) {
        setLoading(true);
        try {
          await api.post('/payments/verify-payment', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          setTxStatus('SUCCESS');
        } catch (err) {
          setError('Neural Verification Failed: Signature Mismatch or Logic Fault.');
          setLoading(false);
        }
      },
      prefill: {
        name: buyerName,
        email: buyerEmail
      },
      theme: { color: "#10b981" },
      modal: { ondismiss: () => setLoading(false) }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
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
    const formData = new FormData();
    formData.append('amount', amount || '0');
    formData.append('utr', utr);
    formData.append('screenshot', screenshot);
    formData.append('paymentApp', paymentApp);
    if (searchParams.get('stockId')) {
      formData.append('stockId', searchParams.get('stockId') || '');
    }

    try {
      const { data } = await api.post('/payments/submit-proof', formData, {
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

  if (txStatus === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-xs">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-10 mx-auto shadow-2xl shadow-emerald-200">
            <CheckCircle className="text-white" size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Settled!</h1>
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

  if (txStatus === 'PENDING_AUDIT') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
         <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-xs">
            <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mb-10 mx-auto shadow-2xl shadow-amber-200 animate-pulse">
               <Zap className="text-white fill-white" size={40} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">Verifying Proof...</h1>
            <p className="text-slate-500 font-bold mt-4 leading-relaxed italic uppercase text-[10px] tracking-[0.2em]">Our neural nodes are auditing your signal. Balance will merge instantly upon approval.</p>
            <div className="mt-10 p-5 bg-white border border-slate-100 rounded-[30px] flex items-center justify-center gap-3">
               <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Neural Status: AWAITING_ADMIN</span>
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="mt-10 px-8 py-5 bg-slate-900 text-white rounded-[28px] font-black uppercase text-xs tracking-[0.3em] italic w-full"
            >
              Back to Dashboard
            </button>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 max-w-lg mx-auto shadow-2xl border-x border-slate-100">
      <div className="bg-white p-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-50 shadow-sm">
        <button onClick={() => router.back()} className="p-1.5 border border-slate-100 rounded-xl text-slate-400 hover:bg-slate-50 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-base font-black italic uppercase text-slate-800 tracking-tighter leading-none">Neural Checkout</h1>
          <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">Secure FastSpring Gateway</p>
        </div>
        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
           <ShieldCheck size={20} />
        </div>
      </div>

      <div className="p-8">
        <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden mb-12 text-center">
          <div className="absolute top-0 right-0 w-32 h-24 bg-emerald-500/10 rounded-full blur-[50px]" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 block italic">Settlement Amount</span>
          <div className="text-6xl font-black italic tracking-tighter tabular-nums mb-6 drop-shadow-[0_4px_12px_rgba(255,255,255,0.1)]">₹{amount}</div>
          
          <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/10 mt-6 overflow-hidden">
             <button 
               onClick={() => setPaymentMethod('AUTO')}
               className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${paymentMethod === 'AUTO' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
             >
                Razorpay Core
             </button>
             <button 
               onClick={() => setPaymentMethod('MANUAL')}
               className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${paymentMethod === 'MANUAL' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
             >
                UPI Manual
             </button>
          </div>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase italic tracking-widest animate-shake">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {paymentMethod === 'AUTO' ? (
            <button 
              onClick={handleRazorpayPayment}
              disabled={loading || !isScriptLoaded}
              className={`w-full py-8 text-white rounded-[32px] flex flex-col items-center justify-center gap-1 font-black uppercase italic shadow-2xl transition-all group disabled:opacity-50 ${loading ? 'bg-slate-500 cursor-not-allowed' : 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700 active:scale-95'}`}
            >
              {loading ? (
                <span className="animate-pulse tracking-[0.3em]">INITIALIZING...</span>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Zap className="fill-white group-hover:animate-bounce" size={24} /> 
                    <span className="text-xl">Fast Pay</span>
                  </div>
                  <span className="text-[9px] opacity-70 tracking-widest not-italic">Autonomous Razorpay Node</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm space-y-5">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Receiver UPI Node</p>
                     <p className="text-lg font-black font-mono text-emerald-600 select-all tracking-tight">
                        {config?.receiverUpiId || 'neural.pay@bank'}
                     </p>
                  </div>

                  <div className="space-y-5">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">UTR / Transaction ID</label>
                        <input 
                          type="text"
                          placeholder="12-22 digit code"
                          className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-sm font-black text-slate-900 focus:border-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-300 tracking-widest"
                          value={utr}
                          onChange={(e) => setUtr(e.target.value)}
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Payment App</label>
                        <select 
                          className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-xs font-black text-slate-900 focus:border-blue-600 focus:bg-white outline-none transition-all appearance-none italic"
                          value={paymentApp}
                          onChange={(e) => setPaymentApp(e.target.value)}
                        >
                           <option value="freecharge">Freecharge</option>
                           <option value="mobikwik">Mobikwik</option>
                           <option value="gpay">Google Pay</option>
                           <option value="other">Other UPI</option>
                        </select>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Screenshot Proof</label>
                        <div 
                          onClick={() => document.getElementById('ss-upload')?.click()}
                          className={`w-full h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${screenshot ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-blue-500 hover:bg-blue-50'}`}
                        >
                           <input id="ss-upload" type="file" hidden onChange={(e) => setScreenshot(e.target.files?.[0] || null)} accept="image/*" />
                           {screenshot ? (
                             <>
                               <CheckCircle size={20} className="text-emerald-500" />
                               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{screenshot.name.slice(0, 20)}...</span>
                             </>
                           ) : (
                             <>
                               <Zap size={20} className="text-slate-300" />
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Payment Screenshot</span>
                             </>
                           )}
                        </div>
                     </div>
                  </div>
               </div>

               <button 
                onClick={handleManualSubmit}
                disabled={loading || !utr || !screenshot}
                className="w-full py-8 bg-blue-600 text-white rounded-[32px] flex flex-col items-center justify-center gap-1 font-black uppercase italic shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
               >
                  {loading ? (
                    <span className="animate-pulse tracking-[0.3em]">PROCESSING NODE...</span>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="fill-white" size={24} /> 
                        <span className="text-xl">Submit Proof</span>
                      </div>
                      <span className="text-[9px] opacity-70 tracking-widest not-italic italic">Neural Audit Required</span>
                    </>
                  )}
               </button>
            </div>
          )}

          <div className="bg-white rounded-[32px] p-6 border border-slate-100 flex items-start gap-4 shadow-sm">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
               <AlertCircle size={20} />
            </div>
            <div>
               <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Payment Instructions</h4>
               <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                 {paymentMethod === 'AUTO' 
                   ? 'Do not close this page after payment. You will be automatically redirected once our neural engine confirms the settlement.'
                   : 'Upload a clear screenshot of your transaction. Our AI scans for amount, receiver, and UTR for faster auditing.'}
               </p>
            </div>
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