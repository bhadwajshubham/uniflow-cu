import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { X, User, Hash, Phone, GraduationCap, Save, Loader2, LogOut, Home, Camera, Sparkles, Shield, QrCode } from 'lucide-react';

// ✅ IMPORT THE CLOUDINARY SERVICE
import { uploadImage } from '../../../lib/uploadService';

const UserProfile = ({ isOpen, onClose }) => {
  const { user, logout, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [formData, setFormData] = useState({
    displayName: '',
    rollNo: '',
    phone: '',
    branch: '',
    group: '',
    residency: ''
  });

  // Load data when modal opens
  useEffect(() => {
    if (user && isOpen) {
      const fetchProfile = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData({
              displayName: data.displayName || user.displayName || '',
              rollNo: data.rollNo || '',
              phone: data.phone || '',
              branch: data.branch || '',
              group: data.group || '',
              residency: data.residency || ''
            });
            setPreviewImage(null);
            setSelectedFile(null);
          } else {
            setFormData(prev => ({ ...prev, displayName: user.displayName || '' }));
          }
        } catch (err) {
          console.error("Profile Fetch Error:", err);
        }
      };
      fetchProfile();
    }
  }, [user, isOpen]);

  const handleLogout = async () => {
    onClose();
    await logout();
    window.location.href = '/login'; // Force redirect
  };

  // 📸 HANDLE FILE SELECTION
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Basic validation: 5MB limit and image type
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert("Please select a valid image file.");
        return;
      }
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file)); // Show local preview instantly
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (formData.rollNo && !/^\d{10}$/.test(formData.rollNo)) {
      alert("Roll Number must be exactly 10 digits."); setLoading(false); return;
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      alert("Phone Number must be exactly 10 digits."); setLoading(false); return;
    }

    try {
      let finalPhotoURL = user.photoURL;

      // ☁️ 1. UPLOAD IMAGE IF SELECTED
      if (selectedFile) {
        finalPhotoURL = await uploadImage(selectedFile);
      }

      // 2. SAVE TO FIRESTORE
      await setDoc(doc(db, 'users', user.uid), {
        ...formData,
        email: user.email,
        photoURL: finalPhotoURL,
        // Ensure role doesn't get overwritten if it exists in context profile
        role: profile?.role || 'student',
        isProfileComplete: true,
        updatedAt: new Date()
      }, { merge: true });

      alert("✅ Profile Updated Successfully!");
      onClose();
      // Optional: Reload to force Navbar update if context doesn't sync fast enough
      // window.location.reload(); 
    } catch (err) {
      alert("Save Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isOpen) return null;

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      
      {/* Main Modal Container - Glassmorphism style */}
      <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl w-full max-w-lg rounded-[2.5rem] border border-white/20 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative animate-in slide-in-from-bottom-8 duration-500">
        
        {/* 🎨 Decorative Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-900/30 dark:to-purple-900/30 pointer-events-none" />

        {/* Header Section with Close & Role */}
        <div className="relative p-6 flex justify-between items-start z-10">
          <div>
             <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Student Hub</span>
             </div>
             <h2 className="text-2xl font-black tracking-tight dark:text-white">My Identity</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 rounded-full transition-colors backdrop-blur-md">
            <X className="w-5 h-5 dark:text-white" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          <div className="px-6 pb-6 space-y-8">

            {/* 📸 HERO IMAGE UPLOAD SECTION */}
            <div className="flex flex-col items-center">
               <div className="relative group cursor-pointer">
                 {/* Glowing Ring Container */}
                 <div className={`w-28 h-28 rounded-full p-1 ${isAdmin ? 'bg-gradient-to-tr from-amber-400 to-orange-600' : 'bg-gradient-to-tr from-indigo-500 to-purple-600'} shadow-lg shadow-indigo-500/20`}>
                   <div className="w-full h-full rounded-full border-4 border-white dark:border-zinc-900 overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center relative">
                     {previewImage ? (
                       <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                     ) : user.photoURL ? (
                       <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                       <span className="text-4xl font-black text-indigo-300 dark:text-indigo-700">{formData.displayName?.[0] || 'U'}</span>
                     )}
                     
                     {/* Overlay Icon */}
                     <label htmlFor="profile-upload" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                       <Camera className="w-8 h-8 text-white drop-shadow-lg scale-90 group-hover:scale-100 transition-transform" />
                     </label>
                   </div>
                 </div>

                 {/* Hidden File Input */}
                 <input 
                   type="file" 
                   id="profile-upload" 
                   accept="image/*" 
                   className="hidden" 
                   onChange={handleFileChange} 
                 />
               </div>

               {/* Role Badge */}
               <div className={`mt-3 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border ${isAdmin ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800'}`}>
                 <Shield className="w-3 h-3" /> {profile?.role || 'Student Access'}
               </div>
            </div>

            {/* 🗂️ FORM INPUT GROUPS */}
            <div className="space-y-6">
                
                {/* Group 1: Academic Credentials */}
                <div className="bg-white/50 dark:bg-zinc-800/50 rounded-3xl p-5 border border-zinc-100 dark:border-zinc-700/50">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" /> Academic Credentials
                    </h3>
                    <div className="space-y-4">
                        <div className="relative group">
                           <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                           <input required type="text" placeholder="Full Name" className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                             value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative group">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input required type="text" pattern="\d{10}" maxLength={10} placeholder="Roll No." className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} />
                            </div>
                            <div className="relative group">
                                <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input required type="text" placeholder="Group (e.g. G1)" className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                value={formData.group} onChange={e => setFormData({...formData, group: e.target.value})} />
                            </div>
                        </div>
                        <div className="relative group">
                           <select required className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-bold dark:text-white outline-none appearance-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                             value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})}>
                             <option value="">Select Branch...</option>
                             <option value="B.E. (C.S.E.)">CSE</option>
                             <option value="B.E. (C.S.E. AI)">CSE (AI)</option>
                             <option value="B.E. (ECE)">ECE</option>
                             <option value="Other">Other</option>
                           </select>
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-zinc-400"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                           </div>
                        </div>
                    </div>
                </div>

                {/* Group 2: Personal Details */}
                <div className="bg-white/50 dark:bg-zinc-800/50 rounded-3xl p-5 border border-zinc-100 dark:border-zinc-700/50">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                        <Home className="w-4 h-4" /> Personal Details
                    </h3>
                    <div className="space-y-4">
                        <div className="relative group">
                           <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                           <input required type="tel" pattern="\d{10}" maxLength={10} placeholder="Phone Number" className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                             value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div className="relative group">
                            <Home className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                            <select required className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold dark:text-white outline-none appearance-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                value={formData.residency} onChange={e => setFormData({...formData, residency: e.target.value})}>
                                <option value="">Residency Status...</option>
                                <option value="Hosteller">Hosteller</option>
                                <option value="Day Scholar">Day Scholar</option>
                            </select>
                        </div>
                    </div>
                </div>

            </div>
          </div>
        </form>

        {/* 🦶 Footer Actions */}
        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex flex-col sm:flex-row gap-4 z-20">
          <button type="button" onClick={handleLogout} className="order-2 sm:order-1 flex-1 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest text-red-500 border-2 border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2 active:scale-95">
             <LogOut className="w-4 h-4" /> Sign Out
          </button>
          <button type="submit" disabled={loading} onClick={handleSave} className="order-1 sm:order-2 flex-[2] py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-5 h-5" /> Save Changes</>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserProfile;