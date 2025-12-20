import { useState } from 'react';
import { X, Loader2, Calendar, MapPin, Tag, Users, AlertTriangle, ShieldCheck, UserPlus } from 'lucide-react';
import { createEvent } from '../services/eventService';
import { useAuth } from '../../../context/AuthContext';

const CreateEventModal = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    location: '',
    category: 'Hackathon', // Default to Hackathon to test teams
    price: '0',
    venueCapacity: '100',
    maxRegistrations: '100',
    description: '',
    
    // NEW FEATURES
    isRestricted: false,      // "Chitkara Only" Toggle
    participationType: 'individual', // 'individual' or 'team'
    minTeamSize: '1',
    maxTeamSize: '4'
  });

  // Smart Logic: Calculate "Overselling"
  const capacity = parseInt(formData.venueCapacity) || 0;
  const registrations = parseInt(formData.maxRegistrations) || 0;
  const isOversold = registrations > capacity;
  const oversellPercent = capacity > 0 ? Math.round(((registrations - capacity) / capacity) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createEvent({
        ...formData,
        totalTickets: registrations,
        venueCapacity: capacity
      }, currentUser.uid);
      
      alert('Event Published Successfully!');
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Create New Event</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Area */}
        <div className="overflow-y-auto p-6">
          <form id="create-event-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Event Title</label>
              <input 
                required
                type="text"
                placeholder="e.g. Chitkara Hackathon 2025"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            {/* Basic Info Grid */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Date & Time
                </label>
                <input 
                  required
                  type="datetime-local"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Category
                </label>
                <select 
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option>Hackathon</option>
                  <option>Workshop</option>
                  <option>Cultural</option>
                  <option>Seminar</option>
                  <option>Sports</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Venue Location
              </label>
              <input 
                required
                type="text"
                placeholder="e.g. Newton Hall, Block A"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>

            {/* 🛡️ NEW: Domain Restriction Toggle */}
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${formData.isRestricted ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-200 text-zinc-500'}`}>
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Restrict to University?</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">Only users with verified emails can register.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.isRestricted}
                  onChange={(e) => setFormData({...formData, isRestricted: e.target.checked})}
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* 👥 NEW: Participation Type (Hackathon Mode) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5" /> Participation Style
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, participationType: 'individual'})}
                  className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${formData.participationType === 'individual' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-black dark:border-zinc-800 dark:text-zinc-400'}`}
                >
                  Individual (Solo)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, participationType: 'team'})}
                  className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${formData.participationType === 'team' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-black dark:border-zinc-800 dark:text-zinc-400'}`}
                >
                  Team Based
                </button>
              </div>

              {/* Team Size Logic (Only shows if 'Team' is selected) */}
              {formData.participationType === 'team' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-700 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Min Team Members</label>
                    <input type="number" min="1" max="10" className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-indigo-500"
                      value={formData.minTeamSize} onChange={(e) => setFormData({...formData, minTeamSize: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Max Team Members</label>
                    <input type="number" min="1" max="20" className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-indigo-500"
                      value={formData.maxTeamSize} onChange={(e) => setFormData({...formData, maxTeamSize: e.target.value})} />
                  </div>
                </div>
              )}
            </div>

            {/* Attendance & Capacity Logic (Existing) */}
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                <Users className="h-4 w-4" />
                <span>Capacity Settings</span>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Venue Capacity
                  </label>
                  <input 
                    required type="number" min="1"
                    className="w-full px-4 py-2.5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.venueCapacity}
                    onChange={(e) => setFormData({...formData, venueCapacity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Reg. Limit (Hype)
                  </label>
                  <input 
                    required type="number" min="1"
                    className={`w-full px-4 py-2.5 bg-white dark:bg-black border rounded-lg text-zinc-900 dark:text-white outline-none ${isOversold ? 'border-orange-300' : 'border-zinc-200 dark:border-zinc-700'}`}
                    value={formData.maxRegistrations}
                    onChange={(e) => setFormData({...formData, maxRegistrations: e.target.value})}
                  />
                </div>
              </div>

              {isOversold && (
                <div className="flex items-start gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Overselling by {oversellPercent}%</span>
                    <p className="mt-0.5 opacity-90">First-come-first-serve mode active.</p>
                  </div>
                </div>
              )}
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 flex items-center justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="create-event-form"
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Publishing...' : 'Launch Event'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateEventModal;