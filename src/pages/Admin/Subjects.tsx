import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  PlusCircle, 
  Trash2, 
  BookOpen, 
  Calculator, 
  Brain, 
  Globe, 
  Microscope, 
  History, 
  Map, 
  Cpu, 
  FileText, 
  Palette,
  Atom,
  Search,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ICON_OPTIONS = [
  { name: 'Brain', icon: Brain },
  { name: 'Calculator', icon: Calculator },
  { name: 'Globe', icon: Globe },
  { name: 'Microscope', icon: Microscope },
  { name: 'History', icon: History },
  { name: 'Map', icon: Map },
  { name: 'Cpu', icon: Cpu },
  { name: 'FileText', icon: FileText },
  { name: 'Palette', icon: Palette },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Atom', icon: Atom },
  { name: 'Search', icon: Search },
  { name: 'MessageSquare', icon: MessageSquare }
];

interface Subject {
  id: string;
  name: string;
  icon: string;
  description: string;
  createdAt: string;
}

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('BookOpen');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchSubjects = async () => {
    setFetching(true);
    try {
      const q = query(collection(db, 'subjects'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !icon) return;
    setLoading(true);
    try {
      const res = await addDoc(collection(db, 'subjects'), {
        name,
        icon,
        description,
        createdAt: new Date().toISOString()
      });
      // Also update doc with its id for easier querying if needed
      await setDoc(doc(db, 'subjects', res.id), { id: res.id }, { merge: true });
      
      setName('');
      setDescription('');
      setIcon('BookOpen');
      fetchSubjects();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this subject? This might affect existing subject-based tests.')) {
      await deleteDoc(doc(db, 'subjects', id));
      fetchSubjects();
    }
  };

  return (
    <AdminLayout title="Subject Management">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Creation Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm sticky top-24">
            <h3 className="text-xl font-black text-primary mb-6 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-secondary" /> Add New Subject
            </h3>

            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subject Name</label>
                <input 
                  required
                  placeholder="e.g. Reasoning"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-primary"
                  value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                <textarea 
                  placeholder="Focus areas, topics covered..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-primary min-h-[100px] resize-none"
                  value={description} onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 text-center block">Choose Icon</label>
                <div className="grid grid-cols-4 gap-3">
                  {ICON_OPTIONS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setIcon(item.name)}
                      className={`p-4 rounded-xl flex items-center justify-center transition-all ${icon === item.name ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      <item.icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-primary text-white rounded-2xl font-black tracking-widest uppercase text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Register Subject'}
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          {fetching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-50 rounded-3xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                {subjects.map((sub) => {
                  const IconComp = ICON_OPTIONS.find(i => i.name === sub.icon)?.icon || BookOpen;
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={sub.id} 
                      className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                          <IconComp className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-black text-primary tracking-tight">{sub.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Topic Mastery</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-4 line-clamp-2 leading-relaxed">
                        {sub.description || 'Practice specific mock tests focused on this subject to improve your accuracy.'}
                      </p>
                      <div className="mt-6 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                             {new Date(sub.createdAt).toLocaleDateString()}
                           </span>
                           <Link 
                             to={`/admin/subject-tests/${sub.id}`}
                             className="text-[10px] font-black text-secondary hover:underline uppercase tracking-widest bg-secondary/5 px-2 py-1 rounded-md"
                           >
                             Manage Tests
                           </Link>
                         </div>
                         <button 
                           onClick={() => handleDelete(sub.id)}
                           className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              {subjects.length === 0 && (
                <div className="col-span-2 py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] text-center">
                   <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No subjects created yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
