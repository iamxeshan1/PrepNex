import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { MessageCircle, Send, CheckCircle2, AlertCircle, Clock, Plus, ArrowLeft, User, MessageSquare, Loader2, Sparkles, X, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { DashboardTopHeader } from '../components/DashboardTopHeader';

export default function Helpdesk() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
      // Filter out disposed tickets from the user view
      setTickets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((t: any) => t.status !== 'disposed'));
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
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status: 'closed',
        updatedAt: new Date().toISOString()
      });
      fetchTickets();
    } catch (err) {
      alert('Failed to close ticket');
    }
  };

  const handleDispose = async (ticketId: string, confirmed = false) => {
    if (!window.confirm('Are you sure you want to dispose of this ticket? This will permanently remove it.')) return;
    
    setReplying(ticketId); // Reusing replying for general loading
    try {
      await deleteDoc(doc(db, 'tickets', ticketId));
      setTickets(prev => prev.filter(t => t.id !== ticketId));
    } catch (err) {
      console.error(err);
      alert('Failed to dispose ticket');
    } finally {
      setReplying(null);
    }
  };

  return (
    <div className="flex bg-[#f8fafc] min-h-screen">
      {/* Mobile Hamburger Overlay */}
      <div className={`fixed inset-0 z-50 bg-black/50 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setIsSidebarOpen(false)}></div>
      
      {/* Sidebar - Desktop and Mobile */}
      <div className={`fixed lg:relative z-50 w-64 h-full bg-white border-r transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <DashboardSidebar />
      </div>
      
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        <DashboardTopHeader user={profile} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="p-4 lg:p-8 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-8">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight font-display italic uppercase">Resolution Hub</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Direct protocol access for student support triage</p>
              </div>
              <button 
                onClick={() => setShowNew(!showNew)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 ${
                  showNew ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-[#002f26] text-white hover:bg-black'
                }`}
              >
                {showNew ? <><X className="w-4 h-4" /> Cancel Request</> : <><Plus className="w-4 h-4" /> Log New Ticket</>}
              </button>
            </div>

            {/* New Ticket Form Overlay/Section */}
            <AnimatePresence>
              {showNew && (
                <motion.form 
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  onSubmit={handleSubmit}
                  className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 -translate-y-1/2 translate-x-1/2 rounded-full opacity-50" />
                  
                  <div className="relative space-y-8">
                     <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                        <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
                           <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-slate-900 uppercase">Draft Protocol</h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Provide detailed parameters for the triage team</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Vector</label>
                           <input 
                             type="text" required 
                             className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/10 font-bold text-[#001f19] transition-all"
                             value={subject} onChange={(e) => setSubject(e.target.value)} 
                             placeholder="Ex: Technical latency in mock test portal..."
                           />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Log</label>
                           <textarea 
                             required rows={4}
                             className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/10 font-bold text-[#001f19] transition-all resize-none"
                             value={message} onChange={(e) => setMessage(e.target.value)} 
                             placeholder="Provide precise details, steps to reproduce, or queries regarding subscription status..."
                           />
                        </div>
                     </div>

                     <button 
                       type="submit" disabled={submitting}
                       className="w-full py-5 bg-[#002f26] text-white rounded-2xl font-black flex justify-center items-center gap-3 hover:bg-black transition-all disabled:opacity-50 text-sm uppercase tracking-widest shadow-xl"
                     >
                       {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Initialize Ticket Dispatch</>}
                     </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List Section */}
            {loading ? (
               <div className="py-24 text-center">
                  <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-6" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Protocol Threads...</p>
               </div>
            ) : tickets.length === 0 ? (
              <div className="py-32 text-center bg-white rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-50 to-transparent opacity-50" />
                 <MessageCircle className="w-20 h-20 text-slate-100 mx-auto mb-6 relative" />
                 <h3 className="text-xl font-black text-[#001f19] uppercase relative">Protocol Repository Empty</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 relative">No active support threads detected in this sector</p>
                 <button onClick={() => setShowNew(true)} className="mt-8 relative px-8 py-3 bg-teal-50 text-teal-700 font-black text-[10px] rounded-full uppercase tracking-widest hover:bg-teal-100 transition-colors">Initialize First Node</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-12 pb-20">
                {tickets.map((ticket, idx) => (
                  <motion.div 
                    key={ticket.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white p-8 md:p-12 rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700 relative group overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-80 h-80 bg-slate-50 -translate-y-1/2 translate-x-1/2 rounded-full opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                    
                    <div className="relative">
                      <header className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6 pb-8 border-b border-slate-50">
                        <div className="space-y-4">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-center text-teal-600 shadow-inner">
                                 <MessageSquare className="w-6 h-6" />
                              </div>
                              <div>
                                 <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase italic">{ticket.subject}</h3>
                                 <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: {ticket.id}</span>
                                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                          <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 shadow-sm ${
                            ticket.status === 'open' ? 'bg-amber-50 border-amber-100 text-amber-600' : 
                            ticket.status === 'replied' ? 'bg-teal-50 border-teal-100 text-teal-600' :
                            'bg-emerald-50 border-emerald-100 text-emerald-600'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                              ticket.status === 'open' ? 'bg-amber-500' : 
                              ticket.status === 'replied' ? 'bg-teal-500' : 'bg-emerald-500'
                            }`} />
                            {ticket.status} Protocol
                          </span>
                        </div>
                      </header>

                      {/* Chat Thread Aesthetic like Admin */}
                      <div className="space-y-8 mb-12 bg-slate-50/30 p-6 md:p-10 rounded-[3rem] border border-slate-100/50 max-h-[600px] overflow-y-auto custom-scrollbar shadow-inner">
                        {/* Initial Message Wrapper */}
                        {ticket.message && (
                          <div className="flex justify-start">
                            <div className="max-w-[85%] bg-white p-7 rounded-[2.5rem] rounded-tl-none border border-slate-100 shadow-sm relative">
                              <p className="text-sm font-bold text-slate-700 leading-relaxed italic pr-4">"{ticket.message}"</p>
                              <div className="mt-4 flex items-center gap-2">
                                 <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Inaugural Node</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Modern Message Threads */}
                        {(ticket.messages || []).map((msg: any, mIdx: number) => (
                          <div key={mIdx} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[85%] p-7 rounded-[2.5rem] border-2 shadow-sm ${
                              msg.sender === 'user' 
                                ? 'bg-white border-slate-100 rounded-tl-none' 
                                : 'bg-[#002f26] border-[#002f26] text-white rounded-tr-none'
                            }`}>
                              <div className="flex items-center gap-2 mb-3">
                                 <div className={`w-1.5 h-1.5 rounded-full ${msg.sender === 'user' ? 'bg-teal-500' : 'bg-emerald-500'}`} />
                                 <span className={`text-[8px] font-black uppercase tracking-widest ${msg.sender === 'user' ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {msg.sender === 'user' ? 'Aspirant Response' : 'Institutional protocol'}
                                 </span>
                              </div>
                              <p className={`text-sm font-bold leading-relaxed ${msg.sender === 'user' ? 'text-[#001f19]' : 'text-white'}`}>{msg.text}</p>
                              <div className="mt-4 flex items-center justify-between">
                                 <span className={`text-[8px] font-bold ${msg.sender === 'user' ? 'text-slate-300' : 'text-white/40'}`}>
                                    {new Date(msg.createdAt).toLocaleString()}
                                 </span>
                                 {msg.sender === 'admin' && (
                                     <Sparkles className="w-3 h-3 text-emerald-500 opacity-50" />
                                 )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reply Zone */}
                      {ticket.status !== 'closed' ? (
                        <div className="relative group/reply">
                          <textarea 
                            className="w-full px-8 py-7 bg-white border border-slate-200 rounded-[2.5rem] outline-none focus:ring-8 focus:ring-teal-500/5 font-bold text-[#001f19] shadow-xl transition-all h-32 resize-none"
                            placeholder="Input supplemental log data..."
                            value={replyText[ticket.id] || ''}
                            onChange={(e) => setReplyText({ ...replyText, [ticket.id]: e.target.value })}
                          />
                          <div className="absolute right-6 bottom-6 flex items-center gap-4">
                             <button 
                                onClick={() => handleResolve(ticket.id)}
                                title="Resolve Ticket"
                                className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all shadow-sm active:scale-95"
                             >
                                <CheckCircle2 className="w-6 h-6" />
                             </button>
                             <button 
                                onClick={() => handleUserReply(ticket.id)}
                                disabled={replying === ticket.id || !replyText[ticket.id]}
                                className="p-5 bg-[#002f26] text-white rounded-2xl hover:bg-black transition-all disabled:opacity-30 shadow-2xl active:scale-95 transform hover:-translate-x-1"
                             >
                                {replying === ticket.id ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                             </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center bg-slate-50 border border-slate-100 p-8 rounded-[2.5rem]">
                           <Lock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Channel Terminated • Case File Archived</p>
                        </div>
                      )}

                      <div className="mt-10 flex items-center justify-between gap-4 flex-wrap">
                         <div className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                            <Sparkles className="w-3.5 h-3.5" /> Direct Support Protocol v3.0 Enabled
                         </div>
                         <div className="flex items-center gap-6">
                           {ticket.status !== 'closed' && (
                               <button onClick={() => handleResolve(ticket.id)} className="flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline transition-colors">
                                  <CheckCircle2 className="w-4 h-4" /> Resolve Case
                               </button>
                           )}
                           <button onClick={() => handleDispose(ticket.id)} className="flex items-center gap-2 text-[9px] font-black text-rose-600 uppercase tracking-widest hover:underline transition-colors">
                              <X className="w-4 h-4" /> Dispose off
                           </button>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Footer Component if needed */}
          <footer className="mt-20 py-10 border-t border-slate-100/60 pb-10">
            <p className="text-center text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">
              Institutional Protocol • © {new Date().getFullYear()} PrepNext Resolution Services
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
