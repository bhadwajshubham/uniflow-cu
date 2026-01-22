import React, { useState, useRef } from 'react';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { X, Calendar, Clock, MapPin, Globe, GraduationCap, DollarSign, Users, Layers, ShieldAlert, Loader2, Image as ImageIcon, UploadCloud, Trash2 } from 'lucide-react';

// ✅ CORRECT IMPORT PATH (Same feature folder)
import { uploadImage } from '../services/uploadService'; 

// 1. 🛡️ CLEAN STATE
const INITIAL_STATE = {
  title: '', 
  description: '', 
  date: '', 
  time: '', 
  location: '', 
  category: 'Tech', 
  price: '0', 
  totalTickets: '100', 
  whatsappLink: '', 
  allowedBranches: 'All',
  imageUrl: '',
  isUniversityOnly: false,
  type: 'solo',
  teamSize: 1
};

const CreateEventModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const fileInputRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];

  if (!isOpen) return null;

  // 🖱️ DRAG & DROP HANDLERS
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG).");
      return;
    }
    
    setImageUploading(true);
    try {
      const url = await uploadImage(file); // ☁️ Upload to Cloudinary
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      alert("Image upload failed. Please try again.");
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (imageUploading) {
      alert("Please wait for the image to finish uploading.");
      return;
    }
    setLoading(true);

    const priceNum = Number(formData.price);
    const ticketsNum = Number(formData.totalTickets);
    const teamSizeNum = Number(formData.teamSize);
    const titleClean = formData.title.trim();
    const whatsappClean = formData.whatsappLink.trim();

    // VALIDATION
    if (isNaN(priceNum) || isNaN(ticketsNum) || priceNum < 0 || ticketsNum < 1) {
      alert("Security Error: Invalid price or capacity.");
      setLoading(false); return;
    }
    if (formData.type === 'team' && teamSizeNum < 2) {
      alert("Logic Error: Team size must be at least 2.");
      setLoading(false); return;
    }
    const eventDateTime = new Date(`${formData.date}T${formData.time}`);
    if (eventDateTime < new Date()) {
      alert("Logic Error: Cannot schedule events in the past.");
      setLoading(false); return;
    }

    try {
      await addDoc(collection(db, 'events'), {
        ...formData,
        title: titleClean,
        description: formData.description.trim(),
        price: priceNum,
        totalTickets: ticketsNum,
        whatsappLink: whatsappClean,
        teamSize: formData.type === 'team' ? teamSizeNum : 1,
        ticketsSold: 0,
        organizerId: user.uid,
        organizerName: user.displayName || 'UniFlow Host',
        createdAt: serverTimestamp(),
      });
      
      alert("✅ Event Deployed Successfully!");
      setFormData(INITIAL_STATE);
      onClose();
    } catch (err) { 
      alert("Error: " + err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* 🎨 Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-white/80 dark:bg-black/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
               <Layers className="w-5 h-5" />
             </div>
             <div>
               <h2 className="text-xl font-black tracking-tighter uppercase dark:text-white">Event Studio</h2>
               <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Create & Inspire</p>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all text-zinc-400 hover:text-red-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <form id="create-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* 🖼️ DRAG & DROP POSTER UPLOAD */}
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Event Poster</label>
               
               <div 
                  className={`relative w-full h-64 rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden flex flex-col items-center justify-center group
                  ${dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black'}
                  ${formData.imageUrl ? 'border-solid border-none' : ''}`}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
               >
                  {imageUploading ? (
                     <div className="flex flex-col items-center gap-3 animate-pulse">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Uploading Visuals...</span>
                     </div>
                  ) : formData.imageUrl ? (
                     <>
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button type="button" onClick={removeImage} className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-105 transition-transform">
                              <Trash2 className="w-4 h-4" /> Remove
                           </button>
                        </div>
                     </>
                  ) : (
                     <div className="text-center p-6 cursor-pointer" onClick={() => fileInputRef.current.click()}>
                        <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4 group-hover:scale-110 transition-transform">
                           <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <h3 className="text-sm font-black text-zinc-700 dark:text-zinc-300">Drag poster here or <span className="text-indigo-500 underline">browse</span></h3>
                        <p className="text-[10px] text-zinc-400 mt-2 font-medium uppercase tracking-wide">Supports JPG, PNG (Max 5MB)</p>
                     </div>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
               </div>
            </div>

            {/* 📝 Title & Description */}
            <div className="space-y-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Headline</label>
                 <input required type="text" name="title" maxLength={100} placeholder="e.g. Hackfest 2025" 
                   className="w-full px-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl font-black text-lg dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                   value={formData.title} onChange={handleChange} />
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Description</label>
                 <textarea required name="description" rows="4" maxLength={2000} placeholder="Tell the story..." 
                   className="w-full px-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl font-medium text-sm dark:text-zinc-300 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                   value={formData.description} onChange={handleChange} />
               </div>
            </div>

            {/* 📅 Date & Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">When</label>
                 <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input required type="date" name="date" min={today} className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-black rounded-2xl font-bold text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.date} onChange={handleChange} />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">At</label>
                 <div className="relative group">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input required type="time" name="time" className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-black rounded-2xl font-bold text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.time} onChange={handleChange} />
                 </div>
              </div>
            </div>

            {/* 📍 Location & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Where</label>
                 <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input required type="text" name="location" placeholder="Auditorium" className="w-full pl-12 pr-4 p-4 bg-zinc-50 dark:bg-black rounded-2xl font-bold text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.location} onChange={handleChange} />
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Type</label>
                 <div className="relative group">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                    <select name="category" className="w-full pl-12 pr-4 p-4 bg-zinc-50 dark:bg-black rounded-2xl font-bold text-sm dark:text-white outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.category} onChange={handleChange}>
                      <option value="Tech">Tech</option><option value="Cultural">Cultural</option><option value="Sports">Sports</option><option value="Workshop">Workshop</option>
                    </select>
                 </div>
               </div>
            </div>

            {/* 👯 Team Config */}
            <div className="p-1 bg-zinc-100 dark:bg-zinc-900 rounded-[1.5rem] flex p-1">
                <button type="button" onClick={() => setFormData({...formData, type: 'solo'})}
                   className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${formData.type === 'solo' ? 'bg-white dark:bg-zinc-800 shadow-sm text-indigo-600' : 'text-zinc-400'}`}>
                   Solo
                </button>
                <button type="button" onClick={() => setFormData({...formData, type: 'team'})}
                   className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${formData.type === 'team' ? 'bg-white dark:bg-zinc-800 shadow-sm text-indigo-600' : 'text-zinc-400'}`}>
                   Team
                </button>
            </div>
            {formData.type === 'team' && (
               <div className="animate-in slide-in-from-top-2 p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Squad Size</span>
                  <div className="flex items-center gap-2 bg-white dark:bg-black rounded-xl px-2 py-1">
                     <Users className="w-3 h-3 text-indigo-500" />
                     <input type="number" name="teamSize" min="2" max="10" className="w-10 text-center font-bold text-sm outline-none bg-transparent dark:text-white"
                        value={formData.teamSize} onChange={handleChange} />
                  </div>
               </div>
            )}

            {/* 💰 Price & WhatsApp */}
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Entry Fee</label>
                    <div className="relative group">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-green-500 transition-colors" />
                        <input required type="number" name="price" min="0" className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-black rounded-2xl font-bold text-sm dark:text-white outline-none"
                        value={formData.price} onChange={handleChange} />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Group Link</label>
                    <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-green-500 transition-colors" />
                        <input name="whatsappLink" className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-black rounded-2xl font-bold text-sm dark:text-white outline-none"
                        placeholder="https://..." value={formData.whatsappLink} onChange={handleChange} />
                    </div>
                </div>
            </div>

            {/* 🛡️ Strict Mode */}
            <div className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${formData.isUniversityOnly ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'}`}
                onClick={() => setFormData(prev => ({...prev, isUniversityOnly: !prev.isUniversityOnly}))}>
                <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${formData.isUniversityOnly ? 'bg-indigo-600 text-white' : 'bg-zinc-200 text-zinc-400'}`}>
                      <ShieldAlert className="w-4 h-4" />
                   </div>
                   <div>
                      <p className="text-xs font-black uppercase dark:text-white">Strict Mode</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Only Chitkara Emails Allowed</p>
                   </div>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.isUniversityOnly ? 'bg-indigo-600' : 'bg-zinc-300'}`}>
                   <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${formData.isUniversityOnly ? 'translate-x-4' : ''}`}></div>
                </div>
            </div>

          </form>
        </div>

        {/* 🦶 Footer */}
        <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all">
             Dismiss
          </button>
          <button type="submit" form="create-form" disabled={loading || imageUploading} 
             className="flex-[2] py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none active:scale-95 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="animate-spin" /> : 'LAUNCH EVENT'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateEventModal;