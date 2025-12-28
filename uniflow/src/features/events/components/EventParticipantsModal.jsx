import React, { useEffect, useState } from 'react';
import { 
  X, Search, Download, User, Users, CheckCircle, Clock, 
  Trash2, Edit, AlertCircle, MessageSquare, BarChart3
} from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
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
    
    // 🔴 REAL-TIME LIVE LISTENER: Watch gate entries happen live
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

  const handleExportCSV = () => {
    // 📊 MANDATORY DATA EXPORT
    const headers = ['Name,Email,Roll No,Phone,Residency,Group,Status,Type,Team Code,Registered At'];
    const rows = participants.map(p => {
      const name = `"${(p.userName || 'Student').replace(/"/g, '""')}"`;
      const email = `"${p.userEmail || 'N/A'}"`;
      const roll = `"${p.rollNo || 'N/A'}"`;
      const phone = `"${p.phone || 'N/A'}"`;
      const residency = `"${p.residency || 'N/A'}"`;
      const group = `"${p.group || 'N/A'}"`;
      const status = `"${p.status || 'confirmed'}"`;
      const type = `"${p.type || 'individual'}"`;
      const team = `"${p.teamCode || 'N/A'}"`;
      const date = p.createdAt?.toDate ? `"${p.createdAt.toDate().toLocaleDateString()}"` : '"N/A"';

      return `${name},${email},${roll},${phone},${residency},${group},${status},${type},${team},${date}`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${event.title.replace(/\s+/g, '_')}_master_sheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const attendedCount = participants.filter(p => p.status === 'attended' || p.status === 'used').length;
  const filteredParticipants = participants.filter(p => 
    p.userName?.toLowerCase().includes(filter.toLowerCase()) || 
    p.rollNo?.includes(filter)
  );

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-[#FDFBF7] dark:bg-zinc-900 w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Header Section */}
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-black/20">
          <div>
            <h2 className="text-3xl font-black tracking-tighter dark:text-white">Live Attendance</h2>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setActiveTab('participants')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'participants' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>Members ({participants.length})</button>
              <button onClick={() => setActiveTab('reviews')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'reviews' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>Feedback ({reviews.length})</button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl hover:scale-110 transition-all"><Download className="h-5 w-5" /></button>
            <button onClick={onClose} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-400 hover:rotate-90 transition-all"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="px-8 py-3 bg-indigo-50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
               <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Scanning Active</span>
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase">{attendedCount} Students Checked In</p>
        </div>

        {/* Table/List Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
          {activeTab === 'participants' ? (
            <>
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10 flex gap-4">
                  <Search className="h-5 w-5 text-zinc-400 my-auto ml-2" />
                  <input type="text" placeholder="Search by name or roll number..." className="w-full bg-transparent outline-none text-sm font-bold dark:text-white" value={filter} onChange={(e) => setFilter(e.target.value)} />
              </div>
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-black/40 text-[10px] font-black uppercase text-zinc-400">
                  <tr><th className="px-8 py-4">Student Details</th><th className="px-8 py-4">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {loading ? (<tr><td colSpan="2" className="text-center py-20 font-bold text-zinc-400 italic tracking-widest">Querying Registrations...</td></tr>) 
                  : filteredParticipants.length === 0 ? (<tr><td colSpan="2" className="text-center py-20 font-bold text-zinc-400 tracking-widest uppercase text-xs">No records matching search</td></tr>) 
                  : (filteredParticipants.map((p) => (
                      <tr key={p.id} className={`transition-colors ${p.status === 'attended' ? 'bg-green-50/50 dark:bg-green-900/5' : ''}`}>
                        <td className="px-8 py-5">
                            <div className="font-black text-zinc-900 dark:text-white flex items-center gap-2 text-sm">{p.userName}</div>
                            <div className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-tighter">
                              {p.rollNo} • {p.group} • {p.phone}
                            </div>
                        </td>
                        <td className="px-8 py-5">
                          {(p.status === 'used' || p.status === 'attended')
                            ? <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest"><CheckCircle className="h-4 w-4"/> Entered Gate</span> 
                            : <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-400 rounded-full text-[10px] font-black uppercase tracking-widest"><Clock className="h-4 w-4"/> In Queue</span>
                          }
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          ) : (
            /* REVIEWS TAB */
            <div className="p-8 space-y-4 bg-zinc-50/50 dark:bg-black/20 h-full">
               {reviews.length === 0 ? (
                 <div className="text-center py-20 text-zinc-400 font-black uppercase tracking-widest">No Feedback Recorded</div>
               ) : (
                 reviews.map(r => (
                    <div key={r.id} className="p-6 bg-white dark:bg-zinc-800 rounded-[2rem] border border-zinc-100 dark:border-zinc-700 shadow-sm">
                       <div className="flex justify-between items-center mb-3">
                          <p className="font-black text-indigo-600 text-sm">{r.userName}</p>
                          <div className="flex text-amber-500 text-xs">{"★".repeat(r.rating)}</div>
                       </div>
                       <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed italic">"{r.comment}"</p>
                    </div>
                 ))
               )}
            </div>
          )}
        </div>
      </div>
      {isEditing && <EditEventModal isOpen={isEditing} onClose={() => setIsEditing(false)} event={event} />}
    </div>
  );
};

export default EventParticipantsModal;