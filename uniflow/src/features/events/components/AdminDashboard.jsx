import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { 
  Ticket, DollarSign, Calendar, Trash2, Edit3, Plus, Zap, 
  Users, TrendingUp, Menu, BarChart3, QrCode, FileText, User
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
// Ensure recharts is installed: npm install recharts
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Modals
import EditEventModal from './EditEventModal';
import ManageEventModal from './ManageEventModal'; 

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Data State
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, tickets: 0, attendance: 0 });
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Modals State
  const [editEvent, setEditEvent] = useState(null);
  const [manageEvent, setManageEvent] = useState(null);

  // 📡 Real-time Data Listener
  useEffect(() => {
    if (!user) return;

    // 1. Fetch Events
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('organizerId', '==', user.uid));

    const unsubscribeEvents = onSnapshot(q, (snapshot) => {
      const eventList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort newest first
      eventList.sort((a, b) => {
         const dA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
         const dB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
         return dB - dA;
      });

      setEvents(eventList);
      
      // Calculate Aggregated Stats
      const revenue = eventList.reduce((acc, curr) => acc + (Number(curr.price || 0) * (curr.ticketsSold || 0)), 0);
      const tickets = eventList.reduce((acc, curr) => acc + (curr.ticketsSold || 0), 0);
      
      setStats(prev => ({ ...prev, revenue, tickets }));
      setLoading(false);
    });

    // 2. Fetch Live Attendance (Total Checked In)
    const qLive = query(
      collection(db, 'registrations'),
      where('eventCreatorId', '==', user.uid),
      where('used', '==', true) 
    );
    const unsubscribeLive = onSnapshot(qLive, (snap) => {
      setStats(prev => ({ ...prev, attendance: snap.size }));
    });

    return () => { unsubscribeEvents(); unsubscribeLive(); };
  }, [user]);

  // 📊 Charts Data
  const chartData = [
    { name: 'Mon', sales: Math.floor(stats.tickets * 0.1) }, 
    { name: 'Tue', sales: Math.floor(stats.tickets * 0.2) }, 
    { name: 'Wed', sales: Math.floor(stats.tickets * 0.4) },
    { name: 'Thu', sales: Math.floor(stats.tickets * 0.5) }, 
    { name: 'Fri', sales: Math.floor(stats.tickets * 0.8) }, 
    { name: 'Sat', sales: stats.tickets },
    { name: 'Sun', sales: stats.tickets },
  ];
  const pieData = [
    { name: 'Checked In', value: stats.attendance || 1 }, // Fallback to 1 to show gray ring if 0
    { name: 'Pending', value: (stats.tickets - stats.attendance) || 1 },
  ];
  const COLORS = stats.attendance > 0 ? ['#10B981', '#6366f1'] : ['#e4e4e7', '#f4f4f5']; // Gray if no data

  // 🗑️ Delete Handler
  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure? This action cannot be undone.")) {
      await deleteDoc(doc(db, 'events', eventId));
    }
  };

  // 📥 NEW FUNCTION: Global Financial Report
  const downloadGlobalReport = () => {
    if (events.length === 0) {
        alert("No events to export.");
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Event Name,Date,Total Tickets,Sold,Price,Revenue,Status\n";

    events.forEach(e => {
        const rev = (Number(e.price) || 0) * (e.ticketsSold || 0);
        const status = e.ticketsSold >= e.totalTickets ? "Sold Out" : "Active";
        const row = `"${e.title}","${e.date}",${e.totalTickets},${e.ticketsSold || 0},${e.price},${rev},${status}`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `UniFlow_Global_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black pt-16">
      
      {/* 🟢 SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} hidden md:flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-300`}>
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
           {isSidebarOpen && <span className="font-black text-lg tracking-tight dark:text-white">Backstage</span>}
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
             <Menu className="w-5 h-5 text-zinc-500" />
           </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
           <SidebarItem icon={BarChart3} label="Overview" active isOpen={isSidebarOpen} />
           <SidebarItem icon={Calendar} label="My Events" isOpen={isSidebarOpen} />
           <SidebarItem icon={Users} label="Attendees" isOpen={isSidebarOpen} />
           <SidebarItem icon={DollarSign} label="Finance" isOpen={isSidebarOpen} />
        </nav>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
           <Link to="/scan">
             <div className={`flex items-center gap-3 p-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 cursor-pointer hover:bg-indigo-700 transition-all ${!isSidebarOpen && 'justify-center'}`}>
                <QrCode className="w-5 h-5" />
                {isSidebarOpen && <span className="font-bold text-sm">Open Scanner</span>}
             </div>
           </Link>
        </div>
      </aside>

      {/* 🟢 MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Dashboard</h1>
                <p className="text-zinc-500 text-sm font-medium">Welcome back, {user?.displayName}</p>
             </div>
             <Link to="/admin/create">
                <button className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity shadow-xl">
                   <Plus className="w-4 h-4" /> Create Event
                </button>
             </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <StatCard title="Total Sales" value={`₹${stats.revenue.toLocaleString()}`} icon={DollarSign} color="text-green-500" />
             <StatCard title="Registrations" value={stats.tickets} icon={Ticket} color="text-indigo-500" />
             <StatCard title="Live Attendance" value={stats.attendance} icon={Zap} color="text-amber-500" animate />
          </div>

          {/* Quick Actions & Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             
             {/* 🟢 Left: Quick Actions (ALL WORKING) */}
             <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold dark:text-white mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                   <QuickAction icon={Plus} label="New Event" onClick={() => navigate('/admin/create')} />
                   <QuickAction icon={QrCode} label="Scan Tix" onClick={() => navigate('/scan')} />
                   {/* This button now generates a Global Report */}
                   <QuickAction icon={FileText} label="Global Report" onClick={downloadGlobalReport} />
                   {/* This button links to Profile Settings */}
                   <QuickAction icon={User} label="Profile" onClick={() => navigate('/profile')} />
                </div>
                
                {/* Attendance Chart */}
                <div className="mt-auto h-48 w-full pt-6">
                   <h4 className="text-xs font-bold uppercase text-zinc-400 mb-4">Check-in Ratio</h4>
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* Right: Registration Trend */}
             <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold dark:text-white">Registration Trend</h3>
                   <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-bold text-green-500">Live Updates</span>
                   </div>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#A1A1AA'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#A1A1AA'}} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} itemStyle={{ fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={4} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>

          {/* Event List */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold dark:text-white">Your Events</h2>
            <div className="grid gap-4">
              {events.map(event => (
                <div key={event.id} className="group bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 transition-all flex flex-col md:flex-row gap-6 items-center shadow-sm">
                   
                   <div className="w-full md:w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative">
                     {event.imageUrl ? (
                        <img src={event.imageUrl} className="w-full h-full object-cover" alt="" />
                     ) : (
                        <div className="w-full h-full bg-zinc-100 flex items-center justify-center"><Calendar className="text-zinc-400"/></div>
                     )}
                   </div>

                   <div className="flex-1 text-center md:text-left">
                      <h3 className="text-lg font-black dark:text-white">{event.title}</h3>
                      <div className="flex justify-center md:justify-start gap-4 text-xs font-bold text-zinc-500 mt-1">
                         <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {event.date}</span>
                         <span className="flex items-center gap-1"><Ticket className="w-3 h-3" /> {event.ticketsSold}/{event.totalTickets}</span>
                      </div>
                      <div className="w-full max-w-md mt-3 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                         <div className="bg-indigo-500 h-full transition-all duration-1000" style={{width: `${(event.ticketsSold/event.totalTickets)*100}%`}}></div>
                      </div>
                   </div>

                   {/* Actions */}
                   <div className="flex gap-2">
                      <button onClick={() => setManageEvent(event)} className="px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-600 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-2 font-bold text-xs" title="Download Attendee List">
                        <Users className="w-4 h-4" /> Participants
                      </button>
                      <button onClick={() => setEditEvent(event)} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Edit Event">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(event.id)} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-600 hover:bg-red-50 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Modals */}
      {editEvent && <EditEventModal isOpen={!!editEvent} onClose={() => setEditEvent(null)} eventData={editEvent} />}
      {manageEvent && <ManageEventModal isOpen={!!manageEvent} onClose={() => setManageEvent(null)} eventData={manageEvent} />}
    </div>
  );
};

// 🎨 Helper Components
const StatCard = ({ title, value, icon: Icon, color, animate }) => (
  <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
    <div className={`w-14 h-14 rounded-2xl ${color.replace('text-', 'bg-')}/10 flex items-center justify-center ${color}`}>
       <Icon className={`w-7 h-7 ${animate ? 'animate-pulse' : ''}`} />
    </div>
    <div>
       <p className="text-xs font-bold uppercase text-zinc-400 tracking-wider">{title}</p>
       <h3 className="text-3xl font-black dark:text-white tracking-tight">{value}</h3>
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, label, onClick }) => (
    <div onClick={onClick} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-all border border-transparent hover:border-indigo-200 group">
        <Icon className="w-6 h-6 text-zinc-400 group-hover:text-indigo-600 transition-colors" />
        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-indigo-700">{label}</span>
    </div>
);

const SidebarItem = ({ icon: Icon, label, active, isOpen }) => (
    <div className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-zinc-100 dark:bg-zinc-800 text-indigo-600' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'} ${!isOpen && 'justify-center'}`}>
        <Icon className={`w-5 h-5 ${active ? 'fill-current' : ''}`} />
        {isOpen && <span className="text-sm font-bold">{label}</span>}
    </div>
);

export default AdminDashboard;