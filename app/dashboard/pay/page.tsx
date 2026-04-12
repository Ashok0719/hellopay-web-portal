'use client';

import { Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, ShieldCheck, Zap, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

function PayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const paymentUrl = searchParams.get('paymentUrl');
  const amount = searchParams.get('amount');
  const orderId = searchParams.get('orderId');
  const transactionId = searchParams.get('txnId');
  const buyerName = searchParams.get('name') || 'HelloPay User';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txStatus, setTxStatus] = useState<string | null>(null);

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

  const handleFastringPayment = () => {
    if (!paymentUrl) {
      setError('Neural Link Fault: Fastring payment signals not received.');
      return;
    }

    setLoading(true);
    // Redirect to Fastring Payment Gateway
    window.location.href = paymentUrl;
  };

  if (txStatus === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-xs">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-10 mx-auto shadow-2xl shadow-emerald-200">
            <CheckCircle className="text-white" size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Settled!</h1>
          <p className="text-slate-500 font-bold mt-4 leading-relaxed">Fastring Protocol Completed. ₹{amount} has been merged into your asset wallet.</p>
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 max-w-lg mx-auto shadow-2xl border-x border-slate-100">
      <div className="bg-white p-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-50 shadow-sm">
        <button onClick={() => router.back()} className="p-1.5 border border-slate-100 rounded-xl text-slate-400 hover:bg-slate-50 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-base font-black italic uppercase text-slate-800 tracking-tighter leading-none">Neural Checkout</h1>
          <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-0.5">Fastring App Gateway</p>
        </div>
        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
           <ShieldCheck size={20} />
        </div>
      </div>

      <div className="p-8">
        <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden mb-12 text-center group">
          <div className="absolute top-0 right-0 w-32 h-24 bg-blue-500/10 rounded-full blur-[50px]" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 block italic">Settlement Amount</span>
          <div className="text-6xl font-black italic tracking-tighter tabular-nums mb-6 drop-shadow-[0_4px_12px_rgba(255,255,255,0.1)]">₹{amount}</div>
          <div className="inline-flex flex-col items-center gap-2 p-5 bg-white/5 border border-white/10 rounded-[30px] w-full">
            <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest italic opacity-80">Fastring App Protocol</span>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Order Ref: {orderId || '...'}</p>
          </div>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase italic tracking-widest animate-shake">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button 
            onClick={handleFastringPayment}
            disabled={loading || !paymentUrl}
            className={`w-full py-8 text-white rounded-[32px] flex flex-col items-center justify-center gap-1 font-black uppercase italic shadow-2xl transition-all group disabled:opacity-50 ${loading ? 'bg-slate-500 cursor-not-allowed' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700 active:scale-95'}`}
          >
            {loading ? (
              <span className="animate-pulse tracking-[0.3em] flex items-center gap-2">
                <RefreshCw className="animate-spin" size={18} /> INITIALIZING...
              </span>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Zap className="fill-white group-hover:animate-bounce" size={24} /> 
                  <span className="text-xl">Pay with Fastring</span>
                </div>
                <span className="text-[9px] opacity-70 tracking-widest not-italic">Fast & Secure UPI Redirect</span>
              </>
            )}
          </button>

          <div className="bg-white rounded-[32px] p-6 border border-slate-100 flex items-start gap-4 shadow-sm">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
               <ShieldCheck size={20} />
            </div>
            <div>
               <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Fastring Security</h4>
               <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                 You will be redirected to the Fastring App for secure payment. Once done, stay on the app or return here for instant confirmation.
               </p>
            </div>
          </div>

          <div className="pt-8 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300 italic flex items-center justify-center gap-2">
               <ShieldCheck size={12} className="text-blue-500" /> Fastring Mesh Security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center font-black text-blue-600 uppercase tracking-[0.5em] animate-pulse italic">Connecting to Fastring...</div>}>
      <PayContent />
    </Suspense>
  );
}