import React, { useEffect, useState } from 'react';
import { 
  collection, query, where, getDocs, deleteDoc, doc, writeBatch, onSnapshot 
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { 
  X, Search, Download, User, Users, CheckCircle, Clock, 
  Trash2, Edit, AlertCircle, MessageSquare 
} from 'lucide-react';
import EditEventModal from './EditEventModal';

const EventParticipantsModal = ({ isOpen, onClose, event }) => {
  const [activeTab, setActiveTab] = useState('participants'); 
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isOpen || !event) return;
    
    // 🔴 REAL-TIME LISTENER: Instantly updates when admin scans QR
    const qP = query(collection(db, 'registrations'), where('eventId', '==', event.id));
    const unsubP = onSnapshot(qP, (snapshot) => {
      setParticipants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const qR = query(collection(db, 'reviews'), where('eventId', '==', event.id));
    const unsubR = onSnapshot(qR, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubP(); unsubR(); };
  }, [isOpen, event]);

  const handleDeleteEvent = async () => {
    if (!window.confirm("DANGER: This deletes EVERYTHING (Tickets/Reviews). Proceed?")) return;
    try {
      const batch = writeBatch(db);
      const q = query(collection(db, 'registrations'), where('eventId', '==', event.id));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));

      const qR = query(collection(db, 'reviews'), where('eventId', '==', event.id));
      const snapR = await getDocs(qR);
      snapR.docs.forEach(doc => batch.delete(doc.ref));

      await batch.commit();
      await deleteDoc(doc(db, 'events', event.id));
      window.location.reload(); 
    } catch (error) { alert("Delete failed"); }
  };

  const handleExportCSV = () => {
    const headers = ['Name,Email,Status,Type,Team Code,Roll No,Phone,Residency,Registered At'];
    const rows = participants.map(p => {
      const name = `"${(p.userName || 'Student').replace(/"/g, '""')}"`;
      const email = `"${p.userEmail || 'N/A'}"`;
      const status = `"${p.status || 'confirmed'}"`;
      const type = `"${p.type || 'individual'}"`;
      const team = `"${p.teamCode || 'N/A'}"`;
      const roll = `"${p.rollNo || 'N/A'}"`;
      const phone = `"${p.phone || 'N/A'}"`;
      const residency = `"${p.residency || 'N/A'}"`;
      
      let date = "N/A";
      if (p.createdAt?.toDate) date = `"${p.createdAt.toDate().toLocaleDateString()}"`;
      else if (p.createdAt) date = `"${new Date(p.createdAt).toLocaleDateString()}"`;

      return `${name},${email},${status},${type},${team},${roll},${phone},${residency},${date}`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${event.title.replace(/\s+/g, '_')}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredParticipants = participants.filter(p => 
    (p.userName || '').toLowerCase().includes(filter.toLowerCase()) || 
    (p.userEmail || '').toLowerCase().includes(filter.toLowerCase())
  );

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col h-[85vh] animate-in zoom-in-95 duration-400">
        
        {/* Header */}
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center bg-zinc-50/50 dark:bg-black/20 gap-4">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h2 className="text-2xl font-black tracking-tighter dark:text-white">Management Console</h2>
            <div className="flex gap-2 mt-4 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button onClick={() => setActiveTab('participants')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'participants' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-zinc-400'}`}>Members ({participants.length})</button>
              <button onClick={() => setActiveTab('reviews')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'reviews' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-zinc-400'}`}>Reviews ({reviews.length})</button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleExportCSV} className="p-3 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl transition-all hover:scale-110"><Download className="h-5 w-5" /></button>
            <button onClick={() => setIsEditing(true)} className="p-3 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl transition-all hover:scale-110"><Edit className="h-5 w-5" /></button>
            <button onClick={handleDeleteEvent} className="p-3 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl transition-all hover:scale-110"><Trash2 className="h-5 w-5" /></button>
            <button onClick={onClose} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-500 hover:rotate-90 transition-all"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
          {activeTab === 'participants' ? (
            <>
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex gap-4 bg-white dark:bg-zinc-900 sticky top-0 z-10">
                  <Search className="h-5 w-5 text-zinc-400 my-auto ml-2" />
                  <input type="text" placeholder="Search student by name or email..." className="w-full bg-transparent outline-none text-sm font-medium dark:text-white" value={filter} onChange={(e) => setFilter(e.target.value)} />
              </div>
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800 text-[10px] font-black uppercase text-zinc-400 sticky top-[53px] z-10">
                  <tr><th className="px-8 py-4">Student Identity</th><th className="px-8 py-4">Category</th><th className="px-8 py-4 text-right">Gate Status</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {loading ? (<tr><td colSpan="3" className="text-center py-20 font-bold text-zinc-400">Fetching Database...</td></tr>) 
                  : filteredParticipants.length === 0 ? (<tr><td colSpan="3" className="text-center py-20 font-bold text-zinc-400">Empty Record</td></tr>) 
                  : (filteredParticipants.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-8 py-5">
                            <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><User className="w-4 h-4 text-indigo-500" /> {p.userName}</div>
                            <div className="text-xs text-zinc-500 font-medium">{p.userEmail}</div>
                        </td>
                        <td className="px-8 py-5">
                           <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-black uppercase text-zinc-500">{p.type || 'Individual'}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {(p.status === 'used' || p.status === 'attended')
                            ? <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest animate-in fade-in"><CheckCircle className="h-4 w-4"/> Inside</span> 
                            : <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest"><Clock className="h-4 w-4"/> Waiting</span>
                          }
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          ) : (
            <div className="p-8 space-y-4">
               {reviews.length === 0 ? (
                 <div className="text-center py-20 text-zinc-400 font-black uppercase tracking-widest">No Feedback Yet</div>
               ) : (
                 reviews.map(r => (
                    <div key={r.id} className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700">
                       <div className="flex justify-between items-start mb-2">
                          <p className="font-black text-indigo-600">{r.userName}</p>
                          <div className="flex text-amber-500">{"★".repeat(r.rating)}</div>
                       </div>
                       <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 italic">"{r.comment}"</p>
                    </div>
                 ))
               )}
            </div>
          )}
        </div>
      </div>
      {isEditing && <EditEventModal isOpen={isEditing} onClose={() => setIsEditing(false)} event={event} onSuccess={() => { setIsEditing(false); }} />}
    </div>
  );
};

export default EventParticipantsModal;