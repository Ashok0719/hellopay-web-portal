'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 md:p-24 overflow-x-hidden pt-40">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-400 mb-12 transition-colors font-bold">
        <ArrowLeft size={20} /> Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto"
      >
        <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-black mb-6 border border-emerald-500/20 uppercase tracking-widest leading-none">
           Financial Reversal
        </span>
        <h1 className="text-5xl md:text-7xl font-black mb-12 tracking-tighter italic uppercase text-white shadow-emerald-500/20">
           REFUND <span className="text-emerald-500 tracking-normal">PROTOCOL</span>
        </h1>

        <div className="space-y-16 text-slate-400 text-lg leading-relaxed font-medium">
          <section>
             <h2 className="text-2xl font-black text-slate-100 mb-6 flex items-center gap-3">
                <RefreshCw size={24} className="text-emerald-500" /> 1. Transaction Finality
             </h2>
             <p>
                HelloPay transactions are designed for instant weight transfer. Once a P2P transfer is complete, it is considered final and cannot be reversed. Verify your recipient's phone number carefully.
             </p>
          </section>

          <section>
             <h2 className="text-2xl font-black text-slate-100 mb-6 flex items-center gap-3">
                <AlertCircle size={24} className="text-amber-500" /> 2. Failed Operations
             </h2>
             <p>
                In case of a payment gateway failure (e.g., money deducted from bank but not added to wallet), user should report the transaction ID within 24 hours. Refunds in such cases are usually processed within 5-7 business days by the respective banks.
              </p>
          </section>

          <section>
             <h2 className="text-2xl font-black text-slate-100 mb-6 flex items-center gap-3">
                <ShieldCheck size={24} className="text-emerald-500" /> 3. Service Disputes
             </h2>
             <p>
                For mobile recharges or utility bill payments, refunds are subject to the respective service provider's policy. HelloPay acts as a facilitator and will provide all transaction proofs for dispute resolution.
             </p>
          </section>

          <section className="p-8 rounded-[40px] bg-slate-900 border border-slate-800">
             <h3 className="text-xl font-bold text-slate-100 mb-4 uppercase italic">Support Signal</h3>
             <p className="text-sm font-black text-emerald-400 flex items-center gap-2">
                <ShieldCheck size={16}/> support@hellopay.io
             </p>
             <p className="text-[10px] text-slate-600 mt-4 leading-loose uppercase tracking-widest font-black">
                Static Head node: Level 15, Eros Corporate Tower, Nehru Place, New Delhi, 110019
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
