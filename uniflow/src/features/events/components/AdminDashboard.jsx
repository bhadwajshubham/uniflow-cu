import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { 
  Users, Ticket, DollarSign, Calendar, TrendingUp, 
  Trash2, Edit3, MoreVertical, Plus, Zap, Activity 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [liveAttendance, setLiveAttendance] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTicketsSold, setTotalTicketsSold] = useState(0);
  const [loading, setLoading] = useState(true);

  // 📡 REAL-TIME DATA LISTENER
  useEffect(() => {
    if (!user) return;

    // 1. Listen to ADMIN'S Events
    // Fix: We query 'organizerId' to match your database field
    const q = query(
      collection(db, 'events'), 
      where('organizerId', '==', user.uid),
      orderBy('createdAt', 'desc') // Show newest created first
    );

    const unsubscribeEvents = onSnapshot(q, (snapshot) => {
      const eventList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventList);
      
      // Calculate Stats
      const revenue = eventList.reduce((acc, curr) => acc + (Number(curr.price || 0) * (curr.ticketsSold || 0)), 0);
      const tickets = eventList.reduce((acc, curr) => acc + (curr.ticketsSold || 0), 0);
      
      setTotalRevenue(revenue);
      setTotalTicketsSold(tickets);
      setLoading(false);
    });

    // 2. Listen to LIVE ATTENDANCE (Checked-in Users)
    // We count registrations where eventCreatorId is ME and checkedIn is TRUE
    const qLive = query(
      collection(db, 'registrations'),
      where('eventCreatorId', '==', user.uid),
      where('checkedIn', '==', true)
    );

    const unsubscribeLive = onSnapshot(qLive, (snapshot) => {
      setLiveAttendance(snapshot.size); // The size of snapshot is the count of people inside
    });

    return () => {
      unsubscribeEvents();
      unsubscribeLive();
    };
  }, [user]);

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure? This will delete the event and ticket data.")) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
        // Note: Ideally we should also delete sub-collection registrations or use a Cloud Function
      } catch (err) {
        alert("Error deleting event: " + err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-24 px-6 pt-24">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* 👋 Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tighter dark:text-white flex items-center gap-2">
              Mission Control <Zap className="w-6 h-6 text-yellow-500 fill-current" />
            </h1>
            <p className="text-zinc-500 font-medium">Manage your campus empire.</p>
          </div>
          <Link to="/admin/create">
            <button className="hidden md:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-500/30 transition-all active:scale-95">
              <Plus className="w-4 h-4" /> Create Event
            </button>
          </Link>
        </div>

        {/* 📊 LIVE PULSE & STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: LIVE ATTENDANCE (The "Interesting" Feature) */}
          <div className="col-span-1 md:col-span-2 bg-black text-white rounded-[2rem] p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-30 -mr-16 -mt-16 animate-pulse"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center gap-3 mb-4">
                 <span className="relative flex h-3 w-3">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                 </span>
                 <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Live Attendance</h3>
              </div>
              <div className="flex items-end gap-2">
                 <span className="text-6xl font-black tracking-tighter">{liveAttendance}</span>
                 <span className="text-lg font-bold text-zinc-500 mb-2">Students Active</span>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-zinc-400 font-bold">
                 <Activity className="w-4 h-4 text-green-500" /> Real-time updates from scanners
              </div>
            </div>
          </div>

          {/* Card 2: Tickets Sold */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-600 mb-4">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <p className="text-3xl font-black dark:text-white">{totalTicketsSold}</p>
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Total Tickets Sold</p>
            </div>
          </div>

          {/* Card 3: Revenue */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-600 mb-4">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-3xl font-black dark:text-white">₹{totalRevenue}</p>
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Total Revenue</p>
            </div>
          </div>
        </div>

        {/* 📋 ACTIVE EVENTS LIST */}
        <div className="space-y-4">
          <h2 className="text-xl font-black dark:text-white px-2">Your Active Events</h2>
          
          {loading ? (
             <div className="text-center py-10 text-zinc-400">Loading your empire...</div>
          ) : events.length === 0 ? (
             <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-10 text-center border border-zinc-200 dark:border-zinc-800 border-dashed">
                <Calendar className="w-10 h-10 mx-auto text-zinc-300 mb-4" />
                <h3 className="font-bold text-zinc-500">No events active</h3>
                <Link to="/admin/create" className="text-indigo-600 font-black text-sm mt-2 inline-block hover:underline">Launch your first event</Link>
             </div>
          ) : (
             <div className="grid gap-4">
                {events.map(event => (
                  <div key={event.id} className="group bg-white dark:bg-zinc-900 p-4 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 hover:border-indigo-500/30 transition-all flex flex-col md:flex-row gap-6 items-center shadow-sm">
                    
                    {/* Event Image */}
                    <div className="w-full md:w-32 h-32 rounded-2xl overflow-hidden relative shrink-0">
                      <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg">
                        <p className="text-[10px] font-black text-white uppercase">{event.category}</p>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left space-y-1">
                      <h3 className="text-lg font-black dark:text-white">{event.title}</h3>
                      <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-bold text-zinc-500">
                         <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(event.date).toLocaleDateString()}</span>
                         <span className="flex items-center gap-1"><Ticket className="w-3 h-3" /> {event.ticketsSold} / {event.totalTickets} Sold</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${(event.ticketsSold / event.totalTickets) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col gap-2 w-full md:w-auto">
                       {/* Edit (Placeholder for now) */}
                       <button 
                         onClick={() => alert("Edit Feature: Connect this to CreateEventModal with pre-filled data!")}
                         className="flex-1 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold text-xs uppercase hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-center gap-2"
                       >
                         <Edit3 className="w-4 h-4" /> Manage
                       </button>
                       
                       {/* Delete */}
                       <button 
                         onClick={() => handleDelete(event.id)}
                         className="flex-1 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 font-bold text-xs uppercase hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>

                  </div>
                ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;