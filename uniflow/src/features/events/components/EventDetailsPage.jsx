import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Calendar, MapPin, Clock, Share2, ArrowLeft, MessageCircle, Users } from 'lucide-react';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, 'events', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("No such event!");
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen pt-24 flex justify-center text-zinc-500">Loading details...</div>
  );

  if (!event) return (
    <div className="min-h-screen pt-24 text-center">
      <h2 className="text-xl font-bold">Event not found</h2>
      <button onClick={() => navigate('/events')} className="text-indigo-600 mt-4 hover:underline">Go Back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Button */}
        <button onClick={() => navigate('/events')} className="flex items-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
        </button>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl">
          
          {/* Hero Image */}
          <div className="h-64 md:h-96 bg-zinc-200 dark:bg-zinc-800 relative">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                <Calendar className="w-16 h-16 opacity-50" />
              </div>
            )}
            <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 backdrop-blur px-4 py-1.5 rounded-full text-sm font-bold border border-zinc-200 dark:border-zinc-700">
              {event.price > 0 ? `$${event.price}` : 'Free Entry'}
            </div>
          </div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8 justify-between">
              
              {/* Main Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">
                    {event.category || 'General'}
                  </span>
                  {event.type === 'team' && (
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3" /> Team Event
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-4">
                  {event.title}
                </h1>
                
                <p className="text-zinc-600 dark:text-zinc-300 text-lg leading-relaxed mb-8 whitespace-pre-line">
                  {event.description}
                </p>

                {/* WhatsApp Link (If exists) */}
                {event.whatsappLink && (
                  <a 
                    href={event.whatsappLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors mb-8"
                  >
                    <MessageCircle className="w-5 h-5" /> Join WhatsApp Group
                  </a>
                )}
              </div>

              {/* Sidebar Details */}
              <div className="w-full md:w-80 space-y-6">
                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-indigo-500 mt-1" />
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase">Date</p>
                        <p className="font-semibold text-zinc-900 dark:text-white">{event.date}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-indigo-500 mt-1" />
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase">Time</p>
                        <p className="font-semibold text-zinc-900 dark:text-white">{event.time}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-indigo-500 mt-1" />
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase">Location</p>
                        <p className="font-semibold text-zinc-900 dark:text-white">{event.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700">
                    <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
                      Register Now
                    </button>
                    <p className="text-center text-xs text-zinc-400 mt-3">
                      {event.ticketsSold || 0} / {event.totalTickets} spots filled
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;