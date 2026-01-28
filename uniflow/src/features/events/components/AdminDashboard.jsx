import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { 
  Ticket, DollarSign, Calendar, Trash2, Edit3, Plus, Zap, 
  Users, TrendingUp, Menu, QrCode, FileText, User, LayoutDashboard
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Modals
import EditEventModal from './EditEventModal';
import ManageEventModal from './ManageEventModal'; 

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, tickets: 0, attendance: 0 });
  const [chartData, setChartData] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('overview'); 

  const [editEvent, setEditEvent] = useState(null);
  const [manageEvent, setManageEvent] = useState(null);

  // 1. FETCH EVENTS
  useEffect(() => {
    if (!user) return;
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('organizerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      eventList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setEvents(eventList);
    });
    return () => unsubscribe();
  }, [user]);

  // 2. FETCH REGISTRATIONS
  useEffect(() => {
    if (!user) return;
    const qReg = query(
      collection(db, 'registrations'), 
      where('eventCreatorId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(qReg, (snapshot) => {
      const regs = snapshot.docs.map(doc => doc.data());
      setRegistrations(regs);

      const totalRev = regs.reduce((acc, curr) => acc + (Number(curr.ticketPrice) || 0), 0);
      const totalAttended = regs.filter(r => r.used === true).length;
      setStats({ revenue: totalRev, tickets: regs.length, attendance: totalAttended });

      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const dailyData = last7Days.map(dateStr => {
        const count = regs.filter(r => {
            if (!r.bookedAt) return false;
            const bookDate = r.bookedAt.toDate ? r.bookedAt.toDate() : new Date(r.bookedAt);
            return bookDate.toISOString().split('T')[0] === dateStr;
        }).length;
        return { name: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }), sales: count };
      });
      setChartData(dailyData);
    });
    return () => unsubscribe();
  }, [user]);

  const pieData = [
    { name: 'Checked In', value: stats.attendance || 0 },
    { name: 'Pending', value: (stats.tickets - stats.attendance) || 1 },
  ];
  const COLORS = stats.tickets > 0 ? ['#10B981', '#6366f1'] : ['#e4e4e7', '#f4f4f5']; 

  const handleDelete = async (eventId) => {
    if (window.confirm("Delete event? This cannot be undone.")) {
      await deleteDoc(doc(db, 'events', eventId));
    }
  };

  const downloadGlobalReport = () => {
    if (registrations.length === 0) { alert("No data."); return; }
    let csvContent = "data:text/csv;charset=utf-8,Event,Name,Roll No,Price,Status,Date\n";
    registrations.forEach(r => {
        const date = r.bookedAt?.toDate ? r.bookedAt.toDate().toLocaleDateString() : 'N/A';
        const status = r.used ? "Attended" : "Registered";
        csvContent += `"${r.eventTitle}","${r.userName}","${r.userRollNo}",${r.ticketPrice},${status},${date}\n`;
    });
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `UniFlow_Report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black pt-16">
      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} hidden md:flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-300`}>
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
           {isSidebarOpen && <span className="font-black text-lg dark:text-white">Admin</span>}
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
             <Menu className="w-5 h-5 text-zinc-500" />
           </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           <SidebarItem icon={LayoutDashboard} label="Overview" active={activeView === 'overview'} isOpen={isSidebarOpen} onClick={() => setActiveView('overview')} />
           <SidebarItem icon={Calendar} label="My Events" active={activeView === 'events'} isOpen={isSidebarOpen} onClick={() => { setActiveView('events'); document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' }); }} />
           <SidebarItem icon={Users} label="Download CSV" isOpen={isSidebarOpen} onClick={downloadGlobalReport} />
        </nav>
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
           <Link to="/scan">
             <div className={`flex items-center gap-3 p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all ${!isSidebarOpen && 'justify-center'}`}>
                <QrCode className="w-5 h-5" />
                {isSidebarOpen && <span className="font-bold text-sm">Scanner</span>}
             </div>
           </Link>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Dashboard</h1>
                <p className="text-zinc-500 text-sm font-medium">Welcome back, {user?.displayName}</p>
             </div>
             <Link to="/admin/create">
                <button className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 shadow-xl">
                   <Plus className="w-4 h-4" /> Create Event
                </button>
             </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <StatCard title="Revenue" value={`₹${stats.revenue}`} icon={DollarSign} color="text-green-500" />
             <StatCard title="Tickets" value={stats.tickets} icon={Ticket} color="text-indigo-500" />
             <StatCard title="Check-ins" value={stats.attendance} icon={Zap} color="text-amber-500" animate />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* PIE CHART - Fixed Height */}
             <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold dark:text-white mb-6">Attendance</h3>
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
             </div>

             {/* LINE CHART - Fixed Height */}
             <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold dark:text-white">Sales (7 Days)</h3>
                   <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#A1A1AA'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#A1A1AA'}} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} itemStyle={{ fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={4} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>

          <div id="events-section" className="space-y-4">
            <h2 className="text-xl font-bold dark:text-white">Active Events</h2>
            <div className="grid gap-4">
              {events.map(event => (
                <div key={event.id} className="group bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 transition-all flex flex-col md:flex-row gap-6 items-center shadow-sm">
                   <div className="w-full md:w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-zinc-100">
                     <img src={event.imageUrl || "https://placehold.co/200x200?text=Event"} className="w-full h-full object-cover" alt="" />
                   </div>
                   <div className="flex-1 text-center md:text-left">
                      <h3 className="text-lg font-black dark:text-white">{event.title}</h3>
                      <div className="text-xs font-bold text-zinc-500 mt-1 flex gap-4 justify-center md:justify-start">
                         <span>{event.date}</span>
                         <span>{event.ticketsSold}/{event.totalTickets} Sold</span>
                      </div>
                      <div className="w-full max-w-md mt-3 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                         <div className="bg-indigo-500 h-full" style={{width: `${(event.ticketsSold/event.totalTickets)*100}%`}}></div>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => setManageEvent(event)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:text-green-600"><Users className="w-4 h-4" /></button>
                      <button onClick={() => setEditEvent(event)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:text-indigo-600"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(event.id)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {editEvent && <EditEventModal isOpen={!!editEvent} onClose={() => setEditEvent(null)} eventData={editEvent} />}
      {manageEvent && <ManageEventModal isOpen={!!manageEvent} onClose={() => setManageEvent(null)} eventData={manageEvent} />}
    </div>
  );
};

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

const SidebarItem = ({ icon: Icon, label, active, isOpen, onClick }) => (
    <div onClick={onClick} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-zinc-100 dark:bg-zinc-800 text-indigo-600' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'} ${!isOpen && 'justify-center'}`}>
        <Icon className={`w-5 h-5 ${active ? 'fill-current' : ''}`} />
        {isOpen && <span className="text-sm font-bold">{label}</span>}
    </div>
);

const QuickAction = ({ icon: Icon, label, onClick }) => (
    <div onClick={onClick} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-all border border-transparent hover:border-indigo-200 group">
        <Icon className="w-6 h-6 text-zinc-400 group-hover:text-indigo-600 transition-colors" />
        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-indigo-700">{label}</span>
    </div>
);

export default AdminDashboard;