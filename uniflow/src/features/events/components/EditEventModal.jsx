import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

const EditEventModal = ({ isOpen, onClose, event, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});

  // Load event data when modal opens
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
        whatsappLink: event.whatsappLink || ''
      });
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        ...formData,
        price: Number(formData.price),
        totalTickets: Number(formData.totalTickets),
        updatedAt: serverTimestamp()
      });
      alert("Event Updated Successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Update Error:", error);
      alert("Failed to update event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Edit Event</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-500" /></button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase">Title</label>
            <input name="title" value={formData.title} onChange={handleChange} className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase">Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase">Time</label>
              <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white" />
            </div>
          </div>

          <div>
             <label className="text-xs font-bold text-zinc-500 uppercase">Location</label>
             <input name="location" value={formData.location} onChange={handleChange} className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white" />
          </div>

          <div>
             <label className="text-xs font-bold text-zinc-500 uppercase">Description</label>
             <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white h-24" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;