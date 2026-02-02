import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Trash2, Edit, Plus, Users, Calendar, MapPin, QrCode } from 'lucide-react';

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, [user, profile]);

  const fetchEvents = async () => {
    try {
      if (!user) return;

      const eventsRef = collection(db, 'events');
      let q;

      // 🛡️ SECURITY LOGIC:
      // Super Admin: Sab kuch dekhega.
      // Admin: Sirf wahi events dekhega jo usne banaye hain (createdBy == user.uid).
      
      if (profile?.role === 'super_admin') {
        q = query(eventsRef, orderBy('date', 'asc'));
      } else {
        // Admin ke liye query filter
        q = query(eventsRef, where('createdBy', '==', user.uid));
      }

      const querySnapshot = await getDocs(q);
      let eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Agar Admin hai, toh client-side sorting kar lete hain (index error avoid karne ke liye)
      if (profile?.role !== 'super_admin') {
        eventsData.sort((a, b) => new Date(a.date) - new Date(b.date));
      }

      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'events', id));
        // UI update bina refresh ke
        setEvents(events.filter(event => event.id !== id));
      } catch (error) {
        console.error("Error deleting event: ", error);
        alert("Failed to delete event.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {profile?.role === 'super_admin' ? 'Super Admin Dashboard' : 'Event Organizer Dashboard'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {profile?.role === 'super_admin' 
              ? 'Manage all events across the platform.' 
              : 'Manage your events and attendees.'}
          </p>
        </div>
        
        <div className="flex gap-3">
          {/* Scan Button Sabko Dikhega (Admin & Super Admin) */}
          <Link
            to="/scan"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium dark:bg-indigo-900/30 dark:text-indigo-400"
          >
            <QrCode className="w-5 h-5" />
            Scanner
          </Link>

          <Link
            to="/admin/create"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No events found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {profile?.role === 'super_admin' 
              ? 'There are no events in the system yet.' 
              : 'You haven\'t created any events yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div 
              key={event.id} 
              className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
            >
              {/* Event Image */}
              <div className="h-40 overflow-hidden relative bg-gray-100 dark:bg-zinc-800">
                <img 
                  src={event.image || "/api/placeholder/400/200"} 
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 bg-white/90 dark:bg-black/90 text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    title="Delete Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                    {event.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.price > 0 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {event.price > 0 ? `₹${event.price}` : 'Free'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{event.attendees ? event.attendees.length : 0} Registered</span>
                  </div>
                </div>

                <button
                   onClick={() => alert("Edit Feature Coming Soon!")} // Yahan edit modal khol lena future mein
                   className="w-full py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;