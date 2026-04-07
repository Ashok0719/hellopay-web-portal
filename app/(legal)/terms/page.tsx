'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, AlertCircle, Zap } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 md:p-24 overflow-x-hidden pt-40">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-400 mb-12 transition-colors font-bold">
        <ArrowLeft size={20} /> Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-4xl mx-auto"
      >
        <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-black mb-6 border border-indigo-500/20 uppercase tracking-widest leading-none">
           Legal Matrix
        </span>
        <h1 className="text-5xl md:text-7xl font-black mb-12 tracking-tighter italic uppercase underline decoration-indigo-500 underline-offset-10">
           TERMS OF <span className="text-indigo-500 tracking-normal underline-none">ENGAGEMENT</span>
        </h1>

        <div className="space-y-16 text-slate-400 text-lg leading-relaxed font-medium">
          <section>
             <h2 className="text-2xl font-black text-slate-100 mb-6 flex items-center gap-3">
                <BookOpen size={24} className="text-indigo-500" /> 1. Acceptance
             </h2>
             <p>
                By accessing or using the HelloPay fintech platform, you agree to be bound by these Terms of Engagement. If you do not agree to all terms, you are not authorized to use the ecosystem.
             </p>
          </section>

          <section>
             <h2 className="text-2xl font-black text-slate-100 mb-6 flex items-center gap-3">
                <Zap size={24} className="text-amber-500 fill-amber-500" /> 2. User Responsibilities
             </h2>
             <p>
                You are responsible for maintaining the confidentiality of your credentials. Any transaction performed under your session will be considered your authorized activity. Ensure your mobile device is secure for OTP verification.
             </p>
          </section>

          <section>
             <h2 className="text-2xl font-black text-slate-100 mb-6 flex items-center gap-3">
                <AlertCircle size={24} className="text-red-500" /> 3. Prohibited Activities
             </h2>
             <p>
                Users must not use HelloPay for money laundering, fraudulent activities, or any illegal transactions prohibited by law. We reserve the right to freeze accounts showing suspicious behavior in coordination with legal authorities.
             </p>
          </section>

          <section className="p-8 rounded-[40px] bg-slate-900 border border-slate-800">
             <h3 className="text-xl font-bold text-slate-100 mb-4 whitespace-nowrap">GOVERNING LAW & JURISDICTION</h3>
             <p className="text-sm">
                These terms are governed by the laws of India. Any disputes arising from the use of this ecosystem shall be subject to the exclusive jurisdiction of the courts located in New Delhi.
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
