import { useEffect, useState } from 'react';
import { X, Search, Download, User, Users, CheckCircle, Clock, Trash2, Edit, Star, MessageSquare } from 'lucide-react';
import { getEventParticipants, getEventReviews } from '../services/adminService';
import { deleteEvent } from '../services/eventService';
import EditEventModal from './EditEventModal';

const EventParticipantsModal = ({ eventId, eventTitle, onClose, eventData }) => {
  // State
  const [activeTab, setActiveTab] = useState('participants'); // 'participants' or 'reviews'
  const [loading, setLoading] = useState(true);
  
  // Data
  const [participants, setParticipants] = useState([]);
  const [reviews, setReviews] = useState([]);
  
  // Filtering & Editing
  const [filter, setFilter] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pData, rData] = await Promise.all([
        getEventParticipants(eventId),
        getEventReviews(eventId)
      ]);
      setParticipants(pData);
      setReviews(rData);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm("DANGER: Are you sure you want to delete this event? This cannot be undone.")) return;
    try {
      await deleteEvent(eventId);
      alert("Event deleted.");
      window.location.reload();
    } catch (error) {
      alert("Failed to delete.");
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name,Email,Phone,Roll No,Branch,Status,Ticket Type,Team Code,Check-in Time'];
    const rows = participants.map(p => {
      const checkIn = p.status === 'attended' ? 'Present' : 'Absent';
      const type = p.type || 'individual';
      const team = p.teamCode || 'N/A';
      const phone = p.userPhone || 'N/A';
      const roll = p.userRollNo || 'N/A';
      const branch = p.userBranch || 'N/A';
      return `${p.userName},${p.userEmail},${phone},${roll},${branch},${checkIn},${type},${team},"${p.createdAt?.toDate().toLocaleString()}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${eventTitle.replace(/\s+/g, '_')}_Participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredParticipants = participants.filter(p => 
    p.userName.toLowerCase().includes(filter.toLowerCase()) || 
    p.userEmail.toLowerCase().includes(filter.toLowerCase()) ||
    (p.userRollNo && p.userRollNo.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col h-[80vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-50 dark:bg-black/50 rounded-t-2xl gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              {eventTitle}
            </h2>
            
            {/* TABS */}
            <div className="flex gap-2 mt-3">
              <button 
                onClick={() => setActiveTab('participants')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'participants' ? 'bg-indigo-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-300'}`}
              >
                Participants ({participants.length})
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'reviews' ? 'bg-indigo-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-300'}`}
              >
                Reviews ({reviews.length})
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm" title="Download CSV">
              <Download className="h-5 w-5" /> <span className="hidden md:inline">Export</span>
            </button>
            {eventData && (
              <button onClick={() => setIsEditing(true)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                <Edit className="h-5 w-5" />
              </button>
            )}
            <button onClick={handleDeleteEvent} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              <Trash2 className="h-5 w-5" />
            </button>
            <div className="h-6 w-px bg-zinc-300 dark:bg-zinc-700 mx-2"></div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full">
              <X className="h-5 w-5 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white dark:bg-zinc-900">
          
          {/* TAB 1: PARTICIPANTS */}
          {activeTab === 'participants' && (
            <>
              {/* Search Bar */}
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex gap-4 bg-white dark:bg-zinc-900 sticky top-0 z-10">
                  <Search className="h-5 w-5 text-zinc-400 my-auto ml-2" />
                  <input 
                    type="text" 
                    placeholder="Search by Name, Email, or Roll No..." 
                    className="w-full bg-transparent outline-none text-sm dark:text-white"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
              </div>

              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 sticky top-[60px] z-10">
                  <tr>
                    <th className="px-6 py-3">Student Details</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredParticipants.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="px-6 py-4">
                           <div className="font-bold text-zinc-900 dark:text-white">{p.userName}</div>
                           <div className="text-xs text-zinc-500">
                             {p.userRollNo && p.userRollNo !== 'N/A' ? `Roll: ${p.userRollNo}` : p.userEmail}
                           </div>
                        </td>
                        <td className="px-6 py-4 capitalize text-zinc-500">{p.type.replace('_', ' ')}</td>
                        <td className="px-6 py-4">
                          {p.status === 'attended' 
                            ? <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Present</span> 
                            : <span className="text-amber-500 font-bold flex items-center gap-1"><Clock className="h-3 w-3"/> Registered</span>
                          }
                        </td>
                      </tr>
                  ))}
                  {filteredParticipants.length === 0 && (
                     <tr><td colSpan="3" className="text-center py-8 text-zinc-400">No participants found.</td></tr>
                  )}
                </tbody>
              </table>
            </>
          )}

          {/* TAB 2: REVIEWS (NEW) */}
          {activeTab === 'reviews' && (
             <div className="p-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No reviews yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {reviews.map(r => (
                      <div key={r.id} className="p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800/30">
                         <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-2">
                             <div className="font-bold text-zinc-900 dark:text-white">{r.userName}</div>
                             <div className="text-xs text-zinc-400">{r.userEmail}</div>
                           </div>
                           <div className="flex text-amber-500">
                             {[...Array(5)].map((_, i) => (
                               <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-amber-500' : 'text-zinc-300 dark:text-zinc-700'}`} />
                             ))}
                           </div>
                         </div>
                         <p className="text-sm text-zinc-600 dark:text-zinc-300 italic">"{r.comment || 'No comment provided.'}"</p>
                         <div className="mt-2 text-[10px] text-zinc-400">
                           {r.createdAt?.toDate().toLocaleString()}
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          )}

        </div>
      </div>

      {isEditing && eventData && (
        <EditEventModal event={eventData} onClose={() => setIsEditing(false)} />
      )}
    </div>
  );
};

export default EventParticipantsModal;