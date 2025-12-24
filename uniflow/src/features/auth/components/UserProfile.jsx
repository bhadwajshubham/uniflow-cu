import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Shield, User, Mail, Edit } from 'lucide-react';
import EditProfileModal from './EditProfileModal'; // Import Modal

const UserProfile = () => {
  const { currentUser, userRole } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Profile Card */}
        <div className="flex-1 bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl relative">
          
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
            title="Edit Profile"
          >
            <Edit className="h-5 w-5" />
          </button>

          <h1 className="text-3xl font-bold mb-8 flex items-center gap-3 text-zinc-900 dark:text-white">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <User className="h-8 w-8 text-indigo-500" />
            </div>
            My Profile
          </h1>
          
          <div className="space-y-6">
            <div className="p-4 bg-zinc-50 dark:bg-black rounded-xl flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-sm">
                <User className="h-6 w-6 text-zinc-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Full Name</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{currentUser?.displayName || 'Student'}</p>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-black rounded-xl flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-sm">
                <Mail className="h-6 w-6 text-zinc-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email Account</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{currentUser?.email}</p>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-black rounded-xl flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-sm">
                <Shield className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Current Role</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-indigo-600 uppercase">{userRole}</p>
                  {userRole === 'admin' && (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">ORGANIZER</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel (Info) */}
        <div className="w-full md:w-80 space-y-6">
           <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl text-white shadow-lg">
              <h3 className="font-bold text-lg mb-2">Did you know?</h3>
              <p className="text-indigo-100 text-sm leading-relaxed">
                Your <b>Full Name</b> displayed here is exactly what will appear on your Certificates. 
                Make sure it matches your University ID card!
              </p>
           </div>

           <div className="bg-zinc-100 dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-zinc-900 dark:text-white mb-2">Account Status</h3>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Student
              </div>
           </div>
        </div>
      </div>

      {/* MODAL */}
      {isEditing && <EditProfileModal onClose={() => setIsEditing(false)} />}
    </div>
  );
};

export default UserProfile;