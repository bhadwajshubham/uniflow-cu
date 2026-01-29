import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db, storage, auth } from '../../../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { 
  User, Phone, BookOpen, Hash, Camera, Edit2, Save, X, 
  Loader2, AlertCircle, FileText, CheckCircle, ShieldCheck, LogOut 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- STATES ---
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); 
  const [consenting, setConsenting] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState(null);
  
  // FORM STATE
  const [formData, setFormData] = useState({
    displayName: '', 
    phone: '', 
    rollNo: '', 
    branch: 'B.E. (CSE)', 
    customBranch: '', 
    semester: '1st', 
    group: '', 
    residency: 'Day Scholar'
  });
  
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);

  // 🔄 REAL-TIME SYNC (No Redirects Here!)
  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    setLoading(true);
    const userRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (!saving && !consenting) { 
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
    }, (err) => {
      console.error("Sync Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // ✅ INSTANT CONSENT HANDLER
  const handleAcceptTerms = async () => {
    setConsenting(true);
    try {
        const updatedProfile = { ...profile, termsAccepted: true };
        setProfile(updatedProfile); // Optimistic Update
        setSuccess("Terms Accepted! Welcome.");

        await setDoc(doc(db, 'users', user.uid), { termsAccepted: true }, { merge: true });

        setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
        setError("Could not accept terms. Try again.");
    } finally {
        setConsenting(false);
    }
  };

  // 💾 SAVE HANDLER
  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return; 
    setSaving(true); setError('');

    if (formData.phone.length !== 10) { setError("Phone number must be exactly 10 digits."); setSaving(false); return; }
    if (formData.rollNo.length < 5) { setError("Enter a valid Roll Number."); setSaving(false); return; }
    if (!formData.displayName.trim()) { setError("Name cannot be empty."); setSaving(false); return; }
    
    const finalBranch = formData.branch === 'Others' ? formData.customBranch.trim() : formData.branch;
    if (!finalBranch) { setError("Please specify your Branch/Course."); setSaving(false); return; }

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
        updatedAt: new Date(),
        termsAccepted: true 
      };

      setProfile(updatedData); 
      setIsEditing(false); 
      setSuccess("Profile Updated Successfully!"); 
      await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError("Update failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => { await signOut(auth); navigate('/login'); };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone' && !/^\d{0,10}$/.test(value)) return;
    if (name === 'rollNo' && !/^[a-zA-Z0-9]{0,15}$/.test(value)) return;
    setFormData({ ...formData, [name]: value }); setError('');
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 2 * 1024 * 1024) { setPhoto(file); setPreview(URL.createObjectURL(file)); }
    else if (file) setError("Max file size is 2MB");
  };

  // --- RENDER ---
  
  if (loading && !profile) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600"/></div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-20 pb-24 px-4">
      <div className="max-w-md mx-auto">

        {/* 🔴 CASE 1: TERMS NOT ACCEPTED -> SHOW CONSENT CARD (NO REDIRECT) */}
        {!profile?.termsAccepted ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-8 text-center border-2 border-indigo-100 dark:border-zinc-800 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Final Step!</h2>
                <p className="text-zinc-500 text-sm mb-6">
                    To access your profile, please accept the UniFlow Community Guidelines.
                </p>
                <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3 text-left p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">I agree to share my Name & Roll No with Organizers.</p>
                    </div>
                    <div className="flex items-start gap-3 text-left p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">I will follow university rules during events.</p>
                    </div>
                </div>
                <button 
                    onClick={handleAcceptTerms} 
                    disabled={consenting}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    {consenting ? <Loader2 className="animate-spin w-5 h-5"/> : "I Accept & Continue"}
                </button>
                <div className="mt-4 text-[10px] text-zinc-400">
                    Read our <a href="/terms" target="_blank" className="underline hover:text-indigo-500">Terms</a> & <a href="/privacy" target="_blank" className="underline hover:text-indigo-500">Privacy Policy</a>
                </div>
            </div>
        ) : (
            /* 🟢 CASE 2: TERMS ACCEPTED -> SHOW PROFILE */
            <>
                {/* HEADER & PHOTO */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 mb-6 relative">
                  <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
                     <button onClick={() => setIsEditing(!isEditing)} className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition z-10">
                        {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                     </button>
                  </div>
                  <div className="absolute top-16 left-1/2 -translate-x-1/2">
                     <div className="w-28 h-28 bg-white dark:bg-zinc-900 rounded-full p-1.5 shadow-2xl relative group">
                        <img src={preview || profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}`} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-zinc-100"/>
                        {isEditing && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer">
                            <Camera className="w-8 h-8 text-white" />
                            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                          </div>
                        )}
                     </div>
                  </div>
                  <div className="pt-16 pb-6 px-6 text-center mt-2">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white">{profile?.displayName || "Student Name"}</h2>
                    <p className="text-zinc-500 text-sm mb-3">{user?.email}</p>
                    <div className="flex justify-center gap-2 flex-wrap">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase flex items-center"><ShieldCheck className="w-3 h-3 mr-1" /> Verified</span>
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold uppercase flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Consent Given</span>
                    </div>
                  </div>
                </div>

                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm flex items-center font-bold"><AlertCircle className="w-4 h-4 mr-2"/>{error}</div>}
                {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-xl text-sm flex items-center font-bold"><CheckCircle className="w-4 h-4 mr-2"/>{success}</div>}

                {/* VIEW MODE */}
                {!isEditing ? (
                  <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
                     <div className="flex items-center p-4"><div className="w-10 h-10 rounded-full bg-blue-50 flex text-blue-600 justify-center items-center mr-4"><Hash className="w-5 h-5"/></div><div><p className="text-[10px] text-zinc-400 font-bold uppercase">Roll No</p><p className="font-bold text-gray-800">{profile?.rollNo || "Not Set"}</p></div></div>
                     <div className="flex items-center p-4"><div className="w-10 h-10 rounded-full bg-purple-50 flex text-purple-600 justify-center items-center mr-4"><BookOpen className="w-5 h-5"/></div><div><p className="text-[10px] text-zinc-400 font-bold uppercase">Branch</p><p className="font-bold text-gray-800">{profile?.branch || "Not Set"}</p></div></div>
                     <div className="flex items-center p-4"><div className="w-10 h-10 rounded-full bg-green-50 flex text-green-600 justify-center items-center mr-4"><Phone className="w-5 h-5"/></div><div><p className="text-[10px] text-zinc-400 font-bold uppercase">Phone</p><p className="font-bold text-gray-800">{profile?.phone || "Not Set"}</p></div></div>
                     <div className="grid grid-cols-3 divide-x divide-zinc-100">
                        <div className="p-4 text-center"><p className="text-[10px] text-zinc-400 font-bold uppercase">Sem</p><p className="font-bold text-sm">{profile?.semester}</p></div>
                        <div className="p-4 text-center"><p className="text-[10px] text-zinc-400 font-bold uppercase">Group</p><p className="font-bold text-sm">{profile?.group || "-"}</p></div>
                        <div className="p-4 text-center"><p className="text-[10px] text-zinc-400 font-bold uppercase">Stay</p><p className="font-bold text-xs mt-1">{profile?.residency}</p></div>
                     </div>
                  </div>
                ) : (
                  /* EDIT FORM */
                  <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg border border-zinc-200 p-6 space-y-4">
                    <div><label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Full Name</label><input name="displayName" value={formData.displayName} onChange={handleChange} className="w-full p-3 bg-zinc-50 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-indigo-500/50" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Phone</label><input name="phone" value={formData.phone} onChange={handleChange} placeholder="10 digits" className="w-full p-3 bg-zinc-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/50" /></div>
                      <div><label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Roll No</label><input name="rollNo" value={formData.rollNo} onChange={handleChange} className="w-full p-3 bg-zinc-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/50" /></div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Branch</label>
                      <select name="branch" value={formData.branch} onChange={handleChange} className="w-full p-3 bg-zinc-50 rounded-xl font-bold outline-none mb-2 appearance-none">
                        <option>B.E. (CSE)</option><option>B.E. (CSE-AI)</option><option>B.E. (ECE)</option><option>B.E. (ME)</option><option>Others</option>
                      </select>
                      {formData.branch === 'Others' && <input name="customBranch" value={formData.customBranch} onChange={handleChange} placeholder="Specify Branch" className="w-full p-3 bg-zinc-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/50"/>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Semester</label><select name="semester" value={formData.semester} onChange={handleChange} className="w-full p-3 bg-zinc-50 rounded-xl font-bold outline-none appearance-none">{['1st','2nd','3rd','4th','5th','6th','7th','8th'].map(n => <option key={n}>{n}</option>)}</select></div>
                      <div><label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Group</label><input name="group" value={formData.group} onChange={handleChange} placeholder="Optional" className="w-full p-3 bg-zinc-50 rounded-xl font-bold outline-none" /></div>
                    </div>
                    <div><label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Residency</label><select name="residency" value={formData.residency} onChange={handleChange} className="w-full p-3 bg-zinc-50 rounded-xl font-bold outline-none appearance-none"><option>Day Scholar</option><option>Hosteller (Boys)</option><option>Hosteller (Girls)</option></select></div>

                    <button type="submit" disabled={saving} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2">
                       {saving ? <Loader2 className="animate-spin w-5 h-5"/> : <><Save className="w-5 h-5"/> Save Details</>}
                    </button>
                  </form>
                )}

                <button onClick={handleLogout} className="w-full mt-6 bg-white border border-red-100 text-red-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-50">
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
            </>
        )}
      </div>
    </div>
  );
};

export default UserProfile;