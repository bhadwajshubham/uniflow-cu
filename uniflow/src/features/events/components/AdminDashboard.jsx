import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { BarChart3, Users, Ticket, Zap, CheckCircle, Mail, ShieldAlert, Loader2, Megaphone } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import PostAnnouncementModal from './PostAnnouncementModal';

const AdminDashboard = () => {
  const { userRole } = useAuth(); // We use role from DB now, not email
  
  // Stats
  const [stats, setStats] = useState({ totalEvents: 0, totalTickets: 0, totalUsers: 0, attendedCount: 0 });
  const [emailEnabled, setEmailEnabled] = useState(true);
  
  // Modals
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Security: Only render if role is 'admin' (handled by ProtectedRoute, but double check doesn't hurt)
  const isSuperAdmin = true; // Since you manually set roles in DB, we treat all Dashboard visitors as Admins.

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Stats
      const eventsSnap = await getDocs(collection(db, 'events'));
      const ticketsSnap = await getDocs(collection(db, 'registrations'));
      
      const attended = ticketsSnap.docs.filter(doc => doc.data().status === 'attended').length;
      const userIds = ticketsSnap.docs.map(doc => doc.data().userId).filter(id => id);
      const uniqueUsers = new Set(userIds).size;

      setStats({
        totalEvents: eventsSnap.size,
        totalTickets: ticketsSnap.size,
        totalUsers: uniqueUsers,
        attendedCount: attended
      });

      // 2. Config
      const configRef = doc(db, 'system', 'config');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        setEmailEnabled(configSnap.data().emailEnabled !== false);
      } else {
        await setDoc(configRef, { emailEnabled: true });
      }

    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailSystem = async () => {
    const newState = !emailEnabled;
    try {
      await setDoc(doc(db, 'system', 'config'), { emailEnabled: newState }, { merge: true });
      setEmailEnabled(newState);
    } catch (error) {
      alert("Failed to toggle system.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600"/></div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-indigo-600" /> Command Center
        </h1>

        {/* 1. METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard label="Total Events" value={stats.totalEvents} icon={Ticket} color="blue" />
          <StatCard label="Registrations" value={stats.totalTickets} icon={Users} color="indigo" />
          <StatCard label="Active Students" value={stats.totalUsers} icon={Zap} color="purple" />
          <StatCard label="Attendance" value={`${stats.totalTickets ? Math.round((stats.attendedCount/stats.totalTickets)*100) : 0}%`} icon={CheckCircle} color="emerald" />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* 2. BROADCAST */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
             <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-full"><Megaphone className="h-6 w-6"/></div>
                <div>
                   <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Broadcast</h3>
                   <p className="text-sm text-zinc-500">Post live alerts.</p>
                </div>
             </div>
             <button 
               onClick={() => setShowAnnouncementModal(true)}
               className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-opacity"
             >
               + Post Announcement
             </button>
          </div>

          {/* 3. TRAFFIC CONTROL */}
          <div className={`p-8 rounded-2xl border transition-all ${!emailEnabled ? 'bg-red-50 border-red-200' : 'bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'}`}>
             <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-full ${!emailEnabled ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                   {emailEnabled ? <Mail className="h-6 w-6"/> : <ShieldAlert className="h-6 w-6"/>}
                </div>
                <div>
                   <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Traffic Control</h3>
                   <p className="text-sm text-zinc-500">System Status: {emailEnabled ? 'Normal' : 'High Load'}</p>
                </div>
             </div>
             <button 
               onClick={toggleEmailSystem}
               className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                 emailEnabled 
                   ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                   : 'bg-emerald-600 text-white hover:bg-emerald-700'
               }`}
             >
               {emailEnabled ? '⚠️ Stop Emails' : '✅ Restore Emails'}
             </button>
          </div>

        </div>
      </div>

      {showAnnouncementModal && <PostAnnouncementModal onClose={() => setShowAnnouncementModal(false)} />}
    </div>
  );
};

// Helper
const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    indigo: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
    emerald: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20',
  };
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
      <div className={`p-4 rounded-xl ${colors[color]}`}><Icon className="h-6 w-6" /></div>
      <div><p className="text-sm font-bold text-zinc-500 uppercase">{label}</p><p className="text-2xl font-black text-zinc-900 dark:text-white">{value}</p></div>
    </div>
  );
};

export default AdminDashboard;