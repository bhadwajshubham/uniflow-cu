import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, query, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { 
  Shield, Users, Mail, Search, Lock, Unlock, Zap, BarChart3 
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 📈 Stats State
  const [stats, setStats] = useState({
    emailsSentToday: 0, // We'll simulate this based on a 'system_stats' doc later
    totalReadsUsed: 0
  });

  const fetchUsers = async () => {
    try {
      // 💡 Optimization: Only fetch first 50 users to save Reads
      const q = query(collection(db, 'users'), limit(50));
      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
      
      // Simulate Daily Stats (In a real app, these come from a specific 'stats' doc)
      setStats({
        emailsSentToday: Math.floor(Math.random() * 120), // Placeholder logic
        totalReadsUsed: querySnapshot.size
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pt-24 pb-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* 📊 TOP MONITOR BAR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           {/* Email Monitor */}
           <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl"><Mail className="w-6 h-6" /></div>
                <span className="text-[10px] font-black text-green-500 uppercase">Live Quota</span>
              </div>
              <div className="text-2xl font-black">{stats.emailsSentToday} / 500</div>
              <div className="text-xs text-zinc-500 font-bold uppercase mt-1">Emails Sent Today</div>
              {/* Simple Progress Bar */}
              <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-indigo-600" style={{ width: `${(stats.emailsSentToday / 500) * 100}%` }}></div>
              </div>
           </div>

           {/* User Count */}
           <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-2xl w-fit mb-4"><Users className="w-6 h-6" /></div>
              <div className="text-2xl font-black">{users.length}</div>
              <div className="text-xs text-zinc-500 font-bold uppercase mt-1">Database Users</div>
           </div>

           {/* Read Efficiency */}
           <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-2xl w-fit mb-4"><BarChart3 className="w-6 h-6" /></div>
              <div className="text-2xl font-black">{stats.totalReadsUsed}</div>
              <div className="text-xs text-zinc-500 font-bold uppercase mt-1">Firestore Reads (This Session)</div>
           </div>
        </div>

        {/* 👮 USER POLICE SECTION */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-black flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-600" /> User Governance</h2>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search user..." 
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] font-black uppercase text-zinc-400 bg-zinc-50/50 dark:bg-black/50">
                <tr>
                  <th className="px-6 py-4">Identity</th>
                  <th className="px-6 py-4">Access Level</th>
                  <th className="px-6 py-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {users.filter(u => u.email.includes(searchTerm)).map(user => (
                  <tr key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold">{user.displayName}</div>
                      <div className="text-xs text-zinc-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== 'super_admin' && (
                        <button className="text-xs font-bold text-red-600 hover:underline">
                          {user.isBanned ? 'Unban' : 'Ban User'}
                        </button>
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