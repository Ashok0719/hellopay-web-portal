'use client';

import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Wallet, 
  Send, 
  Smartphone, 
  ShieldCheck, 
  Activity, 
  PieChart, 
  Zap, 
  Menu, 
  X
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-500/30">
              <Zap className="text-white fill-white" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 italic">
              Hello<span className="text-indigo-600 italic">Pay</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-slate-600 font-bold text-sm uppercase tracking-widest italic">
            <Link href="#features" className="hover:text-indigo-600 transition-colors">Nodes</Link>
            <Link href="#how-it-works" className="hover:text-indigo-600 transition-colors">Network</Link>
              <Link href="/login" className="px-8 py-3 hover:bg-slate-50 rounded-full transition-colors border border-slate-100">Portal</Link>
              <Link href="/login" className="btn-primary">Connect</Link>
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 container mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-600/10 text-indigo-400 text-sm font-semibold mb-6 border border-indigo-600/20">
                🚀 Re-imagining Digital Economy
              </span>
              <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.95] tracking-tighter text-slate-900 italic">
                PAYMENTS <br />
                THAT FEEL <br />
                <span className="text-indigo-600">WEIGHTLESS.</span>
              </h1>
              <p className="text-xl text-slate-400 mb-10 max-w-lg leading-relaxed">
                Experience the next generation of financial freedom. Send, receive, and manage your money with Hello's ultra-secure, hyper-fast digital ecosystem.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login" className="btn-primary py-4 px-10 text-lg flex items-center justify-center gap-2 group">
                  Quick Access <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="flex items-center gap-4 py-4 px-8 rounded-xl border border-slate-700 bg-slate-800/20">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-indigo-600" />
                    ))}
                  </div>
                  <span className="text-sm text-slate-400 font-medium">Join 50k+ early users</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Hero Visual Card */}
          <div className="lg:w-1/2 relative group">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative z-10"
            >
              <div className="w-[340px] h-[580px] sm:w-[380px] sm:h-[620px] bg-white rounded-[60px] p-4 border-8 border-slate-200 shadow-2xl overflow-hidden shadow-indigo-600/10">
                <div className="h-full w-full bg-slate-50 rounded-[44px] p-8 relative flex flex-col gap-6 border border-white">
                  {/* Mock UI */}
                  <div className="flex justify-between items-center opacity-40">
                    <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
                    <div className="w-8 h-8 rounded-full bg-indigo-600" />
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Available Balance</div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">$24,500.00</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-4 rounded-2xl bg-indigo-600/20 border border-indigo-600/30 flex flex-col gap-2">
                       <Send size={20} className="text-indigo-400" />
                       <span className="text-[10px] font-bold text-indigo-400">SEND</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col gap-2">
                       <Wallet size={20} className="text-slate-400" />
                       <span className="text-[10px] font-bold text-slate-400">RECEIVE</span>
                    </div>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="text-xs text-slate-500 uppercase font-bold">Recent Activities</div>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700" />
                          <div>
                            <div className="text-sm font-bold">Netflix Subscription</div>
                            <div className="text-[10px] text-slate-500">Today, 2:40 PM</div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-red-500">-$12.99</div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 h-1 bg-indigo-600/10 rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-indigo-600" />
                  </div>
                </div>
              </div>
              {/* Floating Elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600/20 blur-3xl animate-pulse" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-600/20 blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="features" className="py-24 bg-slate-50/50">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          {[
            { label: 'Total Users', value: '1.2M+' },
            { label: 'Transactions', value: '$45B+' },
            { label: 'Success Rate', value: '99.99%' },
            { label: 'Countries', value: '45+' }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-black text-slate-900 italic shadow-glow mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500 uppercase tracking-widest font-bold">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 px-6 container mx-auto">
        <h2 className="text-4xl font-bold mb-16 text-center">Built for the <span className="text-indigo-500">Modern Era</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: 'Lightning Transfers', 
              desc: 'Transfer money in milliseconds between any Hello wallets worldwide.',
              icon: <Zap className="text-amber-400" />
            },
            { 
              title: 'Smart Recharge', 
              desc: 'One-tap recharges for mobile, utilities, and more with instant verification.',
              icon: <Smartphone className="text-green-400" />
            },
            { 
              title: 'Ironclad Security', 
              desc: 'Biometric locks, JWT authentication, and bank-grade encryption.',
              icon: <ShieldCheck className="text-blue-400" />
            },
            { 
              title: 'Real-time Analytics', 
              desc: 'Monitor your spending patterns with beautiful interactive dashboards.',
              icon: <PieChart className="text-pink-400" />
            },
            { 
              title: 'Global Payments', 
              desc: 'Pay globally with built-in multicurrency support and Best conversion rates.',
              icon: <Wallet className="text-indigo-400" />
            },
            { 
              title: 'Referral Rewards', 
              desc: 'Invite friends and earn exclusive cashback on every transaction they make.',
              icon: <Activity className="text-orange-400" />
            }
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-[40px] bg-white border border-slate-100 hover:border-indigo-600/30 transition-all hover:shadow-xl group">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed font-medium">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic Investment Teaser */}
      <section className="py-24 px-6 bg-indigo-600/5 border-y border-indigo-500/10">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 italic uppercase">Neural <span className="text-indigo-500">Assets</span></h2>
          <p className="text-slate-400 mb-12 max-w-2xl mx-auto">Explore high-yield financial nodes. Our ecosystem dynamically updates with the world's most stable digital assets.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[100, 500, 1000, 2000].map(amt => (
              <div key={amt} className="p-6 rounded-[32px] bg-white border border-slate-100 hover:border-indigo-600 transition-all group cursor-pointer shadow-xl">
                <div className="text-3xl font-black text-indigo-400 italic mb-2">₹{amt}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SIG_NODE_{amt}</div>
                <div className="mt-4 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                   <div className="w-1/2 h-full bg-indigo-500 group-hover:w-full transition-all duration-700" />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16">
            <Link href="/register" className="btn-primary py-4 px-10 text-lg">Start Investing Now</Link>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-24 px-6 border-t border-slate-800">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Zap className="text-indigo-500" />
              <span className="text-2xl font-bold">HelloPay</span>
            </div>
            <p className="text-slate-500 max-w-sm">
              The only wallet you'll ever need. Download our app from PlayStore or continue here.
            </p>
          </div>
          <div className="flex gap-8">
             <Link href="/privacy" className="text-slate-500 hover:text-white transition-colors">Privacy Policy</Link>
             <Link href="/terms" className="text-slate-500 hover:text-white transition-colors">Terms of Service</Link>
             <Link href="/support" className="text-slate-500 hover:text-white transition-colors">Security Report</Link>
          </div>
        </div>
        <div className="container mx-auto mt-12 pt-8 border-t border-slate-900 text-center text-slate-700 text-sm">
           © 2026 Hello Financial Ecosystem. All weights reserved.
        </div>
      </footer>
    </div>
  );
}
