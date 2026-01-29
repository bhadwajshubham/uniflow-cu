import React from 'react';
import { Mail, Github, Linkedin, ChevronDown, Rocket, Shield, Zap, Code } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-20 pb-24 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        
        {/* 1. BRAND HERO SECTION (Professional Product Header) */}
        <div className="text-center mb-10 mt-4">
           <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20 mb-4">
              <Rocket className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">
             UniFlow CU
           </h1>
           <p className="text-zinc-500 font-medium text-lg">
             The Campus Event Operating System
           </p>
        </div>

        {/* 2. WHAT IS UNIFLOW? (Mission Statement) */}
        <section className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-6">
           <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Why we built this?</h2>
           <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
             Managing university events was chaos—paper tickets, long queues, and confusion. 
             <strong>UniFlow</strong> solves this by creating a seamless digital bridge between Organizers and Students. 
             No more lost tickets, no more fake entries.
           </p>

           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                 <Zap className="w-6 h-6 text-amber-500 mb-2" />
                 <h3 className="font-bold text-sm">Instant Booking</h3>
                 <p className="text-xs text-zinc-500 mt-1">Book tickets in under 10 seconds.</p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                 <Shield className="w-6 h-6 text-green-500 mb-2" />
                 <h3 className="font-bold text-sm">Secure Entry</h3>
                 <p className="text-xs text-zinc-500 mt-1">Unique QR codes prevent fraud.</p>
              </div>
           </div>
        </section>

        {/* 3. MEET THE TEAM (Professional & Compact) */}
        <section className="mb-8">
           <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 ml-1">Engineering Team</h3>
           
           <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 hover:border-indigo-200 transition-colors">
              <img 
                 src="https://avatars.githubusercontent.com/u/159251372?v=4" 
                 alt="Shubham" 
                 className="w-14 h-14 rounded-full object-cover border-2 border-zinc-100"
              />
              <div className="flex-1">
                 <h4 className="font-bold text-zinc-900 dark:text-white">Shubham Bhardwaj</h4>
                 <p className="text-xs text-indigo-600 font-bold uppercase">Lead Developer</p>
                 <p className="text-xs text-zinc-500 mt-0.5">Full Stack Engineer • Chitkara University</p>
              </div>
              
              {/* Social Icons (Minimal) */}
              <div className="flex gap-2">
                 <a href="https://github.com/bhadwajshubham" target="_blank" className="p-2 text-zinc-400 hover:text-black dark:hover:text-white transition"><Github className="w-5 h-5"/></a>
                 <a href="https://linkedin.com/in/shubhambhardwaj0777" target="_blank" className="p-2 text-zinc-400 hover:text-blue-600 transition"><Linkedin className="w-5 h-5"/></a>
                 <a href="mailto:bhardwajshubham0777@gmail.com" className="p-2 text-zinc-400 hover:text-red-500 transition"><Mail className="w-5 h-5"/></a>
              </div>
           </div>
        </section>

        {/* 4. HELP & FAQ (Moved to Bottom) */}
        <section>
           <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 ml-1">Support & FAQ</h3>
           <div className="space-y-3">
              <DetailsItem question="Where is my ticket?" answer="Check the 'My Tickets' tab in the navigation bar. All your active and past tickets are stored there securely." />
              <DetailsItem question="How does entry work?" answer="Show the QR Code from your ticket at the venue entrance. The organizer will scan it using their Admin Scanner." />
              <DetailsItem question="I found a bug, whom to contact?" answer="Please reach out directly to the Lead Developer via the email icon above." />
           </div>
        </section>

        {/* FOOTER */}
        <div className="mt-12 text-center border-t border-zinc-200 dark:border-zinc-800 pt-6">
           <p className="text-xs text-zinc-400 font-medium">
             © {new Date().getFullYear()} UniFlow CU • Built for Chitkara University
           </p>
           <p className="text-[10px] text-zinc-300 mt-1 flex items-center justify-center gap-1">
             <Code className="w-3 h-3" /> v1.0.0 (Stable)
           </p>
        </div>

      </div>
    </div>
  );
};

// Helper Component for FAQ items (Cleaner Code)
const DetailsItem = ({ question, answer }) => (
  <details className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
    <summary className="flex items-center justify-between p-4 font-bold text-sm text-zinc-800 dark:text-zinc-200 cursor-pointer select-none">
      {question}
      <ChevronDown className="w-4 h-4 text-zinc-400 transition-transform group-open:rotate-180" />
    </summary>
    <div className="px-4 pb-4 text-sm text-zinc-500 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-3">
      {answer}
    </div>
  </details>
);

export default AboutPage;