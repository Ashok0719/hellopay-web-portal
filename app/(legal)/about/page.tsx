'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Target, Cpu, Globe } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 md:p-24 overflow-x-hidden pt-40">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-400 mb-12 transition-colors font-bold">
        <ArrowLeft size={20} /> Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-4xl mx-auto"
      >
        <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-black mb-6 border border-emerald-500/20 uppercase tracking-widest leading-none">
           Neural Mission
        </span>
        <h1 className="text-5xl md:text-7xl font-black mb-12 tracking-tighter italic uppercase text-white">
           THE HELLOPAY <span className="text-emerald-500">PROTOCOL</span>
        </h1>

        <div className="space-y-16 text-slate-400 text-lg leading-relaxed font-medium">
           <section>
              <h2 className="text-2xl font-black text-slate-100 mb-6 flex items-center gap-3 italic uppercase">
                 <Globe size={24} className="text-emerald-500 underline" /> 01. The Ecosystem
              </h2>
              <p>
                 HelloPay is a high-velocity P2P asset rotation engine designed to democratize access to stock marketplace liquidity. We specialize in secure, UPI-verified claims and real-time financial settlement between distributed nodes.
              </p>
           </section>

           <section>
              <h2 className="text-2xl font-black text-slate-100 mb-6 flex items-center gap-3 italic uppercase">
                 <Cpu size={24} className="text-indigo-500" /> 02. The Neural Core
              </h2>
              <p>
                 At our heart lies the HelloPay Neural Protocol—an advanced cryptographic framework that ensures every transaction is binded to a unique UPI identity, eliminating fraud and ensuring 100% settlement transparency.
              </p>
           </section>

           <section>
              <h2 className="text-2xl font-black text-slate-100 mb-6 flex items-center gap-3 italic uppercase">
                 <Target size={24} className="text-emerald-500" /> 03. The Mission
              </h2>
              <p>
                 Our mission is to eliminate friction in the Indian P2P finance space. By leveraging the power of UPI and atomic stock rotation, we enable users to manage and trade digital assets with banking-grade security and consumer-grade speed.
              </p>
           </section>
        </div>

        <div className="mt-24 pt-12 border-t border-slate-900 text-center text-slate-700 text-xs font-bold uppercase tracking-widest leading-loose">
           Copyright © 2026 Hello Financial Ecosystem. V1.0.0-PROD
        </div>
      </motion.div>
    </div>
  );
}
