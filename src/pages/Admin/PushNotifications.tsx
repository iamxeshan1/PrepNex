import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Send, Trash2, Bell, Clock, Info } from 'lucide-react';
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
        alert('Notification sent to user!');
      } else {
        await addDoc(collection(db, 'notifications'), {
          ...form,
          createdAt: serverTimestamp(),
          sentBy: 'Admin'
        });
        alert('Notification sent to all users!');
      }
      setForm({ title: '', message: '', url: '', userId: '' });
    } catch (error) {
      console.error(error);
      alert('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification history?')) return;
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AdminLayout title="Push Notifications">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Send Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Send className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-black text-slate-800 tracking-tight">Send New Notification</h2>
                <p className="text-sm text-slate-500 font-medium">Broadcast a message to all active users</p>
              </div>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Notification Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Mock Test Live!"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Message Body</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell your users what's happening..."
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Target User ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty for all users"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  value={form.userId}
                  onChange={e => setForm({ ...form, userId: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Redirect URL (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. /dashboard or https://..."
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {sending ? 'Sending...' : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Notification
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
            <div className="flex gap-4">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900 mb-1">How it works</h3>
                <p className="text-sm text-blue-700 leading-relaxed font-medium">
                  When you send a notification, it will be instantly delivered to all users who have the app open. 
                  Users who have granted notification permissions will see a browser popup, while others will 
                  see an in-app toast notification.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[600px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-2xl">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="font-black text-slate-800 tracking-tight">Notification History</h2>
            </div>
            <span className="text-xs font-black px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg uppercase tracking-wider">
              {notifications.length} Sent
            </span>
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 scrollbar-hide">
            <AnimatePresence mode="popLayout">
              {notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-100 group relative"
                >
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 bg-white rounded-xl border border-slate-200">
                      <Bell className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-slate-800 truncate mb-1 pr-8">{notif.title}</h3>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed mb-3">{notif.message}</p>
                      
                      <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {notif.createdAt?.toDate().toLocaleString() || 'Just now'}
                        </span>
                        {notif.url && (
                          <span className="text-primary truncate max-w-[150px]">
                            URL: {notif.url}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {!loading && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No notifications sent yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
