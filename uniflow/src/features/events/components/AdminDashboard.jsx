import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, FileSpreadsheet, Edit3, Trash2, ShieldCheck, Camera, Plus, RefreshCw 
} from 'lucide-react';

// ✅ Import the Modal
import EditEventModal from './EditEventModal'; 

const AdminDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // Stats & Data State
  const [stats, setStats] = useState({ totalRegistrations: 0, totalCheckedIn: 0, recentRegistrations: [] });
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEvent, setFilterEvent] = useState('All');

  // 🛠️ EDIT MODAL STATE
  const [editingEvent, setEditingEvent] = useState(null);

  // 1. DATA FETCHING
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch Events (Filtered by Creator)
      let eventsQuery;
      if (profile?.role === 'super_admin') {
        eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
      } else {
        eventsQuery = query(collection(db, 'events'), where('createdBy', '==', user.uid), orderBy('createdAt', 'desc'));
      }

      const eventsSnap = await getDocs(eventsQuery);
      const eventsData = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyEvents(eventsData);

      // Fetch Registrations
      const regSnap = await getDocs(collection(db, 'registrations'));
      const allRegs = regSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const myRegs = profile?.role === 'super_admin' ? allRegs : allRegs.filter(r => r.eventCreatorId === user.uid);
      const filteredRegs = filterEvent === 'All' ? myRegs : myRegs.filter(r => r.eventTitle === filterEvent);

      setStats({
        totalRegistrations: myRegs.length,
        totalCheckedIn: myRegs.filter(r => r.checkedIn || r.status === 'attended').length,
        recentRegistrations: filteredRegs
      });

    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user, profile, filterEvent]);

  // CSV Export
  const handleExportCSV = () => {
    if (stats.recentRegistrations.length === 0) return alert("No data to export!");
    const headers = ["Ticket ID", "Name", "Roll No", "Email", "Event", "Status"];
    const rows = stats.recentRegistrations.map(r => [
      r.id, r.userName, r.userRollNo, r.userEmail, r.eventTitle, 
      (r.checkedIn || r.status === 'attended') ? "PRESENT" : "ABSENT"
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `UniFlow_${filterEvent}_Report.csv`;
    link.click();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><RefreshCw className="animate-spin text-indigo-500" /></div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div>
            <h1 className="text-4xl font-black dark:text-white uppercase tracking-tighter italic">Console</h1>
            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-indigo-500" /> Authorized: {profile?.role}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/admin/create')} className="px-6 py-4 bg-white dark:bg-black border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all">
              <Plus className="w-4 h-4" /> Create Event
            </button>
            <button onClick={() => navigate('/scan')} className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-500/20">
              <Camera className="w-4 h-4" /> Open Scanner
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2">My Total Bookings</p>
                <h2 className="text-5xl font-black dark:text-white tracking-tighter">{stats.totalRegistrations}</h2>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2">Check-ins</p>
                <h2 className="text-5xl font-black text-green-500 tracking-tighter">{stats.totalCheckedIn}</h2>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2">Managed Events</p>
                <h2 className="text-5xl font-black text-indigo-600 tracking-tighter">{myEvents.length}</h2>
            </div>
        </div>

        {/* My Events */}
        <div className="space-y-4">
           <h3 className="text-xl font-black dark:text-white uppercase tracking-tight flex items-center gap-2">
             <Calendar className="w-5 h-5 text-indigo-500" /> Managed Events
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.map(ev => (
                <div key={ev.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                     <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[8px] font-black uppercase tracking-widest">Active</span>
                     <div className="flex gap-2">
                        {/* ✏️ EDIT BUTTON - Opens Modal */}
                        <button onClick={() => setEditingEvent(ev)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if(window.confirm("Delete?")) deleteDoc(doc(db, 'events', ev.id)).then(()=>fetchData()) }} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                  <h4 className="font-black text-lg dark:text-white leading-tight mb-1 truncate">{ev.title}</h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4">{ev.date}</p>
                  
                  <button onClick={() => setFilterEvent(filterEvent === ev.title ? 'All' : ev.title)} className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterEvent === ev.title ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                    {filterEvent === ev.title ? 'Viewing Stats' : 'View Registrations'}
                  </button>
                </div>
              ))}
           </div>
        </div>

        {/* Recent Registrations Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4">
               <div>
                 <h3 className="font-black dark:text-white uppercase tracking-widest text-xs">Event Registry</h3>
                 <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Filter: <span className="text-indigo-500">{filterEvent}</span></p>
               </div>
               <button onClick={handleExportCSV} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-green-500/20">
                 <FileSpreadsheet className="w-4 h-4" /> Download CSV
               </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-black text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  <tr>
                    <th className="p-6">Student Detail</th>
                    <th className="p-6">Event Title</th>
                    <th className="p-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                   {stats.recentRegistrations.slice(0, 10).map(reg => (
                     <tr key={reg.id} className="text-sm dark:text-zinc-300">
                        <td className="p-6">
                           <p className="font-bold">{reg.userName}</p>
                           <p className="text-[10px] opacity-60 uppercase font-mono">{reg.userRollNo}</p>
                        </td>
                        <td className="p-6 font-black text-[10px] uppercase text-indigo-500">{reg.eventTitle}</td>
                        <td className="p-6">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${(reg.checkedIn || reg.status === 'attended') ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'}`}>
                             {(reg.checkedIn || reg.status === 'attended') ? 'Verified' : 'Pending'}
                           </span>
                        </td>
                     </tr>
                   ))}
                </tbody>
              </table>
            </div>
        </div>

        {/* 🛠️ EDIT MODAL COMPONENT */}
        {editingEvent && (
          <EditEventModal 
            isOpen={!!editingEvent} 
            event={editingEvent} 
            onClose={() => setEditingEvent(null)} 
            onSuccess={fetchData} 
          />
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;