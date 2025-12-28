import React, { useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { X, Calendar, MapPin, Clock, Tag, Users, Info, PlusCircle } from 'lucide-react';

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
    whatsappLink: '',
    eligibility: '',
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
      alert("Event launched successfully!");
      onClose();
    } catch (err) {
      alert("Error creating event: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-black/20">
          <div>
            <h2 className="text-2xl font-black tracking-tighter dark:text-white uppercase">Host New Event</h2>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Fill in the campus experience details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="h-6 w-6 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Event Title</label>
              <input required type="text" className="w-full px-5 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600/20 dark:text-white"
                placeholder="e.g. Annual Hackathon 2025" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Description</label>
              <textarea required rows="3" className="w-full px-5 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-600/20 dark:text-white"
                placeholder="What is this event about?" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Date</label>
                <input required type="date" className="w-full px-5 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold outline-none dark:text-white"
                  value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Time</label>
                <input required type="time" className="w-full px-5 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold outline-none dark:text-white"
                  value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Location / Venue</label>
                <input required type="text" className="w-full px-5 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold outline-none dark:text-white"
                  placeholder="e.g. Main Auditorium" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Category</label>
                <select className="w-full px-5 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold outline-none dark:text-white appearance-none"
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Tech">Technology</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                  <option value="Workshop">Workshop</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Price (₹)</label>
                <input required type="number" className="w-full px-5 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold outline-none dark:text-white"
                  placeholder="0 for Free" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Max Capacity</label>
                <input required type="number" className="w-full px-5 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold outline-none dark:text-white"
                  placeholder="e.g. 200" value={formData.totalTickets} onChange={e => setFormData({...formData, totalTickets: e.target.value})} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all">
            {loading ? 'DEPLOYING TO CAMPUS...' : 'LAUNCH EVENT'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;