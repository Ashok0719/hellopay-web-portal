'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Copy, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OrderDetailPage() {
  const router = useRouter();

  const details = [
    { label: 'PayeeAccount', value: '50100506910862' },
    { label: 'PayeeName', value: 'temsumanla longkumer' },
    { label: 'IFSC', value: 'HDFC0004745' },
    { label: 'Code', value: 'izLYKE' },
    { label: 'Type', value: 'IMPS' },
    { label: 'Payout Wallet', value: 'Freecharge', wallet: true },
    { label: 'Payout Account', value: '7200520719' },
    { label: 'Payout UPI', value: '7200520719@freecharge' },
    { label: 'Status', value: 'Pending', status: true },
    { label: 'CreatedAt', value: '2026-03-25 20:39:44', copy: false },
    { label: 'NO', value: 'R2026032520394411517055' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans max-w-lg mx-auto shadow-2xl border-x border-slate-200">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-emerald-600">Order</h1>
        <div className="w-10" />
      </header>

      <div className="p-6">
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
           {/* Amount Header */}
           <div className="bg-emerald-50/50 rounded-2xl p-6 text-center mb-10 border border-emerald-50">
              <span className="text-3xl font-black text-slate-800 tracking-tight italic">
                 <span className="text-emerald-600">INR</span> 300.00
              </span>
           </div>

           {/* Details Table */}
           <div className="space-y-6 mb-10">
              {details.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-4 group">
                   <div className="text-slate-400 font-bold text-xs uppercase tracking-tighter whitespace-nowrap pt-1">
                      {item.label}:
                   </div>
                   <div className="flex-1 flex justify-end items-center gap-2">
                      {item.wallet && (
                        <div className="w-6 h-6 rounded-md bg-[#EF4444] shadow-md flex items-center justify-center -mr-1">
                          <img src="https://img.icons8.com/color/48/freecharge.png" className="w-4 h-4" />
                        </div>
                      )}
                      <span className={`text-[13px] font-black text-slate-700 text-right leading-relaxed ${item.status ? 'text-amber-500' : ''}`}>
                         {item.value}
                      </span>
                      {item.copy !== false && (
                        <button className="p-1 px-1.5 bg-emerald-50 rounded text-emerald-600 border border-emerald-100 active:scale-90 transition-transform">
                           <Copy size={12} />
                        </button>
                      )}
                   </div>
                </div>
              ))}
           </div>

           {/* View Voucher Button */}
           <button className="w-full py-4 px-6 border border-emerald-500 text-emerald-600 font-bold rounded-full flex items-center justify-center gap-2 hover:bg-emerald-50 active:scale-[0.98] transition-all">
              View Voucher <ChevronRight size={18} />
           </button>
        </div>
      </div>
    </div>
  );
}
