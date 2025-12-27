import React, { useState } from 'react';
import { X, Calendar, MapPin, DollarSign, Image as ImageIcon, Type, Ticket, Users, ShieldAlert, Sparkles } from 'lucide-react';
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
    type: 'solo', 
    teamSize: 1,
    allowedBranches: 'All',
    isRestricted: false 
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  // 🪄 MAGIC: Auto-generate a simple SVG poster locally (No Storage Needed!)
  const generateRandomImage = () => {
    const titleText = formData.title || "Upcoming Event";
    
    // 1. Define nice color gradients based on category
    const gradients = {
      'Tech': ['#2563eb', '#1e40af'],    // Blue
      'Cultural': ['#db2777', '#9d174d'], // Pink
      'Sports': ['#ea580c', '#9a3412'],   // Orange
      'Workshop': ['#059669', '#047857'], // Teal
      'Seminar': ['#7c3aed', '#5b21b6'],  // Purple
      'Art': ['#d97706', '#b45309'],      // Yellow/Gold
      'General': ['#4b5563', '#374151']   // Gray
    };
    
    const [color1, color2] = gradients[formData.category] || gradients['General'];

    // 2. Create a simple SVG string
    // Use encodeURIComponent to ensure special characters in title don't break SVG
    const svgString = `
      <svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad1)" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="40" font-weight="bold" fill="#ffffff">
          ${titleText}
        </text>
        <text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#e5e7eb">
          ${formData.category} Event
        </text>
      </svg>
    `;

    // 3. Convert SVG string to Base64 Data URI
    const base64Svg = btoa(svgString);
    const dataUri = `data:image/svg+xml;base64,${base64Svg}`;
    
    setFormData(prev => ({ 
      ...prev, 
      imageUrl: dataUri
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.title || !formData.date || !formData.location) {
        throw new Error("Please fill in all required fields.");
      }

      // If no image URL is provided, generate a default one before saving
      let finalImageUrl = formData.imageUrl;
      if (!finalImageUrl) {
          // Re-run generation logic locally if empty
          const titleText = formData.title || "Event";
          const gradients = { 'Tech': ['#2563eb', '#1e40af'], 'General': ['#4b5563', '#374151'] };
          const [c1, c2] = gradients[formData.category] || gradients['General'];
          const svg = `<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${c1}"/><stop offset="100%" style="stop-color:${c2}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="40" font-weight="bold" fill="#fff">${titleText}</text></svg>`;
          finalImageUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
      }

      const eventPayload = {
        ...formData,
        imageUrl: finalImageUrl, // Use the guaranteed image URL
        price: Number(formData.price),
        totalTickets: Number(formData.totalTickets),
        teamSize: formData.type === 'team' ? Number(formData.teamSize) : 1,
        ticketsSold: 0,
        organizerId: user.uid,
        organizerName: user.displayName || 'Admin',
        organizerEmail: user.email,
        createdAt: new Date()
      };

      await createEvent(eventPayload, user.uid);
      if (onSuccess) onSuccess();
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
            <Calendar className="w-5 h-5 text-indigo-600" /> Create Event
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium text-center">{error}</div>}

          <form id="create-event-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Title (Moved up so it's ready for image generation) */}
            <div className="relative">
              <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input name="title" value={formData.title} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white" required placeholder="Event Title" />
            </div>

            {/* Category (Moved up) */}
            <div>
               <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Category</label>
               <div className="grid grid-cols-3 gap-2">
                  {['Tech', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'General'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData(prev => ({...prev, category: cat}))}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        formData.category === cat 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
               </div>
            </div>

            {/* 📸 IMAGE URL SECTION (Auto-Gen) */}
            <div className="space-y-2">
               <label className="text-xs font-bold uppercase text-zinc-500">Event Poster</label>
               <div className="flex gap-2">
                 <div className="relative flex-1">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      name="imageUrl" 
                      value={formData.imageUrl} 
                      onChange={handleChange} 
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white" 
                      placeholder="Paste Image URL or use Auto" 
                    />
                 </div>
                 {/* 🪄 MAGIC BUTTON */}
                 <button 
                   type="button"
                   onClick={generateRandomImage}
                   className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                 >
                   <Sparkles className="w-4 h-4" /> Auto-Gen
                 </button>
               </div>
               
               {/* Preview */}
               {formData.imageUrl && (
                 <div className="h-48 w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 mt-2 relative">
                   <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/800x450?text=Invalid+Link'} />
                 </div>
               )}
            </div>

            {/* Date/Time/Location */}
            <div className="grid grid-cols-2 gap-4">
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white" required />
              <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white" required />
            </div>
            
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input name="location" value={formData.location} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white" required placeholder="Location" />
            </div>

            {/* Team Config */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-700">
               <label className="text-xs font-bold uppercase text-zinc-500 mb-2 block">Participation Type</label>
               <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="type" value="solo" checked={formData.type === 'solo'} onChange={handleChange} className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium dark:text-white">Individual</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="type" value="team" checked={formData.type === 'team'} onChange={handleChange} className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium dark:text-white">Team Event</span>
                  </label>
               </div>
               {formData.type === 'team' && (
                 <div className="mt-3">
                   <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Max Team Size</label>
                   <div className="relative">
                     <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                     <input type="number" name="teamSize" min="2" max="10" value={formData.teamSize} onChange={handleChange} className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none dark:text-white" required />
                   </div>
                 </div>
               )}
            </div>

            {/* Capacity & Price */}
            <div className="grid grid-cols-2 gap-4">
               <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input type="number" name="totalTickets" value={formData.totalTickets} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white" required placeholder="Capacity" />
               </div>
               <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white" placeholder="Price (0 = Free)" />
               </div>
            </div>

            {/* Restrictions */}
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
              <input type="checkbox" name="isRestricted" checked={formData.isRestricted} onChange={handleChange} className="w-5 h-5 rounded text-red-600 focus:ring-red-500" />
              <div>
                <h4 className="text-sm font-bold text-red-900 dark:text-red-400 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Chitkara Only</h4>
              </div>
            </div>

            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none min-h-[100px]" placeholder="Description..." />

          </form>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800">Cancel</button>
          <button type="submit" form="create-event-form" disabled={loading} className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
            {loading ? "Creating..." : "Launch Event"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;