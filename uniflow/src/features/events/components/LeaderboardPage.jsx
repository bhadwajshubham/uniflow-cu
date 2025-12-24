import { useEffect, useState } from 'react';
import { Trophy, Medal, Crown, Loader2, Sparkles } from 'lucide-react';
import { getLeaderboardData } from '../services/gamificationService';

const LeaderboardPage = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getLeaderboardData();
      setLeaders(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500 animate-pulse" />;
    if (index === 1) return <Medal className="h-6 w-6 text-zinc-400 fill-zinc-400" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-700 fill-amber-700" />;
    return <span className="font-bold text-zinc-400">#{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans p-6 md:p-12">
      
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
          <Trophy className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-4xl font-black text-zinc-900 dark:text-white mb-2">Campus Hall of Fame</h1>
        <p className="text-zinc-500">Top students ranked by event attendance and participation.</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
             <p className="text-zinc-500">No data yet. Be the first to attend an event!</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            
            {/* Top 3 Banner (Optional visual flair) */}
            <div className="h-2 bg-gradient-to-r from-yellow-400 via-zinc-300 to-amber-700"></div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {leaders.map((student, index) => (
                <div 
                  key={student.userId} 
                  className={`flex items-center gap-4 p-6 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50
                    ${index === 0 ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}
                  `}
                >
                  {/* Rank */}
                  <div className="w-10 flex justify-center">
                    {getRankIcon(index)}
                  </div>

                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2
                    ${index === 0 ? 'bg-yellow-100 border-yellow-500 text-yellow-700' : 
                      index === 1 ? 'bg-zinc-100 border-zinc-400 text-zinc-700' :
                      index === 2 ? 'bg-amber-100 border-amber-600 text-amber-800' :
                      'bg-indigo-50 border-transparent text-indigo-600'
                    }
                  `}>
                    {student.userName[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      {student.userName}
                      {index === 0 && <Sparkles className="h-4 w-4 text-yellow-500" />}
                    </h3>
                    <p className="text-xs text-zinc-500">{student.eventsAttended} Events Attended</p>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <span className="block text-xl font-black text-indigo-600 dark:text-indigo-400">
                      {student.points}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">XP Points</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;