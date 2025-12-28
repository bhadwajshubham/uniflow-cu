import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { X, Search, Download, User, CheckCircle, Clock, Trash2, Edit } from 'lucide-react';
import EditEventModal from './EditEventModal';

const EventParticipantsModal = ({ isOpen, onClose, event }) => {
  const [activeTab, setActiveTab] = useState('participants'); 
  const [participants, setParticipants] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isOpen || !event) return;
    const unsubP = onSnapshot(query(collection(db, 'registrations'), where('eventId', '==', event.id)), (snap) => {
      setParticipants(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubR = onSnapshot(query(collection(db, 'reviews'), where('eventId', '==', event.id)), (snap) => {
      setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubP(); unsubR(); };
  }, [isOpen, event]);

  const handleExportCSV = () => {
    const headers = ['Name,Email,Roll No,Phone,Residency,Group,Status,Type,Registered At'];
    const rows = participants.map(p => {
      const date = p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : 'N/A';
      return `"${p.userName}","${p.userEmail}","${p.rollNo || 'N/A'}","${p.phone || 'N/A'}","${p.residency || 'N/A'}","${p.group || 'N/A'}","${p.status}","${p.type}","${date}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${event.title}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#FDFBF7] dark:bg-zinc-900 w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-black/20">
          <div>
            <h2 className="text-3xl font-black tracking-tighter dark:text-white uppercase">Attendance Control</h2>
            <div className="flex gap-2 mt-4 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button onClick={() => setActiveTab('participants')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'participants' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-zinc-400'}`}>Members ({participants.length})</button>
              <button onClick={() => setActiveTab('reviews')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'reviews' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-zinc-400'}`}>Feedback ({reviews.length})</button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl hover:scale-110 transition-all"><Download className="h-5 w-5" /></button>
            <button onClick={() => setIsEditing(true)} className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl hover:scale-110 transition-all"><Edit className="h-5 w-5" /></button>
            <button onClick={onClose} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-400 hover:rotate-90 transition-all"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
          {activeTab === 'participants' ? (
            <>
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10 flex gap-4">
                  <Search className="h-5 w-5 text-zinc-400 my-auto ml-2" />
                  <input type="text" placeholder="Search name or roll number..." className="w-full bg-transparent outline-none text-sm font-bold dark:text-white" value={filter} onChange={(e) => setFilter(e.target.value)} />
              </div>
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-black/40 text-[10px] font-black uppercase text-zinc-400 sticky top-[53px] z-10">
                  <tr><th className="px-8 py-4">Student Identity</th><th className="px-8 py-4">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {participants.filter(p => p.userName?.toLowerCase().includes(filter.toLowerCase()) || p.rollNo?.includes(filter)).map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-8 py-5">
                          <div className="font-black text-zinc-900 dark:text-white text-sm">{p.userName}</div>
                          <div className="text-[10px] text-zinc-500 font-bold uppercase mt-1">{p.rollNo} • {p.group} • {p.phone}</div>
                      </td>
                      <td className="px-8 py-5">
                        {p.status === 'attended' ? <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase"><CheckCircle className="h-4 w-4"/> Inside</span> 
                        : <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-400 rounded-full text-[10px] font-black uppercase"><Clock className="h-4 w-4"/> Waiting</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className="p-8 space-y-4">
               {reviews.map(r => (
                 <div key={r.id} className="p-6 bg-white dark:bg-zinc-800 rounded-[2rem] border border-zinc-100 dark:border-zinc-700 shadow-sm">
                    <div className="flex justify-between items-center mb-2"><p className="font-black text-indigo-600 text-sm">{r.userName}</p><div className="flex text-amber-500 text-xs">{"★".repeat(r.rating)}</div></div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 italic">"{r.comment}"</p>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>
      {isEditing && <EditEventModal isOpen={isEditing} onClose={() => setIsEditing(false)} event={event} />}
    </div>
  );
};

export default EventParticipantsModal;