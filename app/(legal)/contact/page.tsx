'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 md:p-24 overflow-x-hidden pt-40">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-400 mb-12 transition-colors font-bold">
        <ArrowLeft size={20} /> Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-sm font-black mb-6 border border-blue-500/20 uppercase tracking-widest leading-none">
           Support Node
        </span>
        <h1 className="text-5xl md:text-7xl font-black mb-12 tracking-tighter italic uppercase text-white">
           CONTACT <span className="text-blue-500">SIGNALS</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
           <div className="p-10 rounded-[40px] bg-slate-900 border border-slate-800 flex flex-col items-center text-center group hover:border-blue-500/50 transition-all">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                 <Mail size={32} />
              </div>
              <h3 className="text-xl font-black uppercase text-white mb-2 italic">Email Protocol</h3>
              <p className="text-slate-400 font-bold">support@hellopay.io</p>
           </div>

           <div className="p-10 rounded-[40px] bg-slate-900 border border-slate-800 flex flex-col items-center text-center group hover:border-blue-500/50 transition-all">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                 <MapPin size={32} />
              </div>
              <h3 className="text-xl font-black uppercase text-white mb-2 italic">Static Office</h3>
              <p className="text-slate-400 font-bold leading-relaxed">
                 Level 15, Eros Corporate Tower<br/>
                 Nehru Place, New Delhi, 110019
              </p>
           </div>
        </div>

        <div className="p-8 rounded-[40px] bg-slate-900/50 border border-slate-800/50 text-center mb-16">
           <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 leading-relaxed italic">
              Expected synchronous response time for financial criticality: 120-240 minutes.
           </p>
        </div>

        <div className="mt-24 pt-12 border-t border-slate-900 text-center text-slate-700 text-xs font-bold uppercase tracking-widest leading-loose">
           Copyright © 2026 Hello Financial Ecosystem. V1.0.0-PROD
        </div>
      </motion.div>
    </div>
  );
}
