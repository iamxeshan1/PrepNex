import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  deleteDoc, 
  doc,
  getDocs
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Send, 
  Trash2, 
  Mail, 
  Clock, 
  Info, 
  Shield, 
  MessageSquare, 
  Ticket, 
  Gift, 
  Users, 
  Loader2, 
  AlertTriangle,
  CheckCircle,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmationModal from '../../components/ConfirmationModal';
import Toast, { ToastType } from '../../components/Toast';

interface DirectMessage {
  id: string;
  title: string;
  content: string;
  type: 'message' | 'voucher' | 'coupon';
  code?: string;
  userId: string;
  createdAt: string;
  senderId: string;
  readBy?: string[];
}

export default function DirectBroadcasts() {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);

  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'message' as 'message' | 'voucher' | 'coupon',
    code: ''
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    messageId: '',
    title: '',
    message: ''
  });

  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as ToastType
  });

  useEffect(() => {
    // Listen to sent direct/broadcast messages in real-time
    const q = query(
      collection(db, 'user_messages'), 
      orderBy('createdAt', 'desc'), 
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DirectMessage[];
      setMessages(data);
      setLoading(false);
    });

    // Fetch total active students count to show in info card
    const getStudents = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        setTotalStudentsCount(snap.size);
      } catch (err) {
        console.error(err);
      }
    };
    getStudents();

    return () => unsub();
  }, []);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setSending(true);

    try {
      // Create broadcast user_message doc for "all" users
      await addDoc(collection(db, 'user_messages'), {
        userId: 'all',
        title: form.title,
        content: form.content,
        type: form.type,
        code: form.type !== 'message' ? form.code : '',
        senderId: 'Admin',
        createdAt: new Date().toISOString(),
        readBy: []
      });

      // Also create a entry in push notifications so they receive live popups!
      await addDoc(collection(db, 'notifications'), {
        title: form.title,
        message: form.content,
        url: '/dashboard',
        createdAt: new Date().toISOString(),
        sentBy: 'Admin'
      });

      setToast({
        isVisible: true,
        message: `High-priority broadcast dispatched successfully to all ${totalStudentsCount || 'active'} nodes.`,
        type: 'success'
      });

      setForm({
        title: '',
        content: '',
        type: 'message',
        code: ''
      });
    } catch (error) {
      console.error(error);
      setToast({
        isVisible: true,
        message: 'Broadcast launch failed. Verify connection protocol.',
        type: 'error'
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      messageId: id,
      title: 'Purge Dispatch Node',
      message: 'Are you sure you want to permanently delete this message dispatch from the catalog? Users will no longer be able to see this message or coupon code in their dashboard.'
    });
  };

  const confirmDelete = async () => {
    const id = confirmModal.messageId;
    try {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      await deleteDoc(doc(db, 'user_messages', id));
      setToast({
        isVisible: true,
        message: 'Inbox dispatch node purged successfully.',
        type: 'success'
      });
    } catch (error) {
       console.error(error);
       setToast({
        isVisible: true,
        message: 'Purge operation failed.',
        type: 'error'
      });
    }
  };

  return (
    <AdminLayout title="Inbox Dispatch Center">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Targeted Messaging & Broadcasts</h2>
           <p className="text-[10px] font-black text-[#006e5d] uppercase tracking-widest mt-1 italic">Deliver premium direct messages, vouchers, or discount coupons directly to user's dashboard notifications</p>
        </div>
        <div className="w-14 h-14 bg-[#006e5d] text-white rounded-2xl flex items-center justify-center shadow-xl shadow-teal-100">
           <Mail className="w-7 h-7" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-40">
        <div className="space-y-10">
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 -translate-y-1/2 translate-x-1/2 rounded-full opacity-50 pointer-events-none" />
            
            <header className="mb-10 relative flex items-center gap-5">
               <div className="w-12 h-12 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-center text-[#006e5d]">
                  <Send className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight font-display uppercase">Send Message to All Users</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Broadcast direct message or reward vouncher to all registered aspirants</p>
               </div>
            </header>

            <form onSubmit={handleSendBroadcast} className="space-y-6 relative">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dispatch Mode & Type</label>
                 <select 
                   value={form.type} 
                   onChange={e => setForm({...form, type: e.target.value as any})}
                   className="w-full px-8 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none focus:ring-4 focus:ring-teal-500/5 text-sm"
                 >
                   <option value="message">Direct Text Announcement</option>
                   <option value="voucher">Gift Voucher 🎁</option>
                   <option value="coupon">Discount Coupon 🎫</option>
                 </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dispatch Title</label>
                <input
                  type="text" required placeholder={form.type === 'message' ? "e.g., Weekly Live Mock Test Schedule" : "e.g., Special Reward: Pass Pro Discount Coupon"}
                  className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-teal-500/5 font-bold shadow-inner"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Narrative Content / Body</label>
                <textarea
                  required rows={4} placeholder="Establishing contextual messaging foundation or instructions..."
                  className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-teal-500/5 font-medium resize-none shadow-inner leading-relaxed"
                  value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                />
              </div>

              {form.type !== 'message' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5" /> Voucher / Coupon Code
                  </label>
                  <input
                    type="text" required placeholder="e.g. GETPASS50 or PREP-GOLD-100"
                    className="w-full px-8 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/5 font-bold shadow-inner uppercase text-sm"
                    value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                  />
                </div>
              )}

              <div className="pt-6 border-t border-slate-50">
                 <button
                   type="submit" disabled={sending}
                   className="w-full py-5 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:shadow-[#006e5d]/20 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
                 >
                   {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                   {sending ? 'Launching Broadcast...' : 'Initiate Broadcast Dispatch'}
                 </button>
              </div>
            </form>
          </div>

          <div className="bg-[#002f26] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
             <div className="flex gap-6 relative">
                <Info className="w-10 h-10 text-teal-400 shrink-0" />
                <div>
                   <h3 className="text-xl font-bold tracking-tight font-display uppercase leading-tight mb-2">Omnipresence Dispatch</h3>
                   <p className="text-xs font-medium text-teal-100 leading-relaxed italic pr-4">Sent messages immediately load on the user's dashboard. A live badge and bell trigger are pushed directly using zero-latency subscription connections.</p>
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
                 <h2 className="text-xl font-black text-[#001f19] tracking-tight font-display uppercase">Inbox Registry Logs</h2>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Audit of sent messages & gift codes</p>
              </div>
            </div>
          </header>

          <div className="flex-1 space-y-6 overflow-y-auto pr-3 custom-scrollbar px-2">
            <AnimatePresence mode="popLayout">
              {messages.map((notif, idx) => {
                const isBroadcast = notif.userId === 'all';
                return (
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
                      className="absolute top-6 right-6 p-2 bg-white border border-slate-100 text-slate-300 hover:text-rose-600 hover:border-rose-100 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm shadow-slate-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-start gap-6 relative">
                      <div className={`shrink-0 w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-[#006e5d] group-hover:text-white transition-all duration-500`}>
                        {notif.type === 'voucher' ? (
                          <Gift className="w-5 h-5 text-amber-500 group-hover:text-white transition-colors" />
                        ) : notif.type === 'coupon' ? (
                          <Ticket className="w-5 h-5 text-emerald-500 group-hover:text-white transition-colors" />
                        ) : (
                          <MessageSquare className="w-5 h-5 text-teal-600 group-hover:text-white transition-colors" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight truncate pr-10">{notif.title}</h3>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed mb-6 group-hover:text-slate-700 transition-colors">{notif.content}</p>

                        {notif.code && (
                          <div className="mb-6 p-3 bg-teal-50 border border-teal-100/50 rounded-xl inline-flex items-center gap-2 text-xs font-black text-[#006e5d] uppercase tracking-wider">
                            <Ticket className="w-4 h-4" /> CODE: {notif.code}
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-6 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                             <Clock className="w-3.5 h-3.5" />
                             {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Syncing...'}
                          </div>
                          
                          <div className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest ${isBroadcast ? 'text-blue-500' : 'text-emerald-600'}`}>
                            <Users className="w-3.5 h-3.5" /> {isBroadcast ? 'All registered' : 'Single User'}
                          </div>

                          <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-[#006e5d]">
                            <Eye className="w-3.5 h-3.5" /> Seen: {notif.readBy?.length || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {loading ? (
               <div className="py-24 text-center">
                  <Loader2 className="w-10 h-10 text-slate-200 animate-spin mx-auto mb-4" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Syncing Messages Ledger stream...</p>
               </div>
            ) : messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-40 text-center px-10">
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border-4 border-dashed border-slate-100">
                  <Mail className="w-10 h-10 text-slate-200" />
                </div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">No notifications or vounchers sent</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-50 flex items-center gap-3 text-[8px] font-black text-slate-300 uppercase tracking-widest px-2">
             <Shield className="w-4 h-4" /> Ledger Integrity & Broadcast protocols verified
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
        confirmText="Confirm Purge"
      />

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </AdminLayout>
  );
}
