'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, X, Bot, User as UserIcon, Loader2, 
  ChevronLeft, MessageSquare, ShieldCheck, 
  Zap, Clock, Info 
} from 'lucide-react';
import api from '@/lib/api';

interface Message {
  text: string;
  sender: 'USER' | 'AI_SUPPORT';
  timestamp: Date;
}

export default function SupportChatModal({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: any }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: `Neural Support Hub Active. Hello ${user?.name}, I am your HelloPay AI assistant. How can I help with your rotations or wallet synchronization today?`,
      sender: 'AI_SUPPORT',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { text: userMsg, sender: 'USER', timestamp: new Date() }]);
    
    setIsTyping(true);
    try {
      // Small artificial delay for "AI thinking"
      await new Promise(r => setTimeout(r, 600));
      
      const { data } = await api.post('/support/chat', { message: userMsg });
      
      if (data.success) {
        setMessages(prev => [...prev, { 
          text: data.response, 
          sender: 'AI_SUPPORT', 
          timestamp: new Date(data.timestamp) 
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        text: "Neural Link Error: Support node currently overloaded. Please try again or contact direct Telegram support.", 
        sender: 'AI_SUPPORT', 
        timestamp: new Date() 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center sm:items-center sm:p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="w-full max-w-lg bg-slate-50 h-[90vh] sm:h-[600px] rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-white/20"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-emerald-600 p-6 text-white flex items-center justify-between shadow-lg relative h-28 overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
             <div className="flex items-center gap-4 relative z-10">
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <ChevronLeft size={24} />
                </button>
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner ring-4 ring-emerald-500/20">
                      <Bot size={28} className="text-white fill-emerald-100" />
                   </div>
                   <div>
                      <h2 className="font-black italic uppercase tracking-tighter text-lg leading-none">Neural Support AI</h2>
                      <div className="flex items-center gap-2 mt-1">
                         <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-ping" />
                         <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Online 24/7 Service</span>
                      </div>
                   </div>
                </div>
             </div>
             <div className="flex gap-2 relative z-10">
                <div className="p-2 bg-white/10 rounded-xl"><ShieldCheck size={18} /></div>
             </div>
          </div>

          {/* Chat Mesh */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scroll-smooth"
          >
            <div className="flex justify-center mb-8">
               <div className="bg-slate-200/50 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500 border border-slate-300/30">
                  Secure Neural Terminal • End-to-End Encrypted
               </div>
            </div>

            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: msg.sender === 'USER' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] flex items-end gap-2 ${msg.sender === 'USER' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${
                    msg.sender === 'USER' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-emerald-600 font-bold'
                  }`}>
                    {msg.sender === 'USER' ? <UserIcon size={16} /> : <Zap size={16} />}
                  </div>
                  <div className={`p-4 rounded-[24px] shadow-sm text-sm font-bold leading-relaxed tracking-tight ${
                    msg.sender === 'USER' 
                      ? 'bg-emerald-600 text-white rounded-br-none shadow-emerald-200' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                  }`}>
                    {msg.text}
                    <div className={`text-[8px] mt-2 font-black opacity-40 uppercase tracking-widest text-right`}>
                       {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                 <div className="bg-white border border-slate-100 p-4 rounded-[24px] rounded-bl-none shadow-sm flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-emerald-600" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">AI Analyst thinking...</span>
                 </div>
              </div>
            )}
          </div>

          {/* Input Terminal */}
          <div className="p-6 bg-white border-t border-slate-100 pb-10 sm:pb-6">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-[30px] p-2 pr-3 shadow-inner hover:border-emerald-200 transition-colors">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-transparent border-none outline-none px-6 py-3 text-sm font-bold placeholder:text-slate-400 italic"
                placeholder="Ask Neural AI support..."
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="w-12 h-12 bg-emerald-600 rounded-[22px] flex items-center justify-center text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-90 transition-all disabled:opacity-30 disabled:scale-100"
              >
                <Send size={20} className="fill-white" />
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-2 mt-4 opacity-30 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
               <Clock size={10} /> Fast Signal Settlement Enabled
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
