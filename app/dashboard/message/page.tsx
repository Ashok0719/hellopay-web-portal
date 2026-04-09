'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Bell, Info, AlertTriangle, ShieldCheck, Mail, Zap } from 'lucide-react';

export default function MessagePage() {
  const router = useRouter();

  const mockMessages = [
    {
      id: 1,
      type: 'info',
      title: 'Neural Node Active',
      body: 'Your account has been successfully synchronized with the rotation engine. Virtual split units are now live.',
      time: 'Just now',
      isRead: false
    },
    {
      id: 2,
      type: 'success',
      title: 'Identity Signal Verified',
      body: 'Your UPI identity has been bound to the registry. Extracts are now authorized.',
      time: '2 hours ago',
      isRead: true
    },
    {
      id: 3,
      type: 'warning',
      title: 'Marketplace Update',
      body: 'Admin has updated the global profit matrix to 4%. All new splits will follow this signal.',
      time: '1 day ago',
      isRead: true
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans max-w-lg mx-auto shadow-2xl border-x border-slate-200">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-emerald-600 italic uppercase">Message Center</h1>
        <div className="w-10" />
      </header>

      <div className="p-6">
        <div className="bg-slate-900 rounded-[32px] p-8 text-white mb-8 relative overflow-hidden shadow-xl">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
           <div className="flex items-center gap-4 mb-4">
              <Mail className="text-blue-400" size={24} />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">System Logs</h2>
           </div>
           <p className="text-sm font-bold text-slate-300 italic">Access restricted to encrypted neural signals only. All communications are identity-bound.</p>
        </div>

        <div className="space-y-4">
           {mockMessages.map((msg, idx) => (
             <motion.div 
               key={msg.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.1 }}
               className={`bg-white p-6 rounded-[28px] border transition-all ${msg.isRead ? 'border-slate-100 opacity-80' : 'border-emerald-200 shadow-sm shadow-emerald-100'}`}
             >
                <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-3">
                      {msg.type === 'info' && <Info size={18} className="text-blue-500" />}
                      {msg.type === 'success' && <ShieldCheck size={18} className="text-emerald-500" />}
                      {msg.type === 'warning' && <AlertTriangle size={18} className="text-amber-500" />}
                      <h3 className="font-black text-sm uppercase tracking-tight text-slate-800 italic">{msg.title}</h3>
                   </div>
                   {!msg.isRead && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                </div>
                <p className="text-[11px] font-bold text-slate-500 leading-relaxed mb-4">{msg.body}</p>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-300">{msg.time} • NEURAL SIGNAL</div>
             </motion.div>
           ))}

           {mockMessages.length === 0 && (
             <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
                <Zap size={48} className="opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">No signals pulse detected</p>
             </div>
           )}
        </div>
        
        <div className="mt-12 text-center">
            <button className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors border-b border-dashed border-slate-200 pb-1">Archive All Signals</button>
        </div>
      </div>
    </div>
  );
}
