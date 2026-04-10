'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Wallet, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  config: any;
  onWithdraw: (newBalance: number) => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, user, config, onWithdraw }) => {
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) < (config?.minWithdrawal || 500)) {
        return setError(`Minimal output threshold is ₹${config?.minWithdrawal || 500}`);
    }
    
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/transactions/withdraw', {
        amount: Number(amount),
        pin
      });
      setSuccess(true);
      setTimeout(() => {
        onWithdraw(data.newBalance);
        onClose();
        setSuccess(false);
        setAmount('');
        setPin('');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Withdrawal Protocol Failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-slate-950/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
        >
          <button onClick={onClose} className="absolute right-8 top-8 text-slate-400 hover:text-slate-900 transition-colors">
            <X size={24} />
          </button>

          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
               <Wallet className="text-indigo-600" size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Neural Asset Output</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Available: ₹{user?.walletBalance?.toLocaleString()}</p>
          </div>

          <AnimatePresence mode="wait">
            {!success ? (
              <motion.form key="form" onSubmit={handleWithdraw} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Withdrawal Power (₹)</label>
                  <input 
                    type="number" required placeholder="0.00"
                    className="w-full bg-slate-100 border-2 border-transparent rounded-2xl p-5 text-slate-900 font-black text-2xl outline-none focus:border-indigo-600/20 transition-all"
                    value={amount} onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Verify Safety PIN</label>
                  <input 
                    type="password" maxLength={4} required placeholder="••••"
                    className="w-full bg-slate-100 border-2 border-transparent rounded-2xl p-5 text-center text-slate-900 font-black text-2xl tracking-[1rem] outline-none focus:border-indigo-600/20 transition-all font-mono"
                    value={pin} onChange={(e) => setPin(e.target.value)}
                  />
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3">
                    <AlertCircle size={18} />
                    <p className="text-[10px] font-bold uppercase tracking-tight">{error}</p>
                  </motion.div>
                )}

                <button 
                  type="submit" disabled={loading}
                  className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2rem] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3"
                >
                  {loading ? 'PROCESSING...' : 'INITIALIZE ROTATION'}
                  <Zap size={18} className="fill-current" />
                </button>
              </motion.form>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                 <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck size={40} />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 uppercase italic">Withdrawal Scheduled</h3>
                 <p className="text-xs text-slate-500 font-bold mt-2">The system is validating the transaction queue.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WithdrawModal;
