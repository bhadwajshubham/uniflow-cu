import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, MapPin, Calendar, Clock, DollarSign, Type, Image as ImageIcon, Users, ShieldAlert, Building2, Globe, GraduationCap } from 'lucide-react';
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
    type: 'solo',
    teamSize: 1,
    category: 'General',
    allowedBranches: 'All',
    whatsappLink: ''
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
        type: event.type || 'solo',
        teamSize: event.teamSize || 1,
        category: event.category || 'General',
        allowedBranches: event.allowedBranches || 'All',
        whatsappLink: event.whatsappLink || ''
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

    // 🛡️ SECURITY PATCH: Prevent negative values during edit
    const priceNum = Number(formData.price);
    const ticketsNum = Number(formData.totalTickets);

    if (priceNum < 0 || ticketsNum < 1) {
      alert("Security Error: Invalid price or ticket count detected.");
      setLoading(false);
      return;
    }

    try {
      const eventRef = doc(db, 'events', event.id);
      
      await updateDoc(eventRef, {
        ...formData,
        price: priceNum,
        totalTickets: ticketsNum,
        teamSize: formData.type === 'team' ? Number(formData.teamSize) : 1,
        updatedAt: serverTimestamp()
      });

      alert("✅ Configuration Synchronized!");
      if (onSuccess) onSuccess(); 
      onClose();
    } catch (error) {
      console.error("Update Error:", error);
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
            <h2 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic leading-none">Modify Experience</h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Live configuration update</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <form id="edit-form" onSubmit={handleUpdate} className="space-y-6">
            
            {/* Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Headline</label>
              <input name="title" value={formData.title} onChange={handleChange} className="w-full p-4 bg-zinc-100 dark:bg-black border-none rounded-2xl font-bold outline-none dark:text-white focus:ring-2 focus:ring-indigo-500/20" required />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Date</label>
                <div className="relative group">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-500" />
                   <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full pl-12 p-4 bg-zinc-100 dark:bg-black border-none rounded-2xl font-bold outline-none dark:text-white" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Time</label>
                <div className="relative group">
                   <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-500" />
                   <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full pl-12 p-4 bg-zinc-100 dark:bg-black border-none rounded-2xl font-bold outline-none dark:text-white" required />
                </div>
              </div>
            </div>

            {/* Location & Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Venue</label>
                 <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input name="location" value={formData.location} onChange={handleChange} className="w-full pl-12 p-4 bg-zinc-100 dark:bg-black border-none rounded-2xl font-bold outline-none dark:text-white" required />
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Target Branch</label>
                 <select name="allowedBranches" value={formData.allowedBranches} onChange={handleChange} className="w-full p-4 bg-zinc-100 dark:bg-black border-none rounded-2xl font-bold dark:text-white appearance-none outline-none">
                    <option value="All">All Branches</option>
                    <option value="CSE/AI Only">CSE & CSE (AI) Only</option>
                 </select>
               </div>
            </div>

            {/* Participation Mode */}
            <div className="p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
                <label className="text-[10px] font-black uppercase text-zinc-400 mb-4 block tracking-widest text-center">Entry Structure</label>
                <div className="flex justify-center gap-6">
                   <label className="flex items-center gap-3 cursor-pointer group">
                     <input type="radio" name="type" value="solo" checked={formData.type === 'solo'} onChange={handleChange} className="w-5 h-5 text-indigo-600 border-zinc-300 dark:border-zinc-700 focus:ring-0" />
                     <span className="text-xs font-black uppercase dark:text-white group-hover:text-indigo-500">Individual</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer group">
                     <input type="radio" name="type" value="team" checked={formData.type === 'team'} onChange={handleChange} className="w-5 h-5 text-indigo-600 border-zinc-300 dark:border-zinc-700 focus:ring-0" />
                     <span className="text-xs font-black uppercase dark:text-white group-hover:text-indigo-500">Squad Entry</span>
                   </label>
                </div>
                {formData.type === 'team' && (
                  <div className="mt-6 flex items-center justify-between p-4 bg-white dark:bg-black rounded-2xl shadow-inner">
                    <span className="text-[10px] font-black uppercase text-zinc-400">Squad Limit:</span>
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-indigo-500" />
                      <input type="number" name="teamSize" min="2" max="10" value={formData.teamSize} onChange={handleChange} className="w-16 bg-transparent text-center font-black dark:text-white outline-none" />
                    </div>
                  </div>
                )}
            </div>

            {/* Financials & Capacity */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Entry Fee (₹)</label>
                  <div className="relative">
                     <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                     <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full pl-12 p-4 bg-zinc-100 dark:bg-black border-none rounded-2xl font-bold dark:text-white outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Total Slots</label>
                  <input type="number" name="totalTickets" value={formData.totalTickets} onChange={handleChange} className="w-full p-4 bg-zinc-100 dark:bg-black border-none rounded-2xl font-bold dark:text-white outline-none" />
                </div>
            </div>

            {/* Links & Assets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Poster URL</label>
                <div className="relative group">
                   <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                   <input name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="w-full pl-12 p-4 bg-zinc-100 dark:bg-black border-none rounded-2xl font-bold dark:text-white outline-none" placeholder="https://..." />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">WhatsApp Group</label>
                <div className="relative group">
                   <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                   <input name="whatsappLink" value={formData.whatsappLink} onChange={handleChange} className="w-full pl-12 p-4 bg-zinc-100 dark:bg-black border-none rounded-2xl font-bold dark:text-white outline-none" placeholder="https://..." />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Description</label>
               <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-5 bg-zinc-100 dark:bg-black border-none rounded-2xl font-medium dark:text-zinc-400 outline-none h-32 focus:ring-2 focus:ring-indigo-500/20" placeholder="Sync the vibes..." />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all">Abort Changes</button>
          <button type="submit" form="edit-form" disabled={loading} className="flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white bg-indigo-600 shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <><Save className="w-4 h-4" /> Deploy Updates</>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditEventModal;