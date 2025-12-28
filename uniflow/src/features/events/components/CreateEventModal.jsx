import React, { useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { X, Calendar, Clock, MapPin, Tag, Globe, GraduationCap, DollarSign, Users, AlertTriangle } from 'lucide-react';

const CreateEventModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', date: '', time: '', location: '', 
    category: 'Tech', price: '0', totalTickets: '100', 
    whatsappLink: '', allowedBranches: 'All' 
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const priceNum = Number(formData.price);
    const ticketsNum = Number(formData.totalTickets);

    // 🛡️ SECURITY CHECK 1: Negative Values
    if (priceNum < 0 || ticketsNum < 1) {
      alert("Security Error: Price cannot be negative and capacity must be at least 1.");
      setLoading(false);
      return;
    }

    // 🛡️ SECURITY CHECK 2: Time Travel Prevention
    const eventDateTime = new Date(`${formData.date}T${formData.time}`);
    const now = new Date();
    if (eventDateTime < now) {
      alert("Logic Error: You cannot schedule events in the past.");
      setLoading(false);
      return;
    }

    // 🛡️ SECURITY CHECK 3: DoS Prevention (String Limits)
    if (formData.description.length > 2000 || formData.title.length > 100) {
      alert("Security Error: Content exceeds maximum length limits.");
      setLoading(false);
      return;
    }

    try {
      // 🛡️ SECURITY CHECK 4: Payload Whitelisting (State Pollution Fix)
      // Instead of spreading ...formData, we explicitly pick allowed fields.
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        time: formData.time,
        location: formData.location.trim(),
        category: formData.category,
        price: priceNum,
        totalTickets: ticketsNum,
        imageUrl: '', // Reserved for future upload logic
        whatsappLink: formData.whatsappLink.trim(),
        allowedBranches: formData.allowedBranches,
        
        // System Enforced Fields (Cannot be overwritten by React DevTools)
        type: 'individual',
        ticketsSold: 0,
        organizerId: user.uid,
        organizerName: user.displayName || 'UniFlow Host',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'events'), payload);
      
      alert("✅ Event Deployed Securely!");
      onClose();
      // Optional: window.location.reload(); to see changes immediately
    } catch (err) { 
      alert("Deployment Error: " + err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-black/40">
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase dark:text-white italic">Design Experience</h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1 tracking-[0.2em]">Secure Event Configuration</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all text-zinc-400"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Event Headline</label>
              <input required type="text" maxLength={100} placeholder="e.g. Hackfest 2025" className="w-full px-6 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-600" />
                <input required type="date" className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="relative group">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-600" />
                <input required type="time" className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Gate Restriction</label>
                 <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <select className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none appearance-none border-none focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.allowedBranches} onChange={e => setFormData({...formData, allowedBranches: e.target.value})}>
                      <option value="All">Open for All Branches</option>
                      <option value="CSE/AI Only">CSE & CSE (AI) Only</option>
                    </select>
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Price (₹)</label>
                 <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input required type="number" min="0" placeholder="0" className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Capacity</label>
                 <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input required type="number" min="1" placeholder="100" className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.totalTickets} onChange={e => setFormData({...formData, totalTickets: e.target.value})} />
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Squad Link</label>
                 <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input type="url" placeholder="WhatsApp URL" className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.whatsappLink} onChange={e => setFormData({...formData, whatsappLink: e.target.value})} />
                 </div>
               </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Venue</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input required type="text" maxLength={100} placeholder="Location" className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Description (Max 2000 chars)</label>
                <textarea required rows="4" maxLength={2000} placeholder="Craft your event story..." className="w-full px-6 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-medium dark:text-zinc-300 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <p className="text-[9px] text-right font-bold text-zinc-400">{formData.description.length} / 2000</p>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
            {loading ? 'SECURING...' : 'DEPLOY TO CAMPUS'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;