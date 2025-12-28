import React, { useEffect, useState } from 'react';
import { 
  collection, doc, updateDoc, onSnapshot, setDoc 
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { 
  Shield, Users, Mail, Search, Zap, BarChart3, 
  UserMinus, UserPlus, ShieldAlert, ToggleLeft, ToggleRight,
  EyeOff // 💡 MailOff ki jagah EyeOff ya XCircle use kar rahe hain compatibility ke liye
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [systemStats, setSystemStats] = useState({ count: 0, isEmailActive: true });

  useEffect(() => {
    // 🔴 LIVE USER LISTENER
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // 🔴 LIVE SYSTEM STATS LISTENER
    const unsubStats = onSnapshot(doc(db, "system_stats", "daily_emails"), (snapshot) => {
      if (snapshot.exists()) {
        setSystemStats(snapshot.data());
      } else {
        setDoc(doc(db, "system_stats", "daily_emails"), { count: 0, isEmailActive: true });
      }
    });

    return () => { unsubUsers(); unsubStats(); };
  }, []);

  // 🚀 STOP EMAIL SERVICE (Quota Saver)
  const toggleEmailService = async () => {
    try {
      const newState = !systemStats.isEmailActive;
      await updateDoc(doc(db, "system_stats", "daily_emails"), { 
        isEmailActive: newState 
      });
      alert(newState ? "Email Service Re-activated!" : "Email Service STOPPED to save quota.");
    } catch (err) { alert("Failed to toggle email system."); }
  };

  // 🚀 PROMOTE / REVOKE ACCESS
  const updateUserRole = async (userId, newRole) => {
    const confirmMsg = newRole === 'admin' 
      ? "Promote this student to Organizer/Admin?" 
      : "Demote this user to Student?";
    
    if (!window.confirm(confirmMsg)) return;

    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      alert(`User is now a ${newRole}.`);
    } catch (err) { alert("Action Failed: " + err.message); }
  };

  const suspendUser = async (userId) => {
    if (!window.confirm("BAN USER: This student will no longer be able to log in or register?")) return;
    try {
      await updateDoc(doc(db, 'users', userId), { role: 'suspended' });
      alert("User Suspended.");
    } catch (err) { alert("Failed to suspend."); }
  };

  if (loading) return <div className="min-h-screen pt-32 text-center font-black text-indigo-600 tracking-widest">SYNCHRONIZING SYSTEM CORE...</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pt-24 pb-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black mb-8 tracking-tighter dark:text-white uppercase italic">SuperAdmin Panel</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           {/* 📧 EMAIL QUOTA CONTROL */}
           <div className={`p-8 rounded-[2.5rem] border shadow-xl transition-all ${systemStats.isEmailActive ? 'bg-white border-zinc-200' : 'bg-red-50 border-red-200'} dark:bg-zinc-900`}>
              <div className="flex justify-between items-center mb-6">
                <div className={`p-4 rounded-2xl ${systemStats.isEmailActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {systemStats.isEmailActive ? <Mail className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                </div>
                <button onClick={toggleEmailService}>
                   {systemStats.isEmailActive ? <ToggleRight className="w-10 h-10 text-green-500" /> : <ToggleLeft className="w-10 h-10 text-red-500" />}
                </button>
              </div>
              <div className="text-3xl font-black dark:text-white">{systemStats.count} / 500</div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-widest">
                {systemStats.isEmailActive ? 'Service: ACTIVE' : 'Service: REVOKED (Stopped)'}
              </p>
           </div>
           
           <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-2xl w-fit mb-6"><Users className="w-6 h-6" /></div>
              <div className="text-3xl font-black dark:text-white">{users.length}</div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Total Verified Students</p>
           </div>

           <div className="p-8 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[2.5rem] shadow-xl">
              <div className="p-4 bg-indigo-500/20 rounded-2xl w-fit mb-6"><Zap className="w-6 h-6" /></div>
              <div className="text-3xl font-black tracking-tighter uppercase italic">Optimal</div>
              <p className="text-xs opacity-50 font-bold uppercase mt-1 tracking-widest">Firebase Realtime Sync</p>
           </div>
        </div>

        {/* 📋 USER GOVERNANCE TABLE */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
           <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-black/20">
              <h2 className="font-black text-xl tracking-tighter dark:text-white uppercase">User Rights Management</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 bg-white dark:bg-black border border-zinc-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-black uppercase text-zinc-400">
                   <tr>
                      <th className="px-8 py-5 tracking-widest">Identity</th>
                      <th className="px-8 py-5 tracking-widest">Permission</th>
                      <th className="px-8 py-5 text-right tracking-widest">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                   {users.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                     <tr key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-indigo-900/5 transition-colors">
                        <td className="px-8 py-5">
                           <div className="font-bold text-zinc-900 dark:text-white text-sm">{user.displayName || 'Unnamed'}</div>
                           <div className="text-xs text-zinc-500 font-medium">{user.email}</div>
                        </td>
                        <td className="px-8 py-5">
                           <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                             user.role === 'super_admin' ? 'bg-indigo-600 text-white' : 
                             user.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-500'
                           }`}>
                              {user.role || 'student'}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                           {user.role !== 'super_admin' && (
                             <>
                                {user.role === 'admin' ? (
                                  <button onClick={() => updateUserRole(user.id, 'student')} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg flex items-center gap-1 text-[10px] font-black uppercase">
                                    <UserMinus className="w-4 h-4" /> Revoke Admin
                                  </button>
                                ) : (
                                  <button onClick={() => updateUserRole(user.id, 'admin')} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1 text-[10px] font-black uppercase">
                                    <UserPlus className="w-4 h-4" /> Promote
                                  </button>
                                )}
                                <button onClick={() => suspendUser(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                   <ShieldAlert className="w-4 h-4" />
                                </button>
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