import React, { useEffect, useState } from 'react';
import { 
  collection, getDocs, doc, updateDoc, query, limit, onSnapshot 
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { 
  Shield, Users, Mail, Search, Lock, Unlock, Zap, 
  BarChart3, RefreshCcw, MailWarning 
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [systemStats, setSystemStats] = useState({ count: 0, isEmailActive: true });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), limit(20));
        const snapshot = await getDocs(q);
        const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };

    const unsub = onSnapshot(doc(db, "system_stats", "daily_emails"), (doc) => {
      if (doc.exists()) { setSystemStats(doc.data()); }
    });

    fetchUsers();
    return () => unsub();
  }, []);

  const toggleEmailSystem = async () => {
    await updateDoc(doc(db, "system_stats", "daily_emails"), { isEmailActive: !systemStats.isEmailActive });
  };

  if (loading) return <div className="min-h-screen bg-zinc-50 dark:bg-black pt-32 text-center text-zinc-500 font-bold tracking-tighter uppercase">Initializing Command Center...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* 📟 HEADER & STATS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 text-[10px] font-black uppercase">System Owner</span>
              </div>
              <h1 className="text-3xl font-black flex items-center gap-2 tracking-tighter">
                SuperAdmin Panel
              </h1>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className={`p-8 rounded-[2.5rem] border shadow-sm transition-all ${systemStats.isEmailActive ? 'bg-white border-zinc-200' : 'bg-red-50 border-red-200'} dark:bg-zinc-900`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${systemStats.isEmailActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                   <Mail className="w-6 h-6" />
                </div>
                <button onClick={toggleEmailSystem} className="text-[10px] font-black uppercase text-red-600 hover:underline">Toggle Power</button>
              </div>
              <div className="text-3xl font-black">{systemStats.count} <span className="text-zinc-300 text-lg">/ 500</span></div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Daily Email Traffic</p>
           </div>
           
           <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-2xl w-fit mb-6"><Users className="w-6 h-6" /></div>
              <div className="text-3xl font-black">{users.length}</div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Managed Entities</p>
           </div>

           <div className="p-8 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[2.5rem] shadow-xl">
              <div className="p-4 bg-indigo-500/20 rounded-2xl w-fit mb-6"><BarChart3 className="w-6 h-6" /></div>
              <div className="text-3xl font-black uppercase tracking-tighter">Optimal</div>
              <p className="text-xs opacity-50 font-bold uppercase tracking-widest mt-1">Database Health</p>
           </div>
        </div>

        {/* User Table Logic */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
           <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-black/20">
              <h2 className="font-black text-xl tracking-tighter">User Governance</h2>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Find student..." 
                  className="pl-10 pr-4 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-black uppercase text-zinc-400">
                   <tr>
                      <th className="px-8 py-5 tracking-widest">Identification</th>
                      <th className="px-8 py-5 tracking-widest">Authority</th>
                      <th className="px-8 py-5 text-right tracking-widest">Moderation</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                   {users.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                     <tr key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-indigo-900/5 transition-colors group">
                        <td className="px-8 py-5">
                           <div className="font-bold text-zinc-900 dark:text-white">{user.displayName || 'Unknown'}</div>
                           <div className="text-xs text-zinc-500 font-medium">{user.email}</div>
                        </td>
                        <td className="px-8 py-5">
                           <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-500'}`}>
                              {user.role}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                           {user.role !== 'super_admin' && (
                             <button className="text-xs font-black text-red-600 hover:underline">Revoke Access</button>
                           )}
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </div>

        {/* 🛠️ MANUAL CONTROLS */}
        <div className="mt-8 p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl"><RefreshCcw className="w-6 h-6" /></div>
              <div><h3 className="font-black text-lg tracking-tight">Manual Quota Reset</h3><p className="text-xs text-zinc-500 font-medium">Clear daily email counters for the entire platform.</p></div>
           </div>
           <button 
             onClick={async () => {
               if(window.confirm("Reset Daily Quota?")) await updateDoc(doc(db, "system_stats", "daily_emails"), { count: 0 });
             }}
             className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs hover:scale-105 transition-transform"
           >
              Reset Counters Now
           </button>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminDashboard;