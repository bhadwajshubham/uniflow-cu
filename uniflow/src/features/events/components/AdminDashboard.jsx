import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { 
  Ticket, Calendar, Plus, QrCode, MoreVertical, 
  Trash2, Users, Edit, ShieldCheck, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import Modals
import CreateEventModal from './CreateEventModal';
import EditEventModal from './EditEventModal';
import EventParticipantsModal from './EventParticipantsModal';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Stats State
  const [stats, setStats] = useState({ events: 0, tickets: 0, funds: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // 1. Fetch Events Logic
  const fetchData = async () => {
    try {
      if (!user) return;
      setLoading(true);
      
      // Query: Only events created by this Admin
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
        const sold = data.ticketsSold || 0;
        const price = Number(data.price) || 0;
        
        totalTickets += sold;
        totalFunds += (sold * price);
        
        eventsList.push({ id: doc.id, ...data });
      });

      // Sort by Newest First
      eventsList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      setStats({ 
        events: eventSnaps.size, 
        tickets: totalTickets, 
        funds: totalFunds 
      });
      setRecentEvents(eventsList);
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  // 2. Batch Delete Logic (Prevents Orphaned Tickets)
  const handleDelete = async (eventId) => {
    if (window.confirm("WARNING: This will delete the event and ALL associated tickets. This cannot be undone.")) {
      try {
        // Step A: Find all tickets for this event
        const q = query(collection(db, 'registrations'), where('eventId', '==', eventId));
        const snapshot = await getDocs(q);
        
        // Step B: Delete tickets in a batch
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        // Step C: Delete the event document
        await deleteDoc(doc(db, 'events', eventId));
        
        // Step D: Refresh UI
        fetchData();
        alert("Event and ticket data cleaned up successfully.");
      } catch (error) {
        console.error("Delete failed", error);
        alert("Failed to delete event completely.");
      }
    }
  };

  // Helper Functions
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

  if (loading) return <div className="min-h-screen pt-24 text-center text-zinc-500">Loading your dashboard...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-4" onClick={() => setActiveMenuId(null)}>
      <div className="max-w-7xl mx-auto">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
              Organizer Dashboard <ShieldCheck className="w-6 h-6 text-green-500" />
            </h1>
            <p className="text-zinc-500 text-sm">Manage events, track attendance, and scan tickets.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => setIsCreateModalOpen(true)} 
              className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-4 h-4" /> Create Event
            </button>
            <button 
              onClick={() => navigate('/scan')} 
              className="flex-1 md:flex-none px-4 py-2 bg-zinc-800 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all"
            >
              <QrCode className="w-4 h-4" /> Scanner
            </button>
          </div>
        </div>

        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
             <div className="text-zinc-500 text-sm font-medium">My Active Events</div>
             <div className="text-3xl font-black text-zinc-900 dark:text-white">{stats.events}</div>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
             <div className="text-zinc-500 text-sm font-medium">Total Tickets Sold</div>
             <div className="text-3xl font-black text-zinc-900 dark:text-white">{stats.tickets}</div>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
             <div className="text-zinc-500 text-sm font-medium">Funds Raised</div>
             {/* 🛠️ FIX: Proper Currency Formatting */}
             <div className="text-3xl font-black text-zinc-900 dark:text-white">
               ₹{stats.funds.toFixed(2)}
             </div>
          </div>
        </div>

        {/* --- Events List Table --- */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden min-h-[400px]">
           <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-6 py-4">Event Title</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Sales / Capacity</th>
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
                      
                      {/* Action Menu */}
                      <td className="px-6 py-4 text-right relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === event.id ? null : event.id); }}
                          className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4 text-zinc-400" />
                        </button>

                        {/* Dropdown Popup */}
                        {activeMenuId === event.id && (
                          <div className="absolute right-8 top-8 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            
                            <button onClick={() => navigate(`/events/${event.id}`)} className="w-full text-left px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2">
                              <Ticket className="w-4 h-4" /> View Page
                            </button>
                            
                            {/* 👇 CLICKING THIS OPENS ATTENDANCE & DOWNLOAD */}
                            <button onClick={() => openParticipants(event)} className="w-full text-left px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2">
                              <Users className="w-4 h-4" /> Participants / Attendance
                            </button>
                            
                            <button onClick={() => openEdit(event)} className="w-full text-left px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2">
                              <Edit className="w-4 h-4" /> Edit Details
                            </button>
                            
                            <button onClick={() => handleDelete(event.id)} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-700">
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

        {/* --- MODAL MOUNTS --- */}
        <CreateEventModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={fetchData} 
        />
        <EditEventModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          event={selectedEvent} 
          onSuccess={fetchData} 
        />
        {/* This modal handles the CSV Download and Attendance Check */}
        <EventParticipantsModal 
          isOpen={isParticipantsModalOpen} 
          onClose={() => setIsParticipantsModalOpen(false)} 
          event={selectedEvent} 
        />
        
      </div>
    </div>
  );
};

export default AdminDashboard;