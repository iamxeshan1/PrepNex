import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Quote, Send, Trash2, Calendar, User, Sparkles, X, Loader2, Plus, Search } from 'lucide-react';

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
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchThoughts = async () => {
    setFetching(true);
    const q = query(collection(db, 'thoughts'), orderBy('createdAt', 'desc'), limit(100)); // Increased limit
    const snapshot = await getDocs(q);
    setThoughts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Thought)));
    setFetching(false);
  };

  useEffect(() => { fetchThoughts(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !author) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'thoughts'), {
        text, author,
        createdAt: new Date().toISOString()
      });
      setText(''); setAuthor('');
      setShowAddForm(false);
      fetchThoughts();
    } catch (error) {
       console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this thought?')) {
      await deleteDoc(doc(db, 'thoughts', id));
      fetchThoughts();
    }
  };

  const filtered = thoughts.filter(t => 
    t.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ title, value, span, colorClass = "text-slate-900" }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200">
      <p className="text-sm font-medium text-slate-500 mb-2">{title}</p>
      <h3 className={`text-4xl font-bold tracking-tight mb-2 ${colorClass}`}>{value}</h3>
      {span && <p className="text-xs font-semibold text-slate-400 mt-2">{span}</p>}
    </div>
  );

  return (
    <AdminLayout title="Daily Thoughts">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 font-medium">Manage daily inspirational quotes and thoughts.</p>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-indigo-800 transition-colors"
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showAddForm ? 'Cancel Entry' : 'Add Thought'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Quotes" value={thoughts.length} span="In library" colorClass="text-indigo-600" />
        <StatCard title="Recent Authors" value={new Set(thoughts.map(t => t.author)).size} span="Distinct authors" colorClass="text-emerald-600" />
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm mb-8 relative">
           <button type="button" onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-600 transition-colors">
              <X className="w-5 h-5" />
           </button>

           <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Quote className="w-5 h-5 text-indigo-600" /> Compose Thought</h3>

           <div className="space-y-6">
             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-2">Quote Text</label>
               <textarea 
                 required
                 placeholder="Type the motivational anchor..."
                 className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-slate-50 min-h-[100px]"
                 value={text} onChange={(e) => setText(e.target.value)}
               />
             </div>
             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-2">Author</label>
               <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required
                    placeholder="Author Identity"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-slate-50"
                    value={author} onChange={(e) => setAuthor(e.target.value)}
                  />
               </div>
             </div>
           </div>

           <div className="mt-8">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-800 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Save Thought</>}
              </button>
           </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
           <div className="flex gap-4">
             <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search thoughts & authors..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-sm font-medium focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                />
             </div>
           </div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Showing {filtered.length} THOUGHTS</p>
        </div>

        {fetching ? (
           <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                <th className="p-4 pl-6 font-semibold">Quote</th>
                <th className="p-4 font-semibold">Author</th>
                <th className="p-4 font-semibold">Date Added</th>
                <th className="p-4 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((thought) => (
                <tr key={thought.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600 border border-indigo-100">
                         <Quote className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors italic leading-relaxed max-w-2xl">
                           "{thought.text}"
                         </p>
                       </div>
                    </div>
                  </td>
                  <td className="p-4">
                     <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-700">
                        {thought.author}
                     </span>
                  </td>
                  <td className="p-4">
                     <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(thought.createdAt).toLocaleDateString()}
                     </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                     <button onClick={() => handleDelete(thought.id)} className="p-2 hover:bg-red-50 rounded text-red-500 transition-colors" title="Delete Thought">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                   <td colSpan={4} className="p-8 text-center text-slate-500">No thoughts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
