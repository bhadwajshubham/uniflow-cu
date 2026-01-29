import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db, storage, auth } from '../../../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { User, Phone, BookOpen, Hash, Camera, Edit2, Save, X, Loader2, Shield, CheckCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // 🔒 Ye humara LOCK hai
  
  // ✅ States for Checkboxes
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    displayName: '', phone: '', rollNo: '', branch: 'B.E. (CSE)', customBranch: '', semester: '1st', group: '', residency: 'Day Scholar'
  });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // 🔒 CRITICAL FIX: Agar hum save/accept kar rahe hain, toh DB update ko ignore karo
        // Taaki UI flicker na kare aur instant feel ho.
        if (!saving) { 
            setProfile(data);
            if (!isEditing) {
                const isStandard = ['B.E. (CSE)', 'B.E. (CSE-AI)', 'B.E. (ECE)', 'B.E. (ME)'].includes(data.branch);
                setFormData({
                    displayName: data.displayName || user.displayName || '',
                    phone: data.phone || '',
                    rollNo: data.rollNo || '',
                    branch: isStandard ? data.branch : 'Others',
                    customBranch: isStandard ? '' : data.branch,
                    semester: data.semester || '1st',
                    group: data.group || '',
                    residency: data.residency || 'Day Scholar'
                });
            }
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, saving, isEditing]); // Added dependencies

  // 🚀 SUPERSONIC SPEED HANDLER
  const handleAcceptTerms = async () => {
    if (!termsChecked || !privacyChecked) {
        setError("Please check both boxes to continue.");
        return;
    }

    // 🔒 LOCK ON: Stop listening to DB for a moment
    setSaving(true); 

    // ⚡ INSTANT UI SWITCH (No Waiting)
    setProfile(prev => ({ ...prev, termsAccepted: true }));
    setSuccess("Welcome!");

    try {
        // Background DB Update
        await setDoc(doc(db, 'users', user.uid), { 
            termsAccepted: true, 
            updatedAt: new Date() 
        }, { merge: true });
        
        // 🔓 LOCK OFF: 2 second baad DB listener wapis on karo
        setTimeout(() => setSaving(false), 2000);
        
    } catch (err) {
        console.error("Sync Error:", err);
        setSaving(false); // Error aaye to lock khol do
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return; 
    setSaving(true); setError('');

    if (formData.phone.length !== 10) { setError("Phone must be 10 digits."); setSaving(false); return; }
    if (formData.rollNo.length < 5) { setError("Invalid Roll No."); setSaving(false); return; }
    const finalBranch = formData.branch === 'Others' ? formData.customBranch.trim() : formData.branch;
    if (!finalBranch) { setError("Specify Branch."); setSaving(false); return; }

    try {
      let finalPhotoURL = preview || profile?.photoURL || user.photoURL;
      if (photo) {
        const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
        await uploadBytes(storageRef, photo);
        finalPhotoURL = await getDownloadURL(storageRef);
      }

      const updatedData = {
        displayName: formData.displayName.trim(),
        phone: formData.phone,
        rollNo: formData.rollNo.toUpperCase(),
        branch: finalBranch,
        semester: formData.semester,
        group: formData.group.trim().toUpperCase(),
        residency: formData.residency,
        photoURL: finalPhotoURL,
        isProfileComplete: true,
        updatedAt: new Date()
      };

      // ⚡ INSTANT UPDATE
      setProfile(prev => ({ ...prev, ...updatedData })); 
      setIsEditing(false); 
      setSuccess("Profile Updated!"); 

      await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });
      
      setTimeout(() => { setSuccess(''); setSaving(false); }, 2000);

    } catch (err) { setError("Update failed: " + err.message); setSaving(false); } 
  };

  const handleLogout = async () => { await signOut(auth); navigate('/login'); };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone' && !/^\d{0,10}$/.test(value)) return;
    setFormData({ ...formData, [name]: value }); setError('');
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setPhoto(file); setPreview(URL.createObjectURL(file)); }
  };
  
  if (loading && !profile) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600"/></div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-20 pb-24 px-4">
      <div className="max-w-md mx-auto">
        
        {/* 🔴 CONSENT UI (Faster Transition) */}
        {!profile?.termsAccepted ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-8 text-center border-2 border-indigo-100 dark:border-zinc-800 animate-in fade-in zoom-in duration-300">
                <Shield className="w-14 h-14 text-indigo-600 mx-auto mb-4" />
                <h2 className="text-2xl font-extrabold mb-2 dark:text-white">Consent Required</h2>
                <p className="text-zinc-500 text-sm mb-6">Please review and accept to continue.</p>
                
                <div className="text-left space-y-3 mb-6 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={termsChecked} onChange={e => setTermsChecked(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"/>
                        <span className="text-sm font-medium text-zinc-700 dark:text-gray-300">I agree to <a href="/terms" target="_blank" className="text-indigo-600 underline font-bold" onClick={e=>e.stopPropagation()}>Terms & Conditions</a></span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={privacyChecked} onChange={e => setPrivacyChecked(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"/>
                        <span className="text-sm font-medium text-zinc-700 dark:text-gray-300">I agree to <a href="/privacy" target="_blank" className="text-indigo-600 underline font-bold" onClick={e=>e.stopPropagation()}>Privacy Policy</a></span>
                    </label>
                </div>

                {error && <p className="text-red-500 text-xs font-bold mb-3">{error}</p>}

                <button 
                    onClick={handleAcceptTerms} 
                    disabled={!termsChecked || !privacyChecked} 
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
                >
                    <CheckCircle className="w-5 h-5" /> Accept & Continue
                </button>
            </div>
        ) : (
            /* 🟢 PROFILE UI */
            <>
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 mb-6 relative">
                  <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
                     <button onClick={() => setIsEditing(!isEditing)} className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition z-10">
                        {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                     </button>
                  </div>
                  <div className="absolute top-16 left-1/2 -translate-x-1/2">
                     <div className="w-28 h-28 bg-white dark:bg-zinc-900 rounded-full p-1.5 shadow-2xl relative group">
                        <img src={preview || profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}`} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-zinc-100"/>
                        {isEditing && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer"><Camera className="w-8 h-8 text-white" /><input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" /></div>}
                     </div>
                  </div>
                  <div className="pt-16 pb-6 px-6 text-center mt-2">
                    <h2 className="text-2xl font-black dark:text-white">{profile?.displayName || "Student Name"}</h2>
                    <div className="flex justify-center gap-2 mt-1">
                        {profile?.role === 'admin' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 rounded-full">ADMIN</span>}
                        {profile?.role === 'superadmin' && <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 rounded-full">SUPER ADMIN</span>}
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 rounded-full">STUDENT</span>
                    </div>
                  </div>
                </div>

                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm font-bold">{error}</div>}
                {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-xl text-sm font-bold">{success}</div>}

                {!isEditing ? (
                  <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-4">
                     <div className="flex items-center p-3 border-b dark:border-zinc-800"><Hash className="w-5 h-5 mr-3 text-blue-500"/><p className="font-bold dark:text-white">{profile?.rollNo || "Not Set"}</p></div>
                     <div className="flex items-center p-3 border-b dark:border-zinc-800"><BookOpen className="w-5 h-5 mr-3 text-purple-500"/><p className="font-bold dark:text-white">{profile?.branch || "Not Set"}</p></div>
                     <div className="flex items-center p-3"><Phone className="w-5 h-5 mr-3 text-green-500"/><p className="font-bold dark:text-white">{profile?.phone || "Not Set"}</p></div>
                     <div className="grid grid-cols-3 border-t dark:border-zinc-800 pt-3 mt-2">
                        <div className="text-center"><p className="text-xs text-gray-400">SEM</p><p className="font-bold dark:text-white">{profile?.semester}</p></div>
                        <div className="text-center border-l dark:border-zinc-800"><p className="text-xs text-gray-400">GROUP</p><p className="font-bold dark:text-white">{profile?.group || "-"}</p></div>
                        <div className="text-center border-l dark:border-zinc-800"><p className="text-xs text-gray-400">STAY</p><p className="font-bold dark:text-white">{profile?.residency}</p></div>
                     </div>
                  </div>
                ) : (
                  <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
                    <input name="displayName" value={formData.displayName} onChange={handleChange} placeholder="Full Name" className="w-full p-3 bg-zinc-50 text-zinc-900 rounded-xl font-bold" />
                    <div className="grid grid-cols-2 gap-4">
                      <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="w-full p-3 bg-zinc-50 text-zinc-900 rounded-xl font-bold" />
                      <input name="rollNo" value={formData.rollNo} onChange={handleChange} placeholder="Roll No" className="w-full p-3 bg-zinc-50 text-zinc-900 rounded-xl font-bold" />
                    </div>
                    <select name="branch" value={formData.branch} onChange={handleChange} className="w-full p-3 bg-zinc-50 text-zinc-900 rounded-xl font-bold"><option>B.E. (CSE)</option><option>B.E. (CSE-AI)</option><option>B.E. (ECE)</option><option>B.E. (ME)</option><option>Others</option></select>
                    {formData.branch === 'Others' && <input name="customBranch" value={formData.customBranch} onChange={handleChange} placeholder="Specify Branch" className="w-full p-3 bg-zinc-50 text-zinc-900 rounded-xl font-bold"/>}
                    
                    <div className="grid grid-cols-2 gap-4">
                       <select name="semester" value={formData.semester} onChange={handleChange} className="w-full p-3 bg-zinc-50 text-zinc-900 rounded-xl font-bold">{['1st','2nd','3rd','4th','5th','6th','7th','8th'].map(n=><option key={n}>{n}</option>)}</select>
                       <input name="group" value={formData.group} onChange={handleChange} placeholder="Group No" className="w-full p-3 bg-zinc-50 text-zinc-900 rounded-xl font-bold"/>
                    </div>
                    <select name="residency" value={formData.residency} onChange={handleChange} className="w-full p-3 bg-zinc-50 text-zinc-900 rounded-xl font-bold"><option>Day Scholar</option><option>Hosteller (Boys)</option><option>Hosteller (Girls)</option></select>

                    <button type="submit" disabled={saving} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase flex justify-center items-center gap-2">{saving ? <Loader2 className="animate-spin"/> : "Save Details"}</button>
                  </form>
                )}
                <button onClick={handleLogout} className="w-full mt-6 bg-white border border-red-100 text-red-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-50"><LogOut className="w-5 h-5" /> Sign Out</button>
            </>
        )}
      </div>
    </div>
  );
};
export default UserProfile;