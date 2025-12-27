import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, MapPin, Calendar, Clock, DollarSign, Type, Image as ImageIcon } from 'lucide-react';
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
    imageUrl: ''
  });

  // Populate form when event data arrives
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
        imageUrl: event.imageUrl || ''
      });
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventRef = doc(db, 'events', event.id);
      
      // Update logic
      await updateDoc(eventRef, {
        ...formData,
        price: Number(formData.price),
        totalTickets: Number(formData.totalTickets),
        updatedAt: serverTimestamp()
      });

      alert("Event Updated Successfully!");
      if (onSuccess) onSuccess(); // Refresh parent data
      onClose();
    } catch (error) {
      console.error("Update Error:", error);
      alert("Failed to update event: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Type className="w-5 h-5 text-indigo-500" /> Edit Event
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="edit-form" onSubmit={handleUpdate} className="space-y-4">
            
            {/* Title */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase">Event Title</label>
              <input name="title" value={formData.title} onChange={handleChange} className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white" required />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Date</label>
                <div className="relative">
                   <Calendar className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                   <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full pl-10 p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white" required />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">Time</label>
                <div className="relative">
                   <Clock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                   <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full pl-10 p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white" required />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase">Location</label>
              <div className="relative">
                 <MapPin className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                 <input name="location" value={formData.location} onChange={handleChange} className="w-full pl-10 p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white" required />
              </div>
            </div>

            {/* Price & Tickets */}
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-xs font-bold text-zinc-500 uppercase">Price (₹)</label>
                 <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full pl-10 p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white" />
                 </div>
               </div>
               <div>
                 <label className="text-xs font-bold text-zinc-500 uppercase">Total Capacity</label>
                 <input type="number" name="totalTickets" value={formData.totalTickets} onChange={handleChange} className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white" />
               </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase">Poster URL</label>
              <div className="relative">
                 <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                 <input name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="w-full pl-10 p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white" placeholder="https://..." />
              </div>
            </div>

            {/* Description */}
            <div>
               <label className="text-xs font-bold text-zinc-500 uppercase">Description</label>
               <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white h-24" />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-900 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
          <button type="submit" form="edit-form" disabled={loading} className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditEventModal;