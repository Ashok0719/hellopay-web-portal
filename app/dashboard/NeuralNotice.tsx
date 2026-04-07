'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, X } from 'lucide-react';

export default function NeuralNotice({ isOpen, title, message, type = 'info', onConfirm, onClose }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl border border-white/20 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex flex-col items-center text-center relative z-10">
          <div className={`w-20 h-20 rounded-3xl mb-6 flex items-center justify-center shadow-lg ${type === 'confirm' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {type === 'confirm' ? <ShieldAlert size={40} /> : <CheckCircle2 size={40} />}
          </div>
          
          <h3 className="text-xl font-black italic text-slate-800 mb-2 uppercase tracking-tight">{title}</h3>
          <p className="text-sm font-bold text-slate-500 leading-relaxed mb-8">{message}</p>
          
          <div className="flex gap-3 w-full">
            {type === 'confirm' ? (
              <>
                <button 
                  onClick={onConfirm}
                  className="flex-1 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all"
                >
                  Confirm Signal
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-slate-100 text-slate-400 font-black uppercase tracking-widest text-[10px] rounded-2xl active:scale-95 transition-all"
                >
                  Abort
                </button>
              </>
            ) : (
              <button 
                onClick={onClose}
                className="w-full py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all"
              >
                Acknowledge Pulse
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
