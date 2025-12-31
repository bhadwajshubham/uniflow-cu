import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { X, User, Hash, Phone, GraduationCap, Save, Loader2, LogOut, Home, Camera } from 'lucide-react';
import { uploadImage } from '../../common/services/uploadService'; // 👈 Importing the new service

const UserProfile = ({ isOpen, onClose }) => {
  const { user, logout, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // To show selected image before uploading
  const [selectedFile, setSelectedFile] = useState(null); // To store the file for upload

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
            // Reset image states
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
  };

  // 📸 HANDLE FILE SELECTION
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB Limit
        alert("File size must be less than 5MB");
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
      alert("Roll Number must be exactly 10 digits.");
      setLoading(false);
      return;
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      alert("Phone Number must be exactly 10 digits.");
      setLoading(false);
      return;
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
        photoURL: finalPhotoURL, // Save the Cloudinary URL
        role: profile?.role || 'student',
        isProfileComplete: true,
        updatedAt: new Date()
      }, { merge: true });

      alert("✅ Profile Saved Successfully!");
      onClose();
      window.location.reload(); 
    } catch (err) {
      alert("Save Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 pb-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-black/20 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black tracking-tighter uppercase dark:text-white italic">Student Identity</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${profile?.role === 'super_admin' ? 'bg-red-100 text-red-600' : profile?.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-500'}`}>
                 {profile?.role || 'Student'}
               </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"><X className="w-5 h-5 dark:text-white" /></button>
        </div>

        <form onSubmit={handleSave} className="p-8 overflow-y-auto custom-scrollbar space-y-5">
          
          {/* 📸 IMAGE UPLOAD SECTION */}
          <div className="flex justify-center mb-6">
             <div className="relative group cursor-pointer">
               {/* Image Display */}
               <div className="w-24 h-24 rounded-full border-4 border-white dark:border-zinc-900 shadow-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                 {previewImage ? (
                   <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                 ) : user.photoURL ? (
                   <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-4xl font-black text-indigo-600">{formData.displayName?.[0] || 'U'}</span>
                 )}
               </div>

               {/* Hidden File Input */}
               <input 
                 type="file" 
                 id="profile-upload" 
                 accept="image/*" 
                 className="hidden" 
                 onChange={handleFileChange} 
               />

               {/* Overlay Icon */}
               <label htmlFor="profile-upload" className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                 <Camera className="w-8 h-8 text-white" />
               </label>
             </div>
             <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest absolute mt-28">Tap to Change</p>
          </div>

          <div className="space-y-1">
             <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Full Name</label>
             <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-600" />
                <input required type="text" className="w-full pl-12 p-4 bg-zinc-100 dark:bg-black border-none rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} />
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">University Roll No</label>
             <div className="relative group">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-600" />
                <input required type="text" pattern="\d{10}" maxLength={10} placeholder="10 Digit ID" className="w-full pl-12 p-4 bg-zinc-100 dark:bg-black border-none rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Branch</label>
               <div className="relative group">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-600" />
                  <select required className="w-full pl-10 pr-2 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-xs font-bold dark:text-white outline-none appearance-none"
                    value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})}>
                    <option value="">Select...</option>
                    <option value="B.E. (C.S.E.)">CSE</option>
                    <option value="B.E. (C.S.E. AI)">CSE (AI)</option>
                    <option value="B.E. (ECE)">ECE</option>
                    <option value="Other">Other</option>
                  </select>
               </div>
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Group</label>
               <input required type="text" placeholder="G1" className="w-full px-4 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl font-bold dark:text-white outline-none text-center"
                  value={formData.group} onChange={e => setFormData({...formData, group: e.target.value})} />
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Residency Status</label>
             <div className="relative group">
                <Home className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-600" />
                <select required className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl font-bold dark:text-white outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.residency} onChange={e => setFormData({...formData, residency: e.target.value})}>
                  <option value="">Select Status...</option>
                  <option value="Hosteller">Hosteller</option>
                  <option value="Day Scholar">Day Scholar</option>
                </select>
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Phone</label>
             <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-600" />
                <input required type="tel" pattern="\d{10}" maxLength={10} className="w-full pl-12 p-4 bg-zinc-100 dark:bg-black border-none rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
             </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4" /> SAVE PROFILE</>}
          </button>

          <button type="button" onClick={handleLogout} className="w-full py-4 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all flex items-center justify-center gap-2">
             <LogOut className="w-4 h-4" /> Sign Out
          </button>

        </form>
      </div>
    </div>
  );
};

export default UserProfile;