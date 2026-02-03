import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { 
  Ticket, DollarSign, Calendar, Trash2, Edit3, Plus, Zap, 
  Menu, QrCode, FileText, LayoutDashboard, Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ✅ MODAL IMPORTS
import EditEventModal from './EditEventModal'; 
import ManageEventModal from './ManageEventModal';
import CreateEventModal from './CreateEventModal'; 

const AdminDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]); 
  const [stats, setStats] = useState({ revenue: 0, tickets: 0, attendance: 0 });
  const [chartData, setChartData] = useState([]);
  
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('overview'); 
  const [loading, setLoading] = useState(true);

  // Modal States
  const [editEvent, setEditEvent] = useState(null);
  const [manageEvent, setManageEvent] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 1. FETCH EVENTS (🔥 FIXED: organizerId)
  useEffect(() => {
    if (!user || !profile) return;
    setLoading(true);

    const eventsRef = collection(db, 'events');
    let q;

    if (profile.role === 'super_admin') {
      // Super Admin: Fetch All
      q = query(eventsRef, orderBy('createdAt', 'desc')); 
    } else {
      // ✅ FIX: Using 'organizerId' because CreateModal saves it as 'organizerId'
      q = query(eventsRef, where('organizerId', '==', user.uid)); 
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Client Side Sorting
      eventList.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA; // Newest First
      });

      setEvents(eventList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, profile]);

  // 2. FETCH TICKETS & STATS
  useEffect(() => {
    if (!user || events.length === 0) return;
    const ticketsRef = collection(db, 'tickets');
    
    const unsubscribe = onSnapshot(ticketsRef, (snapshot) => {
      const allTickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const myEventIds = events.map(e => e.id);
      
      const myTickets = allTickets.filter(t => myEventIds.includes(t.eventId));
      
      setTickets(myTickets);
      calculateStats(myTickets, events);
    });
    return () => unsubscribe();
  }, [user, events]); 

  // 3. STATS LOGIC
  const calculateStats = (ticketList, eventList) => {
    let totalRevenue = 0;
    let totalAttended = 0;
    ticketList.forEach(t => {
      const event = eventList.find(e => e.id === t.eventId);
      totalRevenue += event?.price ? Number(event.price) : 0;
      if (t.scanned === true) totalAttended++;
    });
    setStats({ revenue: totalRevenue, tickets: ticketList.length, attendance: totalAttended });

    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const dailyData = last7Days.map(dateStr => {
      const count = ticketList.filter(t => {
          if (!t.bookedAt) return false;
          const bookDate = t.bookedAt.toDate ? t.bookedAt.toDate() : new Date(t.bookedAt);
          return bookDate.toISOString().split('T')[0] === dateStr;
      }).length;
      return { name: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }), sales: count };
    });
    setChartData(dailyData);
  };

  const pieData = [
    { name: 'Checked In', value: stats.attendance || 0 },
    { name: 'Pending', value: (stats.tickets - stats.attendance) || 1 },
  ];
  const COLORS = stats.tickets > 0 ? ['#10B981', '#6366f1'] : ['#e4e4e7', '#f4f4f5']; 

  const handleDelete = async (eventId) => {
    if (profile?.role !== 'super_admin') {
      alert("Only Super Admin can delete events.");
      return;
    }
    if (window.confirm("Delete event?")) {
      try { await deleteDoc(doc(db, 'events', eventId)); } catch (error) { console.error(error); }
    }
  };

  const downloadGlobalReport = () => {
    if (tickets.length === 0) { alert("No data."); return; }
    let csvContent = "data:text/csv;charset=utf-8,Event,Ticket ID,Name,Roll No,Price,Status\n";
    tickets.forEach(t => {
        const event = events.find(e => e.id === t.eventId);
        csvContent += `"${t.eventName}","${t.id}","${t.userName}","${t.userRollNo}",${event?.price || 0},${t.scanned ? "Attended" : "Booked"}\n`;
    });
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `UniFlow_Report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && events.length === 0) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10"/></div>;

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black pt-16">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} hidden md:flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-300`}>
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
           {isSidebarOpen && <span className="font-black text-lg dark:text-white">Admin</span>}
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-lg"><Menu className="w-5 h-5 text-zinc-500"/></button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           <SidebarItem icon={LayoutDashboard} label="Overview" active={activeView === 'overview'} isOpen={isSidebarOpen} onClick={() => setActiveView('overview')} />
           <SidebarItem icon={Calendar} label="My Events" active={activeView === 'events'} isOpen={isSidebarOpen} onClick={() => { setActiveView('events'); document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' }); }} />
           <SidebarItem icon={FileText} label="Download CSV" isOpen={isSidebarOpen} onClick={downloadGlobalReport} />
        </nav>
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
           <Link to="/scan">
             <div className={`flex items-center gap-3 p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all ${!isSidebarOpen && 'justify-center'}`}>
                <QrCode className="w-5 h-5" />{isSidebarOpen && <span className="font-bold text-sm">Scanner</span>}
             </div>
           </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
             <div>
                <h1 className="text-3xl font-black dark:text-white">Dashboard</h1>
                <p className="text-zinc-500 text-sm">{profile?.role === 'super_admin' ? 'Super Admin View' : 'Organizer View'}</p>
             </div>
             <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs uppercase hover:opacity-90 shadow-xl"><Plus className="w-4 h-4" /> Create Event</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <StatCard title="Revenue" value={`₹${stats.revenue}`} icon={DollarSign} color="text-green-500" />
             <StatCard title="Tickets" value={stats.tickets} icon={Ticket} color="text-indigo-500" />
             <StatCard title="Checked In" value={stats.attendance} icon={Zap} color="text-amber-500" animate />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold dark:text-white mb-6">Attendance</h3>
                <div style={{ width: '100%', height: '250px' }}>
                   <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                </div>
             </div>
             <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h3 className="text-lg font-bold dark:text-white mb-6">Sales</h3>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip /><Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={4} dot={{ r: 4 }} /></LineChart></ResponsiveContainer>
                </div>
             </div>
          </div>

          {/* Event List */}
          <div id="events-section" className="space-y-4 pt-4">
            <h2 className="text-xl font-bold dark:text-white">{profile?.role === 'super_admin' ? 'All Platform Events' : 'Your Events'}</h2>
            {events.length === 0 ? (
                <div className="p-8 text-center bg-zinc-100 dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-300">
                    <p className="text-zinc-500 font-bold">No events found. Create one to get started!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                {events.map(event => (
                    <div key={event.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-6 items-center shadow-sm">
                        <div className="w-full md:w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-zinc-100">
                        <img src={event.imageUrl || event.image || "https://placehold.co/200x200"} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1">
                        <h3 className="text-lg font-black dark:text-white">{event.title}</h3>
                        <div className="text-xs font-bold text-zinc-500 mt-1">{new Date(event.date).toLocaleDateString()} • {event.registered}/{event.totalTickets} Sold</div>
                        </div>
                        <div className="flex gap-2">
                        <button onClick={() => setManageEvent(event)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:text-green-600"><Users className="w-4 h-4" /></button>
                        <button onClick={() => setEditEvent(event)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:text-indigo-600"><Edit3 className="w-4 h-4" /></button>
                        
                        {(profile?.role === 'super_admin' || event.organizerId === user.uid) && (
                            <button onClick={() => handleDelete(event.id)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        </div>
                    </div>
                ))}
                </div>
            )}
          </div>
        </div>
      </main>

      {/* MODALS */}
      {isCreateModalOpen && <CreateEventModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />}
      {editEvent && <EditEventModal isOpen={!!editEvent} onClose={() => setEditEvent(null)} eventData={editEvent} onSuccess={() => setEditEvent(null)} />}
      {manageEvent && <ManageEventModal isOpen={!!manageEvent} onClose={() => setManageEvent(null)} eventData={manageEvent} />}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, animate }) => (
  <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
    <div className={`w-14 h-14 rounded-2xl ${color.replace('text-', 'bg-')}/10 flex items-center justify-center ${color}`}><Icon className={`w-7 h-7 ${animate ? 'animate-pulse' : ''}`} /></div>
    <div><p className="text-xs font-bold uppercase text-zinc-400 tracking-wider">{title}</p><h3 className="text-3xl font-black dark:text-white tracking-tight">{value}</h3></div>
  </div>
);

const SidebarItem = ({ icon: Icon, label, active, isOpen, onClick }) => (
    <div onClick={onClick} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-zinc-100 dark:bg-zinc-800 text-indigo-600' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'} ${!isOpen && 'justify-center'}`}><Icon className={`w-5 h-5 ${active ? 'fill-current' : ''}`} />{isOpen && <span className="text-sm font-bold">{label}</span>}</div>
);

export default AdminDashboard;