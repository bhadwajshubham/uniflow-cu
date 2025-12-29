import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, MapPin, Calendar, Clock, DollarSign, Image as ImageIcon, Users, ShieldAlert, Globe, GraduationCap, Layers } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

const EditEventModal = ({ isOpen, onClose, event, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', 
    date: '', 
    time: '', 
    location: '', 
    price: 0, 
    totalTickets: 0,
    description: '', 
    imageUrl: '', 
    category: 'Tech',
    allowedBranches: 'All', 
    whatsappLink: '', 
    isUniversityOnly: false,
    type: 'solo',      // 🟢 Restored Team Logic
    teamSize: 1        // 🟢 Restored Team Size
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        date: event.date || '',
        time: event.time || '',
        location: event.location || '',
        price: event.price || 0,
        totalTickets: event.totalTickets || 0,
        description: event.description || '',
        imageUrl: event.imageUrl || '',
        category: event.category || 'Tech',
        allowedBranches: event.allowedBranches || 'All',
        whatsappLink: event.whatsappLink || '',
        isUniversityOnly: event.isUniversityOnly || false,
        type: event.type || 'solo',
        teamSize: event.teamSize || 1
      });
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const priceNum = Number(formData.price);
    const ticketsNum = Number(formData.totalTickets);
    const teamSizeNum = Number(formData.teamSize);
    const whatsappClean = formData.whatsappLink.trim();

    // 🛡️ SECURITY: Strict Validation
    if (priceNum < 0 || ticketsNum < 1) {
      alert("Security Error: Invalid price or capacity.");
      setLoading(false);
      return;
    }

    if (formData.type === 'team' && teamSizeNum < 2) {
      alert("Logic Error: Team size must be at least 2.");
      setLoading(false);
      return;
    }

    if (whatsappClean && !/^https?:\/\//.test(whatsappClean)) {
      alert("Security Error: WhatsApp link must start with https://");
      setLoading(false);
      return;
    }

    try {
      const eventRef = doc(db, 'events', event.id);
      
      await updateDoc(eventRef, {
        ...formData,
        price: priceNum,
        totalTickets: ticketsNum,
        teamSize: formData.type === 'team' ? teamSizeNum : 1,
        whatsappLink: whatsappClean,
        updatedAt: serverTimestamp()
      });

      alert("✅ Configuration Synchronized!");
      if (onSuccess) onSuccess(); 
      onClose();
    } catch (error) {
      alert("Update Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-black/20 rounded-t-[2.5rem]">
          <div>
            <h2 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic">Modify Event</h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Live Update</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"><X className="h-5 w-5 text-zinc-500" /></button>
        </div>

        {/* Scrollable Form */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <form id="edit-form" onSubmit={handleUpdate} className="space-y-6">
            
            {/* Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Headline</label>
              <input name="title" value={formData.title} onChange={handleChange} className="w-full p-4 bg-zinc-100 dark:bg-black border-none rounded-2xl font-bold outline-none dark:text-white" required />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Date</label>
                 <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none" required />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Time</label>
                 <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full p-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none" required />
              </div>
            </div>

            {/* Location & Category */}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Location</label>
                 <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input name="location" value={formData.location} onChange={handleChange} className="w-full pl-12 p-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none" required />
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Category</label>
                 <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full pl-12 pr-4 p-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none appearance-none">
                        <option value="Tech">Tech</option><option value="Cultural">Cultural</option><option value="Sports">Sports</option><option value="Workshop">Workshop</option>
                    </select>
                 </div>
               </div>
            </div>

            {/* 🟢 RESTORED: TEAM PARTICIPATION LOGIC */}
            <div className="p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
                <label className="text-[10px] font-black uppercase text-zinc-400 mb-4 block tracking-widest text-center">Entry Structure</label>
                <div className="flex justify-center gap-6">
                   <label className="flex items-center gap-3 cursor-pointer group">
                     <input type="radio" name="type" value="solo" checked={formData.type === 'solo'} onChange={handleChange} className="w-5 h-5 text-indigo-600 border-zinc-300 dark:border-zinc-700 focus:ring-0" />
                     <span className="text-xs font-black uppercase dark:text-white group-hover:text-indigo-500">Individual</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer group">
                     <input type="radio" name="type" value="team" checked={formData.type === 'team'} onChange={handleChange} className="w-5 h-5 text-indigo-600 border-zinc-300 dark:border-zinc-700 focus:ring-0" />
                     <span className="text-xs font-black uppercase dark:text-white group-hover:text-indigo-500">Team</span>
                   </label>
                </div>
                {formData.type === 'team' && (
                  <div className="mt-6 flex items-center justify-between p-4 bg-white dark:bg-black rounded-2xl shadow-inner animate-in slide-in-from-top-2">
                    <span className="text-[10px] font-black uppercase text-zinc-400">Max Team Size:</span>
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-indigo-500" />
                      <input type="number" name="teamSize" min="2" max="10" value={formData.teamSize} onChange={handleChange} className="w-16 bg-transparent text-center font-black dark:text-white outline-none" />
                    </div>
                  </div>
                )}
            </div>

            {/* 🆕 UNIVERSITY ID & BRANCH RESTRICTION */}
            <div className="space-y-3">
               <div className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center gap-4 ${formData.isUniversityOnly ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black'}`}
                    onClick={() => setFormData(prev => ({...prev, isUniversityOnly: !prev.isUniversityOnly}))}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${formData.isUniversityOnly ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-400 bg-white'}`}>
                    {formData.isUniversityOnly && <ShieldAlert className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className={`text-xs font-black uppercase ${formData.isUniversityOnly ? 'text-indigo-700 dark:text-indigo-400' : 'text-zinc-500'}`}>Strict Mode: @chitkara Only</p>
                  </div>
               </div>

               <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <select name="allowedBranches" value={formData.allowedBranches} onChange={handleChange} className="w-full pl-12 pr-4 p-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none appearance-none">
                      <option value="All">Open for All Branches</option>
                      <option value="CSE/AI Only">CSE & CSE (AI) Only</option>
                  </select>
               </div>
            </div>

            {/* Price & Capacity */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Price (₹)</label>
                   <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full pl-12 p-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none" />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Total Slots</label>
                   <input type="number" name="totalTickets" value={formData.totalTickets} onChange={handleChange} className="w-full p-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none" />
                </div>
            </div>

            {/* 🟢 RESTORED: Image & WhatsApp Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Poster URL</label>
                 <div className="relative group">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="w-full pl-12 p-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none" placeholder="https://..." />
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">WhatsApp</label>
                 <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input name="whatsappLink" value={formData.whatsappLink} onChange={handleChange} className="w-full pl-12 p-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none" placeholder="https://..." />
                 </div>
               </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Description</label>
               <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-5 bg-zinc-100 dark:bg-black border-none rounded-2xl font-medium dark:text-zinc-400 outline-none h-32" />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex gap-4 rounded-b-[2.5rem]">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all">Cancel</button>
          <button type="submit" form="edit-form" disabled={loading} className="flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white bg-indigo-600 shadow-xl active:scale-95 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditEventModal;