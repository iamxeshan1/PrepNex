import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
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
        message,
        status: 'open',
        createdAt: new Date().toISOString()
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
            <div className="space-y-4">
              {tickets.map(ticket => (
                <div key={ticket.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <h3 className="font-black text-lg text-slate-800 tracking-tight">{ticket.subject}</h3>
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                      ticket.status === 'open' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                    }`}>
                      {ticket.status === 'open' ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-slate-600 font-bold text-sm bg-slate-50 p-4 rounded-2xl mb-4">{ticket.message}</p>
                  
                  {ticket.reply && (
                    <div className="ml-4 pl-4 border-l-2 border-primary/20 mt-4">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                           <AlertCircle className="w-3 h-3" />
                         </div>
                         <span className="font-black text-xs uppercase tracking-widest text-primary">Admin Reply</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">{ticket.reply}</p>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>Ticket ID: {ticket.id}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
