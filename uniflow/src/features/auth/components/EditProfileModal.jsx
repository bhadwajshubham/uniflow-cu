import { useState, useEffect } from 'react';
import { X, User, Phone, Hash, BookOpen, GraduationCap, Home, Loader2, Building2, Lock } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { updateProfile, updatePassword } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase'; 
import { doc, setDoc, getDoc } from 'firebase/firestore';

const EditProfileModal = ({ onClose, isOpen }) => {
  // 🔥 FIX: Use 'user', not 'currentUser'
  const { user } = useAuth();
  
  // State for Saving
  const [saving, setSaving] = useState(false);
  
  // State for Loading Data
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    phone: '',
    rollNo: '',
    branch: '',
    semester: '',
    residence: 'Day Scholar',
    newPassword: '',
    confirmPassword: ''
  });

  if (!isOpen) return null;

  // 1. FETCH EXISTING DATA ON MOUNT
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(prev => ({
            ...prev,
            displayName: user.displayName || '', // Sync with Auth
            phone: data.phone || '',
            rollNo: data.rollNo || '',
            branch: data.branch || '',
            semester: data.semester || '',
            residence: data.residence || 'Day Scholar'
          }));
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setFetching(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.phone.length !== 10) {
      alert("Invalid Phone Number. Must be exactly 10 digits.");
      return;
    }

    setSaving(true);

    try {
      const promises = [];

      // Update Auth Name
      if (formData.displayName !== user.displayName) {
        promises.push(updateProfile(auth.currentUser, { displayName: formData.displayName }));
      }

      // Update Password
      if (formData.newPassword) {
        if (formData.newPassword.length < 6) throw new Error("Password too short.");
        if (formData.newPassword !== formData.confirmPassword) throw new Error("Passwords do not match.");
        promises.push(updatePassword(auth.currentUser, formData.newPassword));
      }

      // Save to Firestore
      const userRef = doc(db, 'users', user.uid);
      const userUpdate = setDoc(userRef, {
        phone: formData.phone,
        rollNo: formData.rollNo,
        branch: formData.branch,
        semester: formData.semester,
        residence: formData.residence,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      promises.push(userUpdate);

      await Promise.all(promises);
      
      alert("Profile updated successfully!");
      onClose();
      window.location.reload(); 

    } catch (error) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        alert("Security: Please Log Out and Log In again to change password.");
      } else {
        alert(error.message || "Failed to update profile.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Your Profile</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-zinc-500" /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar relative">
          
          {/* LOADER OVERLAY */}
          {fetching && (
            <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 z-10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          )}

          <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase">Full Name</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                <input required type="text" className="w-full pl-10 p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white"
                  value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} />
              </div>
            </div>

            {/* Phone & Roll No */}
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase">Phone No</label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                    <input 
                        required 
                        type="tel" 
                        placeholder="9876543210" 
                        maxLength={10}
                        className="w-full pl-10 p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white"
                        value={formData.phone} 
                        onChange={(e) => {
                            const re = /^[0-9\b]+$/;
                            if (e.target.value === '' || re.test(e.target.value)) {
                                setFormData({...formData, phone: e.target.value})
                            }
                        }} 
                    />
                  </div>
               </div>
               <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase">Roll No</label>
                  <div className="relative mt-1">
                    <Hash className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                    <input required type="text" placeholder="211099..." className="w-full pl-10 p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white"
                      value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} />
                  </div>
               </div>
            </div>

            {/* Branch & Semester */}
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase">Branch</label>
                  <div className="relative mt-1">
                    <BookOpen className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                    <input required type="text" placeholder="CSE" className="w-full pl-10 p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white"
                      value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} />
                  </div>
               </div>
               <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase">Semester</label>
                  <div className="relative mt-1">
                    <GraduationCap className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                    <select className="w-full pl-10 p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none appearance-none dark:text-white"
                      value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})}>
                        <option value="">Select</option>
                        {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
               </div>
            </div>

            {/* Residence Type */}
            <div>
               <label className="text-xs font-bold text-zinc-500 uppercase">Residence Type</label>
               <div className="grid grid-cols-2 gap-3 mt-1">
                  <button type="button" onClick={() => setFormData({...formData, residence: 'Day Scholar'})} 
                    className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.residence === 'Day Scholar' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}>
                    <Home className="h-4 w-4" /> Day Scholar
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, residence: 'Hosteler'})} 
                    className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.residence === 'Hosteler' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}>
                    <Building2 className="h-4 w-4" /> Hosteler
                  </button>
               </div>
            </div>

            {/* Password Section */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <label className="text-xs font-bold text-zinc-500 uppercase">Change Password (Optional)</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                <input type="password" placeholder="New Password" className="w-full pl-10 p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white mb-2"
                   value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} />
              </div>
              {formData.newPassword && (
                 <input type="password" placeholder="Confirm Password" className="w-full pl-3 p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white"
                   value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
              )}
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button type="submit" form="profile-form" disabled={saving || fetching} className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Profile'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditProfileModal;