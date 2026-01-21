import React from 'react';
import { Mail, Github, Linkedin, HelpCircle, Code, Heart, Globe } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* 🆘 HELP SECTION */}
        <section className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Help & Support</h2>
          </div>
          
          <div className="space-y-4">
            <details className="group bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 cursor-pointer">
              <summary className="font-bold text-zinc-900 dark:text-white flex justify-between items-center">
                How do I get my certificate?
              </summary>
              <p className="mt-2 text-zinc-500 text-sm leading-relaxed">
                After attending an event, the organizer will scan your QR code. Once scanned, your certificate automatically appears in the "My Tickets" section under the "History" tab.
              </p>
            </details>

            <details className="group bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 cursor-pointer">
              <summary className="font-bold text-zinc-900 dark:text-white flex justify-between items-center">
                Can I cancel a ticket?
              </summary>
              <p className="mt-2 text-zinc-500 text-sm leading-relaxed">
                Yes, but only before the event starts. Go to "My Tickets," select the ticket, and look for the cancel option if enabled by the organizer.
              </p>
            </details>
            
            <details className="group bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 cursor-pointer">
              <summary className="font-bold text-zinc-900 dark:text-white flex justify-between items-center">
                I am an organizer. How do I verify students?
              </summary>
              <p className="mt-2 text-zinc-500 text-sm leading-relaxed">
                Use the "Scanner" button in your Admin Dashboard. It opens your camera to scan student QR codes instantly.
              </p>
            </details>
          </div>
        </section>

        {/* 👨‍💻 DEVELOPER SPOTLIGHT (THE FAME SECTION) */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-black text-white rounded-3xl p-8 shadow-2xl">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-20"></div>
          
          <div className="relative z-10 text-center">
            <div className="inline-block p-1 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 mb-4">
               {/* 🖼️ REPLACE WITH YOUR PHOTO URL */}
               <img 
                 src="https://avatars.githubusercontent.com/u/159251372?s=400&u=fae706d629454f4209ac7aa2100bca12ec4bef20&v=4" 
                 alt="Shubham" 
                 className="w-24 h-24 rounded-full border-4 border-black object-cover"
                 onError={(e) => e.target.src = 'https://ui-avatars.com/api/?name=Shubham&background=random'}
               />
            </div>
            
            <h2 className="text-3xl font-black mb-1">Meet the Developer</h2>
            <p className="text-indigo-200 font-medium mb-6">Designed & Built by Shubham</p>
            
            <p className="text-zinc-400 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
              Hi, I'm a Full-Stack Engineer passionate about solving campus problems with code. 
              UniFlow was built to make event management seamless for everyone at Chitkara University.
            </p>

            {/* Social Links */}
            <div className="flex justify-center gap-4">
              <a href="https://github.com/bhadwajshubham" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm">
                <Github className="w-5 h-5" />
              </a>
              <a href="www.linkedin.com/in/shubhambhardwaj0777" target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-full transition-colors backdrop-blur-sm">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="mailto:bhardwajshubham0777@gmail.com" className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm">
                <Mail className="w-5 h-5" />
              </a>
              <a href="https://bhardwajshubham.netlify.app/" target="_blank" rel="noopener noreferrer" className="p-3 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 rounded-full transition-colors backdrop-blur-sm">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
             <p className="text-xs text-zinc-500 flex items-center justify-center gap-1">
               <Code className="w-3 h-3" /> with <Heart className="w-3 h-3 text-red-500" /> in Haryana
             </p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default AboutPage;