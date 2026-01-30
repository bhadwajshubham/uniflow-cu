import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Calendar, Clock, MapPin, Globe, DollarSign, Users, 
  Layers, ShieldAlert, Loader2, Plus, Trash2, UploadCloud, AlertCircle 
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { uploadImage } from '../services/uploadService'; // Ensure this path is correct

const EditEventModal = ({ isOpen, onClose, eventData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Initial State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'Tech',
    price: 0,
    totalTickets: 100,
    whatsappLink: '',
    allowedBranches: 'All',
    imageUrl: '',
    isUniversityOnly: false,
    isOpen: true, // ✅ Added Start/Stop Toggle
    type: 'solo',
    teamSize: 1,
    customQuestions: []
  });

  // 1. LOAD DATA
  useEffect(() => {
    if (eventData) {
      setFormData({
        title: eventData.title || '',
        description: eventData.description || '',
        date: eventData.date || '',
        time: eventData.time || '',
        location: eventData.venue || eventData.location || '',
        category: eventData.category || 'Tech',
        price: eventData.price || 0,
        totalTickets: eventData.totalTickets || 100,
        whatsappLink: eventData.whatsappLink || '',
        allowedBranches: eventData.allowedBranches || 'All',
        imageUrl: eventData.image || eventData.imageUrl || '',
        isUniversityOnly: !!eventData.isUniversityOnly,
        isOpen: eventData.isOpen !== undefined ? eventData.isOpen : true,
        type: (eventData.teamSize > 1) ? 'team' : 'solo',
        teamSize: eventData.teamSize || 1,
        customQuestions: eventData.customQuestions || []
      });
    }
  }, [eventData]);

  if (!isOpen || !eventData) return null;

  // 2. HANDLERS
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 3. IMAGE UPLOAD LOGIC
  const handleFileSelect = async (e) => {
    if (e.target.files?.[0]) {
        const file = e.target.files[0];
        if (!file.type.startsWith("image/")) return alert("Only images allowed.");
        
        setImageUploading(true);
        try {
            const url = await uploadImage(file);
            setFormData(prev => ({ ...prev, imageUrl: url }));
        } catch (error) {
            alert("Upload failed");
        } finally {
            setImageUploading(false);
        }
    }
  };

  // 4. CUSTOM QUESTIONS LOGIC
  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      customQuestions: [...prev.customQuestions, { id: crypto.randomUUID(), label: '', type: 'text', required: false, options: [] }]
    }));
  };

  const updateQuestion = (id, key, value) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.map(q => q.id === id ? { ...q, [key]: value } : q)
    }));
  };

  const removeQuestion = (id) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.filter(q => q.id !== id)
    }));
  };

  // 5. SUBMIT UPDATE
  const handleUpdate = async (e) => {
    e.preventDefault();
    if(imageUploading) return alert("Please wait for image upload");
    
    setLoading(true);
    try {
      const eventRef = doc(db, 'events', eventData.id);
      
      await updateDoc(eventRef, {
        ...formData,
        price: Number(formData.price),
        totalTickets: Number(formData.totalTickets),
        teamSize: formData.type === 'team' ? Number(formData.teamSize) : 1,
        venue: formData.location, // Sync venue/location fields
        updatedAt: serverTimestamp()
      });

      // alert('✅ Event Updated Successfully'); // Optional Alert
      onSuccess?.(); // Refresh Parent
      onClose();
    } catch (err) {
      alert('Update failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-3xl rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-white/50 dark:bg-black/50 backdrop-blur-md">
          <div>
              <h2 className="text-xl font-black uppercase dark:text-white">Edit Event</h2>
              <p className="text-xs text-zinc-500 font-bold tracking-widest">Update Details & Settings</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"><X className="w-6 h-6"/></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form id="edit-form" onSubmit={handleUpdate} className="space-y-8">

            {/* 🖼️ IMAGE UPLOADER */}
            <div className="relative w-full h-56 rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 overflow-hidden group bg-zinc-50 dark:bg-black">
                {imageUploading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 className="animate-spin text-indigo-600 w-8 h-8"/>
                    </div>
                ) : formData.imageUrl ? (
                    <>
                        <img src={formData.imageUrl} alt="Event" className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button type="button" onClick={() => fileInputRef.current.click()} className="px-4 py-2 bg-white text-black font-bold rounded-xl text-xs">Change</button>
                            <button type="button" onClick={() => setFormData(prev => ({...prev, imageUrl: ''}))} className="px-4 py-2 bg-red-500 text-white font-bold rounded-xl text-xs">Remove</button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full cursor-pointer" onClick={() => fileInputRef.current.click()}>
                        <UploadCloud className="w-10 h-10 text-zinc-400 mb-2"/>
                        <p className="text-xs font-bold text-zinc-500 uppercase">Click to Upload Poster</p>
                    </div>
                )}
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileSelect}/>
            </div>

            {/* 📝 BASIC INFO */}
            <div className="space-y-4">
                <input name="title" value={formData.title} onChange={handleChange} placeholder="Event Title" className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-black text-lg dark:text-white outline-none focus:border-indigo-500 transition-colors" required />
                <textarea name="description" rows={4} value={formData.description} onChange={handleChange} placeholder="Description" className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-medium text-sm dark:text-zinc-300 outline-none focus:border-indigo-500 transition-colors" required />
            </div>

            {/* 📅 DATE & LOCATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4">
                    <Calendar className="w-5 h-5 text-zinc-400 mr-3"/>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="bg-transparent w-full py-4 outline-none font-bold text-sm dark:text-white"/>
                </div>
                <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4">
                    <Clock className="w-5 h-5 text-zinc-400 mr-3"/>
                    <input type="time" name="time" value={formData.time} onChange={handleChange} className="bg-transparent w-full py-4 outline-none font-bold text-sm dark:text-white"/>
                </div>
            </div>

            <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4">
                <MapPin className="w-5 h-5 text-zinc-400 mr-3"/>
                <input name="location" value={formData.location} onChange={handleChange} placeholder="Venue Location" className="bg-transparent w-full py-4 outline-none font-bold text-sm dark:text-white"/>
            </div>

            {/* 💰 PRICE & CAPACITY */}
            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4">
                    <DollarSign className="w-5 h-5 text-zinc-400 mr-3"/>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} className="bg-transparent w-full py-4 outline-none font-bold text-sm dark:text-white" placeholder="Price"/>
                </div>
                <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4">
                    <Users className="w-5 h-5 text-zinc-400 mr-3"/>
                    <input type="number" name="totalTickets" value={formData.totalTickets} onChange={handleChange} className="bg-transparent w-full py-4 outline-none font-bold text-sm dark:text-white" placeholder="Total Tickets"/>
                </div>
            </div>

            {/* 🚦 TOGGLES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* STRICT MODE */}
                <div onClick={() => setFormData(prev => ({...prev, isUniversityOnly: !prev.isUniversityOnly}))} className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${formData.isUniversityOnly ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'border-zinc-200 dark:border-zinc-800'}`}>
                    <div className="flex items-center gap-3">
                        <ShieldAlert className={`w-5 h-5 ${formData.isUniversityOnly ? 'text-indigo-600' : 'text-zinc-400'}`} />
                        <div>
                            <p className="text-xs font-black uppercase dark:text-white">Strict Mode</p>
                            <p className="text-[10px] text-zinc-500">Uni Emails Only</p>
                        </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.isUniversityOnly ? 'bg-indigo-600' : 'bg-zinc-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${formData.isUniversityOnly ? 'translate-x-4' : ''}`}></div>
                    </div>
                </div>

                {/* REGISTRATION OPEN/CLOSE */}
                <div onClick={() => setFormData(prev => ({...prev, isOpen: !prev.isOpen}))} className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${formData.isOpen ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-red-200 bg-red-50 dark:bg-red-900/10'}`}>
                    <div className="flex items-center gap-3">
                        <AlertCircle className={`w-5 h-5 ${formData.isOpen ? 'text-green-600' : 'text-red-500'}`} />
                        <div>
                            <p className="text-xs font-black uppercase dark:text-white">Registrations</p>
                            <p className={`text-[10px] font-bold ${formData.isOpen ? 'text-green-600' : 'text-red-500'}`}>{formData.isOpen ? 'OPEN' : 'CLOSED'}</p>
                        </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.isOpen ? 'bg-green-500' : 'bg-zinc-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${formData.isOpen ? 'translate-x-4' : ''}`}></div>
                    </div>
                </div>
            </div>

            {/* ❓ CUSTOM QUESTIONS */}
            <div className="space-y-4 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between items-center">
                <p className="font-black uppercase text-xs text-zinc-500 tracking-widest">Registration Form Questions</p>
                <button type="button" onClick={addQuestion} className="text-indigo-600 text-xs font-bold flex gap-1 hover:underline"><Plus size={14} /> Add New</button>
              </div>

              {formData.customQuestions.map((q, i) => (
                <div key={q.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3 relative">
                  <div className="absolute top-4 right-4">
                      <button type="button" onClick={() => removeQuestion(q.id)} className="text-zinc-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                  <input value={q.label} onChange={e => updateQuestion(q.id, 'label', e.target.value)} placeholder={`Question ${i+1}`} className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-700 p-2 font-bold text-sm outline-none dark:text-white"/>
                  <div className="flex gap-4">
                      <select value={q.type} onChange={e => updateQuestion(q.id, 'type', e.target.value)} className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs p-2 outline-none dark:text-white">
                        <option value="text">Text Input</option>
                        <option value="number">Number Input</option>
                        <option value="select">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                      </select>
                      <label className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                        <input type="checkbox" checked={q.required} onChange={e => updateQuestion(q.id, 'required', e.target.checked)} className="accent-indigo-600"/> Required
                      </label>
                  </div>
                </div>
              ))}
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-white/80 dark:bg-black/80 flex gap-4 backdrop-blur-md">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900">Cancel</button>
          <button form="edit-form" type="submit" disabled={loading || imageUploading} className="flex-[2] bg-indigo-600 text-white rounded-2xl py-4 font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : 'Save Updates'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditEventModal;