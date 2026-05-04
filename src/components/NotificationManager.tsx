import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const NotificationManager = () => {
  const { user } = useAuth();
  const [lastNotifTime, setLastNotifTime] = useState<number>(Date.now());
  const [toast, setToast] = useState<{ title: string, message: string, url?: string } | null>(null);

  useEffect(() => {
    // Request notification permission on mount if signed in
    if (user && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Listen only for NEW notifications created after this component mounted
    const q = query(
      collection(db, 'notifications'), 
      where('createdAt', '>', Timestamp.fromMillis(lastNotifTime)),
      orderBy('createdAt', 'desc'), 
      limit(1)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) return;
      
      const notif = snap.docs[0].data();
      const title = notif.title || 'New Notification';
      const message = notif.message || '';
      const url = notif.url;

      // 1. Browser Notification
      if ('Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body: message,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            data: { url },
            tag: 'prepnext-broadcast' // Prevents duplicate notifications
          });
        });
      }

      // 2. In-app Toast
      setToast({ title, message, url });
      
      // Update last seen time to avoid duplicates
      setLastNotifTime(Date.now());

      // Auto-hide toast
      setTimeout(() => setToast(null), 8000);
    });

    return () => unsub();
  }, [user, lastNotifTime]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, scale: 0.9, x: '-50%' }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md"
        >
          <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex items-start gap-4 ring-1 ring-black/5">
            <div className="p-3 bg-primary/10 rounded-2xl shrink-0">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0 py-1">
              <h4 className="font-black text-slate-800 leading-tight mb-1 truncate">{toast.title}</h4>
              <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-2 mb-3">
                {toast.message}
              </p>
              
              {toast.url && (
                <button
                  onClick={() => {
                    window.location.href = toast.url!;
                    setToast(null);
                  }}
                  className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
                >
                  View Details →
                </button>
              )}
            </div>

            <button 
              onClick={() => setToast(null)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
