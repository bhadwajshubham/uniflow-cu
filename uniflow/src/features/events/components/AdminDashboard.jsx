import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, deleteDoc, doc, writeBatch } from 'firebase/firestore';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ events: 0, tickets: 0, funds: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const fetchData = async () => {
    try {
      if (!user) return;
      setLoading(true);
      
      const q = query(
        collection(db, 'events'), 
        where('organizerId', '==', user.uid)
      );
      
      const eventSnaps = await getDocs(q);
      
      let totalTickets = 0;
      let totalFunds = 0;
      const eventsList = [];

      eventSnaps.forEach(doc => {
        const data = doc.data();
        totalTickets += (data.ticketsSold || 0);
        totalFunds += ((data.ticketsSold || 0) * (Number(data.price) || 0));
        eventsList.push({ id: doc.id, ...data });
      });

      eventsList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      setStats({ events: eventSnaps.size, tickets: totalTickets, funds: totalFunds });
      setRecentEvents(eventsList);
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  // 🗑️ UPDATED DELETE LOGIC (Batch Delete)
  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure? This will delete the event and ALL ticket data associated with it.")) {
      try {
        // 1. Delete all associated registrations
        const q = query(collection(db, 'registrations'), where('eventId', '==', eventId));
        const snapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        // 2. Delete the event itself
        await deleteDoc(doc(db, 'events', eventId));
        
        fetchData();
      } catch (error) {
        console.error("Delete failed", error);
        alert("Failed to delete event completely.");
      }
    }
  };

  const openEdit = (event) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
    setActiveMenuId(null);
  };

  const openParticipants = (event) => {
    setSelectedEvent(event);
    setIsParticipantsModalOpen(true);
    setActiveMenuId(null);
  };

  if (loading) return <div className="min-h-screen pt-24 text-center text-zinc-500">Loading your events...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-4" onClick={() => setActiveMenuId(null)}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
              Organizer Dashboard <ShieldCheck className="w-6 h-6 text-green-500" />
            </h1>
            <p className="text-zinc-500 text-sm">Managing events created by {user.displayName}</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setIsCreateModalOpen(true)} className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
              <Plus className="w-4 h-4" /> Create Event
            </button>
            <button onClick={() => navigate('/scan')} className="flex-1 md:flex-none px-4 py-2 bg-zinc-800 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all">
              <QrCode className="w-4 h-4" /> Scan
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
             <div className="text-zinc-500 text-sm font-medium">My Active Events</div>
             <div className="text-3xl font-black text-zinc-900 dark:text-white">{stats.events}</div>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
             <div className="text-zinc-500 text-sm font-medium">My Ticket Sales</div>
             <div className="text-3xl font-black text-zinc-900 dark:text-white">{stats.tickets}</div>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
             <div className="text-zinc-500 text-sm font-medium">Funds Raised</div>
             <div className="text-3xl font-black text-zinc-900 dark:text-white">${stats.funds}</div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden min-h-[400px]">
           <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Sales</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentEvents.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-12 text-zinc-500">You haven't created any events yet.</td></tr>
                ) : (
                  recentEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 relative">
                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">{event.title}</td>
                      <td className="px-6 py-4 text-zinc-500 text-sm">{event.date}</td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300 text-sm">
                        {event.ticketsSold} / {event.totalTickets}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === event.id ? null : event.id); }}
                          className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4 text-zinc-400" />
                        </button>

                        {/* DROPDOWN MENU */}
                        {activeMenuId === event.id && (
                          <div className="absolute right-8 top-8 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={() => navigate(`/events/${event.id}`)} className="w-full text-left px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2">
                              <Ticket className="w-4 h-4" /> View Page
                            </button>
                            <button onClick={() => openParticipants(event)} className="w-full text-left px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2">
                              <Users className="w-4 h-4" /> Participants
                            </button>
                            <button onClick={() => openEdit(event)} className="w-full text-left px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2">
                              <Edit className="w-4 h-4" /> Edit Details
                            </button>
                            <button onClick={() => handleDelete(event.id)} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-700">
                              <Trash2 className="w-4 h-4" /> Delete
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

        {/* MODALS */}
        <CreateEventModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={fetchData} />
        <EditEventModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} event={selectedEvent} onSuccess={fetchData} />
        <EventParticipantsModal isOpen={isParticipantsModalOpen} onClose={() => setIsParticipantsModalOpen(false)} event={selectedEvent} />
        
      </div>
    </div>
  );
};

export default AdminDashboard;