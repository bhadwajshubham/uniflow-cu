import { useState, useRef } from 'react';
import { X, Calendar, MapPin, Users, Upload, Loader2, Building2 } from 'lucide-react';
import { updateEvent, uploadEventImage } from '../services/eventService';

const EditEventModal = ({ event, onClose }) => {
  const [loading, setLoading] = useState(false);
  
  // Initialize with existing event data
  const [formData, setFormData] = useState({
    title: event.title || '',
    clubName: event.clubName || '',
    date: event.date || '',
    location: event.location || '',
    description: event.description || '',
    totalTickets: event.totalTickets || '',
    category: event.category || 'General',
    isRestricted: event.isRestricted || false
  });

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(event.imageUrl || null);
  const fileInputRef = useRef(null);

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
      let imageUrl = event.imageUrl; // Default to old image
      
      // If new image selected, upload it
      if (imageFile) {
        imageUrl = await uploadEventImage(imageFile);
      }

      await updateEvent(event.id, {
        ...formData,
        imageUrl: imageUrl,
        updatedAt: new Date().toISOString()
      });
      
      alert("Event updated successfully!");
      onClose();
      window.location.reload();

    } catch (error) {
      console.error(error);
      alert("Failed to update event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Edit Event</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-zinc-500" /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="edit-event-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Image Preview */}
            <div onClick={() => fileInputRef.current?.click()} className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden cursor-pointer relative group">
              {previewUrl ? (
                <img src={previewUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-400">Click to add image</div>
              )}
              <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white font-bold">Change Image</div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            </div>

            {/* Fields */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase">Title</label>
              <input required type="text" className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none"
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-xs font-bold text-zinc-500 uppercase">Date</label>
                 <input required type="datetime-local" className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none"
                   style={{ colorScheme: 'dark' }}
                   value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
               </div>
               <div>
                 <label className="text-xs font-bold text-zinc-500 uppercase">Seats</label>
                 <input required type="number" className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none"
                   value={formData.totalTickets} onChange={e => setFormData({...formData, totalTickets: e.target.value})} />
               </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase">Location</label>
              <input required type="text" className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none"
                value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase">Description</label>
              <textarea rows="4" className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none"
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-zinc-500">Cancel</button>
          <button type="submit" form="edit-event-form" disabled={loading} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditEventModal;