import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { MessageCircle, CheckCircle2, Clock, Send } from 'lucide-react';

export default function AdminHelpdesk() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setTickets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleReply = async (ticketId: string) => {
    const text = replyText[ticketId];
    if (!text) return;
    
    setSubmitting(ticketId);
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        reply: text,
        status: 'closed'
      });
      alert('Reply sent successfully!');
      fetchTickets();
    } catch (err) {
      alert('Failed to send reply');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <AdminLayout title="Helpdesk">
      <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-in">
        <div>
          <h2 className="text-xl font-black text-secondary tracking-tight">Support Tickets</h2>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Manage user queries</p>
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
          <MessageCircle className="w-6 h-6" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
           <MessageCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
           <h3 className="text-lg font-bold text-slate-800">No support tickets</h3>
           <p className="text-slate-500 font-bold mt-1 text-sm">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight mb-1">{ticket.subject}</h3>
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                    <span className="text-primary">{ticket.userName}</span> ({ticket.userEmail})
                  </p>
                </div>
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                  ticket.status === 'open' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                }`}>
                  {ticket.status === 'open' ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {ticket.status}
                </span>
              </div>

              <div className="mb-6">
                <p className="text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-xl">{ticket.message}</p>
              </div>

              {ticket.reply ? (
                 <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                   <div className="flex items-center gap-2 mb-2 text-primary text-xs font-black uppercase tracking-widest">
                     <CheckCircle2 className="w-4 h-4" /> Your Reply
                   </div>
                   <p className="text-sm font-bold text-slate-800">{ticket.reply}</p>
                 </div>
              ) : (
                <div className="mt-4">
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold text-sm resize-y mb-3"
                    placeholder="Write your response here..."
                    value={replyText[ticket.id] || ''}
                    onChange={(e) => setReplyText({ ...replyText, [ticket.id]: e.target.value })}
                  />
                  <button 
                    onClick={() => handleReply(ticket.id)}
                    disabled={submitting === ticket.id || !replyText[ticket.id]}
                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all font-logo flex items-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {submitting === ticket.id ? 'Sending...' : <><Send className="w-4 h-4" /> Send Reply & Close Ticket</>}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
