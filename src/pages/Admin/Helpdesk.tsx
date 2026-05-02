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
  const [closing, setClosing] = useState<string | null>(null);

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
      alert('Reply sent successfully!');
      fetchTickets();
    } catch (err) {
      alert('Failed to send reply');
    } finally {
      setSubmitting(null);
    }
  };

  const handleClose = async (ticketId: string) => {
    if (!window.confirm('Are you sure you want to close this ticket?')) return;
    
    setClosing(ticketId);
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status: 'closed'
      });
      alert('Ticket closed successfully');
      fetchTickets();
    } catch (err) {
      alert('Failed to close ticket');
    } finally {
      setClosing(null);
    }
  };

  return (
    <AdminLayout title="Helpdesk">
      <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-in">
        <div>
          <h2 className="text-xl font-black text-secondary tracking-tight">Support Tickets</h2>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Manage user queries (Multi-message enabled)</p>
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
            <div key={ticket.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight mb-1">{ticket.subject}</h3>
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                    <span className="text-primary font-black uppercase tracking-widest">{ticket.userName}</span> 
                    <span className="text-slate-300">|</span>
                    {ticket.userEmail}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    ticket.status === 'open' ? 'bg-orange-50 text-orange-600' : 
                    ticket.status === 'replied' ? 'bg-blue-50 text-blue-600' :
                    'bg-green-50 text-green-600'
                  }`}>
                    {ticket.status === 'open' ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {ticket.status}
                  </span>
                  {ticket.status !== 'closed' && (
                    <button 
                      onClick={() => handleClose(ticket.id)}
                      disabled={closing === ticket.id}
                      className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                      {closing === ticket.id ? 'Closing...' : 'Close Ticket'}
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Window */}
              <div className="flex flex-col mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 max-h-[400px] overflow-y-auto">
                {/* Legacy message */}
                {ticket.message && (
                  <div className="flex justify-start mb-4">
                    <div className="max-w-[85%] bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200">
                      <p className="text-sm font-bold text-slate-700">{ticket.message}</p>
                      <p className="text-[10px] text-slate-400 mt-2 uppercase font-black">Initial Issue</p>
                    </div>
                  </div>
                )}

                {/* Thread messages */}
                {(ticket.messages || []).map((msg: any, idx: number, arr: any[]) => {
                  const isFirstInGroup = idx === 0 || arr[idx - 1].sender !== msg.sender;
                  const isLastInGroup = idx === arr.length - 1 || arr[idx + 1].sender !== msg.sender;

                  return (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'} ${!isLastInGroup ? 'mb-1' : 'mb-4'}`}>
                      <div className={`max-w-[85%] px-4 py-3 rounded-2xl border ${
                        msg.sender === 'user' 
                          ? `bg-white border-slate-200 ${isFirstInGroup ? 'rounded-tl-none' : 'rounded-tl-md rounded-bl-md'}` 
                          : `bg-primary text-white border-primary ${isFirstInGroup ? 'rounded-tr-none' : 'rounded-tr-md rounded-br-md'}`
                      }`}>
                        {isFirstInGroup && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${msg.sender === 'user' ? 'text-slate-400' : 'text-white/70'}`}>
                              {msg.sender === 'user' ? 'User' : 'You (Admin)'}
                            </span>
                          </div>
                        )}
                        <p className={`text-sm font-bold ${msg.sender === 'user' ? 'text-slate-800' : 'text-white'}`}>{msg.text}</p>
                        {isLastInGroup && (
                          <p className={`text-[10px] mt-2 ${msg.sender === 'user' ? 'text-slate-400' : 'text-white/50'}`}>
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Legacy reply */}
                {ticket.reply && !(ticket.messages || []).some((m: any) => m.sender === 'admin' && m.text === ticket.reply) && (
                  <div className="flex justify-end mb-4">
                    <div className="max-w-[85%] bg-primary text-white p-4 rounded-2xl rounded-tr-none border border-primary">
                      <p className="text-sm font-bold">{ticket.reply}</p>
                      <p className="text-[10px] text-white/50 mt-2 uppercase font-black">Legacy Reply</p>
                    </div>
                  </div>
                )}
              </div>

              {ticket.status !== 'closed' && (
                <div className="mt-4 space-y-4">
                  <div className="flex gap-2">
                    <textarea 
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold text-sm resize-none"
                      placeholder="Type your response..."
                      rows={2}
                      value={replyText[ticket.id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [ticket.id]: e.target.value })}
                    />
                    <button 
                      onClick={() => handleReply(ticket.id)}
                      disabled={submitting === ticket.id || !replyText[ticket.id]}
                      className="bg-primary text-white p-4 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 self-end"
                    >
                      {submitting === ticket.id ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {ticket.status === 'replied' && (
                    <div className="flex justify-end">
                      <button 
                        onClick={() => handleClose(ticket.id)}
                        disabled={closing === ticket.id}
                        className="text-xs font-black text-slate-400 hover:text-red-500 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Force Close Ticket
                      </button>
                    </div>
                  )}
                </div>
              )}

              {ticket.status === 'closed' && (
                <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ticket Closed & Resolved</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
