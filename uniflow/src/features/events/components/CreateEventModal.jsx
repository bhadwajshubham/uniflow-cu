import React, { useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { X, Calendar, Clock, MapPin, Globe, GraduationCap, DollarSign, Users, Layers, ShieldAlert, Loader2, Image as ImageIcon } from 'lucide-react';

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
  const [formData, setFormData] = useState(INITIAL_STATE);

  const today = new Date().toISOString().split('T')[0];

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const priceNum = Number(formData.price);
    const ticketsNum = Number(formData.totalTickets);
    const teamSizeNum = Number(formData.teamSize);
    const titleClean = formData.title.trim();
    const whatsappClean = formData.whatsappLink.trim();

    // 2. 🛡️ SECURITY: Strict Validation
    if (isNaN(priceNum) || isNaN(ticketsNum) || priceNum < 0 || ticketsNum < 1) {
      alert("Security Error: Invalid price or capacity.");
      setLoading(false);
      return;
    }

    if (formData.type === 'team' && teamSizeNum < 2) {
      alert("Logic Error: Team size must be at least 2.");
      setLoading(false);
      return;
    }

    const eventDateTime = new Date(`${formData.date}T${formData.time}`);
    if (eventDateTime < new Date()) {
      alert("Logic Error: Cannot schedule events in the past.");
      setLoading(false);
      return;
    }

    if (whatsappClean && !/^https?:\/\//.test(whatsappClean)) {
      alert("Security Error: WhatsApp link must start with https://");
      setLoading(false);
      return;
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
        
        // System Fields
        ticketsSold: 0,
        organizerId: user.uid,
        organizerName: user.displayName || 'UniFlow Host',
        createdAt: serverTimestamp(),
      });
      
      alert("✅ Event Deployed Successfully!");
      setFormData(INITIAL_STATE); // 3. 🛡️ RESET STATE
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-black/40 rounded-t-[3rem]">
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase dark:text-white italic">Design Experience</h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1 tracking-[0.2em]">Secure Configuration</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all text-zinc-400"><X /></button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          <form id="create-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Headline</label>
              <input required type="text" name="title" maxLength={100} placeholder="e.g. Hackfest 2025" className="w-full px-6 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none"
                value={formData.title} onChange={handleChange} />
            </div>

            {/* Date Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Date</label>
                 <input required type="date" name="date" min={today} className="w-full pl-6 pr-4 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none"
                   value={formData.date} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Time</label>
                 <input required type="time" name="time" className="w-full pl-6 pr-4 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none"
                   value={formData.time} onChange={handleChange} />
              </div>
            </div>

            {/* Location & Category */}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Venue</label>
                 <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input required type="text" name="location" className="w-full pl-12 pr-4 p-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none"
                      value={formData.location} onChange={handleChange} />
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Category</label>
                 <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <select name="category" className="w-full pl-12 pr-4 p-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none appearance-none"
                      value={formData.category} onChange={handleChange}>
                      <option value="Tech">Tech</option><option value="Cultural">Cultural</option><option value="Sports">Sports</option><option value="Workshop">Workshop</option>
                    </select>
                 </div>
               </div>
            </div>

            {/* 🟢 FULL TEAM LOGIC */}
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

            {/* 🆕 UNIVERSITY ID & BRANCH */}
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
                  <select name="allowedBranches" className="w-full pl-12 pr-4 p-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none appearance-none"
                    value={formData.allowedBranches} onChange={handleChange}>
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
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input required type="number" name="price" min="0" className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none"
                      value={formData.price} onChange={handleChange} />
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Total Slots</label>
                 <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input required type="number" name="totalTickets" min="1" className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none"
                      value={formData.totalTickets} onChange={handleChange} />
                 </div>
               </div>
            </div>

            {/* 🟢 RESTORED: Image & WhatsApp */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Poster URL</label>
                 <div className="relative group">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input name="imageUrl" className="w-full pl-12 p-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none" placeholder="https://..." 
                      value={formData.imageUrl} onChange={handleChange} />
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">WhatsApp</label>
                 <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input name="whatsappLink" className="w-full pl-12 p-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none" placeholder="https://..." 
                      value={formData.whatsappLink} onChange={handleChange} />
                 </div>
               </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Description</label>
               <textarea required name="description" rows="4" maxLength={2000} placeholder="Craft your event story..." className="w-full px-6 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-medium dark:text-zinc-300 outline-none resize-none"
                 value={formData.description} onChange={handleChange} />
               <p className="text-[9px] text-right font-bold text-zinc-400">{formData.description.length} / 2000</p>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex gap-4 rounded-b-[3rem]">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all">Cancel</button>
          <button type="submit" form="create-form" disabled={loading} className="flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white bg-indigo-600 shadow-xl active:scale-95 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : 'DEPLOY TO CAMPUS'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateEventModal;