import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { createEvent } from '../services/eventService';
import { X, Calendar, MapPin, Type, Users, Image as ImageIcon } from 'lucide-react';

const CreateEventForm = ({ onClose, onSuccess }) => {
  const { user } = useAuth(); // 👈 Get the logged-in user
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    category: 'Workshop',
    totalTickets: 100,
    imageUrl: '' // Optional image URL
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalTickets' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic Validation
    if (!formData.title || !formData.date || !formData.location) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      // 🔥 THE FIX: We pass 'user.uid' as the second argument!
      // This stamps the event so only YOU can edit it later.
      await createEvent(formData, user.uid);
      
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to create event. Permission denied or invalid data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Create New Event</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Event Title</label>
            <div className="relative">
              <Type className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="e.g. Hackathon 2024"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Tickets */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Capacity</label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                <input
                  type="number"
                  name="totalTickets"
                  value={formData.totalTickets}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Auditorium Hall"
              />
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Image URL (Optional)</label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder="Event details..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventForm;