import React from 'react';
import { Mail, Github, Linkedin, ChevronDown, Rocket, Heart, Code, Globe, Calendar } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-20 pb-24 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* 1. THE CREATOR (HERO SECTION) - Moved to Top & Bigger */}
        <section className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl border border-zinc-200 dark:border-zinc-800 text-center relative overflow-hidden">
           {/* Subtle Background Gradient */}
           <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-10"></div>
           
           <div className="relative z-10">
             {/* Big Photo */}
             <div className="w-32 h-32 mx-auto mb-6 p-1 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 shadow-2xl">
                <img 
                   src="https://avatars.githubusercontent.com/u/159251372?v=4" 
                   alt="Shubham" 
                   className="w-full h-full rounded-full object-cover border-4 border-white dark:border-zinc-900"
                />
             </div>

             <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-1">
               Shubham Bhardwaj
             </h1>
             <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm tracking-wide uppercase mb-4">
               Designed & Built by
             </p>

             <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-lg mx-auto mb-6 text-sm">
               "I built UniFlow to solve the chaos of paper tickets. My goal is to make campus life seamless for every student and society at Chitkara University."
             </p>

             {/* Social Links */}
             <div className="flex justify-center gap-4">
                <SocialLink href="https://github.com/bhadwajshubham" icon={Github} />
                <SocialLink href="https://linkedin.com/in/shubhambhardwaj0777" icon={Linkedin} />
                <SocialLink href="https://bhardwajshubham.netlify.app/" icon={Globe} />
                <SocialLink href="mailto:bhardwajshubham0777@gmail.com" icon={Mail} />
             </div>
           </div>
        </section>

        {/* 2. PARTNER WITH US (Welfare & Societies) */}
        <section className="bg-gradient-to-br from-indigo-900 to-black rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
           <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
           
           <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white shrink-0">
                 <Calendar className="w-6 h-6" />
              </div>
              <div className="flex-1">
                 <h2 className="text-xl font-bold mb-1">Launch Your Event</h2>
                 <p className="text-indigo-200 text-sm leading-relaxed">
                    Are you a Student Society or Welfare Club? Partner with us to host seamless registrations for your next event.
                 </p>
              </div>
              <a href="mailto:bhardwajshubham0777@gmail.com?subject=Host Event on UniFlow" className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-100 transition whitespace-nowrap text-sm">
                 Contact Us
              </a>
           </div>
        </section>

        {/* 3. ABOUT THE APP (Why UniFlow?) */}
        <section>
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                 <Rocket className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-lg">The Mission</h3>
           </div>
           
           <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800">
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4">
                 UniFlow is not just a ticketing app; it's a complete <strong>Event Operating System</strong>. We replaced long queues and lost paper slips with instant QR codes and real-time analytics.
              </p>
              <div className="flex gap-2 flex-wrap">
                 <Badge text="Instant Booking" />
                 <Badge text="Secure QR Entry" />
                 <Badge text="Live Analytics" />
                 <Badge text="Zero Paper Waste" />
              </div>
           </div>
        </section>

        {/* 4. FAQ */}
        <section>
           <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 ml-2">Common Questions</h3>
           <div className="space-y-3">
              <DetailsItem question="Where is my ticket?" answer="Check the 'My Tickets' tab. Your unique QR code is stored there safely." />
              <DetailsItem question="How do I verify entry?" answer="Show your QR Code at the venue. Organizers scan it instantly." />
              <DetailsItem question="Is this official?" answer="UniFlow is a student-led initiative built for the Chitkara community." />
           </div>
        </section>

        {/* FOOTER */}
        <div className="pt-6 text-center">
           <p className="text-[10px] text-zinc-400 font-medium flex items-center justify-center gap-1">
             <Code className="w-3 h-3" /> Built with <Heart className="w-3 h-3 text-red-500 fill-current" /> in India
           </p>
        </div>

      </div>
    </div>
  );
};

// --- Helper Components ---

const SocialLink = ({ href, icon: Icon }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer" 
    className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-white dark:hover:text-black rounded-full transition-all"
  >
    <Icon className="w-5 h-5" />
  </a>
);

const Badge = ({ text }) => (
  <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full text-xs font-bold border border-zinc-200 dark:border-zinc-700">
    {text}
  </span>
);

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