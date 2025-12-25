import React from 'react';
import { QrCode } from 'lucide-react';

const ScanPage = () => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 px-4 flex flex-col items-center">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
          <QrCode className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">QR Scanner</h1>
        <p className="text-zinc-500 mb-8">Camera access is required to scan ticket QR codes.</p>
        
        <div className="h-64 bg-black rounded-2xl flex items-center justify-center text-zinc-500 mb-6">
          [Camera View Placeholder]
        </div>

        <button className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
          Start Camera
        </button>
      </div>
    </div>
  );
};

export default ScanPage;