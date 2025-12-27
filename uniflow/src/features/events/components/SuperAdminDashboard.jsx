import React, { useEffect, useState } from 'react';
import { 
  collection, getDocs, doc, updateDoc, query, limit, onSnapshot 
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { 
  Shield, Users, Mail, Search, Lock, Unlock, Zap, 
  BarChart3, RefreshCcw, UserCheck, Filter 
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'admin' | 'student'
  
  const [emailStats, setEmailStats] = useState({ sent: 0, limit: 500 });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // 🔒 LIMIT SET TO 20 TO SAVE DB READS
        const q = query(collection(db, 'users'), limit(20));
        const snapshot = await getDocs(q);
        const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };

    const unsub = onSnapshot(doc(db, "system_stats", "daily_emails"), (doc) => {
      if (doc.exists()) {
        setEmailStats({ sent: doc.data().count || 0, limit: 500 });
      }
    });

    fetchUsers();
    return () => unsub();
  }, []);

  // 🧹 CLIENT-SIDE FILTERING (Costs 0 Reads)
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pt-32 text-center text-zinc-500 font-bold">Accessing Command Center...</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pt-24 pb-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* 📊 SYSTEM STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <div className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl"><Mail className="w-5 h-5" /></div>
                <span className="text-[10px] font-black text-green-500 uppercase bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">Daily Quota</span>
              </div>
              <div className="text-3xl font-black">{emailStats.sent} <span className="text-zinc-300 text-lg">/ 500</span></div>
              <div className="text-xs text-zinc-500 font-bold uppercase mt-1">Emails Sent Today</div>
           </div>

           <div className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800 shadow-sm">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-2xl w-fit mb-4"><Users className="w-5 h-5" /></div>
              <div className="text-3xl font-black">{users.length}</div>
              <div className="text-xs text-zinc-500 font-bold uppercase mt-1">Users in Database</div>
           </div>

           <div className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800 shadow-sm">
              <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-2xl w-fit mb-4"><BarChart3 className="w-5 h-5" /></div>
              <div className="text-3xl font-black text-green-500">Safe</div>
              <div className="text-xs text-zinc-500 font-bold uppercase mt-1">DB Read Status</div>
           </div>
        </div>

        {/* 👮 USER MANAGEMENT */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200/50 dark:border-zinc-800 overflow-hidden shadow-sm">
          
          {/* Controls Bar */}
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/20 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-black flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-600" /> Management</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Role Filter Button Group */}
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                {['all', 'admin', 'student'].map((r) => (
                  <button 
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${roleFilter === r ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600' : 'text-zinc-400'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Find user..." 
                  className="pl-10 pr-4 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-600/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] font-black uppercase text-zinc-400 bg-zinc-50/30 dark:bg-black/30">
                <tr>
                  <th className="px-8 py-5">User Details</th>
                  <th className="px-8 py-5">Role</th>
                  <th className="px-8 py-5 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-indigo-900/5 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-zinc-900 dark:text-white">{user.displayName || 'Unnamed User'}</div>
                      <div className="text-xs text-zinc-500 font-medium">{user.email}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                        user.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       {user.role !== 'super_admin' && (
                         <div className="flex justify-end gap-2">
                            <button className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-red-600 rounded-xl transition-colors">
                              <Lock className="w-4 h-4" />
                            </button>
                         </div>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🛠️ RESET TOOL */}
        <div className="mt-8 p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-zinc-900 dark:text-white">Quota Manual Overide</h3>
            <p className="text-xs text-zinc-500">Only use this to reset daily email counter manually.</p>
          </div>
          <button 
            onClick={async () => {
              if(window.confirm("Reset email counter to 0?")) {
                await updateDoc(doc(db, "system_stats", "daily_emails"), { count: 0 });
              }
            }}
            className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs flex items-center gap-2"
          >
            <RefreshCcw className="w-3 h-3" /> Reset Daily Quota
          </button>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminDashboard;