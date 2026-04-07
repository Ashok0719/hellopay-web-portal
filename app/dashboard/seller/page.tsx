'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, DollarSign, ListOrdered, QrCode, Upload, CheckCircle, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

export default function SellerDashboard() {
  const [formData, setFormData] = useState({
    stockName: '',
    price: '',
    quantity: '',
    sellerUpiId: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/listings', formData);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <CheckCircle className="text-emerald-500 mb-6 mx-auto" size={80} />
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Listing Verified</h1>
          <p className="text-slate-500 font-bold mt-2">Your stock is now live on the HelloPay marketplace.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-10 group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">Back to Core</span>
      </Link>

      <div className="max-w-md mx-auto">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Zap size={24} className="fill-white" />
             </div>
             <h1 className="text-3xl font-black italic uppercase tracking-tighter">Seller Portal</h1>
          </div>
          <p className="text-slate-500 font-bold text-sm">Deploy new assets to the neural marketplace.</p>
        </header>

        {error && (
          <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Name</label>
            <div className="relative">
              <Package className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input
                type="text"
                placeholder="Stock Name (e.g. Premium Alpha)"
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-14 pr-6 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700"
                value={formData.stockName}
                onChange={(e) => setFormData({ ...formData, stockName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Price (₹)</label>
              <div className="relative">
                <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-14 pr-6 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700 font-bold"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Quantity</label>
              <div className="relative">
                <ListOrdered className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input
                  type="number"
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-14 pr-6 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700 font-bold"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Receiving UPI ID</label>
            <div className="relative">
              <QrCode className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input
                type="text"
                placeholder="name@upi"
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-14 pr-6 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700 font-bold text-indigo-400"
                value={formData.sellerUpiId}
                onChange={(e) => setFormData({ ...formData, sellerUpiId: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="p-8 border-2 border-dashed border-slate-800 rounded-[32px] flex flex-col items-center justify-center gap-4 bg-slate-900/50 hover:bg-slate-900 transition-colors cursor-pointer group">
             <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-600 group-hover:text-indigo-500 transition-colors">
                <Upload size={32} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Upload Merchant QR Code</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-indigo-600 text-white font-black rounded-[24px] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-tighter italic"
          >
            {loading ? 'Initializing Asset...' : 'Deploy to Marketplace'}
          </button>
        </form>
      </div>
    </div>
  );
}
