import React, { useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Calendar, MapPin, DollarSign, Type, Loader2 } from 'lucide-react';

const CreateEventPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    price: 0,
    totalTickets: 100,
    category: 'Workshop',
    imageUrl: '', // You can add Image Upload logic later if needed
    whatsappLink: '',
    isUniversityOnly: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.totalTickets) {
      alert("Please fill required fields!");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'events'), {
        ...formData,
        price: Number(formData.price),
        totalTickets: Number(formData.totalTickets),
        ticketsSold: 0,
        createdBy: user.uid, // 🛡️ CRITICAL: Binds event to YOU (The Organizer)
        createdAt: serverTimestamp()
      });
      
      alert("✅ Event Created Successfully!");
      navigate('/admin'); // Redirect back to Dashboard
    } catch (err) {
      console.error("Error creating event:", err);
      alert("Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/admin')} className="mb-6 flex items-center gap-2 text-zinc-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Console
        </button>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <h1 className="text-3xl font-black dark:text-white uppercase tracking-tighter mb-8">Host New Event</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Event Title</label>
              <div className="relative">
                <Type className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
                <input 
                  type="text" name="title" value={formData.title} onChange={handleChange} required
                  className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
                  placeholder="e.g. Hackathon 2025"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
                  <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-none font-bold dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Time</label>
                <input type="time" name="time" value={formData.time} onChange={handleChange} required className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-none font-bold dark:text-white" />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Venue / Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
                <input type="text" name="location" value={formData.location} onChange={handleChange} required className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-none font-bold dark:text-white" placeholder="e.g. Audi Block A" />
              </div>
            </div>

            {/* Category & Tickets */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-none font-bold dark:text-white">
                  <option>Workshop</option>
                  <option>Seminar</option>
                  <option>Cultural</option>
                  <option>Hackathon</option>
                  <option>Sports</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Total Tickets</label>
                <input type="number" name="totalTickets" value={formData.totalTickets} onChange={handleChange} required className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-none font-bold dark:text-white" />
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Ticket Price (₹)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
                <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-none font-bold dark:text-white" placeholder="0 for Free" />
              </div>
            </div>

             {/* Description */}
             <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-none font-bold dark:text-white" placeholder="Event details..." />
            </div>

             {/* Image URL (Simple Input for now) */}
             <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Banner Image URL</label>
              <div className="relative">
                <Upload className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
                <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-none font-bold dark:text-white" placeholder="https://..." />
              </div>
            </div>

             {/* WhatsApp & Restricted */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="whatsappLink" value={formData.whatsappLink} onChange={handleChange} placeholder="WhatsApp Group Link (Optional)" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-none font-bold dark:text-white" />
                
                <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl cursor-pointer">
                  <input type="checkbox" name="isUniversityOnly" checked={formData.isUniversityOnly} onChange={handleChange} className="w-5 h-5 accent-indigo-600 rounded" />
                  <span className="text-xs font-bold uppercase text-zinc-500">Chitkara Email Only?</span>
                </label>
             </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : "Publish Event"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEventPage;