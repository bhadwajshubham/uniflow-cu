import React, { useState } from 'react';
import { X, Calendar, MapPin, DollarSign, Image as ImageIcon, Type, Ticket, Users, MessageCircle, Building2 } from 'lucide-react';
import { createEvent } from '../services/eventService'; 
import { useAuth } from '../../../context/AuthContext';

const CreateEventModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    price: 0,
    totalTickets: 100,
    description: '',
    imageUrl: '',
    category: 'General',
    // 👇 NEW FIELDS ADDED
    type: 'solo', // 'solo' or 'team'
    teamSize: 1,
    whatsappLink: '',
    allowedBranches: 'All' // 'All', 'CSE', 'ECE', etc.
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.title || !formData.date || !formData.location) {
        throw new Error("Please fill in all required fields.");
      }

      const eventPayload = {
        ...formData,
        price: Number(formData.price),
        totalTickets: Number(formData.totalTickets),
        teamSize: formData.type === 'team' ? Number(formData.teamSize) : 1,
        ticketsSold: 0,
        organizerId: user.uid,
        organizerName: user.displayName || 'Admin',
        createdAt: new Date()
      };

      await createEvent(eventPayload, user.uid);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Create New Event
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium text-center">{error}</div>}

          <form id="create-event-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Event Title</label>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input name="title" value={formData.title} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none" required placeholder="Event Name" />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Time</label>
                <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none" required />
              </div>
            </div>

            {/* Location & Branch */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input name="location" value={formData.location} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none" required placeholder="Venue" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Allowed Branches</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <select name="allowedBranches" value={formData.allowedBranches} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none appearance-none">
                    <option value="All">All Branches</option>
                    <option value="CSE">CSE Only</option>
                    <option value="ECE">ECE Only</option>
                    <option value="MECH">Mechanical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Solo/Team Logic */}
            <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
               <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Event Type</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <select name="type" value={formData.type} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none appearance-none">
                    <option value="solo">Individual (Solo)</option>
                    <option value="team">Team Based</option>
                  </select>
                </div>
              </div>
              
              {formData.type === 'team' && (
                <div className="space-y-1 animate-in fade-in">
                  <label className="text-xs font-bold uppercase text-zinc-500">Max Team Size</label>
                  <input type="number" name="teamSize" value={formData.teamSize} onChange={handleChange} min="2" max="10" className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none" />
                </div>
              )}
            </div>

            {/* WhatsApp Group Link */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">WhatsApp Group Link</label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                <input name="whatsappLink" value={formData.whatsappLink} onChange={handleChange} placeholder="https://chat.whatsapp.com/..." className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none" />
              </div>
            </div>

             {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none min-h-[100px]" placeholder="Event details..." />
            </div>

          </form>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
          <button type="submit" form="create-event-form" disabled={loading} className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? "Creating..." : "🚀 Launch Event"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;