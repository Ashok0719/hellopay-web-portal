'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';

export default function AddMoneyPage() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();

  const handlePayment = async () => {
    if (!amount || isNaN(Number(amount))) return;
    setLoading(true);

    try {
      const { data: order } = await api.post('/wallet/add-money', { amount });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
        amount: order.amount,
        currency: order.currency,
        name: 'HelloPay',
        description: 'Wallet Top-up',
        order_id: order.id,
        handler: async (response: any) => {
          try {
            await api.post('/wallet/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amount,
            });
            alert('Wallet updated successfully!');
            router.push('/dashboard');
          } catch (err) {
            alert('Verification failed');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: { color: '#6366f1' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-12 transition-colors font-bold">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-[40px] p-10 shadow-2xl"
        >
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8">
            <CreditCard className="text-indigo-400" size={32} />
          </div>

          <h1 className="text-4xl font-black mb-2">Add Money</h1>
          <p className="text-slate-500 mb-10 font-medium">Refill your digital weight in seconds.</p>

          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Enter Amount (INR)</label>
              <div className="relative">
                 <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-700">₹</span>
                 <input 
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl py-8 pl-14 pr-8 text-4xl font-black outline-none focus:border-indigo-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                 />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
               {['500', '1000', '2000'].map(val => (
                 <button 
                  key={val}
                  onClick={() => setAmount(val)}
                  className="py-4 rounded-2xl border border-slate-800 bg-slate-900 hover:border-indigo-500 transition-all font-black text-slate-400 hover:text-white"
                 >
                   +₹{val}
                 </button>
               ))}
            </div>

            <button
              onClick={handlePayment}
              disabled={loading || !amount}
              className="w-full btn-primary py-6 rounded-[24px] text-xl font-black flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Proceed to Pay'} <Zap size={24} className="fill-white" />
            </button>

            <div className="flex items-center justify-center gap-2 text-slate-600 font-bold text-xs uppercase tracking-tighter">
               <ShieldCheck size={14} /> Secured by Razorpay encryption
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
