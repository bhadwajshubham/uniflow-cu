import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { 
  Ticket, DollarSign, Calendar, Trash2, Edit3, Plus, Zap, 
  Users, TrendingUp, Menu, QrCode, FileText, LayoutDashboard, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Modals
import EditEventModal from './EditEventModal';
import ManageEventModal from './ManageEventModal'; 
import CreateEventModal from './CreateEventModal';

const AdminDashboard = () => {
  const { user } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]); // Renamed from registrations
  const [stats, setStats] = useState({ revenue: 0, tickets: 0, attendance: 0 });
  const [chartData, setChartData] = useState([]);
  
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('overview'); 
  const [loading, setLoading] = useState(true);

  // Modal States
  const [editEvent, setEditEvent] = useState(null);
  const [manageEvent, setManageEvent] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 1. FETCH ORGANIZER'S EVENTS
  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const eventsRef = collection(db, 'events');
    // Fetch events created by this organizer
    const q = query(eventsRef, where('organizerId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by latest
      eventList.sort((a, b) => new Date(b.createdAt?.seconds || 0) - new Date(a.createdAt?.seconds || 0));
      setEvents(eventList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. FETCH TICKETS (LIVE UPDATES)
  useEffect(() => {
    if (!user || events.length === 0) return;

    // 🔥 FIX: Listen to 'tickets' collection instead of 'registrations'
    // Since we can't query "where eventId IN [list]", we fetch tickets and filter client-side.
    // Security Rules allow Admins to read tickets, so this works.
    const ticketsRef = collection(db, 'tickets');
    const unsubscribe = onSnapshot(ticketsRef, (snapshot) => {
      const allTickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter: Sirf wo tickets jo mere events ki hain
      const myEventIds = events.map(e => e.id);
      const myTickets = allTickets.filter(t => myEventIds.includes(t.eventId));
      
      setTickets(myTickets);
      calculateStats(myTickets, events);
    });

    return () => unsubscribe();
  }, [user, events]); // Runs whenever events list updates

  // 3. CALCULATE STATS & GRAPHS
  const calculateStats = (ticketList, eventList) => {
    let totalRevenue = 0;
    let totalAttended = 0;

    ticketList.forEach(t => {
      // Find event to get price (since ticket might not have price)
      const event = eventList.find(e => e.id === t.eventId);
      const price = event?.price ? Number(event.price) : 0;
      
      totalRevenue += price;
      
      // Check Scan Status (New Field: 'scanned')
      if (t.scanned === true) {
        totalAttended++;
      }
    });

    setStats({
      revenue: totalRevenue,
      tickets: ticketList.length,
      attendance: totalAttended
    });

    // 📊 PREPARE CHART DATA (Last 7 Days)
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
      
      return { 
        name: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }), 
        sales: count 
      };
    });

    setChartData(dailyData);
  };

  const pieData = [
    { name: 'Checked In', value: stats.attendance || 0 },
    { name: 'Pending', value: (stats.tickets - stats.attendance) || 1 },
  ];
  const COLORS = stats.tickets > 0 ? ['#10B981', '#6366f1'] : ['#e4e4e7', '#f4f4f5']; 

  // DELETE EVENT
  const handleDelete = async (eventId) => {
    if (window.confirm("Delete event? This cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
        // Note: Tickets remain for record, or you can delete them via Cloud Function
      } catch (err) {
        alert("Error deleting event: " + err.message);
      }
    }
  };

  // CSV DOWNLOAD (UPDATED FIELDS)
  const downloadGlobalReport = () => {
    if (tickets.length === 0) { alert("No data."); return; }
    
    let csvContent = "data:text/csv;charset=utf-8,Event Name,Ticket ID,User Name,Roll No,Price,Status,Scanned At,Booked Date\n";
    
    tickets.forEach(t => {
        const event = events.find(e => e.id === t.eventId);
        const date = t.bookedAt?.toDate ? t.bookedAt.toDate().toLocaleDateString() : 'N/A';
        const scannedTime = t.scannedAt?.toDate ? t.scannedAt.toDate().toLocaleTimeString() : 'Not Scanned';
        const status = t.scanned ? "Attended" : "Booked";
        const price = event?.price || 0;

        csvContent += `"${t.eventName}","${t.id}","${t.userName}","${t.userRollNo}",${price},${status},${scannedTime},${date}\n`;
    });

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `UniFlow_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && events.length === 0) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10"/></div>;
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black pt-16">
      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} hidden md:flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-300`}>
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
           {isSidebarOpen && <span className="font-black text-lg dark:text-white">Admin Panel</span>}
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
             <Menu className="w-5 h-5 text-zinc-500" />
           </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           <SidebarItem icon={LayoutDashboard} label="Overview" active={activeView === 'overview'} isOpen={isSidebarOpen} onClick={() => setActiveView('overview')} />
           <SidebarItem icon={Calendar} label="My Events" active={activeView === 'events'} isOpen={isSidebarOpen} onClick={() => { setActiveView('events'); document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' }); }} />
           <SidebarItem icon={FileText} label="Download CSV" isOpen={isSidebarOpen} onClick={downloadGlobalReport} />
        </nav>
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
           <Link to="/scan">
             <div className={`flex items-center gap-3 p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all ${!isSidebarOpen && 'justify-center'}`}>
                <QrCode className="w-5 h-5" />
                {isSidebarOpen && <span className="font-bold text-sm">Open Scanner</span>}
             </div>
           </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Dashboard</h1>
                <p className="text-zinc-500 text-sm font-medium">Live Updates Active 🟢</p>
             </div>
             <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 shadow-xl transition-all hover:scale-105">
                <Plus className="w-4 h-4" /> Create Event
             </button>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <StatCard title="Total Revenue" value={`₹${stats.revenue}`} icon={DollarSign} color="text-green-500" />
             <StatCard title="Tickets Sold" value={stats.tickets} icon={Ticket} color="text-indigo-500" />
             <StatCard title="Checked In" value={stats.attendance} icon={Zap} color="text-amber-500" animate />
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Attendance Pie */}
             <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold dark:text-white mb-6">Real-time Attendance</h3>
                <div style={{ width: '100%', height: '250px' }}>
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="text-center mt-[-10px]">
                    <span className="text-3xl font-black text-zinc-800 dark:text-white">{stats.attendance}</span>
                    <span className="text-xs text-zinc-500 uppercase font-bold block">Scanned</span>
                </div>
             </div>

             {/* Sales Line Chart */}
             <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold dark:text-white">Ticket Sales (7 Days)</h3>
                   <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#A1A1AA'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#A1A1AA'}} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} itemStyle={{ fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={4} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>

          {/* ACTIVE EVENTS LIST */}
          <div id="events-section" className="space-y-4 pt-4">
            <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500"/> Your Events
            </h2>
            
            {events.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <p className="text-zinc-500 font-medium mb-4">No events found.</p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="text-indigo-600 font-bold hover:underline">Create your first event</button>
                </div>
            ) : (
                <div className="grid gap-4">
                  {events.map(event => (
                    <div key={event.id} className="group bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 transition-all flex flex-col md:flex-row gap-6 items-center shadow-sm">
                        <div className="w-full md:w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-zinc-100">
                          <img src={event.imageUrl || "https://placehold.co/200x200?text=Event"} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <h3 className="text-lg font-black dark:text-white">{event.title}</h3>
                          <div className="text-xs font-bold text-zinc-500 mt-1 flex gap-4 justify-center md:justify-start">
                              <span>{new Date(event.date).toLocaleDateString()}</span>
                              <span>{event.venue}</span>
                              <span className={event.registered >= event.totalTickets ? "text-red-500" : "text-green-500"}>
                                  {event.registered}/{event.totalTickets} Sold
                              </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full max-w-md mt-3 bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div className="bg-indigo-500 h-full transition-all duration-1000" style={{width: `${Math.min((event.registered/event.totalTickets)*100, 100)}%`}}></div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setManageEvent(event)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:text-green-600 transition-colors" title="View Attendees"><Users className="w-4 h-4" /></button>
                          <button onClick={() => setEditEvent(event)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:text-indigo-600 transition-colors" title="Edit Event"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(event.id)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:text-red-500 transition-colors" title="Delete Event"><Trash2 className="w-4 h-4" /></button>
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
      {editEvent && <CreateEventModal isOpen={!!editEvent} onClose={() => setEditEvent(null)} editData={editEvent} />}
      {manageEvent && <ManageEventModal isOpen={!!manageEvent} onClose={() => setManageEvent(null)} eventData={manageEvent} />}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, animate }) => (
  <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 hover:scale-[1.02] transition-transform">
    <div className={`w-14 h-14 rounded-2xl ${color.replace('text-', 'bg-')}/10 flex items-center justify-center ${color}`}>
       <Icon className={`w-7 h-7 ${animate ? 'animate-pulse' : ''}`} />
    </div>
    <div>
       <p className="text-xs font-bold uppercase text-zinc-400 tracking-wider">{title}</p>
       <h3 className="text-3xl font-black dark:text-white tracking-tight">{value}</h3>
    </div>
  </div>
);

const SidebarItem = ({ icon: Icon, label, active, isOpen, onClick }) => (
    <div onClick={onClick} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-zinc-100 dark:bg-zinc-800 text-indigo-600' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'} ${!isOpen && 'justify-center'}`}>
        <Icon className={`w-5 h-5 ${active ? 'fill-current' : ''}`} />
        {isOpen && <span className="text-sm font-bold">{label}</span>}
    </div>
);

export default AdminDashboard;