import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { X, Save, Loader2, Calendar, MapPin, Clock, DollarSign, Type } from 'lucide-react';

const EditEventModal = ({ isOpen, onClose, eventData }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    price: '',
    totalTickets: ''
  });

  // Pre-fill data when modal opens
  useEffect(() => {
    if (eventData) {
      setFormData({
        title: eventData.title || '',
        description: eventData.description || '',
        date: eventData.date || '',
        time: eventData.time || '',
        location: eventData.location || '',
        price: eventData.price || 0,
        totalTickets: eventData.totalTickets || 0
      });
    }
  }, [eventData]);

  if (!isOpen || !eventData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventRef = doc(db, 'events', eventData.id);
      
      await updateDoc(eventRef, {
        ...formData,
        price: Number(formData.price),
        totalTickets: Number(formData.totalTickets),
        updatedAt: new Date()
      });

      alert("✅ Event Updated Successfully!");
      onClose();
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update event: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-[2rem]">
          <h2 className="text-xl font-black dark:text-white flex items-center gap-2">
            <Type className="w-5 h-5 text-indigo-500" /> Edit Event
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 dark:text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          
          {/* Title */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Event Title</label>
            <input required type="text" name="title" value={formData.title} onChange={handleChange}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input required type="date" name="date" value={formData.date} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input required type="time" name="time" value={formData.time} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input required type="text" name="location" value={formData.location} onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>

          {/* Price & Capacity */}
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Price (₹)</label>
                <input required type="number" name="price" value={formData.price} onChange={handleChange}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Total Tickets</label>
                <input required type="number" name="totalTickets" value={formData.totalTickets} onChange={handleChange}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
             </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Description</label>
            <textarea name="description" rows="4" value={formData.description} onChange={handleChange}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 font-medium text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-[2rem] flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleUpdate} disabled={loading} className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditEventModal;