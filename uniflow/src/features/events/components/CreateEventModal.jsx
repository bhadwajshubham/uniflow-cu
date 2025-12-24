import { useState, useRef } from 'react';
import { X, Upload, Loader2, Link as LinkIcon, AlertCircle, Megaphone } from 'lucide-react'; // Added Megaphone
import { createEvent, uploadEventImage } from '../services/eventService';
import { useAuth } from '../../../context/AuthContext';

const CreateEventModal = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    clubName: '',
    date: '',
    location: '',
    description: '',
    totalTickets: '',
    category: 'General',
    isRestricted: false,
    participationType: 'individual',
    privateLink: '',
    eligibility: '',
    sponsorName: '' // <--- NEW FIELD
  });

  const handleFile = (file) => {
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadEventImage(imageFile);
      }

      const eventData = {
        ...formData,
        imageUrl: imageUrl,
        organizerId: currentUser.uid,
        organizerName: currentUser.displayName,
        ticketsSold: 0,
        status: 'upcoming',
        createdAt: new Date().toISOString()
      };

      await createEvent(eventData);
      onClose();
      window.location.reload();

    } catch (error) {
      console.error(error);
      alert("Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Create New Event</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-zinc-500" /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="create-event-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Image Upload */}
            <div className="space-y-2">
               <label className="text-xs font-bold text-zinc-500 uppercase">Cover Image</label>
               <div onClick={() => fileInputRef.current?.click()} className="relative h-40 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer overflow-hidden">
                 {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <Upload className="h-6 w-6 text-zinc-400" />}
                 <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
               </div>
            </div>

            {/* Title & Club */}
            <div className="grid gap-4">
               <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Title</label>
                  <input required type="text" className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white" 
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
               </div>
               <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Club Name</label>
                  <input required type="text" className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white" 
                    value={formData.clubName} onChange={e => setFormData({...formData, clubName: e.target.value})} />
               </div>
            </div>

            {/* NEW: Sponsor Field */}
            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
              <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase mb-2 flex items-center gap-1">
                <Megaphone className="h-3 w-3" /> Event Sponsor (Optional)
              </label>
              <input 
                type="text" 
                placeholder="e.g. Powered by Nescafe"
                className="w-full p-3 bg-white dark:bg-black border border-indigo-200 dark:border-indigo-800 rounded-xl outline-none text-sm dark:text-white"
                value={formData.sponsorName} 
                onChange={e => setFormData({...formData, sponsorName: e.target.value})} 
              />
              <p className="text-[10px] text-indigo-400 mt-2">This will appear on the Event Card as "Powered By...". Great for sponsorships!</p>
            </div>

            {/* Date & Location */}
            <div className="grid grid-cols-2 gap-4">
              <input required type="datetime-local" className="p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white" style={{colorScheme: 'dark'}} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              <input required type="text" placeholder="Location" className="p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>

            {/* Seats & Desc */}
            <input required type="number" placeholder="Total Seats" className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white" value={formData.totalTickets} onChange={e => setFormData({...formData, totalTickets: e.target.value})} />
            
            <textarea placeholder="Description" rows="3" className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none dark:text-white" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />

            {/* Eligibility Criteria */}
            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mb-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Eligibility (Optional)
              </label>
              <input 
                type="text" 
                placeholder="e.g. 3rd Year CSE Only"
                className="w-full p-3 bg-white dark:bg-black border border-amber-200 dark:border-amber-800 rounded-xl outline-none text-sm dark:text-white"
                value={formData.eligibility} 
                onChange={e => setFormData({...formData, eligibility: e.target.value})} 
              />
            </div>

            {/* Private Link */}
            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-2 flex items-center gap-1">
                <LinkIcon className="h-3 w-3" /> WhatsApp / Private Link (Optional)
              </label>
              <input 
                type="text" 
                placeholder="https://chat.whatsapp.com/..."
                className="w-full p-3 bg-white dark:bg-black border border-emerald-200 dark:border-emerald-800 rounded-xl outline-none text-sm dark:text-white"
                value={formData.privateLink} 
                onChange={e => setFormData({...formData, privateLink: e.target.value})} 
              />
            </div>

            {/* Type Selector */}
            <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setFormData({...formData, participationType: 'individual'})} className={`p-3 rounded-xl border text-sm font-bold ${formData.participationType === 'individual' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}>Individual</button>
                <button type="button" onClick={() => setFormData({...formData, participationType: 'team'})} className={`p-3 rounded-xl border text-sm font-bold ${formData.participationType === 'team' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}>Team</button>
                <button type="button" onClick={() => setFormData({...formData, participationType: 'both'})} className={`p-3 rounded-xl border text-sm font-bold ${formData.participationType === 'both' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}>Both</button>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2 font-bold text-zinc-500">Cancel</button>
          <button type="submit" form="create-event-form" disabled={loading} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl">{loading ? 'Saving...' : 'Launch'}</button>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;