import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, writeBatch, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { 
  Ticket, Calendar, Plus, QrCode, MoreVertical, Trash2, Users, Edit, ShieldCheck, Globe, Lock
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
  
  // 🛡️ SUPERADMIN LOGIC: Check if user is Root
  const isSuper = profile?.role === 'super_admin';
  const isAdmin = profile?.role === 'admin';
  
  // Default to global view for SuperAdmin, local view for Admin
  const [filterMode, setFilterMode] = useState(isSuper ? 'all' : 'mine');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    // Security Guard: Prevent students from staying on this route
    if (!loading && !isSuper && !isAdmin) {
      navigate('/');
      return;
    }

    if (!user || !profile) return;
    
    const eventsRef = collection(db, 'events');
    let q;

    // 🔥 THE BYPASS: SuperAdmin can fetch all documents without 'where' filter
    if (isSuper && filterMode === 'all') {
      q = query(eventsRef);
    } else {
      q = query(eventsRef, where('organizerId', '==', user.uid));
    }

    const unsub = onSnapshot(q, (snapshot) => {
      let tTickets = 0; 
      let tFunds = 0;
      const list = snapshot.docs.map(doc => {
        const d = doc.data();
        tTickets += (d.ticketsSold || 0);
        // Calculate revenue based on price and tickets sold
        tFunds += ((d.ticketsSold || 0) * (Number(d.price) || 0));
        return { id: doc.id, ...d };
      });
      
      setStats({ events: snapshot.size, tickets: tTickets, funds: tFunds });
      // Sort by newest creation date
      setEvents(list.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    }, (error) => {
      console.error("Critical: Dashboard Listener Failed", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user, profile, filterMode, loading, isSuper, isAdmin, navigate]);

  // 💥 THE CHUNKED PURGE LOGIC (Crucial for 500+ ticket events)
  const handleDelete = async (eventId) => {
    const confirmation = window.confirm("🚨 WARNING: This will permanently delete the event AND wipe every student registration pass from the database. This cannot be undone. Proceed?");
    
    if (!confirmation) return;

    try {
      setLoading(true);
      const docsToDelete = [];

      // 1. Collect all Registrations (Tickets)
      const qT = query(collection(db, 'registrations'), where('eventId', '==', eventId));
      const sT = await getDocs(qT);
      sT.docs.forEach(d => docsToDelete.push(d.ref));

      // 2. Collect all Reviews
      const qR = query(collection(db, 'reviews'), where('eventId', '==', eventId));
      const sR = await getDocs(qR);
      sR.docs.forEach(d => docsToDelete.push(d.ref));

      // ⚡ TESTER FIX: Chunk Deletes (500 per batch limit)
      // This prevents the "Too many writes" Firestore error
      for (let i = 0; i < docsToDelete.length; i += 500) {
        const batch = writeBatch(db);
        docsToDelete.slice(i, i + 500).forEach(ref => batch.delete(ref));
        await batch.commit();
      }

      // 3. Delete the main event document
      await deleteDoc(doc(db, 'events', eventId));
      
      alert("System Purge Complete. Event and data removed.");
    } catch (err) { 
      console.error("Purge Error:", err);
      alert("Purge Failed: Check Firestore Security Rules or Network."); 
    } finally { 
      setLoading(false); 
      setActiveMenuId(null);
    }
  };

  const openParticipants = (event) => {
    setSelectedEvent(event);
    setIsParticipantsModalOpen(true);
    setActiveMenuId(null);
  };

  const openEdit = (event) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
    setActiveMenuId(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 mx-auto mb-4"></div>
        <p className="font-black text-[10px] uppercase tracking-[0.3em] text-indigo-600 animate-pulse">Syncing UniFlow Core...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pt-24 pb-24 px-4 sm:px-8" onClick={() => setActiveMenuId(null)}>
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
          <div>
            <h1 className="text-5xl font-black tracking-tighter dark:text-white uppercase italic">
              Console {isSuper && <span className="text-indigo-600">.Root</span>}
            </h1>
            
            {isSuper && (
              <div className="flex gap-2 mt-6 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-[1.2rem] w-fit border border-zinc-200 dark:border-zinc-800 shadow-inner">
                <button 
                  onClick={() => setFilterMode('all')} 
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filterMode === 'all' ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-xl' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  <Globe className="w-3 h-3" /> Platform Global
                </button>
                <button 
                  onClick={() => setFilterMode('mine')} 
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filterMode === 'mine' ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-xl' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  <Lock className="w-3 h-3" /> Private Hub
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => setIsCreateModalOpen(true)} className="flex-1 md:flex-none px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Host Event
            </button>
            <button onClick={() => navigate('/scan')} className="flex-1 md:flex-none px-10 py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all">
              <QrCode className="w-4 h-4" /> Scanner
            </button>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-10 bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Live Experiences</p>
             <p className="text-5xl font-black dark:text-white tracking-tighter">{stats.events}</p>
          </div>
          <div className="p-10 bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Campus Footfall</p>
             <p className="text-5xl font-black dark:text-white tracking-tighter">{stats.tickets}</p>
          </div>
          <div className="p-10 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[3rem] shadow-[0_20px_50px_rgba(79,70,229,0.2)]">
             <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2 italic">Gross Revenue</p>
             <p className="text-5xl font-black tracking-tighter italic">₹{stats.funds.toFixed(0)}</p>
          </div>
        </div>

        {/* EVENT TABLE */}
        <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-black/40 text-[10px] font-black uppercase text-zinc-400 tracking-[0.3em]">
              <tr>
                <th className="px-10 py-8">Experience Identity</th>
                <th className="px-10 py-8">Admissions</th>
                <th className="px-10 py-8 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {events.length === 0 ? (
                <tr><td colSpan="3" className="px-10 py-20 text-center text-zinc-400 font-black uppercase tracking-widest italic">No experiences found in current scope</td></tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-zinc-50/80 dark:hover:bg-indigo-950/10 transition-colors">
                    <td className="px-10 py-8">
                      <p className="font-black text-zinc-900 dark:text-white uppercase tracking-tighter text-lg leading-tight">{event.title}</p>
                      <div className="flex gap-3 mt-1.5">
                        <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">{event.date}</span>
                        <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">@ {event.location}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3">
                         <span className="font-black dark:text-white text-2xl tracking-tighter">{event.ticketsSold}</span>
                         <span className="text-zinc-400 text-[11px] font-black uppercase tracking-widest">/ {event.totalTickets} Passes</span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === event.id ? null : event.id); }} 
                        className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-[1.2rem] hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {activeMenuId === event.id && (
                        <div className="absolute right-12 top-20 w-64 bg-white dark:bg-zinc-800 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-zinc-100 dark:border-zinc-700 z-[160] overflow-hidden animate-in slide-in-from-top-4 duration-300">
                          <button onClick={() => navigate(`/events/${event.id}`)} className="w-full text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 border-b border-zinc-100 dark:border-zinc-700 flex items-center gap-3">
                            <Ticket className="w-4 h-4" /> View Public Page
                          </button>
                          <button onClick={() => openParticipants(event)} className="w-full text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-700 border-b border-zinc-100 dark:border-zinc-700 flex items-center gap-3">
                            <Users className="w-4 h-4" /> Manage Entry Gate
                          </button>
                          <button onClick={() => openEdit(event)} className="w-full text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-3">
                            <Edit className="w-4 h-4" /> Adjust Terms
                          </button>
                          <button onClick={() => handleDelete(event.id)} className="w-full text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-red-600 border-t border-zinc-100 dark:border-zinc-800 hover:bg-red-50 flex items-center gap-3">
                            <Trash2 className="w-4 h-4" /> Purge Experience
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
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