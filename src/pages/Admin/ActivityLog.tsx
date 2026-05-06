import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, query, orderBy, getDocs, limit, where, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Activity, User, BookOpen, CreditCard, RotateCcw, Trash2, Clock, Shield, Search, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { ActivityAction } from '../../services/activityLogger';
import { motion, AnimatePresence } from 'motion/react';

const getActivityIcon = (action: string) => {
  switch (action) {
    case ActivityAction.TEST_ATTEMPT:
      return <BookOpen className="w-5 h-5" />;
    case ActivityAction.PROFILE_UPDATE:
      return <User className="w-5 h-5" />;
    case ActivityAction.SUBSCRIPTION_CHANGE:
      return <CreditCard className="w-5 h-5" />;
    default:
      return <Activity className="w-5 h-5" />;
  }
};

const getActivityStyles = (action: string) => {
  switch (action) {
    case ActivityAction.TEST_ATTEMPT: return 'bg-blue-50 border-blue-100 text-blue-600';
    case ActivityAction.PROFILE_UPDATE: return 'bg-purple-50 border-purple-100 text-purple-600';
    case ActivityAction.SUBSCRIPTION_CHANGE: return 'bg-green-50 border-green-100 text-green-600';
    default: return 'bg-slate-50 border-slate-100 text-slate-400';
  }
}

export default function AdminActivityLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  const cleanupOldLogs = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const q = query(collection(db, 'activity_logs'), where('createdAt', '<', thirtyDaysAgo.toISOString()));
      const snap = await getDocs(q);
      if (snap.empty) return;
      setCleaning(true);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (error) {
       console.error(error);
    } finally {
      setCleaning(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      await cleanupOldLogs();
      const q = query(collection(db, 'activity_logs'), orderBy('createdAt', 'desc'), limit(100));
      const snap = await getDocs(q);
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
       console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <AdminLayout title="Security Ledger">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Global Activity Streams</h2>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Last 100 system nodes and event vectors</p>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={fetchLogs} 
             disabled={loading}
             className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-95 group"
           >
             <RotateCcw className={`w-6 h-6 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
           </button>
           <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
             <Activity className="w-7 h-7" />
           </div>
        </div>
      </div>

      <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 -translate-y-1/2 translate-x-1/2 rounded-full" />
            <div className="relative">
               <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-2"><Shield className="w-3.5 h-3.5" /> Retention Policy</span>
               <h4 className="text-xl font-black text-slate-800 tracking-tight">30-Day Auto Purge</h4>
            </div>
         </div>
         <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative">
               <span className="text-[8px] font-black text-white/50 uppercase tracking-widest flex items-center gap-2 mb-2"><Sparkles className="w-3.5 h-3.5" /> Registry Density</span>
               <h4 className="text-xl font-black tracking-tight">{logs.length} Active Vectors</h4>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 -translate-y-1/2 translate-x-1/2 rounded-full" />
            <div className="relative">
               <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-2"><Clock className="w-3.5 h-3.5" /> Global Sync</span>
               <h4 className="text-xl font-black text-slate-800 tracking-tight">Real-time Hooking</h4>
            </div>
         </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
           <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto mb-4" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Intercepting Event Signals...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-40 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50">
           <Activity className="w-20 h-20 text-slate-100 mx-auto mb-6" />
           <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Signal Buffer Exhausted • No Recent Vectors</p>
        </div>
      ) : (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden mb-40">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-1/4">Originating Entity</th>
                  <th className="py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Event Vector Details</th>
                  <th className="py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-1/6 text-right">Synchronization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.01 }}
                    key={log.id} 
                    className="group border-b border-slate-50 hover:bg-indigo-50/10 transition-colors"
                  >
                    <td className="py-6 px-10">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                            {log.userName?.[0].toUpperCase() || '?'}
                         </div>
                         <div>
                            <p className="font-black text-slate-900 uppercase tracking-tight text-xs leading-none mb-1">{log.userName || 'System Auto'}</p>
                            <p className="text-[10px] text-slate-400 font-bold italic truncate max-w-[150px]">{log.userEmail}</p>
                         </div>
                      </div>
                    </td>
                    <td className="py-6 px-10">
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm ${getActivityStyles(log.action)}`}>
                          {getActivityIcon(log.action)}
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">{log.action}</p>
                          <p className="text-sm font-black text-slate-700 tracking-tight">{log.details}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-10 text-right">
                      <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl whitespace-nowrap group-hover:bg-white transition-colors">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
