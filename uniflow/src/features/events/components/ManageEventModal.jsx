import React, { useState, useEffect } from 'react';
import { X, Search, Download, User, CheckCircle, Clock } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const ManageEventModal = ({ isOpen, onClose, eventData }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!eventData?.id) return;

    const fetchParticipants = async () => {
      try {
        setLoading(true);
        // ✅ FIX: Query 'tickets' instead of 'registrations'
        const q = query(collection(db, 'tickets'), where('eventId', '==', eventData.id));
        const snapshot = await getDocs(q);
        
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setParticipants(data);
      } catch (error) {
        console.error("Error fetching participants:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchParticipants();
    }
  }, [isOpen, eventData]);

  if (!isOpen) return null;

  // Filter
  const filtered = participants.filter(p => 
    p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.userRollNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Download CSV
  const downloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Roll No,Ticket ID,Status,Scanned At\n" 
      + participants.map(p => {
          const scannedTime = p.scannedAt?.toDate ? p.scannedAt.toDate().toLocaleTimeString() : 'N/A';
          return `"${p.userName}","${p.userRollNo}","${p.id}","${p.scanned ? 'Attended' : 'Booked'}","${scannedTime}"`;
      }).join("\n");
      
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `${eventData.title}_Attendees.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-black/50">
           <div>
             <h2 className="text-xl font-black dark:text-white">{eventData.title}</h2>
             <p className="text-xs text-zinc-500 font-bold tracking-widest uppercase">Manage Attendees</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full text-zinc-500"><X className="w-5 h-5"/></button>
        </div>

        {/* Toolbar */}
        <div className="p-6 flex flex-col md:flex-row gap-4 border-b border-zinc-100 dark:border-zinc-800">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"/>
              <input 
                type="text" 
                placeholder="Search by name or roll no..." 
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-black rounded-xl border-none outline-none font-medium dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           <button onClick={downloadCSV} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none">
              <Download className="w-4 h-4" /> Export CSV
           </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-0">
           {loading ? (
             <div className="flex justify-center p-10"><span className="animate-spin text-indigo-600">Loading...</span></div>
           ) : filtered.length === 0 ? (
             <div className="text-center p-10 text-zinc-400">No attendees found.</div>
           ) : (
             <table className="w-full text-left border-collapse">
               <thead className="bg-zinc-50 dark:bg-black sticky top-0 z-10">
                 <tr>
                   <th className="p-4 text-xs font-black text-zinc-400 uppercase tracking-widest">User</th>
                   <th className="p-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Roll No</th>
                   <th className="p-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Status</th>
                   <th className="p-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Ticket ID</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                 {filtered.map(p => (
                   <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                     <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs">
                             {p.userName?.charAt(0) || <User className="w-4 h-4"/>}
                           </div>
                           <span className="font-bold text-sm dark:text-zinc-200">{p.userName || 'Unknown'}</span>
                        </div>
                     </td>
                     <td className="p-4 text-sm font-mono text-zinc-500">{p.userRollNo || 'N/A'}</td>
                     <td className="p-4">
                        {p.scanned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold uppercase">
                            <CheckCircle className="w-3 h-3"/> Attended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 text-zinc-500 rounded-md text-xs font-bold uppercase">
                            <Clock className="w-3 h-3"/> Pending
                          </span>
                        )}
                     </td>
                     <td className="p-4 text-xs font-mono text-zinc-400">{p.id}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
        </div>
      </div>
    </div>
  );
};

export default ManageEventModal;