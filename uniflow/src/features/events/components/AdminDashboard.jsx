import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { 
  Ticket, Calendar, TrendingUp, Plus, QrCode, 
  MoreVertical, RefreshCw, Trash2, Edit, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateEventModal from './CreateEventModal'; 

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ events: 0, tickets: 0, revenue: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // 👇 State for the "Action Menu" (Which row is active?)
  const [activeMenuId, setActiveMenuId] = useState(null);

  const fetchData = async () => {
    try {
      if (!user) return;
      setLoading(true);
      const q = query(collection(db, 'events'), where('organizerId', '==', user.uid));
      const eventSnaps = await getDocs(q);
      
      let totalTickets = 0;
      const eventsList = [];

      eventSnaps.forEach(doc => {
        const data = doc.data();
        totalTickets += (data.ticketsSold || 0);
        eventsList.push({ id: doc.id, ...data });
      });

      eventsList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      setStats({
        events: eventSnaps.size,
        tickets: totalTickets,
        revenue: totalTickets * 15 // Mock revenue
      });
      
      setRecentEvents(eventsList); // Show all events, not just top 5
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // 👇 DELETE LOGIC
  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event? This cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
        setActiveMenuId(null);
        fetchData(); // Refresh list
      } catch (err) {
        alert("Failed to delete event: " + err.message);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen pt-24 flex justify-center text-zinc-500">Loading Dashboard...</div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8" onClick={() => setActiveMenuId(null)}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Dashboard</h1>
            <p className="text-zinc-500">Overview of your club's performance.</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsCreateModalOpen(true); }} 
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Create Event
            </button>
             <button 
              onClick={() => navigate('/scan')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              <QrCode className="w-4 h-4" /> Scan
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard icon={Calendar} label="Total Events" value={stats.events} color="blue" />
          <StatCard icon={Ticket} label="Tickets Sold" value={stats.tickets} color="green" />
          <StatCard icon={TrendingUp} label="Total Revenue" value={`$${stats.revenue}`} color="purple" />
        </div>

        {/* Events Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm min-h-[400px]">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Your Events</h3>
            <button onClick={fetchData} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <RefreshCw className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-xs uppercase text-zinc-500 font-semibold">
                <tr>
                  <th className="px-6 py-4">Event Name</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Sales</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-zinc-500">
                      No events found. Start by creating one!
                    </td>
                  </tr>
                ) : (
                  recentEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors relative">
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                        {event.title}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-sm">
                        {event.date}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300 text-sm">
                        {event.ticketsSold} / {event.totalTickets}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        {/* Action Button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === event.id ? null : event.id);
                          }}
                          className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-zinc-400" />
                        </button>

                        {/* 👇 THE ACTION DROPDOWN */}
                        {activeMenuId === event.id && (
                          <div className="absolute right-8 top-8 w-40 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <button 
                              onClick={() => navigate(`/events/${event.id}`)}
                              className="w-full text-left px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                            >
                              <Ticket className="w-4 h-4" /> View Page
                            </button>
                            <button 
                              onClick={() => handleDelete(event.id)}
                              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-700"
                            >
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

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`p-4 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm text-zinc-500 font-medium mb-1">{label}</p>
      <p className="text-3xl font-black text-zinc-900 dark:text-white">{value}</p>
    </div>
  </div>
);

export default AdminDashboard;