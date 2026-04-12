'use client';

import Link from 'next/link';
import { ShieldCheck, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer bg-slate-950 border-t border-slate-900 pt-20 pb-12 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 px-4">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6 group cursor-default">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                <Zap size={20} className="fill-white" />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter text-white">HELLOPAY</h2>
            </div>
            <p className="text-slate-500 font-bold text-sm leading-relaxed max-w-sm">
              The futuristic P2P asset rotation protocol. Secure. Automated. Neural. 
              Join the evolution of Indian fintech liquidity.
            </p>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Protocol Matrix</h3>
            <ul className="space-y-4">
              <li><Link href="/(legal)/about" className="text-slate-500 hover:text-indigo-400 font-bold text-sm transition-colors block uppercase tracking-widest italic text-[10px]">About Core</Link></li>
              <li><Link href="/(legal)/contact" className="text-slate-500 hover:text-indigo-400 font-bold text-sm transition-colors block uppercase tracking-widest italic text-[10px]">Support Node</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Legal Signatures</h3>
            <ul className="space-y-4">
              <li><Link href="/(legal)/terms" className="text-slate-500 hover:text-indigo-400 font-bold text-sm transition-colors block uppercase tracking-widest italic text-[10px]">Terms of Engagement</Link></li>
              <li><Link href="/(legal)/privacy" className="text-slate-500 hover:text-indigo-400 font-bold text-sm transition-colors block uppercase tracking-widest italic text-[10px]">Privacy Protocol</Link></li>
              <li><Link href="/(legal)/refund" className="text-slate-500 hover:text-indigo-400 font-bold text-sm transition-colors block uppercase tracking-widest italic text-[10px]">Refund Reversal</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-700 italic">
            © 2026 HELLO FINANCIAL ECOSYSTEM. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-2 text-emerald-500 opacity-40 hover:opacity-100 transition-opacity">
            <ShieldCheck size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Neural Security Mesh Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
