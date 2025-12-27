import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { User, Mail, Shield, X, LogOut, Edit } from 'lucide-react';
// 👇 IMPORT THE MODAL
import EditProfileModal from './EditProfileModal';

const UserProfile = ({ isOpen, onClose }) => {
  const { user, profile, logout } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false); // 👇 STATE

  if (!isOpen || !user) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header Background */}
          <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Avatar Section */}
          <div className="px-6 relative -mt-12 mb-4 text-center">
            <div className="w-24 h-24 mx-auto rounded-full border-4 border-white dark:border-zinc-900 bg-zinc-200 flex items-center justify-center shadow-lg">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-zinc-400" />
              )}
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mt-3">
              {user.displayName || "Student"}
            </h2>
            <span className="inline-block px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-bold uppercase rounded-full tracking-wider mt-1">
              {profile?.role || "Student"}
            </span>
          </div>

          {/* Details */}
          <div className="px-6 pb-6 space-y-4">
            
            {/* 👇 EDIT BUTTON */}
            <button 
              onClick={() => setIsEditOpen(true)}
              className="w-full py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm"
            >
              <Edit className="w-4 h-4" /> Edit Profile
            </button>

            <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <Mail className="w-5 h-5 text-indigo-500" />
              <div className="overflow-hidden">
                <p className="text-xs text-zinc-400 uppercase font-bold">Email Address</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <Shield className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-zinc-400 uppercase font-bold">Account Status</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">Verified & Active</p>
              </div>
            </div>

            <button 
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full py-3 mt-4 flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 font-bold rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* 👇 RENDER EDIT MODAL */}
      <EditProfileModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
      />
    </>
  );
};

export default UserProfile;