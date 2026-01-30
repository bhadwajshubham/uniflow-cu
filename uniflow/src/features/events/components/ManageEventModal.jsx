import React, { useState, useEffect } from 'react';
import { X, Search, Download, User, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const ManageEventModal = ({ isOpen, onClose, eventData }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Export State
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // 1. Fetch Basic Ticket List (Lightweight)
  useEffect(() => {
    if (!eventData?.id) return;

    const fetchParticipants = async () => {
      try {
        setLoading(true);
        // Sirf Tickets fetch kar rahe hain (Fast)
        const q = query(collection(db, 'tickets'), where('eventId', '==', eventData.id));
        const snapshot = await getDocs(q);
        
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort by Name
        data.sort((a, b) => (a.userName || '').localeCompare(b.userName || ''));
        setParticipants(data);
      } catch (error) {
        console.error("Error fetching participants:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchParticipants();
    }
  }, [isOpen, eventData]);

  if (!isOpen) return null;

  // Filter Logic
  const filtered = participants.filter(p => 
    p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.userRollNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🚀 2. MASTER CSV EXPORT (Fetches Extra User Details on Click)
  const downloadCsv = async () => {
    if (participants.length === 0) { alert("No data to export."); return; }
    
    setExporting(true);
    setExportProgress(0);

    try {
      // Step A: CSV Headers
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Ticket ID,Name,Roll No,Email,Phone,Branch,Residency,Team/Group,Status,Booked Date,Check-In Time\n";

      // Step B: Fetch Full User Details in Parallel
      // Hum har ticket ke liye User Profile fetch karenge taaki Phone/Residency mile
      const fullDataPromises = participants.map(async (ticket, index) => {
        let userDetails = {};
        
        try {
          // Fetch User Profile from 'users' collection
          if (ticket.userId) {
            const userSnap = await getDoc(doc(db, 'users', ticket.userId));
            if (userSnap.exists()) {
              userDetails = userSnap.data();
            }
          }
        } catch (e) {
          console.warn(`Could not fetch details for ${ticket.userName}`);
        }

        // Update Progress Bar
        setExportProgress(prev => prev + 1);

        // Format Data
        const bookedDate = ticket.bookedAt?.toDate ? ticket.bookedAt.toDate().toLocaleDateString() : 'N/A';
        const checkInTime = ticket.scannedAt?.toDate ? ticket.scannedAt.toDate().toLocaleTimeString() : 'Not Checked In';
        const status = ticket.scanned ? "Attended" : "Registered";
        
        // Data Fallbacks (Ticket data priority -> User Profile data -> N/A)
        const phone = userDetails.phoneNumber || userDetails.phone || 'N/A';
        const branch = userDetails.branch || ticket.userBranch || 'N/A'; // Ticket might not have branch, profile will
        const residency = userDetails.residency || userDetails.hostel || 'N/A'; // Hostel/Day Scholar
        const team = ticket.teamName || 'Solo';

        // Return CSV Row
        return `"${ticket.id}","${ticket.userName}","${ticket.userRollNo}","${ticket.userEmail}","${phone}","${branch}","${residency}","${team}","${status}","${bookedDate}","${checkInTime}"`;
      });

      // Wait for all fetches to complete
      const rows = await Promise.all(fullDataPromises);
      
      // Join rows
      csvContent += rows.join("\n");

      // Step C: Trigger Download
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${eventData.title.replace(/\s+/g, '_')}_MasterList.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("Export Error:", err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-black/50">
           <div>
             <h2 className="text-xl font-black dark:text-white">{eventData.title}</h2>
             <p className="text-xs text-zinc-500 font-bold tracking-widest uppercase">Attendees & Export</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full text-zinc-500"><X className="w-5 h-5"/></button>
        </div>

        {/* Toolbar */}
        <div className="p-6 flex flex-col md:flex-row gap-4 border-b border-zinc-100 dark:border-zinc-800">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"/>
              <input 
                type="text" 
                placeholder="Search name or roll no..." 
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-black rounded-xl border-none outline-none font-medium dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           
           <button 
             onClick={downloadCsv} 
             disabled={exporting}
             className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 transition-all"
           >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> 
                  Generating ({Math.round((exportProgress / participants.length) * 100)}%)
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Export Full Data
                </>
              )}
           </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-0">
           {loading ? (
             <div className="flex justify-center p-10"><span className="animate-spin text-indigo-600">Loading...</span></div>
           ) : filtered.length === 0 ? (
             <div className="text-center p-10 text-zinc-400">No attendees found.</div>
           ) : (
             <table className="w-full text-left border-collapse">
               <thead className="bg-zinc-50 dark:bg-black sticky top-0 z-10">
                 <tr>
                   <th className="p-4 text-xs font-black text-zinc-400 uppercase tracking-widest">User</th>
                   <th className="p-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Roll No</th>
                   <th className="p-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Status</th>
                   <th className="p-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Check-In</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                 {filtered.map(p => (
                   <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                     <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs">
                             {p.userName?.charAt(0) || <User className="w-4 h-4"/>}
                           </div>
                           <div>
                             <p className="font-bold text-sm dark:text-zinc-200">{p.userName || 'Unknown'}</p>
                             <p className="text-[10px] text-zinc-400">{p.userEmail}</p>
                           </div>
                        </div>
                     </td>
                     <td className="p-4 text-sm font-mono text-zinc-500">{p.userRollNo || 'N/A'}</td>
                     <td className="p-4">
                        {p.scanned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold uppercase">
                            <CheckCircle className="w-3 h-3"/> Attended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 text-zinc-500 rounded-md text-xs font-bold uppercase">
                            <Clock className="w-3 h-3"/> Pending
                          </span>
                        )}
                     </td>
                     <td className="p-4 text-xs font-mono text-zinc-400">
                       {p.scannedAt?.toDate ? p.scannedAt.toDate().toLocaleTimeString() : '-'}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
        </div>
        
        {/* Footer Info */}
        <div className="p-4 bg-zinc-50 dark:bg-black/50 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <p className="text-[10px] text-zinc-400">
                Pro Tip: Clicking "Export Full Data" fetches detailed info (Phone, Residency) from user profiles.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ManageEventModal;