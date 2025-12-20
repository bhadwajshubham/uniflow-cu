import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const createEvent = async (eventData, userId) => {
  try {
    // 1. Clean the data (Updated to include TEAM fields)
    const cleanData = {
      title: eventData.title,
      description: eventData.description,
      date: eventData.date,
      location: eventData.location,
      category: eventData.category,
      price: Number(eventData.price) || 0,
      
      // Capacity Logic
      venueCapacity: Number(eventData.venueCapacity) || 0,
      totalTickets: Number(eventData.totalTickets),
      ticketsSold: 0,

      // NEW: Team & Restriction Logic
      isRestricted: eventData.isRestricted || false,
      participationType: eventData.participationType || 'individual',
      minTeamSize: Number(eventData.minTeamSize) || 1,
      maxTeamSize: Number(eventData.maxTeamSize) || 4,
      
      // Meta Data
      createdBy: userId,
      createdAt: serverTimestamp(),
      status: 'published',
      
      // Search Helper
      searchKeywords: eventData.title.toLowerCase().split(' ')
    };

    // 2. Save to "events" collection
    const docRef = await addDoc(collection(db, 'events'), cleanData);
    
    console.log("Event Created with ID:", docRef.id);
    return { id: docRef.id, ...cleanData };
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};