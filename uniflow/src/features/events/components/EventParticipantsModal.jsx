import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { X, Search, Download, Phone, Users } from 'lucide-react';

const EventParticipantsModal = ({ isOpen, onClose, event }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen || !event) return;

    const q = query(collection(db, 'registrations'), where('eventId', '==', event.id));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setParticipants(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    });

    return () => unsub();
  }, [isOpen, event]);

  // 🛡️ SECURITY PATCH: Prevent CSV Formula Injection (Excel Exploits)
  const sanitizeForCSV = (str) => {
    if (!str) return 'N/A';
    const s = String(str);
    // Escape leading characters that trigger Excel formula execution
    return /^[=+\-@]/.test(s) ? `'${s}` : s;
  };

  const handleExportCSV = () => {
    const headers = ['Name,Email,Roll No,Phone,Residency,Group,Branch,Status,Type,Registered At'];
    const rows = participants.map(p => {
      const date = p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : 'N/A';
      return `"${sanitizeForCSV(p.userName)}","${sanitizeForCSV(p.userEmail)}","${sanitizeForCSV(p.rollNo)}","${sanitizeForCSV(p.phone)}","${sanitizeForCSV(p.residency)}","${sanitizeForCSV(p.group)}","${sanitizeForCSV(p.branch)}","${p.status}","${p.type}","${date}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${event.title.replace(/\s+/g, '_')}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const filtered = participants.filter(p => 
    p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.rollNo?.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-900 flex flex-wrap justify-between items-center bg-zinc-50/50 dark:bg-black/20 gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase dark:text-white italic">Attendee Ledger</h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Live Manifest: {event.title}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExportCSV} className="px-6 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-50 transition-all shadow-sm">
               <Download className="w-4 h-4" /> Export Sanitized CSV
            </button>
            <button onClick={onClose} className="p-3 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-2xl transition-all"><X /></button>
          </div>
        </div>

        <div className="p-6 border-b border-zinc-100 dark:border-zinc-900">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="text" placeholder="Search manifest by Roll No or Name..." className="w-full pl-12 pr-6 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-zinc-50 dark:bg-black">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <div key={p.id} className="p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                   <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-xs text-zinc-500 uppercase">{p.userName?.[0]}</div>
                         <div>
                            <p className="font-black text-sm dark:text-white uppercase truncate max-w-[120px]">{p.userName}</p>
                            <p className="text-[9px] text-zinc-400 font-bold tracking-widest">{p.rollNo}</p>
                         </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${p.status === 'attended' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{p.status}</span>
                   </div>
                   
                   <div className="space-y-1.5 pt-3 border-t border-zinc-50 dark:border-zinc-800">
                      <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-bold uppercase"><Phone className="w-3 h-3"/> {p.phone}</div>
                      <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-bold uppercase"><Users className="w-3 h-3"/> {p.group}</div>
                      <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest truncate">{p.branch}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default EventParticipantsModal;