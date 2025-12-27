import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { 
  Ticket, Calendar, Activity, Plus, QrCode, 
  MoreVertical, RefreshCw, Trash2, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateEventModal from './CreateEventModal'; 

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ events: 0, tickets: 0, funds: 0, attendanceRate: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const fetchData = async () => {
    try {
      if (!user) return;
      setLoading(true);
      const q = query(collection(db, 'events'), where('organizerId', '==', user.uid));
      const eventSnaps = await getDocs(q);
      
      let totalTickets = 0;
      let totalFunds = 0;
      let totalCapacity = 0;
      const eventsList = [];

      eventSnaps.forEach(doc => {
        const data = doc.data();
        const sold = data.ticketsSold || 0;
        const price = Number(data.price) || 0;
        
        totalTickets += sold;
        totalFunds += (sold * price); // ✅ REAL MATH
        totalCapacity += (Number(data.totalTickets) || 0);
        
        eventsList.push({ id: doc.id, ...data });
      });

      // Calculate Pulse (Attendance Rate)
      const rate = totalCapacity > 0 ? Math.round((totalTickets / totalCapacity) * 100) : 0;

      // Sort: Newest First
      eventsList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      setStats({
        events: eventSnaps.size,
        tickets: totalTickets,
        funds: totalFunds,
        attendanceRate: rate
      });
      
      setRecentEvents(eventsList);
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to cancel this event? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
        setActiveMenuId(null);
        fetchData(); 
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen pt-24 flex justify-center text-zinc-500">Syncing Club Data...</div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8" onClick={() => setActiveMenuId(null)}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Club Command Center</h1>
            <p className="text-zinc-500">Manage your events and track participation.</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsCreateModalOpen(true); }} 
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Create Event
            </button>
             <button 
              onClick={() => navigate('/scan')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              <QrCode className="w-4 h-4" /> Scanner
            </button>
          </div>
        </div>

        {/* 📊 ETHICAL STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard icon={Calendar} label="Active Events" value={stats.events} color="blue" />
          <StatCard icon={Users} label="Total Participants" value={stats.tickets} color="green" />
          {/* Replaced 'Revenue' with 'Funds Raised' or 'Club Pulse' */}
          <StatCard 
            icon={Activity} 
            label="Club Pulse (Fill Rate)" 
            value={`${stats.attendanceRate}%`} 
            color="purple" 
            subValue={`$${stats.funds} Funds Raised`}
          />
        </div>

        {/* Events Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm min-h-[400px]">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Event Roadmap</h3>
            <button onClick={fetchData} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <RefreshCw className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-xs uppercase text-zinc-500 font-semibold">
                <tr>
                  <th className="px-6 py-4">Event Details</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Engagement</th>
                  <th className="px-6 py-4 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center">
                        <Calendar className="w-12 h-12 text-zinc-300 mb-2" />
                        <p>No active events.</p>
                        <p className="text-xs">Click 'Create Event' to start.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors relative">
                      <td className="px-6 py-4">
                        <p className="font-bold text-zinc-900 dark:text-white">{event.title}</p>
                        <p className="text-xs text-zinc-500">{event.location}</p>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-sm">
                        {event.date}
                      </td>
                      <td className="px-6 py-4">
                         {/* Dynamic Status Badge */}
                         {new Date(event.date) < new Date() ? (
                           <span className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold">Past</span>
                         ) : (
                           <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Upcoming</span>
                         )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-zinc-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full" 
                              style={{ width: `${Math.min((event.ticketsSold / event.totalTickets) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-zinc-500">{event.ticketsSold}/{event.totalTickets}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === event.id ? null : event.id);
                          }}
                          className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-zinc-400" />
                        </button>

                        {activeMenuId === event.id && (
                          <div className="absolute right-8 top-8 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <button 
                              onClick={() => navigate(`/events/${event.id}`)}
                              className="w-full text-left px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                            >
                              <Ticket className="w-4 h-4" /> View Details
                            </button>
                            <button 
                              onClick={() => handleDelete(event.id)}
                              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-700"
                            >
                              <Trash2 className="w-4 h-4" /> Cancel Event
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

        <CreateEventModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={fetchData}
        />
        
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, subValue }) => (
  <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`p-4 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm text-zinc-500 font-medium mb-1">{label}</p>
      <p className="text-3xl font-black text-zinc-900 dark:text-white">{value}</p>
      {subValue && <p className="text-xs text-zinc-400 mt-1 font-medium">{subValue}</p>}
    </div>
  </div>
);

export default AdminDashboard;