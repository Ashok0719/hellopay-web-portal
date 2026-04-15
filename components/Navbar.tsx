'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center group">
          <img
            src="/hellopay-logo.png"
            alt="HelloPay"
            className="h-10 w-auto object-contain group-hover:scale-105 transition-transform"
          />
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5 focus-within:border-indigo-500/50 transition-all">
             <ShieldCheck size={14} className="text-emerald-400" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure Protocol</span>
          </div>
          <Link 
            href="/dashboard"
            className="px-6 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
          >
            Terminal
          </Link>
        </div>
      </div>
    </nav>
  );
}
