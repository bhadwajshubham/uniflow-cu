import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext'; // Tera Old Context import
import { db, auth } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  User, 
  Phone, 
  BookOpen, 
  Layers, 
  MapPin, 
  LogOut, 
  ShieldCheck, 
  CheckCircle,
  Hash,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        // Hamesha Fresh Data laayenge Firestore se
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          // Fallback agar DB mein data nahi hai par Auth mein hai
          setProfile({
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL
          });
        }
      } catch (err) {
        console.error("Profile Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="animate-pulse text-zinc-500 font-bold">Loading Profile...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-20 pb-24 px-4">
      <div className="max-w-md mx-auto">
        
        {/* 1. HEADER CARD (Photo & Name) */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 mb-6 relative">
          {/* Gradient Banner */}
          <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
            <div className="absolute inset-0 bg-black/10" />
          </div>

          {/* Profile Photo - Half Overlapping */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2">
            <div className="w-28 h-28 bg-white dark:bg-zinc-900 rounded-full p-1.5 shadow-2xl">
              <img 
                src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName || 'User'}&background=random`} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover border-2 border-zinc-100 dark:border-zinc-800"
              />
            </div>
          </div>

          <div className="pt-16 pb-8 px-6 text-center mt-2">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-1">
              {profile?.displayName || "Student Name"}
            </h2>
            <p className="text-zinc-500 font-medium text-sm mb-4">{user?.email}</p>
            
            {/* Status Badges */}
            <div className="flex justify-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center border border-green-200 dark:border-green-800">
                <ShieldCheck className="w-3 h-3 mr-1" /> Verified
              </span>
              {profile?.termsAccepted && (
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center border border-indigo-200 dark:border-indigo-800">
                  <CheckCircle className="w-3 h-3 mr-1" /> Agreed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. DETAILS GRID (Read Only) */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Official Details</h3>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            
            {/* Roll No */}
            <div className="flex items-center p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase">Roll Number</p>
                <p className="text-zinc-900 dark:text-white font-bold">
                  {profile?.rollNo || <span className="text-red-400 italic">Not Set</span>}
                </p>
              </div>
            </div>

            {/* Branch */}
            <div className="flex items-center p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
              <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mr-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase">Branch</p>
                <p className="text-zinc-900 dark:text-white font-bold">
                  {profile?.branch || <span className="text-red-400 italic">Not Set</span>}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
              <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 mr-4">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase">Phone</p>
                <p className="text-zinc-900 dark:text-white font-bold">
                  {profile?.phone || <span className="text-red-400 italic">Not Set</span>}
                </p>
              </div>
            </div>

            {/* Extra Info Row (Sem, Group, Residency) */}
            <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800">
              <div className="p-4 text-center">
                <Layers className="w-5 h-5 text-zinc-400 mx-auto mb-1" />
                <p className="text-[10px] text-zinc-400 font-bold uppercase">Sem</p>
                <p className="text-zinc-900 dark:text-white font-bold text-sm">{profile?.semester || '-'}</p>
              </div>
              <div className="p-4 text-center">
                <Users className="w-5 h-5 text-zinc-400 mx-auto mb-1" />
                <p className="text-[10px] text-zinc-400 font-bold uppercase">Group</p>
                <p className="text-zinc-900 dark:text-white font-bold text-sm">{profile?.group || '-'}</p>
              </div>
              <div className="p-4 text-center">
                <MapPin className="w-5 h-5 text-zinc-400 mx-auto mb-1" />
                <p className="text-[10px] text-zinc-400 font-bold uppercase">Stay</p>
                <p className="text-zinc-900 dark:text-white font-bold text-sm truncate px-1">
                   {profile?.residency === 'Day Scholar' ? 'Day' : 'Hostel'}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* 3. LOGOUT BUTTON */}
        <button 
          onClick={handleLogout}
          className="w-full mt-8 bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold py-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <LogOut className="w-5 h-5" /> Sign Out
        </button>

        <p className="text-center text-zinc-300 dark:text-zinc-700 text-[10px] font-bold uppercase tracking-widest mt-8 mb-4">
          UniFlow ID v2.0
        </p>
      </div>
    </div>
  );
};

export default UserProfile;