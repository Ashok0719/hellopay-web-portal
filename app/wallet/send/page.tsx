'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, ArrowLeft, Send, User, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';
import SafetyPinModal from '../../dashboard/SafetyPinModal';

export default function SendMoneyPage() {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPinModal, setShowPinModal] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();

  const handleSend = async (pin: string) => {
    if (!phone || !amount) return;
    setShowPinModal(false);
    setLoading(true);

    try {
      await api.post('/transactions/transfer', {
        receiverPhone: phone,
        amount: Number(amount),
        pin
      });
      setStep(3); // Success step
    } catch (err: any) {
      alert(err.response?.data?.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-12 transition-colors font-bold">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900 border border-slate-800 rounded-[40px] p-10 shadow-2xl"
            >
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8">
                <Send className="text-indigo-400" size={32} />
              </div>

              <h1 className="text-4xl font-black mb-2 tracking-tight">Send Money</h1>
              <p className="text-slate-500 mb-10 font-bold italic">Zero weight, zero delay.</p>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Recipient's Phone</label>
                  <div className="relative group">
                    <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 transition-colors group-focus-within:text-indigo-500" size={24} />
                    <input 
                       type="text"
                       placeholder="Enter 10-digit number"
                       className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl py-6 pl-16 pr-8 text-2xl font-black outline-none focus:border-indigo-500/50 transition-all tracking-wider"
                       value={phone}
                       onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Amount to Transfer</label>
                  <div className="relative">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-700">₹</span>
                     <input 
                        type="number"
                        placeholder="0.00"
                        className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl py-8 pl-14 pr-8 text-4xl font-black outline-none focus:border-indigo-500 transition-all font-outfit"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                     />
                  </div>
                </div>

                <div className="flex items-center gap-4 p-5 rounded-3xl bg-indigo-600/5 border border-indigo-600/10">
                   <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                      <Zap size={18} className="fill-white" />
                   </div>
                   <div className="text-xs text-indigo-100 font-bold leading-relaxed">
                      Instant transfer to any Hello wallet. No fees applied for internal weights.
                   </div>
                </div>

                <button
                  onClick={() => setShowPinModal(true)}
                  disabled={!phone || !amount}
                  className="w-full btn-primary py-6 rounded-[24px] text-xl font-black flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  Next Step <Send size={24} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-[40px] p-10 shadow-2xl text-center"
            >
              <div className="w-24 h-24 bg-indigo-600 rounded-full mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                 <User className="text-white fill-white" size={40} />
              </div>
              <h2 className="text-3xl font-black mb-2 tracking-tight">Confirm Transfer</h2>
              <p className="text-slate-500 mb-8 font-bold">Transferring to <span className="text-indigo-400">{phone}</span></p>

              <div className="text-6xl font-black mb-12 tracking-tighter text-indigo-100">
                ₹{amount}
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setShowPinModal(true)}
                  disabled={loading}
                  className="w-full btn-primary py-6 rounded-3xl text-xl font-black group flex items-center justify-center gap-3"
                >
                  {loading ? 'Confirming...' : 'CONFIRM & SEND'} <Zap className="group-hover:translate-x-1 transition-transform fill-white" />
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="w-full py-4 text-slate-500 font-bold hover:text-white transition-colors"
                >
                  Edit Details
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-slate-800 rounded-[40px] p-12 shadow-2xl text-center"
            >
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full mx-auto mb-8 flex items-center justify-center text-emerald-500">
                 <ShieldCheck size={48} />
              </div>
              <h2 className="text-3xl font-black mb-2">Weight Transferred!</h2>
              <p className="text-slate-500 mb-10 font-bold">Your transaction has been finalized in the Hello.</p>

              <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 mb-8 text-left">
                <div className="flex justify-between mb-4">
                   <span className="text-slate-500 font-bold text-xs uppercase">Amount</span>
                   <span className="font-black">₹{amount}</span>
                </div>
                <div className="flex justify-between mb-4">
                   <span className="text-slate-500 font-bold text-xs uppercase">To</span>
                   <span className="font-black">{phone}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-slate-900">
                   <span className="text-slate-500 font-bold text-xs uppercase">Status</span>
                   <span className="text-emerald-400 font-black">SUCCESS</span>
                </div>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-6 rounded-3xl bg-white text-slate-950 font-black text-xl hover:bg-slate-200 transition-colors"
              >
                Back Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <SafetyPinModal 
        isOpen={showPinModal} 
        onClose={() => setShowPinModal(false)} 
        onConfirm={(pin) => {
          if (step === 1) {
            setShowPinModal(false);
            setStep(2);
          } else {
            handleSend(pin);
          }
        }}
        title="Authorize Transfer"
        message={`Authorize transfer of ₹${amount} to ${phone} using your 4-digit Security PIN.`}
        isLoading={loading}
      />
    </div>
  );
}
