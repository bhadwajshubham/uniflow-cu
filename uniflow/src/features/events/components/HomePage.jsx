import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Trophy, Users, Star, ShieldCheck, Ticket } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black text-zinc-900 dark:text-white pb-24 relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* 🎨 BACKGROUND MESH (Premium 'Apple-style' Effect) */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-indigo-500/20 dark:bg-indigo-600/20 rounded-full blur-[80px] md:blur-[120px] animate-pulse"></div>
        <div className="absolute top-[20%] left-[-10%] w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-purple-500/20 dark:bg-purple-600/10 rounded-full blur-[80px] md:blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[20%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-orange-500/10 dark:bg-orange-600/10 rounded-full blur-[100px] md:blur-[150px]"></div>
      </div>

      {/* 🌟 HERO SECTION (Mobile Optimized) */}
      <div className="relative z-10 pt-32 pb-16 px-6 max-w-7xl mx-auto text-center flex flex-col items-center justify-center min-h-[70vh] md:min-h-auto">
        
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
          </span>
          <span className="text-xs md:text-sm font-bold tracking-wide text-zinc-600 dark:text-zinc-300">
            Live on Campus
          </span>
        </div>

        {/* Big Headline */}
        <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-6 leading-[1.1] md:leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          Student Life, <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">Supercharged.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-2xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 px-4">
          One platform for every hackathon, party, and workshop. 
          Join the ecosystem.
        </p>
        
        {/* Thumb-Friendly Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <button 
            onClick={() => navigate('/events')} 
            className="w-full sm:w-auto px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-indigo-500/20"
          >
            Explore Events <ArrowRight className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-8 py-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold text-lg hover:bg-white dark:hover:bg-zinc-800 active:scale-95 transition-all"
          >
            Login / Sign Up
          </button>
        </div>
      </div>

      {/* 🍱 BENTO GRID (The "Impressive" Part) */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-center text-xs font-bold uppercase tracking-widest text-zinc-400 mb-8">Everything you need</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          
          {/* Card 1: Fast Entry (Span 2) */}
          <div className="col-span-1 md:col-span-2 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 dark:border-zinc-800 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-700">
               <Ticket className="w-48 h-48 text-indigo-600 rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-3">Instant Entry.</h3>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-sm">
                Get a unique QR code for every event. Flash it at the gate and walk in instantly. No more waiting.
              </p>
            </div>
          </div>

          {/* Card 2: Certificates (Vertical) */}
          <div className="bg-zinc-900 dark:bg-white text-white dark:text-black p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div>
              <Trophy className="w-10 h-10 mb-6 text-yellow-400 dark:text-yellow-600" />
              <h3 className="text-2xl font-black mb-2">Verified Wins.</h3>
              <p className="text-zinc-400 dark:text-zinc-600 text-sm font-medium">
                Auto-generate certificates for your resume immediately after attending.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-green-500" /> Official Proof
            </div>
          </div>

          {/* Card 3: Teams */}
          <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 dark:border-zinc-800 shadow-lg hover:shadow-xl transition-all duration-500">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black mb-2">Squad Mode</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
              One click to register your whole team. Share the code and win together.
            </p>
          </div>

          {/* Card 4: Community (Span 2) */}
          <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2.5rem] shadow-lg flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
             {/* Abstract Shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 text-center md:text-left">
               <h3 className="text-2xl font-black mb-2 text-white">Ready to join?</h3>
               <p className="text-indigo-100 font-medium mb-6">
                 Thousands of students use UniFlow to discover their next passion.
               </p>
               <button onClick={() => navigate('/login')} className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm shadow-xl hover:bg-zinc-50 transition-colors">
                 Create Account
               </button>
            </div>
            
            <div className="relative z-10 flex -space-x-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="w-12 h-12 rounded-full border-2 border-indigo-500 bg-indigo-800 flex items-center justify-center text-xs font-bold text-indigo-200">
                    <Star className="w-4 h-4" />
                 </div>
               ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default HomePage;