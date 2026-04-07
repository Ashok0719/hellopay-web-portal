'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Plus, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ToolsListPage() {
  const router = useRouter();

  const upiItems = [
    { upi: '7200520719@axl', range: '10.00~100000.00', status: 'Failed', app: 'Phonepe', risk: false },
    { upi: '7200520719@freecharge', range: '500.00~100000.00', status: 'Enabled', app: 'Freecharge', risk: false },
    { upi: '7200520719@mbkns', range: '10.00~100000.00', status: 'Disabled', app: 'Mobikwik', risk: true },
    { upi: '7200520719@ybl', range: '10.00~100000.00', status: 'Failed', app: 'Phonepe', risk: true },
    { upi: '7200520719@ptsbi', range: '10.00~100000.00', status: 'Failed', app: 'Phonepe', risk: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans max-w-lg mx-auto shadow-2xl border-x border-slate-200 relative">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-emerald-600 italic">Deposit Tool</h1>
        <button 
          onClick={() => router.push('/dashboard/tools/add')}
          className="p-2 -mr-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
        >
          <Plus size={24} />
        </button>
      </header>

      <div className="p-4 space-y-4">
        {upiItems.map((item, idx) => (
          <div key={idx} className="relative overflow-hidden rounded-[24px] bg-emerald-600 p-6 text-white shadow-xl group active:scale-[0.98] transition-all">
            {/* Background elements to match the screenshot pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 opacity-20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500 opacity-10 rounded-full translate-y-1/4 translate-x-1/3" />
            
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="text-4xl font-black italic">UPI</div>
                  <div className="text-emerald-100 font-bold text-sm">{item.upi}</div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase text-white border shadow-md ${
                    item.status === 'Enabled' ? 'bg-emerald-500 border-emerald-400 shadow-emerald-500/20' : 
                    item.status === 'Failed' ? 'bg-red-500 border-red-400 shadow-red-500/20' :
                    'bg-amber-400 border-amber-300 shadow-amber-500/20'
                  }`}>
                    {item.status}
                  </span>
                  {item.risk && (
                    <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase flex items-center gap-1 border border-white/20 text-orange-400">
                       <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                       RISK
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] uppercase font-bold text-emerald-100 tracking-wider">
                 <div className="flex items-center gap-2 px-3 py-1 bg-black/10 rounded-full border border-white/10">
                    LimitedRange: {item.range}
                 </div>
                 <div className="text-emerald-200">{item.app}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
