import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, CheckCircle, Clock, RefreshCw, 
  FileSpreadsheet, Edit3, Trash2, ShieldCheck, Zap, Camera 
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    totalCheckedIn: 0,
    recentRegistrations: []
  });
  const [loading, setLoading] = useState(true);
  const [filterEvent, setFilterEvent] = useState('All');
  const [eventsList, setEventsList] = useState([]);

  // 1. FETCH DATA Logic
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Events
      const eventsSnap = await getDocs(query(collection(db, 'events'), orderBy('createdAt', 'desc')));
      const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEventsList(events);

      // Fetch All Registrations for Master Stats
      let q = query(collection(db, 'registrations'), orderBy('purchasedAt', 'desc'));
      if (filterEvent !== 'All') {
        q = query(collection(db, 'registrations'), where('eventTitle', '==', filterEvent));
      }

      const regSnap = await getDocs(q);
      const registrations = regSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setStats({
        totalEvents: events.length,
        totalRegistrations: registrations.length,
        totalCheckedIn: registrations.filter(r => r.checkedIn || r.status === 'attended').length,
        recentRegistrations: registrations
      });
    } catch (err) {
      console.error("Admin Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterEvent]);

  // 2. CSV EXPORT (Master & Filtered)
  const handleExportCSV = () => {
    if (stats.recentRegistrations.length === 0) return alert("No data!");
    
    const headers = ["Ticket ID", "Name", "Roll No", "Email", "Event", "Status"];
    const rows = stats.recentRegistrations.map(r => [
      r.id, r.userName, r.userRollNo || 'N/A', r.userEmail, r.eventTitle, 
      (r.checkedIn || r.status === 'attended') ? "PRESENT" : "ABSENT"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `UniFlow_${filterEvent}_List.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER AREA - BUTTONS ARE HERE */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black dark:text-white uppercase tracking-tighter italic">Console</h1>
            <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-indigo-500" /> Admin Access: {profile?.role}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* 📸 SCANNER BUTTON (Wapas Agaya!) */}
            <button 
              onClick={() => navigate('/scan')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Camera className="w-4 h-4" /> Open Scanner
            </button>

            {/* 📊 EXPORT BUTTON */}
            <button 
              onClick={handleExportCSV}
              className="px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-50 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-500" /> {filterEvent === 'All' ? 'Master CSV' : 'Event CSV'}
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-xl relative overflow-hidden group">
                <Zap className="absolute -right-4 -top-4 w-24 h-24 text-indigo-500/5 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2">Total Bookings</p>
                <h2 className="text-5xl font-black dark:text-white tracking-tighter">{stats.totalRegistrations}</h2>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2">Checked In</p>
                <h2 className="text-5xl font-black text-green-500 tracking-tighter">{stats.totalCheckedIn}</h2>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2">Live Events</p>
                <h2 className="text-5xl font-black text-indigo-600 tracking-tighter">{stats.totalEvents}</h2>
            </div>
        </div>

        {/* MANAGE EVENTS SECTION (Wapas Agaya!) */}
        <div className="space-y-4">
           <h3 className="text-xl font-black dark:text-white uppercase tracking-tight flex items-center gap-2">
             <Calendar className="w-5 h-5 text-indigo-500" /> Your Hosted Events
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventsList.map(ev => {
                // 🛡️ PERMISSION CHECK: Sirf Creator ya SuperAdmin edit kar sakte hain
                const canEdit = ev.createdBy === user.uid || profile?.role === 'super_admin';
                
                return (
                  <div key={ev.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg group">
                    <div className="flex justify-between items-start mb-4">
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${canEdit ? 'bg-indigo-50 text-indigo-600' : 'bg-zinc-100 text-zinc-400'}`}>
                         {canEdit ? 'Full Access' : 'View Only'}
                       </span>
                       <div className="flex gap-2">
                          {canEdit && (
                            <>
                              <button onClick={() => navigate(`/admin/edit/${ev.id}`)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => { if(window.confirm("Delete?")) deleteDoc(doc(db, 'events', ev.id)).then(()=>fetchData()) }} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                       </div>
                    </div>
                    <h4 className="font-black text-lg dark:text-white leading-tight mb-1 truncate">{ev.title}</h4>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{ev.date} • {ev.location}</p>
                    
                    <button 
                      onClick={() => setFilterEvent(ev.title)} 
                      className={`w-full mt-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterEvent === ev.title ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                    >
                      Filter Registrations
                    </button>
                  </div>
                );
              })}
           </div>
        </div>

        {/* REGISTRATION TABLE */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
               <h3 className="font-black dark:text-white uppercase tracking-widest text-xs">Recent Records ({filterEvent})</h3>
               {filterEvent !== 'All' && <button onClick={() => setFilterEvent('All')} className="text-[10px] font-black uppercase text-indigo-500 underline">Clear Filter</button>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-black text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  <tr>
                    <th className="p-6">Student</th>
                    <th className="p-6">Event</th>
                    <th className="p-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                   {stats.recentRegistrations.slice(0, 10).map(reg => (
                     <tr key={reg.id} className="text-sm dark:text-zinc-300">
                        <td className="p-6">
                           <p className="font-bold">{reg.userName}</p>
                           <p className="text-[10px] opacity-60 uppercase">{reg.userRollNo}</p>
                        </td>
                        <td className="p-6 font-bold text-xs uppercase text-indigo-500">{reg.eventTitle}</td>
                        <td className="p-6">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${(reg.checkedIn || reg.status === 'attended') ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400'}`}>
                             {(reg.checkedIn || reg.status === 'attended') ? 'Present' : 'Pending'}
                           </span>
                        </td>
                     </tr>
                   ))}
                </tbody>
              </table>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;