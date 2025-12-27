import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Users, Trophy, Zap } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black text-zinc-900 dark:text-white pb-24">
      
      {/* 🌟 HERO SECTION */}
      <div className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Soft Background Blobs (Not too white, not too colorful) */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wide mb-6">
            <Zap className="w-3 h-3" /> The Campus Ecosystem
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-tight">
            Unleash Your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Campus Life.</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            One platform for every hackathon, workshop, and cultural fest. 
            Join clubs, earn certificates, and build your portfolio.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/events')} 
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-xl shadow-zinc-900/20"
            >
              Explore Events <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Organizer Login
            </button>
          </div>
        </div>
      </div>

      {/* 📊 STATS / TRUST */}
      <div className="max-w-7xl mx-auto px-6 mb-24">
        <div className="grid grid-cols-3 gap-4 md:gap-12 border-y border-zinc-200 dark:border-zinc-800 py-8">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-black text-indigo-600">50+</div>
            <div className="text-xs md:text-sm font-bold text-zinc-500 uppercase tracking-wider mt-1">Active Clubs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-black text-purple-600">10k+</div>
            <div className="text-xs md:text-sm font-bold text-zinc-500 uppercase tracking-wider mt-1">Students</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-black text-orange-600">500+</div>
            <div className="text-xs md:text-sm font-bold text-zinc-500 uppercase tracking-wider mt-1">Events Hosted</div>
          </div>
        </div>
      </div>

      {/* 🚀 FEATURE GRID */}
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Instant Registration</h3>
          <p className="text-zinc-500 leading-relaxed">
            Forget Google Forms. Register for solo or team events in one click. 
            Get your QR Ticket instantly.
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/20 text-pink-600 rounded-2xl flex items-center justify-center mb-6">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Earn Certificates</h3>
          <p className="text-zinc-500 leading-relaxed">
            Attend events and automatically unlock verifiable certificates 
            to boost your resume and LinkedIn profile.
          </p>
        </div>
      </div>

    </div>
  );
};

export default HomePage;