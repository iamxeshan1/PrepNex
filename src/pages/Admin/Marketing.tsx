import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Mail, Send } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function AdminMarketing() {
  const [fromName, setFromName] = useState('Team PrepNex Edtech');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !body || !fromName) return;
    
    if (!window.confirm("Are you sure you want to send this email to EVERY registered user?")) return;

    setLoading(true);
    setMessage('');
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const emails = usersSnap.docs.map(doc => doc.data().email).filter(Boolean);

      if (emails.length === 0) {
        setMessage("No users to send to.");
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/send-promotional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, emails, fromName })
      });

      if (!response.ok) throw new Error('API failed');

      setMessage(`Successfully sent promotional email to ${emails.length} users!`);
      setSubject('');
      setBody('');
    } catch (err) {
      console.error(err);
      setMessage("Failed to send promotional emails.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Marketing & Emails">
      <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-in">
        <div>
          <h2 className="text-xl font-black text-secondary tracking-tight">Promotional Emails</h2>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Send emails to all registered users</p>
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
          <Mail className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 max-w-3xl">
        <div className="mb-6 bg-slate-50 p-4 border border-slate-200 rounded-2xl">
          <p className="text-sm font-bold text-slate-600">This email will be sent from <strong className="text-slate-800">prepnexedtech@gmail.com</strong>.</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl font-bold text-sm ${message.includes('Success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Sender Name</label>
            <input 
              type="text" required 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold text-slate-800"
              value={fromName} onChange={(e) => setFromName(e.target.value)} 
              placeholder="e.g. Team PrepNex Edtech"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Subject</label>
            <input 
              type="text" required 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold text-slate-800"
              value={subject} onChange={(e) => setSubject(e.target.value)} 
              placeholder="e.g. New Mock Tests Available!"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Email Body (Plain text / HTML)</label>
            <textarea 
              required 
              rows={8}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold text-slate-800 resize-y"
              value={body} onChange={(e) => setBody(e.target.value)} 
              placeholder="Write your email content here. To create line breaks, just press Enter."
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all font-logo flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Sending...' : <><Send className="w-5 h-5" /> Send to All Users</>}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
