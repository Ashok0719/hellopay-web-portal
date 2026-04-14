'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Lock, Eye } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 md:p-24 overflow-x-hidden">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-400 mb-12 transition-colors font-bold">
        <ArrowLeft size={20} /> Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-bold mb-6 border border-indigo-500/20 uppercase tracking-widest">
           Security Matrix
        </span>
        <h1 className="text-5xl md:text-7xl font-black mb-12 tracking-tighter italic">
           PRIVACY <span className="text-indigo-500 tracking-normal">PROTOCOL</span>
        </h1>

        <div className="space-y-16 text-slate-400 text-lg leading-relaxed font-medium">
          <section>
             <h2 className="text-2xl font-black text-slate-100 mb-6 flex items-center gap-3">
                <Eye className="text-indigo-500" /> 1. Information Acquisition
             </h2>
             <p>
                HelloPay collects only what is absolutely necessary to maintain your financial weight in the digital world. This includes your unique identity (name, phone, email) and transaction metadata for verification.
             </p>
          </section>

          <section>
             <h2 className="text-2xl font-black text-slate-100 mb-6 flex items-center gap-3">
                <Lock className="text-indigo-500" /> 2. Encryption Standards
             </h2>
             <p>
                Every byte of data you upload into the Hello is encrypted with hospital-grade SHA-256 protocols and secured behind bank-level firewalls. We never store your raw password—only cryptographic hashes.
             </p>
          </section>

          <section>
             <h2 className="text-2xl font-black text-slate-100 mb-6 flex items-center gap-3">
                <ShieldCheck className="text-indigo-500" /> 3. Third-Party Matrix
             </h2>
             <p>
                We collaborate with verified partners like Razorpay for payment orchestration. Your financial details (CVV, Card Pins) never touch HelloPay's primary core; they are processed securely by our PCI-DSS compliant partners.
             </p>
          </section>

        <section className="p-8 rounded-[40px] bg-slate-900 border border-slate-800">
           <h3 className="text-xl font-bold text-slate-100 mb-4 uppercase italic">Support Signal</h3>
           <p className="text-sm font-black text-indigo-400">support@hellopay.io</p>
           <p className="text-[10px] text-slate-600 mt-4 leading-loose uppercase tracking-widest font-black">
              Static Head node: Level 15, Eros Corporate Tower, Nehru Place, New Delhi, 110019
           </p>
        </section>
      </div>

        <div className="mt-24 pt-12 border-t border-slate-900 text-center text-slate-700 text-xs font-bold uppercase tracking-widest leading-loose">
           Copyright © 2026 Hello Financial Ecosystem. Version V1.0.0-PROD
        </div>
      </motion.div>
    </div>
  );
}
