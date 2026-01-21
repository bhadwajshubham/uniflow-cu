import React, { useState, useEffect } from 'react';
// Correct Import Path
import { useAuth } from '../../../context/AuthContext';
import { db, storage } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// 🟢 FIX: Added 'Users' to the import list below
import { User, Users, Mail, Phone, Hash, BookOpen, Layers, MapPin, Camera, Save, Loader2, AlertCircle } from 'lucide-react';

const UserProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    rollNo: '',
    branch: 'CSE',
    semester: '1st',
    group: '',
    residency: 'Day Scholar'
  });
  
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);

  // Fetch Data
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            displayName: data.displayName || user.displayName || '',
            phone: data.phone || '',
            rollNo: data.rollNo || '',
            branch: data.branch || 'CSE',
            semester: data.semester || '1st',
            group: data.group || '',
            residency: data.residency || 'Day Scholar'
          });
          setExistingPhoto(data.photoURL || user.photoURL);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Handle File Change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Save Function
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (formData.phone.length !== 10) {
      setError("Phone number must be 10 digits.");
      setSaving(false);
      return;
    }

    try {
      let finalPhotoURL = existingPhoto;

      if (photo) {
        const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
        await uploadBytes(storageRef, photo);
        finalPhotoURL = await getDownloadURL(storageRef);
      }

      await setDoc(doc(db, 'users', user.uid), {
        displayName: formData.displayName,
        phone: formData.phone,
        rollNo: formData.rollNo,
        branch: formData.branch,
        semester: formData.semester,
        group: formData.group,
        residency: formData.residency,
        photoURL: finalPhotoURL,
        email: user.email, 
        isProfileComplete: true,
        updatedAt: new Date(),
      }, { merge: true });

      setSuccess("Profile updated successfully!");
      setExistingPhoto(finalPhotoURL);
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error(err);
      setError("Failed to update profile. " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center pt-20"><Loader2 className="animate-spin w-8 h-8 text-indigo-600"/></div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-6">
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Edit Profile</h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">Keep your ID card details updated</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-bold text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 font-bold text-sm flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Photo */}
          <div className="flex flex-col items-center gap-4">
             <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-zinc-100 dark:border-zinc-800 shadow-lg">
                   <img src={preview || existingPhoto || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera className="w-6 h-6 text-white" />
                </div>
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
             </div>
             <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tap to change photo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Fields */}
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Full Name</label>
                <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                   <input name="displayName" value={formData.displayName} onChange={handleChange} className="w-full pl-12 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="John Doe" required />
                </div>
             </div>
             
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Phone (+91)</label>
                <div className="relative">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                   <input name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-12 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="9876543210" required />
                </div>
             </div>

             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Roll No</label>
                <div className="relative">
                   <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                   <input name="rollNo" value={formData.rollNo} onChange={handleChange} className="w-full pl-12 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="211099..." required />
                </div>
             </div>

             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Branch</label>
                <div className="relative">
                   <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                   <select name="branch" value={formData.branch} onChange={handleChange} className="w-full pl-12 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none">
                      <option>CSE</option><option>CSE (AI)</option><option>ECE</option><option>ME</option><option>BBA</option><option>Pharmacy</option>
                   </select>
                </div>
             </div>

             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Semester</label>
                <div className="relative">
                   <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                   <select name="semester" value={formData.semester} onChange={handleChange} className="w-full pl-12 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none">
                      <option>1st</option><option>2nd</option><option>3rd</option><option>4th</option><option>5th</option><option>6th</option><option>7th</option><option>8th</option>
                   </select>
                </div>
             </div>

             {/* 🟢 THIS WAS CAUSING THE CRASH */}
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Group (Optional)</label>
                <div className="relative">
                   {/* 'Users' is now correctly imported */}
                   <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                   <input name="group" value={formData.group} onChange={handleChange} className="w-full pl-12 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="G1, G2..." />
                </div>
             </div>
             
             <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Residency</label>
                <div className="relative">
                   <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                   <select name="residency" value={formData.residency} onChange={handleChange} className="w-full pl-12 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none">
                      <option>Day Scholar</option><option>Hosteller (Boys)</option><option>Hosteller (Girls)</option>
                   </select>
                </div>
             </div>
          </div>

          <button type="submit" disabled={saving} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-5 h-5" /> Save Changes</>}
          </button>

        </form>
      </div>
    </div>
  );
};

export default UserProfile;