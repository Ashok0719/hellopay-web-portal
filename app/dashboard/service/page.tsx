'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MessageCircle, MessageSquare, Send, Bell, ShieldCheck, HelpCircle, ExternalLink, Headset, Zap, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';
import SupportChatModal from '../SupportChatModal';

export default function ServicePage() {
  const router = useRouter();
  const { user } = useAuthStore() as any;
  const [showAiSupport, setShowAiSupport] = useState(false);

  const supportChannels = [
    {
      id: 'telegram',
      name: 'Official Telegram',
      desc: 'Real-time neural signals & updates',
      icon: <Send className="text-white" size={24}/>,
      color: 'from-blue-400 to-blue-600',
      link: 'https://t.me/hellopay_official'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      desc: 'Direct node liquidation support',
      icon: <MessageSquare className="text-white fill-white" size={24}/>,
      color: 'from-emerald-400 to-emerald-600',
      link: 'https://wa.me/911234567890'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans max-w-lg mx-auto shadow-2xl border-x border-slate-200">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-emerald-600 italic uppercase">Service Terminal</h1>
        <div className="w-10" />
      </header>

      <div className="p-6 space-y-8">
        {/* Main 24/7 AI Support Card (The "Wow" factor) */}
        <div 
          onClick={() => setShowAiSupport(true)}
          className="bg-slate-900 rounded-[44px] p-10 text-white shadow-2xl relative overflow-hidden group cursor-pointer active:scale-95 transition-all"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/30 transition-colors" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
               <div className="w-16 h-16 bg-white/10 rounded-[28px] flex items-center justify-center backdrop-blur-md border border-white/10 group-hover:rotate-12 transition-transform">
                 <Headset size={32} className="text-indigo-400" />
               </div>
               <div className="px-5 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-[10px] font-black tracking-widest text-emerald-400">STATUS: 24/7 ONLINE</div>
            </div>
            
            <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2 flex items-center gap-3">
               Neural AI Chat <Sparkles className="text-yellow-400 animate-pulse" size={24} />
            </h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] leading-loose mb-8">Get instant resolution for deposit, extraction & identity signals via system intelligence.</p>
            
            <button className="w-full py-5 bg-white text-slate-900 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl group-hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
               Initialize Chat Protocol <Zap size={14} className="fill-slate-900" />
            </button>
          </div>
        </div>

        {/* Secondary Channels */}
        <div className="grid grid-cols-1 gap-4">
           {supportChannels.map((channel) => (
             <a 
               key={channel.id} 
               href={channel.link} 
               target="_blank" 
               className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all active:scale-95"
             >
                <div className="flex items-center gap-6">
                   <div className={`w-16 h-16 bg-gradient-to-br ${channel.color} rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6`}>
                      {channel.icon}
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-slate-900 leading-none mb-1 italic">{channel.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{channel.desc}</p>
                   </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                   <ExternalLink size={16} />
                </div>
             </a>
           ))}
        </div>

        {/* System FAQ Integration */}
        <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
           <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                 <HelpCircle size={24} />
              </div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">Intelligence Registry (FAQ)</h3>
           </div>
           
           <div className="space-y-8">
              <FAQItem q="Why is my deposit signal pending?" a="Verification protocols typically take 3-10 minutes. If delayed beyond 30 mins, please upload your receipt again to re-trigger OCR extraction." />
              <FAQItem q="Identity verification failed?" a="Ensure your UPI ID is already bound to your bank and matches your profile identity. Proxy signal usage is blocked by Neural Guard." />
              <FAQItem q="Withdrawal cooldown?" a="For security, any changes to your UPI credentials trigger a 24-hour settlement cooldown to prevent unauthorized node liquidation." />
           </div>
        </div>

        {/* Footnote */}
        <div className="text-center pt-8">
           <div className="inline-flex items-center gap-2 px-6 py-2 bg-slate-100 rounded-full text-slate-400 mb-4">
              <ShieldCheck size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Protocol Protected Support</span>
           </div>
           <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.4em]">© 2026 HELLOPAY NEURAL NETWORKS</p>
        </div>
      </div>

      <AnimatePresence>
        {showAiSupport && (
           <SupportChatModal 
             isOpen={showAiSupport} 
             onClose={() => setShowAiSupport(false)} 
             user={user}
           />
        )}
      </AnimatePresence>
    </div>
  );
}

function FAQItem({ q, a }: { q: string, a: string }) {
  return (
    <div className="space-y-3 group cursor-default">
       <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1 h-1 bg-emerald-500 rounded-full" />
          {q}
       </div>
       <div className="text-xs font-bold text-slate-500 leading-relaxed pl-3 border-l border-slate-100 group-hover:border-emerald-200 transition-colors">{a}</div>
    </div>
  );
}
