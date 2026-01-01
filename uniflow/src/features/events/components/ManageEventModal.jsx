import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { X, FileSpreadsheet, Users, Trash2, Mail, Download, Loader2 } from 'lucide-react';

const ManageEventModal = ({ isOpen, onClose, eventData }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Fetch Participants when modal opens
  useEffect(() => {
    if (isOpen && eventData?.id) {
      const fetchParticipants = async () => {
        try {
          const q = query(
            collection(db, 'registrations'), 
            where('eventId', '==', eventData.id)
          );
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setParticipants(list);
        } catch (error) {
          console.error("Error fetching participants:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchParticipants();
    }
  }, [isOpen, eventData]);

  if (!isOpen || !eventData) return null;

  // 📊 MASTER CSV DOWNLOAD FUNCTION
  const downloadCsv = async () => {
    setExporting(true);
    try {
      if (participants.length === 0) {
        alert("No participants to export.");
        setExporting(false);
        return;
      }

      // 1. CSV Headers
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Name,Roll No,Email,Phone,Branch,Status,Check-In Time\n";

      // 2. CSV Rows
      participants.forEach(p => {
        const checkInTime = p.usedAt ? new Date(p.usedAt.toDate()).toLocaleTimeString() : 'Pending';
        const status = p.used ? 'Present' : 'Registered';
        
        const row = [
          `"${p.userName || ''}"`,
          `"${p.userRollNo || 'N/A'}"`,
          `"${p.userEmail || ''}"`,
          `"${p.userPhone || 'N/A'}"`,
          `"${p.userBranch || 'N/A'}"`,
          `"${status}"`,
          `"${checkInTime}"`
        ].join(",");

        csvContent += row + "\n";
      });

      // 3. Trigger Download
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `MasterList_${eventData.title.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("Export failed:", err);
      alert("CSV Export failed.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-3xl">
          <div>
            <h2 className="text-xl font-black dark:text-white">Manage Event</h2>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{eventData.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 dark:text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Action Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-indigo-400">Total Registered</p>
                <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{participants.length}</p>
              </div>
              <Users className="w-8 h-8 text-indigo-300" />
            </div>

            <button 
              onClick={downloadCsv}
              disabled={exporting}
              className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-900/30 flex items-center justify-between hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors group text-left w-full"
            >
              <div>
                <p className="text-[10px] font-black uppercase text-green-600 dark:text-green-400">Export Data</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-300 flex items-center gap-2">
                  {exporting ? 'Generating...' : 'Download CSV'}
                </p>
              </div>
              {exporting ? <Loader2 className="w-6 h-6 text-green-500 animate-spin" /> : <Download className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform" />}
            </button>
          </div>

          {/* Participants List Preview */}
          <div>
            <h3 className="text-sm font-black uppercase text-zinc-400 mb-4 tracking-widest">Recent Registrations</h3>
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500"/></div>
              ) : participants.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-sm font-medium">No registrations yet.</div>
              ) : (
                participants.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-black border border-zinc-100 dark:border-zinc-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        {p.userName?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold dark:text-white">{p.userName}</p>
                        <p className="text-[10px] text-zinc-500">{p.userRollNo}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${p.used ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                      {p.used ? 'Present' : 'Registered'}
                    </span>
                  </div>
                ))
              )}
              {participants.length > 5 && (
                <p className="text-center text-xs text-zinc-400 mt-2">...and {participants.length - 5} more (Download CSV to see all)</p>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-3xl flex justify-end">
          <button onClick={onClose} className="px-6 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageEventModal;