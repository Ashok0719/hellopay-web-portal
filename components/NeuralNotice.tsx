'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, Zap, AlertTriangle, X, Sparkles } from 'lucide-react';

export default function NeuralNotice({ isOpen, title, message, type = 'info', onConfirm, onClose }: any) {
  if (!isOpen) return null;

  const isConfirm = type === 'confirm';
  const isError = type === 'error';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 30 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="relative w-full max-w-sm overflow-hidden"
      >
        {/* Outer glow ring */}
        <div className={`absolute -inset-[1px] rounded-[44px] ${isError ? 'bg-gradient-to-br from-red-500/40 to-rose-500/20' : isConfirm ? 'bg-gradient-to-br from-amber-500/40 to-orange-400/20' : 'bg-gradient-to-br from-emerald-500/40 to-indigo-500/20'} blur-sm`} />
        
        {/* Main card body */}
        <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-[44px] p-8 shadow-2xl border border-white/5 overflow-hidden">
          
          {/* Background pattern */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[60px] opacity-30 ${isError ? 'bg-red-500' : isConfirm ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px]" />
            {/* Grid dots */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all active:scale-90"
          >
            <X size={14} />
          </button>

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.1 }}
              className={`w-20 h-20 rounded-[28px] mb-6 flex items-center justify-center shadow-2xl relative ${
                isError
                  ? 'bg-red-500/10 border border-red-500/20 shadow-red-500/20'
                  : isConfirm
                  ? 'bg-amber-500/10 border border-amber-500/20 shadow-amber-500/20'
                  : 'bg-emerald-500/10 border border-emerald-500/20 shadow-emerald-500/20'
              }`}
            >
              {/* Pulsing ring */}
              <div className={`absolute inset-0 rounded-[28px] animate-ping opacity-20 ${isError ? 'bg-red-500' : isConfirm ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {isError ? (
                <AlertTriangle size={36} className="text-red-400" />
              ) : isConfirm ? (
                <ShieldAlert size={36} className="text-amber-400" />
              ) : (
                <CheckCircle2 size={36} className="text-emerald-400" />
              )}
            </motion.div>

            {/* Signal tag */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 text-[9px] font-black uppercase tracking-[0.25em] border ${
                isError
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : isConfirm
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}
            >
              <Zap size={8} className="fill-current" />
              {isError ? 'Neural Alert' : isConfirm ? 'Confirmation Required' : 'Neural Signal'}
            </motion.div>

            {/* Title */}
            <motion.h3
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-black text-white mb-3 tracking-tight leading-tight"
            >
              {title}
            </motion.h3>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-sm font-medium text-slate-400 leading-relaxed mb-8 max-w-[260px]"
            >
              {message}
            </motion.p>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-3 w-full"
            >
              {isConfirm ? (
                <>
                  <button
                    onClick={onConfirm}
                    className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black uppercase tracking-[0.15em] text-[10px] rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all hover:from-emerald-400 hover:to-emerald-500 flex items-center justify-center gap-2"
                  >
                    <Zap size={12} className="fill-white" />
                    Confirm
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-4 bg-white/5 border border-white/10 text-slate-400 font-black uppercase tracking-[0.15em] text-[10px] rounded-2xl active:scale-95 transition-all hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className={`w-full py-4 font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 ${
                    isError
                      ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/20 hover:from-red-400'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400'
                  }`}
                >
                  <Sparkles size={12} />
                  Got It
                </button>
              )}
            </motion.div>

            {/* Footer */}
            <p className="mt-6 text-[8px] font-black uppercase tracking-[0.3em] text-slate-700">
              HelloPay Neural v2.0
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
