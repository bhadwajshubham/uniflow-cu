import { useEffect, useState } from 'react';
import { X, Loader2, Download, Users, Trophy, Mail, Search } from 'lucide-react';
import { getEventParticipants } from '../services/adminService';

const ManageEventModal = ({ event, onClose }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getEventParticipants(event.id);
        setParticipants(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [event.id]);

  // Simple CSV Export Function
  const handleExport = () => {
    const headers = ["Name", "Email", "Type", "Team Name", "Team Code", "Status"];
    const rows = participants.map(p => [
      p.userName, 
      p.userEmail, 
      p.type, 
      p.teamName || '-', 
      p.teamCode || '-', 
      p.status
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${event.title}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const filtered = participants.filter(p => 
    p.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900">
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              {event.title} <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs">{participants.length} Registered</span>
            </h3>
            <p className="text-sm text-zinc-500">Manage attendees and teams</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex gap-4 bg-white dark:bg-zinc-900">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search student or email..." 
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto bg-zinc-50 dark:bg-black">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
              <Users className="h-12 w-12 mb-4 opacity-50" />
              <p>No attendees found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-100 dark:bg-zinc-800/50 sticky top-0 backdrop-blur-sm z-10">
                <tr>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Student</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Type</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Team Info</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filtered.map(p => (
                  <tr key={p.id} className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-zinc-900 dark:text-white">{p.userName}</div>
                      <div className="text-xs text-zinc-500 flex items-center gap-1">
                         <Mail className="h-3 w-3" /> {p.userEmail}
                      </div>
                    </td>
                    <td className="p-4">
                      {p.type === 'team_leader' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-md">
                          <Trophy className="h-3 w-3" /> Leader
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold rounded-md">
                          Individual
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {p.teamName ? (
                        <div>
                          <div className="font-bold text-indigo-600 dark:text-indigo-400">{p.teamName}</div>
                          <div className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded inline-block mt-1">
                            {p.teamCode}
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-300">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right text-xs text-zinc-500 font-mono">
                      {p.createdAt?.toDate().toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageEventModal;