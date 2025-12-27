import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Calendar, MapPin, Clock, ArrowLeft, MessageCircle, Users, Building2, AlertCircle } from 'lucide-react';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false); // 🖼️ Track image errors

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, 'events', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen pt-24 flex justify-center text-zinc-500">Loading experience...</div>
  );

  if (!event) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center">
      <AlertCircle className="w-12 h-12 text-zinc-300 mb-4" />
      <h2 className="text-xl font-bold">Event not found</h2>
      <button onClick={() => navigate('/')} className="text-indigo-600 mt-4 hover:underline">Go Home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        
        <button onClick={() => navigate('/events')} className="flex items-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Events
        </button>

        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl">
          
          {/* 🖼️ SMART IMAGE SECTION */}
          <div className="h-64 md:h-[400px] bg-zinc-100 dark:bg-zinc-800 relative">
            {!imageError && event.imageUrl ? (
              <img 
                src={event.imageUrl} 
                alt={event.title} 
                className="w-full h-full object-cover"
                onError={() => setImageError(true)} // 👈 Handle broken links
              />
            ) : (
              // Fallback Gradient if image fails or missing
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <Calendar className="w-20 h-20 text-white/50" />
              </div>
            )}
            
            <div className="absolute top-6 right-6 flex gap-2">
               <div className="bg-white/90 dark:bg-black/90 backdrop-blur px-4 py-2 rounded-full text-sm font-bold border border-zinc-200 dark:border-zinc-700 shadow-sm">
                {event.price > 0 ? `$${event.price}` : 'Free Entry'}
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-12 justify-between">
              
              {/* Main Content */}
              <div className="flex-1">
                {/* Tags */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {event.category || 'Event'}
                  </span>
                  
                  {/* Branch Tag */}
                  {event.allowedBranches && event.allowedBranches !== 'All' && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {event.allowedBranches} Only
                    </span>
                  )}

                  {/* Team Tag */}
                  {event.type === 'team' && (
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3" /> Team of {event.teamSize}
                    </span>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-6 leading-tight">
                  {event.title}
                </h1>
                
                {/* Description */}
                <div className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300 mb-10">
                  <p className="whitespace-pre-line text-lg leading-relaxed">{event.description}</p>
                </div>

                {/* 💬 WhatsApp Button (Conditional) */}
                {event.whatsappLink && (
                  <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-2xl border border-green-100 dark:border-green-900/30 flex items-center justify-between gap-4 mb-8">
                    <div>
                      <h4 className="font-bold text-green-800 dark:text-green-400">Join the Community</h4>
                      <p className="text-sm text-green-600 dark:text-green-500">Get updates and find teammates.</p>
                    </div>
                    <a 
                      href={event.whatsappLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-95 flex items-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" /> Join Group
                    </a>
                  </div>
                )}
              </div>

              {/* Sidebar / Ticket Box */}
              <div className="w-full md:w-80 flex-shrink-0">
                <div className="sticky top-24 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-200 dark:border-zinc-700/50">
                  <h3 className="font-bold text-zinc-900 dark:text-white mb-6 text-lg">Event Details</h3>
                  
                  <div className="space-y-6">
                    <DetailRow icon={Calendar} label="Date" value={new Date(event.date).toDateString()} />
                    <DetailRow icon={Clock} label="Time" value={event.time} />
                    <DetailRow icon={MapPin} label="Location" value={event.location} />
                  </div>

                  <div className="my-8 h-px bg-zinc-200 dark:bg-zinc-700"></div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-500">Spots Remaining</span>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {Math.max(0, event.totalTickets - event.ticketsSold)} / {event.totalTickets}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                         style={{ width: `${Math.min((event.ticketsSold / event.totalTickets) * 100, 100)}%` }}
                       ></div>
                    </div>
                  </div>

                  <button className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 text-lg">
                    Register Now
                  </button>
                  <p className="text-center text-[10px] text-zinc-400 mt-3 uppercase tracking-wide">
                    Secure Payment via UPI
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4">
    <div className="p-2 bg-white dark:bg-zinc-700 rounded-lg shadow-sm">
      <Icon className="w-5 h-5 text-indigo-500" />
    </div>
    <div>
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="font-semibold text-zinc-900 dark:text-white">{value}</p>
    </div>
  </div>
);

export default EventDetailsPage;