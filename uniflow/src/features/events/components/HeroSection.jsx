import { ArrowRight, Ticket, Calendar, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const HeroSection = () => {
  return (
    <div className="relative overflow-hidden pt-32 pb-40 lg:pt-48">
      {/* Dot Pattern Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side: Content */}
          <div className="text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-semibold mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Next-Gen Campus Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight"
            >
              Events that <br />
              <span className="text-indigo-600 dark:text-indigo-500">actually matter.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-lg"
            >
              The student-first platform for securing tickets, hosting hackathons, and managing campus life.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <button className="h-12 px-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black font-semibold hover:opacity-90 transition-all flex items-center gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </button>
              <button className="h-12 px-8 rounded-full border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                View Schedule
              </button>
            </motion.div>
          </div>

          {/* Right Side: Visual (Floating Ticket) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative hidden lg:block"
          >
            {/* Glass Card Visual */}
            <div className="relative z-10 bg-white/10 dark:bg-white/5 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl p-6 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-white/5">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">MUSIC FEST</span>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Neon Nights 2025</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                    24
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                    <span>Oct 24, 6:00 PM</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <MapPin className="h-5 w-5 text-indigo-500" />
                    <span>Main Auditorium</span>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                     {[1,2,3].map(i => (
                       <div key={i} className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800" />
                     ))}
                   </div>
                   <span className="text-sm font-medium text-slate-900 dark:text-white">+850 Going</span>
                </div>
              </div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-indigo-500/30 blur-[100px] -z-10" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;