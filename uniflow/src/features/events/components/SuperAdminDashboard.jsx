import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { 
  Shield, Users, Activity, Search, Trash2, 
  UserCheck, UserX, Lock, Unlock, Zap 
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'system'

  // Fetch All Users
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 👮‍♂️ POLICE ACTIONS
  const handlePromote = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    const actionName = newRole === 'admin' ? 'Promote' : 'Demote';
    
    if (window.confirm(`Are you sure you want to ${actionName} this user?`)) {
      try {
        await updateDoc(doc(db, 'users', userId), { role: newRole });
        // Update UI locally
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } catch (err) {
        alert("Failed to update role.");
      }
    }
  };

  const handleBan = async (userId, currentStatus) => {
    const newStatus = !currentStatus; // Toggle Ban
    const actionName = newStatus ? 'BAN' : 'UNBAN';
    
    if (window.confirm(`🚨 Are you sure you want to ${actionName} this user?`)) {
      try {
        await updateDoc(doc(db, 'users', userId), { isBanned: newStatus });
        setUsers(users.map(u => u.id === userId ? { ...u, isBanned: newStatus } : u));
      } catch (err) {
        alert("Failed to ban user.");
      }
    }
  };

  // Filter Users Search
  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="min-h-screen pt-24 text-center">Loading Command Center...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-wider">
                Super Admin
              </span>
            </div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <Shield className="w-8 h-8 text-indigo-600" /> Command Center
            </h1>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-4">
             <div className="px-4 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
                <div className="text-xs text-zinc-500 font-bold uppercase">Total Users</div>
                <div className="text-xl font-black">{users.length}</div>
             </div>
             <div className="px-4 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
                <div className="text-xs text-zinc-500 font-bold uppercase">Organizers</div>
                <div className="text-xl font-black text-indigo-600">
                  {users.filter(u => u.role === 'admin').length}
                </div>
             </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 w-fit mb-8">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            User Management
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'system' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            System Health
          </button>
        </div>

        {/* 👥 TAB 1: USERS */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            
            {/* Search Bar */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Search student email or name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* User List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase font-bold text-xs">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900 dark:text-white">{user.displayName || 'No Name'}</div>
                        <div className="text-zinc-500 text-xs">{user.email}</div>
                        <div className="text-zinc-400 text-[10px] font-mono mt-0.5">{user.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'super_admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold">
                            <Zap className="w-3 h-3" /> Owner
                          </span>
                        ) : user.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                            <Shield className="w-3 h-3" /> Organizer
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold">
                            <Users className="w-3 h-3" /> Student
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.isBanned ? (
                           <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">BANNED</span>
                        ) : (
                           <span className="text-green-600 text-xs font-bold">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {/* Don't let me ban myself */}
                        {user.role !== 'super_admin' && (
                          <>
                            {/* Promote Button */}
                            <button 
                              onClick={() => handlePromote(user.id, user.role)}
                              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 transition-colors"
                              title={user.role === 'admin' ? "Demote to Student" : "Promote to Organizer"}
                            >
                              {user.role === 'admin' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>

                            {/* Ban Button */}
                            <button 
                              onClick={() => handleBan(user.id, user.isBanned)}
                              className={`p-2 rounded-lg transition-colors ${
                                user.isBanned 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-red-100 hover:text-red-600'
                              }`}
                              title={user.isBanned ? "Unban User" : "Ban User"}
                            >
                              {user.isBanned ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-zinc-500">No users found matching "{searchTerm}"</div>
              )}
            </div>
          </div>
        )}

        {/* ⚙️ TAB 2: SYSTEM */}
        {activeTab === 'system' && (
          <div className="grid md:grid-cols-2 gap-6">
             <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-xl flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Emergency Lockdown</h3>
                <p className="text-zinc-500 text-sm mb-6">
                  Prevents any new logins or registrations. Use only if the platform is under attack.
                </p>
                <button className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-bold rounded-xl cursor-not-allowed border border-dashed border-zinc-300">
                   Disabled (Requires Backend)
                </button>
             </div>

             <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Pause Registrations</h3>
                <p className="text-zinc-500 text-sm mb-6">
                  Stops students from registering for any events. Useful during semester exams.
                </p>
                <button className="w-full py-3 bg-orange-50 text-orange-600 font-bold rounded-xl hover:bg-orange-100 transition-colors">
                   Pause All Events
                </button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SuperAdminDashboard;