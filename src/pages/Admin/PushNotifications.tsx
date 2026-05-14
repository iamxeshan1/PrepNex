import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Send, Trash2, Bell, Clock, Info, Shield, ArrowRight, Zap, Target, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: string;
  title: string;
  message: string;
  url?: string;
  createdAt: any;
  sentBy: string;
}

export default function PushNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    url: '',
    userId: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      setNotifications(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) return;
    setSending(true);
    try {
      if (form.userId) {
        await fetch('/api/admin/send-to-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: form.userId, title: form.title, body: form.message })
        });
      } else {
        await addDoc(collection(db, 'notifications'), {
          ...form,
          createdAt: serverTimestamp(),
          sentBy: 'Admin'
        });
      }
      setForm({ title: '', message: '', url: '', userId: '' });
    } catch (error) {
       console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string, confirmed = false) => {
    if (!window.confirm('Verify: Permanently clear this notification node from history?')) return;
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
       console.error(error);
    }
  };

  return (
    <AdminLayout title="Signal Center">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Communication Broadcast Engine</h2>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Instant dispatch of instructional or promotional nodes</p>
        </div>
        <div className="w-14 h-14 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-teal-100">
           <Bell className="w-7 h-7" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-40">
        <div className="space-y-10">
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 -translate-y-1/2 translate-x-1/2 rounded-full opacity-50 pointer-events-none" />
            
            <header className="mb-10 relative flex items-center gap-5">
               <div className="w-12 h-12 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-center text-teal-600">
                  <Zap className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight font-display uppercase">Forge Signal</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Broadcast logic for active network entities</p>
               </div>
            </header>

            <form onSubmit={handleSend} className="space-y-6 relative">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Signal Identity (Title)</label>
                <input
                  type="text" required placeholder="e.g. Protocol Update: New Mock Bank Live"
                  className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-teal-500/5 font-bold shadow-inner"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proposition Narrative (Message)</label>
                <textarea
                  required rows={4} placeholder="Establishing contextual foundation for the alert..."
                  className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-teal-500/5 font-medium resize-none shadow-inner leading-relaxed"
                  value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Target className="w-3.5 h-3.5 text-rose-500" /> Selective Targeting (ID)</label>
                    <input
                      type="text" placeholder="Global Dispatch (Empty)"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold shadow-inner text-xs"
                      value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })}
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vector Redirection (URL)</label>
                    <input
                      type="text" placeholder="e.g. /dashboard/exams"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold shadow-inner text-xs"
                      value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
                    />
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                 <button
                   type="submit" disabled={sending}
                   className="w-full py-5 bg-[#002f26] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-black transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
                 >
                   {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                   {sending ? 'Projecting Signal...' : 'Initiate Broadcast Cycle'}
                 </button>
              </div>
            </form>
          </div>

          <div className="bg-teal-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-teal-100 relative overflow-hidden group">
             <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
             <div className="flex gap-6 relative">
                <Info className="w-10 h-10 text-white/50 shrink-0" />
                <div>
                   <h3 className="text-2xl font-black tracking-tight font-display uppercase leading-tight mb-4">Propagation Protocol</h3>
                   <p className="text-sm font-medium text-teal-100 leading-relaxed italic pr-4">Broadcasts are multi-channeled. Active entities receive priority toast hooks, while dormant nodes receive secondary browser pops-ups.</p>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm min-h-[600px] flex flex-col">
          <header className="flex items-center justify-between mb-10 shrink-0 px-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-[#001f19] tracking-tight font-display uppercase">Dispatch Ledger</h2>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Audit of last 50 propogations</p>
              </div>
            </div>
          </header>

          <div className="flex-1 space-y-6 overflow-y-auto pr-3 custom-scrollbar px-2">
            <AnimatePresence mode="popLayout">
              {notifications.map((notif, idx) => (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.02 }}
                  className="p-8 rounded-[2.5rem] bg-slate-50/50 border border-slate-100 group relative hover:bg-white hover:shadow-xl transition-all duration-500"
                >
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="absolute top-6 right-6 p-2 bg-white border border-slate-100 text-slate-300 hover:text-rose-600 hover:border-rose-100 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-start gap-6 relative">
                    <div className="shrink-0 w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-teal-600 group-hover:text-white transition-all duration-500">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate pr-10 mb-2">{notif.title}</h3>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-6 group-hover:text-slate-700 transition-colors">{notif.message}</p>
                      
                      <div className="flex items-center gap-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                           <Clock className="w-3.5 h-3.5" />
                           {notif.createdAt?.toDate().toLocaleString() || 'Syncing...'}
                        </div>
                        {notif.url && (
                          <div className="flex items-center gap-2 text-[8px] font-black text-teal-400 uppercase tracking-widest truncate max-w-[150px]">
                            <Target className="w-3.5 h-3.5" /> {notif.url}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading ? (
               <div className="py-24 text-center">
                  <Loader2 className="w-10 h-10 text-slate-200 animate-spin mx-auto mb-4" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pulling History Stream...</p>
               </div>
            ) : notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-40 text-center px-10">
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border-4 border-dashed border-slate-100">
                  <Bell className="w-10 h-10 text-slate-200" />
                </div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Signal Registry Void</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-50 flex items-center gap-3 text-[8px] font-black text-slate-300 uppercase tracking-widest px-2">
             <Shield className="w-4 h-4" /> Secure Broadcast Verification Active
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
