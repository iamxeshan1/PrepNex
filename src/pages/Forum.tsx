import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { MessageCircle, Search, Plus, User, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Forum() {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General'
  });

  const fetchThreads = async () => {
    try {
      const q = query(collection(db, 'forum_posts'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setThreads(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching threads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      const newId = doc(collection(db, 'forum_posts')).id;
      await setDoc(doc(db, 'forum_posts', newId), {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        authorId: user.uid,
        authorName: profile?.fullName || user.email?.split('@')[0] || 'Anonymous',
        replyCount: 0,
        createdAt: Date.now()
      });
      setShowModal(false);
      setFormData({ title: '', content: '', category: 'General' });
      fetchThreads();
    } catch (error) {
      console.error("Error creating doubt:", error);
    }
  };

  const filteredThreads = threads.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen pb-20">
        <div className="bg-[#002f26] text-white pt-24 pb-16 px-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="text-center md:text-left max-w-2xl">
                 <h1 className="text-4xl md:text-5xl font-sans font-[800] tracking-tighter mb-4">Community Forum & Doubts</h1>
                 <p className="text-emerald-100/80 text-lg font-medium tracking-tight mb-8">
                   Ask questions, discuss strategies, and help out fellow aspirants.
                 </p>
                 <div className="relative max-w-xl">
                   <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     type="text" 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     placeholder="Search discussions..."
                     className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 backdrop-blur-md"
                   />
                 </div>
              </div>
              <div>
                 <button 
                   onClick={() => user ? setShowModal(true) : navigate('/login')}
                   className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                 >
                   <Plus className="w-5 h-5" /> Ask a Doubt
                 </button>
              </div>
           </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 lg:px-8 mt-10 relative z-10">
           {loading ? (
             <div className="text-center py-20 text-slate-500 font-medium">Loading discussions...</div>
           ) : filteredThreads.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Discussions Yet</h3>
                <p className="text-slate-500 mb-6">Be the first to ask a doubt or start a discussion!</p>
                <button 
                   onClick={() => user ? setShowModal(true) : navigate('/login')}
                   className="bg-[#006e5d] text-white px-6 py-2.5 rounded-lg font-bold shadow-sm hover:bg-[#005a4d]"
                >
                   Ask a Doubt
                </button>
             </div>
           ) : (
             <div className="space-y-4">
                {filteredThreads.map((thread, idx) => (
                  <motion.div 
                    key={thread.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-[#006e5d]/30 hover:shadow-lg transition-all flex flex-col md:flex-row gap-6 items-start md:items-center group"
                  >
                    <div className="flex-grow min-w-0">
                       <div className="flex items-center gap-3 mb-2">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold tracking-wider">
                             {thread.category || 'General'}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                             <Clock className="w-3.5 h-3.5" /> 
                             {new Date(thread.createdAt).toLocaleDateString()}
                          </span>
                       </div>
                       <Link to={`/forum/${thread.id}`} className="block block">
                          <h3 className="text-xl font-sans font-[800] text-slate-900 mb-1 group-hover:text-[#006e5d] transition-colors truncate">{thread.title}</h3>
                          <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">{thread.content}</p>
                       </Link>
                       <div className="flex items-center gap-2 mt-4 text-xs font-bold text-slate-400">
                          <User className="w-3.5 h-3.5" />
                          <span>Started by <span className="text-slate-700">{thread.authorName}</span></span>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-6 shrink-0 md:pl-6 md:border-l md:border-slate-100 w-full md:w-auto justify-between md:justify-start">
                       <div className="text-center">
                          <p className="text-2xl font-black text-[#006e5d]">{thread.replyCount || 0}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Replies</p>
                       </div>
                       <Link to={`/forum/${thread.id}`} className="flex items-center justify-center p-3 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-[#006e5d] group-hover:text-white transition-all">
                          <ChevronRight className="w-5 h-5" />
                       </Link>
                    </div>
                  </motion.div>
                ))}
             </div>
           )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-slate-900">Post a Doubt</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="doubtForm" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title / Question *</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium" placeholder="What is your doubt?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium">
                     <option value="General">General Doubt</option>
                     <option value="Subject Specific">Subject Specific</option>
                     <option value="Exam Strategy">Exam Strategy</option>
                     <option value="Technical Support">Technical Support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                  <textarea required rows={5} value={formData.content} onChange={e => setFormData(p => ({ ...p, content: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium resize-none" placeholder="Provide more details to get a better answer..." />
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50">Cancel</button>
              <button type="submit" form="doubtForm" className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">Post Doubt</button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
