import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Globe,
  DollarSign,
  Users,
  Layers,
  ShieldAlert,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

const EditEventModal = ({ isOpen, onClose, eventData, onSuccess }) => {
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
    whatsappLink: '',
    allowedBranches: 'All',
    imageUrl: '',
    isUniversityOnly: false,
    type: 'solo',
    teamSize: 1,
    customQuestions: []
  });

  /* ---------------- LOAD EVENT ---------------- */

  useEffect(() => {
    if (eventData) {
      setFormData({
        title: eventData.title || '',
        description: eventData.description || '',
        date: eventData.date || '',
        time: eventData.time || '',
        location: eventData.location || '',
        category: eventData.category || 'Tech',
        price: String(eventData.price ?? 0),
        totalTickets: String(eventData.totalTickets ?? 100),
        whatsappLink: eventData.whatsappLink || '',
        allowedBranches: eventData.allowedBranches || 'All',
        imageUrl: eventData.imageUrl || '',
        isUniversityOnly: !!eventData.isUniversityOnly,
        type: eventData.teamSize > 1 ? 'team' : 'solo',
        teamSize: eventData.teamSize || 1,
        customQuestions: eventData.customQuestions || []
      });
    }
  }, [eventData]);

  if (!isOpen || !eventData) return null;

  /* ---------------- HANDLERS ---------------- */

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
          id: crypto.randomUUID(),
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
    updateQuestion(
      id,
      'options',
      value.split(',').map(v => v.trim())
    );
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

  /* ---------------- UI ---------------- */

  return (
    <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="font-black uppercase">Edit Event</h2>
          <button onClick={onClose}><X /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8">
          <form id="edit-form" onSubmit={handleUpdate} className="space-y-8">

            {/* Title */}
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Event Title"
              className="w-full p-4 rounded-xl border"
              required
            />

            {/* Description */}
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Description"
              className="w-full p-4 rounded-xl border"
              required
            />

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="p-3 border rounded-xl" />
              <input type="time" name="time" value={formData.time} onChange={handleChange} className="p-3 border rounded-xl" />
            </div>

            {/* Location */}
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Location"
              className="w-full p-3 border rounded-xl"
            />

            {/* Category */}
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl"
            >
              <option>Tech</option>
              <option>Cultural</option>
              <option>Sports</option>
              <option>Workshop</option>
            </select>

            {/* Price & Tickets */}
            <div className="grid grid-cols-2 gap-4">
              <input type="number" name="price" value={formData.price} onChange={handleChange} className="p-3 border rounded-xl" />
              <input type="number" name="totalTickets" value={formData.totalTickets} onChange={handleChange} className="p-3 border rounded-xl" />
            </div>

            {/* Team Mode */}
            <div className="flex gap-2">
              <button type="button" onClick={() => setFormData({ ...formData, type: 'solo', teamSize: 1 })}
                className={`flex-1 p-3 rounded-xl ${formData.type === 'solo' ? 'bg-indigo-600 text-white' : 'bg-zinc-100'}`}>
                Solo
              </button>
              <button type="button" onClick={() => setFormData({ ...formData, type: 'team' })}
                className={`flex-1 p-3 rounded-xl ${formData.type === 'team' ? 'bg-indigo-600 text-white' : 'bg-zinc-100'}`}>
                Team
              </button>
            </div>

            {formData.type === 'team' && (
              <input
                type="number"
                min="2"
                name="teamSize"
                value={formData.teamSize}
                onChange={handleChange}
                className="p-3 border rounded-xl"
              />
            )}

            {/* WhatsApp */}
            <input
              name="whatsappLink"
              value={formData.whatsappLink}
              onChange={handleChange}
              placeholder="WhatsApp / Group Link"
              className="w-full p-3 border rounded-xl"
            />

            {/* Custom Questions */}
            <div className="space-y-4 border rounded-2xl p-4">
              <div className="flex justify-between items-center">
                <p className="font-black uppercase text-sm">Custom Questions</p>
                <button type="button" onClick={addQuestion} className="text-indigo-600 flex gap-1">
                  <Plus size={16} /> Add
                </button>
              </div>

              {formData.customQuestions.map(q => (
                <div key={q.id} className="border rounded-xl p-3 space-y-2">
                  <input
                    value={q.label}
                    onChange={e => updateQuestion(q.id, 'label', e.target.value)}
                    placeholder="Question"
                    className="w-full p-2 border rounded"
                  />
                  <select
                    value={q.type}
                    onChange={e => updateQuestion(q.id, 'type', e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="select">Select</option>
                    <option value="checkbox">Checkbox</option>
                  </select>

                  {q.type === 'select' && (
                    <input
                      placeholder="Options (comma separated)"
                      onChange={e => updateOptions(q.id, e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  )}

                  <label className="flex gap-2 text-sm">
                    <input type="checkbox" checked={q.required}
                      onChange={e => updateQuestion(q.id, 'required', e.target.checked)} />
                    Required
                  </label>

                  <button type="button" onClick={() => removeQuestion(q.id)} className="text-red-500 text-sm">
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
          <button form="edit-form" type="submit" disabled={loading}
            className="flex-[2] bg-indigo-600 text-white rounded-xl py-3">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditEventModal;
