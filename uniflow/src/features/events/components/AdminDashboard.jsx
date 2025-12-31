import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { 
  Users, Calendar, CheckCircle, Clock, Search, 
  Download, Filter, Trash2, RefreshCw, XCircle, FileSpreadsheet 
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    totalCheckedIn: 0,
    recentRegistrations: []
  });
  const [loading, setLoading] = useState(true);
  const [filterEvent, setFilterEvent] = useState('All');
  const [eventsList, setEventsList] = useState([]);

  // 1. Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Events
      const eventsSnap = await getDocs(query(collection(db, 'events'), orderBy('createdAt', 'desc')));
      const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEventsList(events);

      // Fetch Registrations
      let q = query(collection(db, 'registrations'), orderBy('purchasedAt', 'desc'));
      
      // Apply Filter if selected
      if (filterEvent !== 'All') {
        q = query(collection(db, 'registrations'), where('eventTitle', '==', filterEvent));
      }

      const regSnap = await getDocs(q);
      const registrations = regSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate Stats
      const checkedInCount = registrations.filter(r => r.checkedIn).length;

      setStats({
        totalEvents: events.length,
        totalRegistrations: registrations.length,
        totalCheckedIn: checkedInCount,
        recentRegistrations: registrations
      });

    } catch (err) {
      console.error("Admin Data Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterEvent]);

  // 2. 📊 EXPORT MASTER LIST (The Logic You Asked For)
  const handleExportMasterCSV = () => {
    if (stats.recentRegistrations.length === 0) {
      alert("No data to export!");
      return;
    }

    // Define Headers
    const headers = [
      "Ticket ID", 
      "Student Name", 
      "Roll No", 
      "Phone",
      "Email", 
      "Event Name", 
      "STATUS", // <--- The Important Column
      "Registration Date"
    ];
    
    // Map Data
    const rows = stats.recentRegistrations.map(reg => [
      reg.id,
      `"${reg.userName}"`, // Quote names to handle commas
      reg.userRollNo || "N/A",
      reg.userPhone || "N/A",
      reg.userEmail,
      `"${reg.eventTitle}"`,
      reg.checkedIn ? "✅ PRESENT" : "❌ ABSENT", // <--- Master List Logic
      new Date(reg.purchasedAt?.toDate()).toLocaleDateString()
    ]);

    // Build CSV String
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    // Trigger Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `UniFlow_Master_List_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Delete Ticket (Super Admin Safety)
  const handleDeleteTicket = async (ticketId) => {
    if(!window.confirm("⚠️ DANGER: This will permanently delete this ticket. Are you sure?")) return;
    try {
      await deleteDoc(doc(db, 'registrations', ticketId));
      fetchData(); // Refresh
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Organizer Console</h1>
            <p className="text-zinc-500 font-medium">Real-time campus analytics.</p>
          </div>
          
          <div className="flex gap-2">
            <button onClick={fetchData} className="p-3 bg-white dark:bg-zinc-900 rounded-xl hover:scale-105 transition-transform shadow-sm">
              <RefreshCw className={`w-5 h-5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={handleExportMasterCSV}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-green-900/20 active:scale-95 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Master List
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-xl">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600"><Calendar className="w-6 h-6" /></div>
              <span className="text-xs font-black uppercase text-zinc-400 tracking-widest">Active Events</span>
            </div>
            <h3 className="text-4xl font-black dark:text-white">{stats.totalEvents}</h3>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-xl">
             <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600"><Users className="w-6 h-6" /></div>
              <span className="text-xs font-black uppercase text-zinc-400 tracking-widest">Registrations</span>
            </div>
            <h3 className="text-4xl font-black dark:text-white">{stats.totalRegistrations}</h3>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-xl">
             <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl text-green-600"><CheckCircle className="w-6 h-6" /></div>
              <span className="text-xs font-black uppercase text-zinc-400 tracking-widest">Present Today</span>
            </div>
            <h3 className="text-4xl font-black dark:text-white">{stats.totalCheckedIn}</h3>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <Filter className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-bold uppercase text-zinc-500">Filter By:</span>
          </div>
          <button 
            onClick={() => setFilterEvent('All')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterEvent === 'All' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            All Events
          </button>
          {eventsList.map(ev => (
            <button 
              key={ev.id} 
              onClick={() => setFilterEvent(ev.title)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterEvent === ev.title ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            >
              {ev.title}
            </button>
          ))}
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Student</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Event</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Ticket ID</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {stats.recentRegistrations.length > 0 ? (
                  stats.recentRegistrations.map((reg) => (
                    <tr key={reg.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="p-6">
                        <p className="font-bold dark:text-white">{reg.userName}</p>
                        <p className="text-xs text-zinc-500">{reg.userEmail}</p>
                        <p className="text-[10px] text-indigo-500 font-mono mt-1">{reg.userRollNo}</p>
                      </td>
                      <td className="p-6">
                        <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wide">
                          {reg.eventTitle}
                        </span>
                      </td>
                      <td className="p-6 font-mono text-xs text-zinc-500">{reg.id.slice(0,8)}...</td>
                      <td className="p-6">
                        {reg.checkedIn ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Present</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-zinc-400">
                            <Clock className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Pending</span>
                          </div>
                        )}
                      </td>
                      <td className="p-6 text-right">
                        <button onClick={() => handleDeleteTicket(reg.id)} className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Delete Ticket">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-zinc-400 font-medium">
                      No registrations found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;