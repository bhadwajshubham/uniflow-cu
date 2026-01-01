import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Ticket, ShieldCheck, ArrowRight, Zap, Users } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white pt-20">
      
      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
           <div className="absolute top-20 right-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl"></div>
           <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Live Campus Sync
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9]">
            CAMPUS LIFE, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">AMPLIFIED.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            One platform for all university events. Book tickets, manage entries, and get certified—all in real-time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/events')}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
            >
              Explore Events <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-full font-black text-xs uppercase tracking-widest transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Student Login
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-20 bg-white dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="p-8 bg-zinc-50 dark:bg-black rounded-3xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-500/30 transition-colors group">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
              <Ticket className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-3">Instant Booking</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">Secure your spot in seconds. QR tickets delivered straight to your dashboard and email.</p>
          </div>

          <div className="p-8 bg-zinc-50 dark:bg-black rounded-3xl border border-zinc-100 dark:border-zinc-800 hover:border-purple-500/30 transition-colors group">
             <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-3">Secure Entry</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">Fraud-proof QR codes bound to student IDs. Fast, reliable scanning at the gate.</p>
          </div>

          <div className="p-8 bg-zinc-50 dark:bg-black rounded-3xl border border-zinc-100 dark:border-zinc-800 hover:border-green-500/30 transition-colors group">
             <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mb-6 text-green-600 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-3">Real-time Updates</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">Live capacity tracking, instant notifications, and dynamic event management.</p>
          </div>

        </div>
      </section>

      {/* Stats/Social Proof */}
      <section className="px-6 py-20 border-t border-zinc-200 dark:border-zinc-900">
         <div className="max-w-5xl mx-auto bg-black dark:bg-zinc-900 rounded-[3rem] p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6 relative z-10">Join the Hype</h2>
            <div className="flex flex-wrap justify-center gap-12 relative z-10">
               <div>
                  <p className="text-4xl font-black text-indigo-500">50+</p>
                  <p className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Events</p>
               </div>
               <div>
                  <p className="text-4xl font-black text-purple-500">2k+</p>
                  <p className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Students</p>
               </div>
               <div>
                  <p className="text-4xl font-black text-green-500">100%</p>
                  <p className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Paperless</p>
               </div>
            </div>
         </div>
      </section>

    </div>
  );
};

export default HomePage;