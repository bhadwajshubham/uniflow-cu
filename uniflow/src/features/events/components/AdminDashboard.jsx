import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, deleteDoc, doc, writeBatch, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { 
  Ticket, Calendar, Activity, Plus, QrCode, 
  MoreVertical, RefreshCw, Trash2, Users, Edit, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateEventModal from './CreateEventModal';
import EditEventModal from './EditEventModal';
import EventParticipantsModal from './EventParticipantsModal';

const AdminDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ events: 0, tickets: 0, funds: 0 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // God Mode Default
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    if (!user) return;
    const eventsRef = collection(db, 'events');
    
    // 🛡️ Super Admin logic: if filter is 'all', show everything. Else show only created by current UID.
    const q = (profile?.role === 'super_admin' && filterMode === 'all') 
      ? query(eventsRef) 
      : query(eventsRef, where('organizerId', '==', user.uid));

    const unsub = onSnapshot(q, (snapshot) => {
      let tTickets = 0; let tFunds = 0;
      const list = snapshot.docs.map(doc => {
        const d = doc.data();
        tTickets += (d.ticketsSold || 0);
        tFunds += ((d.ticketsSold || 0) * (Number(d.price) || 0));
        return { id: doc.id, ...d };
      });
      setStats({ events: snapshot.size, tickets: tTickets, funds: tFunds });
      setEvents(list.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    });
    return () => unsub();
  }, [user, profile, filterMode]);

  const handleDelete = async (eventId) => {
    if (!window.confirm("🚨 CRITICAL PERMANENT ACTION: Purge all tickets, reviews, and event data?")) return;
    try {
      setLoading(true);
      const docsToDelete = [];

      // Collect everything associated with event
      const qT = query(collection(db, 'registrations'), where('eventId', '==', eventId));
      const sT = await getDocs(qT);
      sT.docs.forEach(d => docsToDelete.push(d.ref));

      const qR = query(collection(db, 'reviews'), where('eventId', '==', eventId));
      const sR = await getDocs(qR);
      sR.docs.forEach(d => docsToDelete.push(d.ref));

      // Batch Purge in 500s (Tester's Fix)
      for (let i = 0; i < docsToDelete.length; i += 500) {
        const batch = writeBatch(db);
        docsToDelete.slice(i, i + 500).forEach(ref => batch.delete(ref));
        await batch.commit();
      }

      await deleteDoc(doc(db, 'events', eventId));
      alert("System Cleansed.");
    } catch (err) { alert("Error during purge."); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pt-32 text-center font-black text-indigo-600">UNIFLOW CORE LOADING...</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pt-24 pb-24 px-4" onClick={() => setActiveMenuId(null)}>
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter dark:text-white flex items-center gap-2 italic uppercase">Organizer Console</h1>
            {profile?.role === 'super_admin' && (
              <div className="flex gap-2 mt-4 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl w-fit">
                <button onClick={() => setFilterMode('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'all' ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-xl' : 'text-zinc-500'}`}>Platform View</button>
                <button onClick={() => setFilterMode('mine')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'mine' ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-xl' : 'text-zinc-500'}`}>My Club</button>
              </div>
            )}
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => setIsCreateModalOpen(true)} className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Create Event</button>
            <button onClick={() => navigate('/scan')} className="flex-1 md:flex-none px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-2 shadow-xl hover:scale-105 transition-all"><QrCode className="w-5 h-5" /> Scanner</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm transition-transform hover:-translate-y-1">
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Live Events</p>
             <p className="text-4xl font-black dark:text-white">{stats.events}</p>
          </div>
          <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm transition-transform hover:-translate-y-1">
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Admissions</p>
             <p className="text-4xl font-black dark:text-white">{stats.tickets}</p>
          </div>
          <div className="p-8 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[2.5rem] shadow-2xl transition-transform hover:-translate-y-1">
             <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">Est. Revenue</p>
             <p className="text-4xl font-black">₹{stats.funds}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-black/40 text-[10px] font-black uppercase text-zinc-400 tracking-widest">
              <tr><th className="px-8 py-6">Event Identity</th><th className="px-8 py-6">Registered Students</th><th className="px-8 py-6 text-right">Moderation</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 group transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">{event.title}</p>
                    <p className="text-[10px] text-indigo-600 font-bold uppercase mt-1">{event.date} • {event.location}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <span className="font-black dark:text-white text-xl">{event.ticketsSold}</span>
                       <span className="text-zinc-400 font-bold uppercase text-[10px]">/ {event.totalTickets} Spots</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right relative">
                    <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === event.id ? null : event.id); }} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><MoreVertical className="w-4 h-4" /></button>
                    {activeMenuId === event.id && (
                      <div className="absolute right-10 top-16 w-56 bg-white dark:bg-zinc-800 rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-700 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-300">
                        <button onClick={() => navigate(`/events/${event.id}`)} className="w-full text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-3">View Event Page</button>
                        <button onClick={() => { setSelectedEvent(event); setIsParticipantsModalOpen(true); setActiveMenuId(null); }} className="w-full text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-indigo-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-3">Manage Gate</button>
                        <button onClick={() => { setSelectedEvent(event); setIsEditModalOpen(true); setActiveMenuId(null); }} className="w-full text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-3">Edit Details</button>
                        <button onClick={() => handleDelete(event.id)} className="w-full text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-red-600 border-t border-zinc-100 dark:border-zinc-800 hover:bg-red-50 flex items-center gap-3">Purge Data</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <CreateEventModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <EditEventModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} event={selectedEvent} />
      <EventParticipantsModal isOpen={isParticipantsModalOpen} onClose={() => setIsParticipantsModalOpen(false)} event={selectedEvent} />
    </div>
  );
};

export default AdminDashboard;