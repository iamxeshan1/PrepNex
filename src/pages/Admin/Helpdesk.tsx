import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { MessageCircle, CheckCircle2, Clock, Send, Trash2, X, MessageSquare, User, Info, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminHelpdesk() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const allTickets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      const closedTickets = allTickets.filter((t: any) => t.status === 'closed');
      if (closedTickets.length > 0) {
        for (const t of closedTickets) {
          await deleteDoc(doc(db, 'tickets', t.id));
        }
        setTickets(allTickets.filter((t: any) => t.status !== 'closed'));
      } else {
        setTickets(allTickets);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleReply = async (ticketId: string) => {
    const text = replyText[ticketId];
    if (!text) return;
    
    setSubmitting(ticketId);
    try {
      const ticket = tickets.find(t => t.id === ticketId);
      const updatedMessages = [
        ...(ticket.messages || []),
        {
          sender: 'admin',
          text,
          createdAt: new Date().toISOString()
        }
      ];

      await updateDoc(doc(db, 'tickets', ticketId), {
        messages: updatedMessages,
        status: 'replied',
        updatedAt: new Date().toISOString()
      });
      
      setReplyText({ ...replyText, [ticketId]: '' });
      fetchTickets();
    } catch (err) {
      alert('Failed to send reply');
    } finally {
      setSubmitting(null);
    }
  };

  const handleClose = async (ticketId: string) => {
    if (!window.confirm('Mark this query as resolved?')) return;
    
    setClosing(ticketId);
    try {
      await deleteDoc(doc(db, 'tickets', ticketId));
      fetchTickets();
    } catch (err) {
      alert('Failed to resolve ticket');
    } finally {
      setClosing(null);
    }
  };

  return (
    <AdminLayout title="Resolve Hub">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Student Support Ledger</h2>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Real-time triage for institutional queries</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm flex flex-col items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Open Cases</span>
              <span className="text-lg font-black text-[#0f172a] font-display">{tickets.length}</span>
           </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
           <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto mb-6" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Resolve Channel...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50">
           <MessageSquare className="w-16 h-16 text-slate-100 mx-auto mb-4" />
           <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Query Repository Empty • Case Files Closed</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 pb-40">
          <AnimatePresence>
            {tickets.map((ticket, idx) => (
              <motion.div 
                key={ticket.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700 relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 -translate-y-1/2 translate-x-1/2 rounded-full opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                
                <div className="relative">
                  <header className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6 pb-6 border-b border-slate-50">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                             <User className="w-5 h-5" />
                          </div>
                          <div>
                             <h3 className="text-xl font-black text-slate-900 tracking-tight font-display uppercase">{ticket.subject}</h3>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{ticket.userName} • {ticket.userEmail}</p>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${
                        ticket.status === 'open' ? 'bg-amber-50 border-amber-100 text-amber-600' : 
                        ticket.status === 'replied' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                        'bg-emerald-50 border-emerald-100 text-emerald-600'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                          ticket.status === 'open' ? 'bg-amber-500' : 'bg-indigo-500'
                        }`} />
                        {ticket.status} Dispatch
                      </span>
                      <button 
                        onClick={() => handleClose(ticket.id)}
                        disabled={closing === ticket.id}
                        className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-rose-600 hover:border-rose-100 rounded-xl transition-all shadow-sm hover:scale-110 active:scale-95"
                        title="Archive Case"
                      >
                         <X className="w-5 h-5" />
                      </button>
                    </div>
                  </header>

                  <div className="space-y-6 mb-10 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100/50 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {/* Initial Message */}
                    {ticket.message && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] bg-white p-6 rounded-[2rem] rounded-tl-none border border-slate-100 shadow-sm">
                          <p className="text-sm font-bold text-slate-700 leading-relaxed italic pr-4">"{ticket.message}"</p>
                          <div className="mt-3 flex items-center gap-2">
                             <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Inaugural Query Node</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Interaction Thread */}
                    {(ticket.messages || []).map((msg: any, mIdx: number) => (
                      <div key={mIdx} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[85%] p-6 rounded-[2rem] border-2 shadow-sm ${
                          msg.sender === 'user' 
                            ? 'bg-white border-slate-100 rounded-tl-none' 
                            : 'bg-[#0f172a] border-[#0f172a] text-white rounded-tr-none'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${msg.sender === 'user' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                             <span className={`text-[8px] font-black uppercase tracking-widest ${msg.sender === 'user' ? 'text-slate-400' : 'text-slate-500'}`}>
                                {msg.sender === 'user' ? 'Aspirant Response' : 'Institutional Protocol'}
                             </span>
                          </div>
                          <p className={`text-sm font-bold leading-relaxed ${msg.sender === 'user' ? 'text-slate-800' : 'text-white'}`}>{msg.text}</p>
                          <div className="mt-3 flex items-center gap-2">
                             <span className={`text-[8px] font-bold ${msg.sender === 'user' ? 'text-slate-300' : 'text-white/40'}`}>
                                {new Date(msg.createdAt).toLocaleString()}
                             </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative group/reply">
                    <textarea 
                      className="w-full px-8 py-6 bg-white border border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-500/5 font-bold text-slate-800 shadow-xl transition-all h-28 resize-none"
                      placeholder="Input resolving protocol message..."
                      value={replyText[ticket.id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [ticket.id]: e.target.value })}
                    />
                    <button 
                      onClick={() => handleReply(ticket.id)}
                      disabled={submitting === ticket.id || !replyText[ticket.id]}
                      className="absolute right-4 bottom-4 p-5 bg-[#0f172a] text-white rounded-2xl hover:bg-black transition-all disabled:opacity-30 shadow-2xl active:scale-95 transform hover:-translate-x-1"
                    >
                      {submitting === ticket.id ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                    </button>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                        <Sparkles className="w-3.5 h-3.5" /> Direct Channel Protocol v2.4
                     </div>
                     <button onClick={() => handleClose(ticket.id)} className="flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline">
                        <CheckCircle2 className="w-4 h-4" /> Move to Archive
                     </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </AdminLayout>
  );
}
