import React, { useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { X, Calendar, Clock, MapPin, Tag, Smartphone, Users, GraduationCap, Globe } from 'lucide-react';

const CreateEventModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'Tech',
    price: '0',
    totalTickets: '100',
    imageUrl: '',
    whatsappLink: '', // Optional Group Link
    allowedBranches: 'All', // Branch Lock Toggle
    type: 'individual'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'events'), {
        ...formData,
        price: Number(formData.price),
        totalTickets: Number(formData.totalTickets),
        ticketsSold: 0,
        organizerId: user.uid,
        organizerName: user.displayName,
        createdAt: serverTimestamp(),
      });
      onClose();
      // Optional: window.location.reload();
    } catch (err) {
      alert("Error Launching Experience: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-black/20">
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase dark:text-white italic">Experience Design</h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1 tracking-[0.2em]">Host your campus event</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all text-zinc-400"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Event Headline</label>
              <input required type="text" placeholder="e.g. Nexus Tech Summit" className="w-full px-6 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input required type="date" className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input required type="time" className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Gate Eligibility</label>
                 <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <select className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none appearance-none border-none focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.allowedBranches} onChange={e => setFormData({...formData, allowedBranches: e.target.value})}>
                      <option value="All">All University Branches</option>
                      <option value="CSE/AI Only">C.S.E & C.S.E (AI) ONLY</option>
                    </select>
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Squad Link (Optional)</label>
                 <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input type="url" placeholder="WhatsApp Group Link" className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.whatsappLink} onChange={e => setFormData({...formData, whatsappLink: e.target.value})} />
                 </div>
               </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 tracking-widest">Venue & Logic</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input required type="text" placeholder="Location" className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-bold dark:text-white outline-none"
                  value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
            </div>

            <textarea required rows="4" placeholder="Craft your event story..." className="w-full px-6 py-4 bg-zinc-100 dark:bg-black rounded-2xl font-medium dark:text-zinc-300 outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">
            {loading ? 'DEPLOYING ENGINE...' : 'DEPLOY TO CAMPUS'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;