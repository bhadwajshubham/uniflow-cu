import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Loader2,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Image as ImageIcon,
  Users,
  ShieldAlert,
  Globe,
  GraduationCap,
  Layers,
  Plus,
  Trash2
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

const EditEventModal = ({ isOpen, onClose, eventData, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    price: 0,
    totalTickets: 0,
    description: '',
    imageUrl: '',
    category: 'Tech',
    allowedBranches: 'All',
    whatsappLink: '',
    isUniversityOnly: false,
    type: 'solo',
    teamSize: 1,
    customQuestions: []
  });

  useEffect(() => {
    if (eventData) {
      setFormData({
        title: eventData.title || '',
        date: eventData.date || '',
        time: eventData.time || '',
        location: eventData.location || '',
        price: eventData.price || 0,
        totalTickets: eventData.totalTickets || 0,
        description: eventData.description || '',
        imageUrl: eventData.imageUrl || '',
        category: eventData.category || 'Tech',
        allowedBranches: eventData.allowedBranches || 'All',
        whatsappLink: eventData.whatsappLink || '',
        isUniversityOnly: eventData.isUniversityOnly || false,
        type: eventData.teamSize > 1 ? 'team' : 'solo',
        teamSize: eventData.teamSize || 1,
        customQuestions: eventData.customQuestions || []
      });
    }
  }, [eventData]);

  if (!isOpen || !eventData) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  /* ---------------- CUSTOM QUESTIONS ---------------- */

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      customQuestions: [
        ...prev.customQuestions,
        {
          id: `q_${Date.now()}`,
          label: '',
          type: 'text',
          required: false,
          options: []
        }
      ]
    }));
  };

  const updateQuestion = (id, key, value) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.map(q =>
        q.id === id ? { ...q, [key]: value } : q
      )
    }));
  };

  const removeQuestion = (id) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.filter(q => q.id !== id)
    }));
  };

  const updateOptions = (id, value) => {
    updateQuestion(id, 'options', value.split(',').map(v => v.trim()));
  };

  /* ---------------- SUBMIT ---------------- */

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventRef = doc(db, 'events', eventData.id);

      await updateDoc(eventRef, {
        ...formData,
        price: Number(formData.price),
        totalTickets: Number(formData.totalTickets),
        teamSize: formData.type === 'team' ? Number(formData.teamSize) : 1,
        updatedAt: serverTimestamp()
      });

      alert('✅ Event Updated Successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      alert('Update failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-950 max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-6 border-b flex justify-between">
          <h2 className="font-black uppercase">Edit Event</h2>
          <button onClick={onClose}><X /></button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="edit-form" onSubmit={handleUpdate} className="space-y-6">

            <input name="title" value={formData.title} onChange={handleChange} placeholder="Event Title" className="w-full p-3 rounded-xl" />

            {/* CUSTOM QUESTIONS */}
            <div className="border rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center">
                <p className="font-black text-sm uppercase">Custom Registration Questions</p>
                <button type="button" onClick={addQuestion} className="text-indigo-600 flex gap-1 items-center">
                  <Plus size={16} /> Add
                </button>
              </div>

              {formData.customQuestions.map(q => (
                <div key={q.id} className="border p-3 rounded-xl space-y-2">
                  <input
                    value={q.label}
                    onChange={e => updateQuestion(q.id, 'label', e.target.value)}
                    placeholder="Question label"
                    className="w-full p-2 rounded"
                    required
                  />

                  <select
                    value={q.type}
                    onChange={e => updateQuestion(q.id, 'type', e.target.value)}
                    className="w-full p-2 rounded"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="select">Dropdown</option>
                    <option value="checkbox">Checkbox</option>
                  </select>

                  {(q.type === 'select') && (
                    <input
                      placeholder="Options (comma separated)"
                      onChange={e => updateOptions(q.id, e.target.value)}
                      className="w-full p-2 rounded"
                    />
                  )}

                  <label className="flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={e => updateQuestion(q.id, 'required', e.target.checked)}
                    />
                    Required
                  </label>

                  <button type="button" onClick={() => removeQuestion(q.id)} className="text-red-500 flex gap-1 items-center">
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              ))}
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex gap-4">
          <button onClick={onClose} className="flex-1">Cancel</button>
          <button form="edit-form" type="submit" disabled={loading} className="flex-[2] bg-indigo-600 text-white rounded-xl py-3">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEventModal;
