import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Megaphone, X } from 'lucide-react';

const Announcements = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      // Get the single most recent announcement
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setAnnouncement(snap.docs[0].data());
      }
    };
    fetchLatest();
  }, []);

  if (!announcement || !isVisible) return null;

  // Visual style based on type
  const isUrgent = announcement.type === 'urgent';
  const bgColor = isUrgent ? 'bg-red-600' : 'bg-indigo-600';

  return (
    <div className={`${bgColor} text-white px-4 py-3 shadow-lg relative animate-in slide-in-from-top duration-500`}>
      <div className="max-w-7xl mx-auto flex items-start md:items-center gap-3">
        <div className="p-2 bg-white/20 rounded-full shrink-0 animate-pulse">
          <Megaphone className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 mr-8">
          <p className="text-sm font-medium leading-relaxed">
            <span className="font-bold uppercase tracking-wider opacity-80 mr-2">
              {isUrgent ? 'URGENT UPDATE:' : 'ANNOUNCEMENT:'}
            </span>
            {announcement.message}
          </p>
          <p className="text-[10px] opacity-70 mt-1">
            {new Date(announcement.createdAt?.seconds * 1000).toLocaleString()}
          </p>
        </div>
        <button 
          onClick={() => setIsVisible(false)} 
          className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Announcements;