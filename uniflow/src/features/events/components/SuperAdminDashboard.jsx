import React, { useEffect, useState } from 'react';
import { 
  collection, doc, updateDoc, onSnapshot, setDoc, query, where, getDocs, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { 
  Shield, Users, Mail, Search, Zap, UserMinus, UserPlus, 
  ShieldAlert, ToggleLeft, ToggleRight, EyeOff, QrCode, CheckCircle, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [systemStats, setSystemStats] = useState({ count: 0, isEmailActive: true });

  useEffect(() => {
    // 1. Live Users & Roles
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // 2. Live Platform Events (To see which club is active)
    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Email Stats
    const unsubStats = onSnapshot(doc(db, "system_stats", "daily_emails"), (snapshot) => {
      if (snapshot.exists()) setSystemStats(snapshot.data());
    });

    return () => { unsubUsers(); unsubEvents(); unsubStats(); };
  }, []);

  // 🚀 MANUAL ENTRY LOGIC (Zero Cost Search)
  const handleManualEntry = async (regId) => {
    if (!window.confirm("Mark this student as 'Present' manually?")) return;
    try {
      await updateDoc(doc(db, 'registrations', regId), {
        status: 'attended',
        attendedAt: serverTimestamp(),
        entryType: 'manual_root'
      });
      alert("Entry Recorded.");
    } catch (err) { alert("Action Failed."); }
  };

  const toggleEmailService = async () => {
    const newState = !systemStats.isEmailActive;
    await setDoc(doc(db, "system_stats", "daily_emails"), { isEmailActive: newState }, { merge: true });
  };

  const updateUserRole = async (userId, newRole) => {
    if (!window.confirm(`Promote/Demote user to ${newRole}?`)) return;
    await updateDoc(doc(db, 'users', userId), { role: newRole });
  };

  if (loading) return <div className="min-h-screen pt-32 text-center font-black text-indigo-600 italic">ROOT ACCESSING...</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pt-24 pb-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER & GLOBAL SCANNER */}
        <div className="flex justify-between items-start mb-12">
           <div>
             <h1 className="text-5xl font-black tracking-tighter dark:text-white uppercase italic">Command Center</h1>
             <p className="text-zinc-500 font-bold text-xs mt-2 tracking-widest uppercase">System-Wide Governance & Live Entry</p>
           </div>
           <button onClick={() => navigate('/scan')} className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-indigo-600/30 hover:scale-105 transition-all">
             <QrCode className="w-5 h-5" /> Launch Gate Scanner
           </button>
        </div>
        
        {/* TOP STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className={`p-8 rounded-[2.5rem] border shadow-xl transition-all ${systemStats.isEmailActive ? 'bg-white' : 'bg-red-50'} dark:bg-zinc-900`}>
              <div className="flex justify-between items-center mb-6">
                <div className={`p-4 rounded-2xl ${systemStats.isEmailActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}><Mail className="w-6 h-6" /></div>
                <button onClick={toggleEmailService}>
                   {systemStats.isEmailActive ? <ToggleRight className="w-12 h-12 text-green-500" /> : <ToggleLeft className="w-12 h-12 text-red-500" />}
                </button>
              </div>
              <div className="text-3xl font-black dark:text-white">{systemStats.count || 0} <span className="text-zinc-400">/ 500</span></div>
              <p className="text-[10px] text-zinc-500 font-black uppercase mt-1">Quota Saver: {systemStats.isEmailActive ? 'ONLINE' : 'REVOKED'}</p>
           </div>
           
           <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 shadow-sm">
              <Users className="w-8 h-8 text-indigo-600 mb-6" />
              <div className="text-3xl font-black dark:text-white">{users.length}</div>
              <p className="text-[10px] text-zinc-500 font-black uppercase mt-1">Total Campus Users</p>
           </div>

           <div className="p-8 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[2.5rem] shadow-xl">
              <Shield className="w-8 h-8 text-indigo-400 mb-6" />
              <div className="text-3xl font-black italic uppercase tracking-tighter">Root Mode</div>
              <p className="text-[10px] opacity-50 font-black uppercase mt-1">Admin Dashboard Integrated</p>
           </div>
        </div>

        {/* 📊 CLUB ACTIVITY TRACKER (See who is creating what) */}
        <div className="mb-12">
          <h2 className="text-xl font-black dark:text-white uppercase italic mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" /> Live Club Activity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(event => (
              <div key={event.id} className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{event.organizerName || 'Unknown Club'}</p>
                <h3 className="font-black text-zinc-900 dark:text-white mt-1 uppercase tracking-tight">{event.title}</h3>
                <div className="flex justify-between items-center mt-4">
                  <div className="text-xs font-bold text-zinc-400">{event.ticketsSold} Registered</div>
                  <button onClick={() => navigate(`/events/${event.id}`)} className="text-[10px] font-black text-zinc-900 dark:text-white underline">VIEW PAGE</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 📋 USER & MANUAL ENTRY MANAGEMENT */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
           <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-black/20">
              <h2 className="font-black text-xl dark:text-white uppercase tracking-tighter">Campus Ledger</h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input type="text" placeholder="Search Roll No / Email..." className="pl-12 pr-6 py-3 bg-white dark:bg-black border border-zinc-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-600/20 dark:text-white w-64 shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-950 text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                   <tr>
                      <th className="px-8 py-6">Student</th>
                      <th className="px-8 py-6">Role</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                   {users.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.rollNo?.includes(searchTerm)).map(u => (
                     <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-indigo-900/5 transition-colors">
                        <td className="px-8 py-6">
                           <div className="font-black text-zinc-900 dark:text-white text-sm uppercase tracking-tight">{u.displayName}</div>
                           <div className="text-[10px] text-zinc-400 font-bold uppercase">{u.email}</div>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                             u.role === 'super_admin' ? 'bg-red-600 text-white' : 
                             u.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-400'
                           }`}>
                              {u.role || 'student'}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-right flex items-center justify-end gap-2">
                           {u.role !== 'super_admin' && (
                             <>
                                {u.role === 'admin' ? (
                                  <button onClick={() => updateUserRole(u.id, 'student')} className="px-4 py-2 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-xl hover:bg-amber-600 hover:text-white transition-all">Revoke Admin</button>
                                ) : (
                                  <button onClick={() => updateUserRole(u.id, 'admin')} className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-xl hover:bg-indigo-600 hover:text-white transition-all">Make Admin</button>
                                )}
                                <button onClick={() => updateUserRole(u.id, 'suspended')} className="p-2 text-zinc-300 hover:text-red-600 transition-colors"><ShieldAlert className="w-5 h-5"/></button>
                             </>
                           )}
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

export default SuperAdminDashboard;