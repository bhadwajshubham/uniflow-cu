import React, { useEffect, useState } from 'react';
import { 
  collection, doc, updateDoc, onSnapshot, setDoc 
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { 
  Shield, Users, Mail, Search, Zap, 
  UserMinus, UserPlus, ShieldAlert, ToggleLeft, ToggleRight, EyeOff 
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [systemStats, setSystemStats] = useState({ count: 0, isEmailActive: true });

  useEffect(() => {
    // 🔴 Handle Permissions Error gracefully
    const unsubUsers = onSnapshot(collection(db, 'users'), 
      (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("User list error:", error);
        setLoading(false);
      }
    );

    const unsubStats = onSnapshot(doc(db, "system_stats", "daily_emails"), (snapshot) => {
      if (snapshot.exists()) {
        setSystemStats(snapshot.data());
      }
    });

    return () => { unsubUsers(); unsubStats(); };
  }, []);

  // 🚀 TOGGLE EMAIL SERVICE (Now uses setDoc to prevent 'Not Found' errors)
  const toggleEmailService = async () => {
    try {
      const statsRef = doc(db, "system_stats", "daily_emails");
      const newState = !systemStats.isEmailActive;
      
      await setDoc(statsRef, { 
        isEmailActive: newState 
      }, { merge: true });
      
      alert(newState ? "✅ Email System Online" : "🛑 Email System Revoked (Quota Saved)");
    } catch (err) { 
      console.error(err);
      alert("Permission Denied: Check Firestore Rules."); 
    }
  };

  const updateUserRole = async (userId, newRole) => {
    if (!window.confirm(`Change user role to ${newRole}?`)) return;
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (err) { alert("Action Failed: Check Permissions."); }
  };

  if (loading) return <div className="min-h-screen pt-32 text-center font-black text-indigo-600">GOD MODE INITIALIZING...</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pt-24 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
           <h1 className="text-4xl font-black tracking-tighter dark:text-white uppercase italic">Command Center</h1>
           <div className="px-4 py-2 bg-red-600 text-white text-[10px] font-black rounded-full animate-pulse">SUPERUSER ACTIVE</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           {/* EMAIL TOGGLE CARD */}
           <div className={`p-8 rounded-[2.5rem] border shadow-2xl transition-all duration-500 ${systemStats.isEmailActive ? 'bg-white border-zinc-200' : 'bg-red-50 border-red-200'} dark:bg-zinc-900`}>
              <div className="flex justify-between items-center mb-6">
                <div className={`p-4 rounded-2xl ${systemStats.isEmailActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {systemStats.isEmailActive ? <Mail className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                </div>
                <button onClick={toggleEmailService} className="hover:scale-110 transition-transform">
                   {systemStats.isEmailActive ? <ToggleRight className="w-12 h-12 text-green-500" /> : <ToggleLeft className="w-12 h-12 text-red-400" />}
                </button>
              </div>
              <div className="text-4xl font-black dark:text-white">{systemStats.count || 0} <span className="text-sm text-zinc-400">/ 500</span></div>
              <p className="text-[10px] text-zinc-500 font-black uppercase mt-2 tracking-[0.2em]">
                {systemStats.isEmailActive ? 'Email Gateway: OPEN' : 'Email Gateway: REVOKED'}
              </p>
           </div>
           
           {/* TOTAL USERS CARD */}
           <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <Users className="w-8 h-8 text-indigo-600 mb-6" />
              <div className="text-4xl font-black dark:text-white">{users.length}</div>
              <p className="text-[10px] text-zinc-500 font-black uppercase mt-2 tracking-[0.2em]">Verified Campus Identities</p>
           </div>

           {/* SYSTEM STATUS */}
           <div className="p-8 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[2.5rem] shadow-xl">
              <Zap className="w-8 h-8 text-yellow-400 mb-6" />
              <div className="text-3xl font-black tracking-tighter uppercase italic">Operational</div>
              <p className="text-[10px] opacity-50 font-black uppercase mt-2 tracking-[0.2em]">Internal Latency: 14ms</p>
           </div>
        </div>

        {/* USER LIST */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
           <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="font-black text-xl dark:text-white uppercase tracking-tighter">Identity Management</h2>
              <input 
                type="text" 
                placeholder="Filter by name or email..." 
                className="px-6 py-3 bg-zinc-100 dark:bg-black border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-black/20 text-[10px] font-black uppercase text-zinc-400">
                 <tr>
                    <th className="px-8 py-5">User</th>
                    <th className="px-8 py-5">Role</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                 {users.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                   <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-indigo-900/5 transition-colors group">
                      <td className="px-8 py-6">
                         <div className="font-bold text-zinc-900 dark:text-white text-sm">{u.displayName}</div>
                         <div className="text-[10px] text-zinc-500 font-bold">{u.email}</div>
                      </td>
                      <td className="px-8 py-6">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                           u.role === 'super_admin' ? 'bg-red-100 text-red-600' : 
                           u.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-500'
                         }`}>
                            {u.role || 'student'}
                         </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         {u.role !== 'super_admin' && (
                           <div className="flex justify-end gap-2">
                             {u.role === 'admin' ? (
                               <button onClick={() => updateUserRole(u.id, 'student')} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase rounded-xl hover:bg-red-50 hover:text-red-600 transition-all">Revoke Admin</button>
                             ) : (
                               <button onClick={() => updateUserRole(u.id, 'admin')} className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-xl hover:bg-indigo-600 hover:text-white transition-all">Promote to Admin</button>
                             )}
                             <button onClick={() => updateUserRole(u.id, 'suspended')} className="p-2 text-zinc-300 hover:text-red-600 transition-colors"><ShieldAlert className="w-4 h-4"/></button>
                           </div>
                         )}
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;