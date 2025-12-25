import React from 'react';
import { Mail, MessageCircle, FileQuestion, ChevronRight, LifeBuoy } from 'lucide-react';

const HelpPage = () => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        
        {/* Header Icon */}
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-6">
          <LifeBuoy className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        
        <h1 className="text-4xl font-black text-zinc-900 dark:text-white mb-4">
          How can we help you?
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-12 max-w-2xl mx-auto">
          From account access to ticket issues, we're here to ensure your campus experience is smooth.
        </p>

        {/* Support Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* Card 1: Email */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-600">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Email Support</h3>
            <p className="text-sm text-zinc-500 mt-2 mb-6">
              Get a response within 24 hours. Best for non-urgent queries.
            </p>
            <a href="mailto:support@uniflow.com" className="inline-flex items-center text-blue-600 font-semibold hover:gap-2 transition-all">
              Send Email <ChevronRight className="w-4 h-4 ml-1" />
            </a>
          </div>

          {/* Card 2: Chat */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl">ONLINE</div>
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-green-600">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Live Chat</h3>
            <p className="text-sm text-zinc-500 mt-2 mb-6">
              Chat with our support team in real-time.
            </p>
            <button className="inline-flex items-center text-green-600 font-semibold hover:gap-2 transition-all">
              Start Chat <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Card 3: FAQs */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-purple-600">
              <FileQuestion className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">FAQs</h3>
            <p className="text-sm text-zinc-500 mt-2 mb-6">
              Find answers to common questions about ticketing.
            </p>
            <button className="inline-flex items-center text-purple-600 font-semibold hover:gap-2 transition-all">
              Browse Articles <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;