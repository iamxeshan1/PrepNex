import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Quote, Send, Trash2, Calendar, User, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface Thought {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export default function AdminThoughts() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchThoughts = async () => {
    const q = query(collection(db, 'thoughts'), orderBy('createdAt', 'desc'), limit(20));
    const snapshot = await getDocs(q);
    setThoughts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Thought)));
  };

  useEffect(() => {
    fetchThoughts();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !author) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'thoughts'), {
        text,
        author,
        createdAt: new Date().toISOString()
      });
      setText(''); 
      setAuthor('');
      fetchThoughts();
    } catch (error) {
      console.error("Error adding thought:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this thought?')) {
      await deleteDoc(doc(db, 'thoughts', id));
      fetchThoughts();
    }
  };

  return (
    <AdminLayout title="Thought of the Day">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Creation Form */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-secondary/10 text-secondary rounded-2xl">
                <Sparkles className="w-5 h-5 fill-secondary opacity-30" />
              </div>
              <div>
                <h3 className="text-xl font-black text-primary tracking-tight">New Daily Thought</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Motivate your aspirants</p>
              </div>
            </div>

            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Motivational Quote</label>
                <textarea 
                  required
                  placeholder="Enter the thought or quote..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-primary min-h-[120px] resize-none"
                  value={text} onChange={(e) => setText(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Author / Credit</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    required
                    placeholder="e.g. Swami Vivekananda"
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-primary"
                    value={author} onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-primary text-white rounded-2xl font-black tracking-widest uppercase text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? 'Publishing...' : <><Send className="w-4 h-4" /> Publish Thought</>}
              </button>
            </form>
          </div>
        </div>

        {/* Previous Thoughts */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-primary tracking-tight flex items-center gap-3">
             <Calendar className="w-5 h-5 text-slate-300" /> Previous Thoughts
          </h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
            {thoughts.map((thought, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={thought.id} 
                className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all relative"
              >
                <Quote className="absolute top-4 right-4 w-10 h-10 text-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-sm font-bold text-primary leading-relaxed pr-8">"{thought.text}"</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-black text-secondary uppercase tracking-widest">— {thought.author}</span>
                  <div className="flex items-center gap-4">
                     <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                       {new Date(thought.createdAt).toLocaleDateString()}
                     </span>
                     <button onClick={() => handleDelete(thought.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {thoughts.length === 0 && (
              <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center">
                 <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No thoughts recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
