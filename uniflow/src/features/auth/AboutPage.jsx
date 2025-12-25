import React from 'react';
import { Github, Linkedin, Mail, Globe, Sparkles, Code2 } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-6 flex items-center justify-center relative overflow-hidden">
      
      {/* Background Blobs (Decoration) */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-500 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-500 rounded-full blur-[100px] opacity-20 animate-pulse delay-700"></div>

      {/* Glass Card */}
      <div className="relative z-10 w-full max-w-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 md:p-12 shadow-2xl">
        
        <div className="flex flex-col md:flex-row items-center gap-10">
          
          {/* Photo Section */}
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white dark:border-black shadow-inner bg-zinc-100 dark:bg-zinc-800">
              {/* 👇 Your GitHub Avatar Auto-Link */}
              <img 
                src="https://github.com/bhadwajshubham.png" 
                alt="Shubham Bhardwaj" 
                className="w-full h-full object-cover transform transition group-hover:scale-110 duration-700"
                onError={(e) => e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Architect"}
              />
            </div>
            {/* Online Status Dot */}
            <div className="absolute bottom-3 right-3 bg-emerald-500 w-5 h-5 rounded-full border-4 border-white dark:border-zinc-900 z-20"></div>
          </div>

          {/* Content Section */}
          <div className="text-center md:text-left flex-1 space-y-4">
            
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-500/20">
                Lead Architect
              </span>
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            
            <div>
              <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-1">
                Shubham Bhardwaj
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium flex items-center justify-center md:justify-start gap-2">
                <Code2 className="w-4 h-4" /> Full Stack Engineer
              </p>
            </div>

            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-sm">
              Building <span className="text-indigo-600 dark:text-indigo-400 font-bold">UniFlow</span> to revolutionize campus events. 
              I specialize in creating high-performance, scalable web applications using React, Firebase, and Modern UI principles.
            </p>

            {/* Social Links Row */}
            <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
              <SocialBtn icon={Github} href="https://github.com/bhadwajshubham" label="GitHub" />
              <SocialBtn icon={Linkedin} href="https://linkedin.com/in/" label="LinkedIn" />
              <SocialBtn icon={Globe} href="#" label="Portfolio" />
              <SocialBtn icon={Mail} href="mailto:shubham@example.com" label="Email" />
            </div>
          </div>
        </div>

        {/* Tech Stack Footer */}
        <div className="mt-10 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap justify-center gap-4 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
          <span>React 18</span>
          <span>•</span>
          <span>Firebase</span>
          <span>•</span>
          <span>Tailwind</span>
          <span>•</span>
          <span>Vite PWA</span>
        </div>

      </div>
    </div>
  );
};

// Reusable Button Component
const SocialBtn = ({ icon: Icon, href, label }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noreferrer"
    aria-label={label}
    className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/30"
  >
    <Icon className="w-5 h-5" />
  </a>
);

export default AboutPage;