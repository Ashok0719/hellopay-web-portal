'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, X, Zap } from 'lucide-react';

interface SafetyPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  title?: string;
  message?: string;
  isLoading?: boolean;
}

export default function SafetyPinModal({ isOpen, onClose, onConfirm, title = "Safety Protocol", message = "Enter your 4-digit Security PIN to authorize this transaction.", isLoading = false }: SafetyPinModalProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => pinRefs.current[0]?.focus(), 300);
      setPin(['', '', '', '']);
    }
  }, [isOpen]);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);

    if (digit && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter' && pin.every(d => d !== '')) {
      onConfirm(pin.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!data) return;
    const newPin = [...pin];
    data.split('').forEach((char, idx) => { newPin[idx] = char; });
    setPin(newPin);
    const focusIdx = Math.min(data.length, 3);
    pinRefs.current[focusIdx]?.focus();
  };

  const isComplete = pin.every(d => d !== '');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                  <ShieldCheck size={32} />
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter mb-2">{title}</h3>
              <p className="text-xs font-bold text-slate-500 italic mb-8 leading-relaxed max-w-[240px]">
                {message}
              </p>

              <div className="flex justify-between gap-3 mb-10">
                {pin.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { pinRefs.current[idx] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    autoComplete="one-time-code"
                    className={`w-full h-16 bg-slate-50 border rounded-2xl text-center text-xl font-bold transition-all duration-300 ${pin[idx] ? 'border-indigo-400 bg-indigo-50/20 shadow-[0_4px_15px_rgba(79,70,229,0.1)]' : 'border-slate-100 bg-white'}`}
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    disabled={isLoading}
                  />
                ))}
              </div>

              <button
                onClick={() => onConfirm(pin.join(''))}
                disabled={!isComplete || isLoading}
                className={`w-full py-5 rounded-3xl text-sm font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 relative overflow-hidden ${
                  isComplete && !isLoading 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 active:scale-95' 
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Authorizing...
                  </span>
                ) : (
                  <>
                    <Zap size={16} className={isComplete ? "fill-indigo-400 text-indigo-400" : ""} />
                    Authorize Action
                  </>
                )}
              </button>
              
              <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-center gap-2 opacity-30">
                 <Lock size={12} className="text-slate-400" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Secure Node Signal v2.1</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
