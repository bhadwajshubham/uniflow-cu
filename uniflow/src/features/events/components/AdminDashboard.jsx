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
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    if (!user) return;

    // 🔴 LIVE LISTENER: If SuperAdmin, show all. If Admin, show only theirs.
    const eventsRef = collection(db, 'events');
    const q = profile?.role === 'super_admin' 
      ? query(eventsRef) 
      : query(eventsRef, where('organizerId', '==', user.uid));

    const unsub = onSnapshot(q, (snapshot) => {
      let totalTickets = 0;
      let totalFunds = 0;
      const eventsList = snapshot.docs.map(doc => {
        const data = doc.data();
        totalTickets += (data.ticketsSold || 0);
        totalFunds += ((data.ticketsSold || 0) * (Number(data.price) || 0));
        return { id: doc.id, ...data };
      });

      eventsList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setStats({ events: snapshot.size, tickets: totalTickets, funds: totalFunds });
      setEvents(eventsList);
      setLoading(false);
    });

    return () => unsub();
  }, [user, profile]);

  const handleDelete = async (eventId) => {
    if (window.confirm("CRITICAL: This will delete the event AND all associated tickets/reviews. Proceed?")) {
      try {
        const batch = writeBatch(db);
        const qTickets = query(collection(db, 'registrations'), where('eventId', '==', eventId));
        const snapTickets = await getDocs(qTickets);
        snapTickets.docs.forEach(doc => batch.delete(doc.ref));

        const qReviews = query(collection(db, 'reviews'), where('eventId', '==', eventId));
        const snapReviews = await getDocs(qReviews);
        snapReviews.docs.forEach(doc => batch.delete(doc.ref));

        await batch.commit();
        await deleteDoc(doc(db, 'events', eventId));
      } catch (error) {
        alert("Delete failed.");
      }
    }
  };

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pt-32 text-center font-black text-indigo-600">LOADING CONSOLE...</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pt-24 pb-24 px-4" onClick={() => setActiveMenuId(null)}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white flex items-center gap-2 tracking-tighter">
              Organizer Console <ShieldCheck className="w-8 h-8 text-indigo-600" />
            </h1>
            <p className="text-zinc-500 font-medium mt-1">Manage events and track live student check-ins.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setIsCreateModalOpen(true)} className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all">
              <Plus className="w-4 h-4" /> Create Event
            </button>
            <button onClick={() => navigate('/scan')} className="flex-1 md:flex-none px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-sm hover:scale-105 transition-all">
              <QrCode className="w-4 h-4" /> Scan QR
            </button>
          </div>
        </div>

        {/* Stats Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
             <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Hosted</div>
             <div className="text-4xl font-black text-zinc-900 dark:text-white">{stats.events}</div>
          </div>
          <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
             <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Footfall</div>
             <div className="text-4xl font-black text-zinc-900 dark:text-white">{stats.tickets}</div>
          </div>
          <div className="p-8 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[2.5rem] shadow-2xl">
             <div className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">Revenue</div>
             <div className="text-4xl font-black">₹{stats.funds}</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
           <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-black/20 text-[10px] font-black uppercase text-zinc-400">
                <tr>
                  <th className="px-8 py-5">Event Title</th>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Registrations</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {events.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-20 text-zinc-400 font-bold">No active events hosted yet.</td></tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 relative group transition-colors">
                      <td className="px-8 py-5 font-bold text-zinc-900 dark:text-white">{event.title}</td>
                      <td className="px-8 py-5 text-zinc-500 font-medium text-sm">{event.date}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                           <span className="font-black dark:text-white">{event.ticketsSold}</span>
                           <span className="text-zinc-400 text-xs">/ {event.totalTickets}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === event.id ? null : event.id); }}
                          className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === event.id && (
                          <div className="absolute right-10 top-14 w-52 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                            <button onClick={() => navigate(`/events/${event.id}`)} className="w-full text-left px-5 py-4 text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-3">
                              <Ticket className="w-4 h-4 text-indigo-500" /> View Live Page
                            </button>
                            <button onClick={() => { setSelectedEvent(event); setIsParticipantsModalOpen(true); setActiveMenuId(null); }} className="w-full text-left px-5 py-4 text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-3">
                              <Users className="w-4 h-4 text-indigo-500" /> Manage Attendance
                            </button>
                            <button onClick={() => { setSelectedEvent(event); setIsEditModalOpen(true); setActiveMenuId(null); }} className="w-full text-left px-5 py-4 text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-3">
                              <Edit className="w-4 h-4 text-indigo-500" /> Edit Details
                            </button>
                            <button onClick={() => handleDelete(event.id)} className="w-full text-left px-5 py-4 text-sm font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 border-t border-zinc-100 dark:border-zinc-800">
                              <Trash2 className="w-4 h-4" /> Delete Event
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