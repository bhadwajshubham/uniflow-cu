import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { auth } from '../../../lib/firebase';
import { signOut } from 'firebase/auth';

import { db, storage } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import {
  User,
  Users,
  Phone,
  Hash,
  BookOpen,
  Layers,
  MapPin,
  Camera,
  Save,
  Loader2,
  AlertCircle,
  LogOut
} from 'lucide-react';

const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  // Fetch user data
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (formData.phone.length !== 10) {
      setError('Phone number must be 10 digits.');
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

      await setDoc(
        doc(db, 'users', user.uid),
        {
          ...formData,
          photoURL: finalPhotoURL,
          email: user.email,
          isProfileComplete: true,
          updatedAt: new Date()
        },
        { merge: true }
      );

      setSuccess('Profile updated successfully!');
      setExistingPhoto(finalPhotoURL);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update profile. ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 🔴 LOGOUT (ONLY NEW FEATURE)
  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center pt-20">
        <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white">
            Edit Profile
          </h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">
            Keep your ID card details updated
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-bold text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 font-bold text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Photo */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-zinc-100 dark:border-zinc-800 shadow-lg">
                <img
                  src={
                    preview ||
                    existingPhoto ||
                    `https://ui-avatars.com/api/?name=${user.displayName}`
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* FORM FIELDS — UNCHANGED */}
          {/* (Your entire existing grid stays exactly the same) */}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-5 h-5" /> Save Changes</>}
          </button>
        </form>

        {/* 🔴 LOGOUT BUTTON */}
        <button
          onClick={handleLogout}
          className="mt-6 w-full py-3 border border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>

      </div>
    </div>
  );
};

export default UserProfile;
