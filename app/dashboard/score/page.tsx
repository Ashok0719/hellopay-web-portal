'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ArrowRight, History } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ScorePage() {
  const router = useRouter();

  const transactions = [
    { phone: '9199802576@fam', label: 'Deduct Integral for 645033022667', amount: '99.81', id: '20450815', utr: '645033022667', date: 'Mar 25,2026', code: 'HvG1mp' },
    { phone: '9569380452@axl', label: 'Deduct Integral for 517901209114', amount: '199.31', id: '20448268', utr: '517901209114', date: 'Mar 25,2026', code: 'pneaQq' },
    { phone: '7297839678@axl', label: 'Deduct Integral for 849349884289', amount: '99.6', id: '20446446', utr: '849349884289', date: 'Mar 25,2026', code: 'Azi2YO' },
    { phone: 'No Wallet', label: 'Ashok0719 User purchased integral', amount: '300', id: '20440450', utr: '170071640846', date: 'Mar 25,2026', code: 'izLYKE' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans max-w-lg mx-auto shadow-2xl border-x border-slate-200">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-white border-b border-slate-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-emerald-600">Score</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="p-4">
        {/* Score Card */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 font-medium">You have Score</span>
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold text-sm">Change</span>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center">
                  <span className="text-[10px]">💰</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center">
                   <span className="text-[10px]">💰</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-5xl font-black text-emerald-600 mb-8">0.86</div>

          {/* Toggle Button */}
          <div className="flex bg-emerald-50 p-1.5 rounded-2xl">
            <button className="flex-1 py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95">
              Into
            </button>
            <button className="flex-1 py-3.5 text-emerald-600 font-bold rounded-xl transition-all">
              Roll out
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <div className="text-emerald-600 font-bold text-lg mb-6 flex items-center gap-2">
            2026-03
          </div>

          <div className="space-y-8">
            {transactions.map((item, idx) => (
              <div key={idx} className="pb-6 border-b border-slate-50 last:border-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-lg">{item.phone}</span>
                  <span className="text-emerald-500 font-bold text-xl">{item.amount}</span>
                </div>
                <div className="text-emerald-500/80 text-[11px] font-medium mb-3">
                  {item.label}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                  <span>ID: {item.id}</span>
                  <span>UTR: {item.utr}</span>
                  <span>DATE: {item.date}</span>
                  <span>CODE: {item.code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
