import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { MessageCircle, Send, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function Helpdesk() {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [replying, setReplying] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const q = query(collection(db, 'tickets'), where('userId', '==', user?.uid), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setTickets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'tickets'), {
        userId: user?.uid,
        userEmail: user?.email,
        userName: profile?.name || 'Aspirant',
        subject,
        status: 'open',
        createdAt: new Date().toISOString(),
        messages: [
          {
            sender: 'user',
            text: message,
            createdAt: new Date().toISOString()
          }
        ]
      });
      setSubject('');
      setMessage('');
      setShowNew(false);
      fetchTickets();
    } catch (err) {
      alert("Failed to submit ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUserReply = async (ticketId: string) => {
    const text = replyText[ticketId];
    if (!text) return;
    
    setReplying(ticketId);
    try {
      const ticket = tickets.find(t => t.id === ticketId);
      const updatedMessages = [
        ...(ticket.messages || []),
        {
          sender: 'user',
          text,
          createdAt: new Date().toISOString()
        }
      ];

      await updateDoc(doc(db, 'tickets', ticketId), {
        messages: updatedMessages,
        status: 'open', // Reset to open when user replies
        updatedAt: new Date().toISOString()
      });
      
      setReplyText({ ...replyText, [ticketId]: '' });
      fetchTickets();
    } catch (err) {
      alert('Failed to send reply');
    } finally {
      setReplying(null);
    }
  };

  const handleResolve = async (ticketId: string) => {
    if (!window.confirm('Are you satisfied and want to close this ticket?')) return;
    
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status: 'closed'
      });
      fetchTickets();
    } catch (err) {
      alert('Failed to close ticket');
    }
  };

  return (
    <Layout>
      <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-black text-secondary tracking-tight mb-2">Helpdesk Support</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Get help from Team PrepNex</p>
            </div>
            <button 
              onClick={() => setShowNew(!showNew)}
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all font-logo"
            >
              {showNew ? 'Cancel' : 'Open New Ticket'}
            </button>
          </div>

          {showNew && (
            <motion.form 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit} 
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mb-8 space-y-6"
            >
              <h3 className="text-xl font-black text-slate-800 tracking-tight border-b border-slate-100 pb-4">Describe Your Issue</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Subject</label>
                <input 
                  type="text" required 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold"
                  value={subject} onChange={(e) => setSubject(e.target.value)} 
                  placeholder="What do you need help with?"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Message</label>
                <textarea 
                  required rows={5}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold resize-y"
                  value={message} onChange={(e) => setMessage(e.target.value)} 
                  placeholder="Provide as much detail as possible..."
                />
              </div>

              <button 
                type="submit" disabled={submitting}
                className="w-full py-4 bg-secondary text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-secondary/90 transition-all disabled:opacity-50 font-logo"
              >
                {submitting ? 'Submitting...' : <><Send className="w-5 h-5" /> Submit Ticket</>}
              </button>
            </motion.form>
          )}

          {loading ? (
             <div className="flex justify-center p-12">
               <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
             </div>
          ) : tickets.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
               <MessageCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-slate-800">No support tickets</h3>
               <p className="text-slate-500 font-bold mt-1 text-sm">You haven't opened any support tickets yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {tickets.map(ticket => (
                <div key={ticket.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-6 gap-4 border-b border-slate-50 pb-4">
                    <div>
                      <h3 className="font-black text-xl text-slate-800 tracking-tight">{ticket.subject}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ticket ID: {ticket.id}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      ticket.status === 'open' ? 'bg-orange-50 text-orange-600' : 
                      ticket.status === 'replied' ? 'bg-blue-50 text-blue-600' :
                      'bg-green-50 text-green-600'
                    }`}>
                      {ticket.status === 'open' ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {ticket.status}
                    </span>
                  </div>

                  <div className="flex flex-col mb-6">
                    {/* Render legacy message if it exists */}
                    {ticket.message && (
                      <div className="flex justify-start mb-4">
                        <div className="max-w-[85%] bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100">
                          <p className="text-sm font-bold text-slate-700">{ticket.message}</p>
                          <p className="text-[10px] text-slate-400 mt-2">Original Message</p>
                        </div>
                      </div>
                    )}

                    {/* Render modern messages */}
                    {(ticket.messages || []).map((msg: any, idx: number, arr: any[]) => {
                      const isFirstInGroup = idx === 0 || arr[idx - 1].sender !== msg.sender;
                      const isLastInGroup = idx === arr.length - 1 || arr[idx + 1].sender !== msg.sender;

                      return (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'} ${!isLastInGroup ? 'mb-1' : 'mb-4'}`}>
                          <div className={`max-w-[85%] px-4 py-3 rounded-2xl border ${
                            msg.sender === 'user' 
                              ? `bg-slate-50 border-slate-100 ${isFirstInGroup ? 'rounded-tl-none' : 'rounded-tl-md rounded-bl-md'}` 
                              : `bg-primary/5 border-primary/10 ${isFirstInGroup ? 'rounded-tr-none' : 'rounded-tr-md rounded-br-md'}`
                          }`}>
                            {isFirstInGroup && (
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${msg.sender === 'user' ? 'text-slate-400' : 'text-primary'}`}>
                                  {msg.sender === 'user' ? 'You' : 'Admin'}
                                </span>
                              </div>
                            )}
                            <p className="text-sm font-bold text-slate-800">{msg.text}</p>
                            {isLastInGroup && (
                              <p className="text-[10px] text-slate-400 mt-2">{new Date(msg.createdAt).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Render legacy reply if it exists */}
                    {ticket.reply && !(ticket.messages || []).some((m: any) => m.sender === 'admin' && m.text === ticket.reply) && (
                      <div className="flex justify-end mb-4">
                        <div className="max-w-[85%] bg-primary/5 p-4 rounded-2xl rounded-tr-none border border-primary/10">
                          <p className="text-sm font-bold text-slate-800">{ticket.reply}</p>
                          <p className="text-[10px] text-primary mt-2 uppercase font-black">Admin Reply (Legacy)</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {ticket.status !== 'closed' && (
                    <div className="border-t border-slate-50 pt-6 space-y-4">
                      <div className="flex gap-2">
                        <textarea 
                          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold text-sm resize-none"
                          placeholder="Type your message..."
                          rows={2}
                          value={replyText[ticket.id] || ''}
                          onChange={(e) => setReplyText({ ...replyText, [ticket.id]: e.target.value })}
                        />
                        <button 
                          onClick={() => handleUserReply(ticket.id)}
                          disabled={replying === ticket.id || !replyText[ticket.id]}
                          className="bg-primary text-white p-4 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 self-end"
                        >
                          {replying === ticket.id ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Send className="w-5 h-5" />}
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-bold text-slate-400">Resolved your issue? Close the ticket below</p>
                        <button 
                          onClick={() => handleResolve(ticket.id)}
                          className="text-xs font-black text-green-600 hover:text-green-700 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Mark as Resolved
                        </button>
                      </div>
                    </div>
                  )}

                  {ticket.status === 'closed' && (
                    <div className="border-t border-slate-50 pt-4 text-center">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">This ticket is closed</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
