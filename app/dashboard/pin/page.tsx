'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

export default function ChangePin() {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleUpdate = async () => {
    if (newPin !== confirmPin) {
      setStatus('error');
      setMessage('New PINs do not match');
      return;
    }
    if (newPin.length !== 4 || oldPin.length !== 4) {
      setStatus('error');
      setMessage('PIN must be 4 digits');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    try {
      const { data } = await api.post('/auth/change-pin', { oldPin, newPin });
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setTimeout(() => router.back(), 2000);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Verification Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans max-w-lg mx-auto shadow-2xl overflow-hidden relative border-x border-slate-200">
      {/* Header */}
      <div className="bg-white p-6 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100">
        <button onClick={() => router.back()} className="p-2 border border-slate-100 rounded-2xl text-slate-400 hover:bg-slate-50 transition-all">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black italic uppercase text-slate-800 tracking-tighter leading-none">Neural PIN Vault</h1>
          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">Identity Security Protocol</p>
        </div>
        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
           <ShieldCheck size={24} />
        </div>
      </div>

      <div className="p-8">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-emerald-500/20">
           <Lock className="text-emerald-600" size={32} />
        </div>

        <div className="space-y-8">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-3 ml-2 italic">Current Security PIN</label>
            <input 
              type="password"
              maxLength={4}
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
              placeholder="****"
              className="w-full px-8 py-5 bg-white border border-slate-100 rounded-[32px] text-lg font-black placeholder:opacity-20 focus:outline-emerald-500 shadow-sm text-center tracking-[1em]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-3 ml-2 italic">New 4-Digit PIN</label>
            <input 
              type="password"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="****"
              className="w-full px-8 py-5 bg-white border border-slate-100 rounded-[32px] text-lg font-black placeholder:opacity-20 focus:outline-emerald-500 shadow-sm text-center tracking-[1em]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-3 ml-2 italic">Confirm New PIN</label>
            <input 
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="****"
              className="w-full px-8 py-5 bg-white border border-slate-100 rounded-[32px] text-lg font-black placeholder:opacity-20 focus:outline-emerald-500 shadow-sm text-center tracking-[1em]"
            />
          </div>

          {status === 'error' && (
            <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-3xl text-red-600 italic">
               <AlertCircle size={20} className="shrink-0 mt-1" />
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest mb-1 underline">Security Mismatch</span>
                  <span className="text-xs font-bold">{message}</span>
               </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-start gap-4 p-5 bg-emerald-50 border border-emerald-100 rounded-3xl text-emerald-600 italic">
               <CheckCircle size={20} className="shrink-0 mt-1" />
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest mb-1 underline">Registry Sync SUCCESS</span>
                  <span className="text-xs font-bold">{message}</span>
               </div>
            </div>
          )}

          <button 
            onClick={handleUpdate}
            disabled={isLoading || oldPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4}
            className="w-full py-6 bg-slate-900 text-white font-black uppercase italic tracking-widest rounded-[32px] shadow-2xl active:scale-95 transition-all text-sm disabled:opacity-20 hover:bg-slate-800"
          >
            {isLoading ? 'Updating Vault...' : 'Update Neural PIN'}
          </button>
        </div>

        <div className="mt-12 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 italic flex items-center justify-center gap-2">
               <ShieldCheck size={12} className="text-emerald-500" /> Neural Link Active
            </p>
        </div>
      </div>
    </div>
  );
}
