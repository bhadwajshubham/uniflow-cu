import React, { useEffect, useState } from 'react';
import { 
  collection, getDocs, doc, updateDoc, query, limit, onSnapshot 
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { 
  Shield, Users, Mail, Search, Lock, Unlock, Zap, 
  BarChart3, RefreshCcw, Power, MailWarning 
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  
  // ⚡ SYSTEM CONTROLS STATE
  const [systemStats, setSystemStats] = useState({ 
    count: 0, 
    isEmailActive: true 
  });

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

    // Listen to System Controls & Stats
    const unsub = onSnapshot(doc(db, "system_stats", "daily_emails"), (doc) => {
      if (doc.exists()) {
        setSystemStats(doc.data());
      }
    });

    fetchUsers();
    return () => unsub();
  }, []);

  // 🖱️ Toggle Global Email Kill Switch
  const toggleEmailSystem = async () => {
    const newState = !systemStats.isEmailActive;
    try {
      await updateDoc(doc(db, "system_stats", "daily_emails"), {
        isEmailActive: newState
      });
    } catch (err) {
      alert("Failed to update system status");
    }
  };

  if (loading) return <div className="min-h-screen pt-32 text-center bg-[#FDFBF7] dark:bg-black">Loading God Mode...</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pt-24 pb-24 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* 📟 SYSTEM MONITORING */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           
           {/* EMAIL STATUS & KILL SWITCH */}
           <div className={`p-6 rounded-[2rem] border transition-all ${systemStats.isEmailActive ? 'bg-white border-zinc-200' : 'bg-red-50 border-red-200'} dark:bg-zinc-900`}>
              <div className="flex justify-between items-center mb-4">
                <div className={`p-3 rounded-2xl ${systemStats.isEmailActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                   {systemStats.isEmailActive ? <Mail className="w-5 h-5" /> : <MailWarning className="w-5 h-5" />}
                </div>
                <button 
                  onClick={toggleEmailSystem}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${systemStats.isEmailActive ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
                >
                  {systemStats.isEmailActive ? 'Stop Emails' : 'Enable Emails'}
                </button>
              </div>
              <div className="text-3xl font-black">{systemStats.count} <span className="text-zinc-300 text-lg">/ 500</span></div>
              <div className="text-xs text-zinc-500 font-bold uppercase mt-1">
                Emails: {systemStats.isEmailActive ? 'SYSTEM ACTIVE' : 'SYSTEM PAUSED'}
              </div>
           </div>

           <div className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 shadow-sm">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit mb-4"><Users className="w-5 h-5" /></div>
              <div className="text-3xl font-black">{users.length}</div>
              <div className="text-xs text-zinc-500 font-bold uppercase mt-1">Sampled Users</div>
           </div>

           <div className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 shadow-sm">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl w-fit mb-4"><BarChart3 className="w-5 h-5" /></div>
              <div className="text-3xl font-black text-green-500 flex items-center gap-2"><Zap className="w-6 h-6" /> Safe</div>
              <div className="text-xs text-zinc-500 font-bold uppercase mt-1">DB Efficiency Tier 1</div>
           </div>
        </div>

        {/* 👥 USER TABLE (Filtered for your view) */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 overflow-hidden shadow-sm">
           <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
              <h2 className="font-black text-xl">User Governance</h2>
              <div className="flex gap-2 bg-zinc-100 p-1 rounded-xl">
                 <button className="px-4 py-1.5 bg-white rounded-lg text-xs font-bold">All Users</button>
              </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-zinc-50 text-[10px] font-black uppercase text-zinc-400">
                   <tr>
                      <th className="px-8 py-4">User</th>
                      <th className="px-8 py-4">Role</th>
                      <th className="px-8 py-4 text-right">Moderation</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                   {users.map(user => (
                     <tr key={user.id} className="hover:bg-zinc-50/50">
                        <td className="px-8 py-4 font-bold text-sm">{user.email}</td>
                        <td className="px-8 py-4">
                           <span className="px-2 py-1 bg-zinc-100 rounded text-[10px] font-black uppercase">{user.role}</span>
                        </td>
                        <td className="px-8 py-4 text-right">
                           <button className="text-zinc-300 hover:text-red-600 transition-colors"><Lock className="w-4 h-4" /></button>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </div>

        {/* 🛠️ RESET QUOTA */}
        <div className="mt-8 p-6 bg-white border border-zinc-200 rounded-3xl flex items-center justify-between">
           <div>
              <p className="font-black">Daily Quota Manual Override</p>
              <p className="text-xs text-zinc-500">Resets email counter to 0 manually.</p>
           </div>
           <button 
             onClick={async () => {
               if(window.confirm("Reset count?")) await updateDoc(doc(db, "system_stats", "daily_emails"), { count: 0 });
             }}
             className="p-3 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors"
           >
              <RefreshCcw className="w-5 h-5" />
           </button>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminDashboard;