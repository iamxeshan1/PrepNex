import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Megaphone, Calendar, ChevronRight, Info, AlertTriangle, Zap, ArrowLeft, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { format } from 'date-fns';

interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'update';
  createdAt: string;
}

export default function Announcements() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice)));
      } catch (error) {
        console.error("Error fetching notices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: AlertTriangle };
      case 'update':
        return { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', icon: Zap };
      default:
        return { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', icon: Info };
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Announcements</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Platform Updates</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Bell className="w-5 h-5" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400 font-medium">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            <p>Fetching latest updates...</p>
          </div>
        ) : notices.length > 0 ? (
          <div className="space-y-6">
            {notices.map((notice, index) => {
              const styles = getTypeStyles(notice.type);
              const date = new Date(notice.createdAt);
              const Icon = styles.icon;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={notice.id}
                  className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all"
                >
                  <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${styles.bg} ${styles.text} flex items-center justify-center shrink-0 border ${styles.border}`}>
                      <Icon className="w-7 h-7 md:w-8 md:h-8" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${styles.bg} ${styles.text}`}>
                          {notice.type}
                        </span>
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {format(date, 'MMMM dd, yyyy')}
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-3 group-hover:text-indigo-700 transition-colors">
                        {notice.title}
                      </h2>
                      <div className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                        {notice.content}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
               <Megaphone className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No Announcements Yet</h3>
            <p className="text-slate-500 font-medium">We'll post updates here as they become available.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm font-bold text-slate-400">© {new Date().getFullYear()} PrepNext. Staying Ahead of the Curve.</p>
        </div>
      </footer>
    </div>
  );
}
