'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Copy, Clock, History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Receive');
  const [activeSubTab, setActiveSubTab] = useState('INR');
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/transactions/history');
        setHistoryItems(data);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredHistory = (historyItems || []).filter(item => {
    if (activeTab === 'Receive') return item.category === 'Receive' || item.action === 'credit' || item.direction === 'IN';
    if (activeTab === 'Purchase') return item.category === 'Purchase' || item.action === 'debit' || item.direction === 'OUT';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans max-w-lg mx-auto shadow-2xl border-x border-slate-200">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-white border-b border-slate-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-indigo-600">Payment History</h1>
        <div className="w-10" />
      </header>

      <div className="p-4">
        {/* Main Tabs */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-full mb-4">
          {['Receive', 'Purchase'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all ${
                activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>


        {/* Sub-tabs */}
        <div className="flex gap-4 mb-6">
           {['INR', 'USDT'].map(tab => (
             <button
               key={tab}
               onClick={() => setActiveSubTab(tab)}
               className={`flex-1 py-2 rounded-xl font-bold text-sm border transition-all ${
                 activeSubTab === tab ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-400 border-slate-100'
               }`}
             >
               {tab}
             </button>
           ))}
        </div>

        {/* History List */}
        <div className="space-y-4">
          {loading ? (
             <div className="flex justify-center py-20">
               <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
             </div>
          ) : filteredHistory.length > 0 ? (
            filteredHistory.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                  const isPurchase = item.category === 'Purchase';
                  const isPending = item.status === 'PENDING' || item.status === 'PENDING_PAYMENT';
                  if (isPurchase && (isPending || item.status === 'INIT') && item.type === 'ROTATION') {
                    const seller = item.sellerId || item.otherParty;
                    const upiId = seller?.upiId || 'admin@upi';
                    const sellerName = encodeURIComponent(seller?.name || 'HelloPay Seller');
                    const upiIntent = `upi://pay?pa=${upiId}&pn=${sellerName}&am=${item.amount}&cu=INR`;
                    const sellerIdNum = seller?.userIdNumber || '******';
                    router.push(`/dashboard/pay?orderId=${item.transactionId}&amount=${item.amount}&upiIntent=${encodeURIComponent(upiIntent)}&txnId=${item._id}&sellerId=${sellerIdNum}`);
                  }
                }}
                className={`bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative group active:scale-[0.98] transition-all ${item.category === 'Purchase' && item.status === 'PENDING' ? 'cursor-pointer border-l-4 border-l-amber-400' : ''}`}
              >
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                         <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${item.direction === 'IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {item.direction === 'IN' ? 'CREDIT' : 'DEBIT'}
                         </span>
                         {item.type === 'ROTATION' && (
                           <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-md text-[8px] font-black uppercase tracking-widest">P2P NODE</span>
                         )}
                      </div>
                      
                      <div className={`text-3xl font-black italic mb-2 tracking-tighter ${item.direction === 'IN' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {item.direction === 'IN' ? '+' : '-'} ₹ {item.amount.toLocaleString()}
                      </div>

                      <div className="space-y-1">
                         <p className="text-slate-500 text-[10px] font-black uppercase tracking-tighter">
                            {item.category === 'Purchase' ? 'Paid To:' : 'From:'} 
                            <span className="text-slate-900 ml-1">
                               {item.otherParty?.name || (item.receiverId?.name || 'Admin Authority')} 
                               {item.otherParty?.userIdNumber && ` (ID_${item.otherParty.userIdNumber})`}
                            </span>
                         </p>
                         <p className="text-slate-400 text-[9px] font-bold">
                            {item.description || item.type || 'Manual Entry'}
                         </p>
                         {item.utr && (
                            <p className="text-indigo-400 text-[8px] font-mono mt-2">REF: {item.utr}</p>
                         )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-4 min-w-[80px]">
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border shadow-sm ${
                        item.status?.toUpperCase() === 'COMPLETED' || item.status?.toUpperCase() === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : ['PENDING', 'PENDING_PAYMENT', 'PENDING_VERIFICATION', 'INIT'].includes(item.status?.toUpperCase())
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                             item.status?.toUpperCase() === 'COMPLETED' || item.status?.toUpperCase() === 'SUCCESS' ? 'bg-emerald-500' : 
                             ['PENDING', 'PENDING_PAYMENT', 'PENDING_VERIFICATION', 'INIT'].includes(item.status?.toUpperCase()) ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          {['COMPLETED', 'SUCCESS'].includes(item.status?.toUpperCase()) ? 'COMPLETED' : 
                           ['FAILED', 'REJECTED', 'CANCELED'].includes(item.status?.toUpperCase()) ? 'FAILED' : 
                           item.status?.replace('_', ' ')}
                      </div>
                      <div className="text-right">
                          <div className="text-slate-900 text-[10px] font-black italic">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-slate-400 text-[10px] font-bold">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                      </div>
                    </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
               <History size={48} className="mb-4 opacity-20" />
               <p className="font-bold">No {activeTab} Activity Found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

