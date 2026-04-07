'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AddToolPage() {
  const router = useRouter();
  const [selected, setSelected] = useState('Freecharge');

  const paymentOptions = [
    { name: 'Freecharge', logo: 'https://img.icons8.com/color/96/freecharge.png' },
    { name: 'Phonepe', logo: 'https://img.icons8.com/color/96/phonepe.png' },
    { name: 'Mobikwik', logo: 'https://img.icons8.com/color/96/mobikwik.png' },
    { name: 'Paytm', logo: 'https://img.icons8.com/color/96/paytm.png' },
    { name: 'Paytm Business', logo: 'https://img.icons8.com/color/96/paytm.png' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans max-w-lg mx-auto shadow-2xl border-x border-slate-200">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-white border-b border-slate-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-emerald-600">Add Tool</h1>
        <div className="w-10" />
      </header>

      <div className="p-8">
        <h2 className="text-2xl font-black text-center text-emerald-600 mb-10 italic">
          Choose your payment
        </h2>

        <div className="space-y-4 mb-20">
          {paymentOptions.map((opt) => (
             <div 
               key={opt.name}
               onClick={() => setSelected(opt.name)}
               className={`p-4 rounded-[20px] flex items-center gap-6 border-2 transition-all cursor-pointer shadow-sm ${
                 selected === opt.name ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-white'
               }`}
             >
               <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                 selected === opt.name ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-100'
               }`}>
                 {selected === opt.name && <Check size={14} />}
               </div>
               
               <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden">
                  <img src={opt.logo} alt={opt.name} className="w-8 h-8 object-contain" />
               </div>

               <span className="text-lg font-bold text-slate-700">{opt.name}</span>
             </div>
          ))}
        </div>

        <button 
           onClick={() => router.push('/dashboard/tools')}
           className="w-full py-4 bg-emerald-600 text-white font-bold rounded-full shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
        >
          Sure
        </button>
      </div>
    </div>
  );
}
