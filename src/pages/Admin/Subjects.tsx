import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, setDoc, writeBatch, limit } from 'firebase/firestore';
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
  MessageSquare,
  Languages,
  FlaskConical,
  Dna,
  Binary,
  Code,
  Music,
  HeartPulse,
  Scale,
  Briefcase,
  Church,
  Sigma,
  Zap,
  Gamepad2,
  Brush,
  Variable,
  RotateCcw
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
  { name: 'MessageSquare', icon: MessageSquare },
  { name: 'Languages', icon: Languages },
  { name: 'FlaskConical', icon: FlaskConical },
  { name: 'Dna', icon: Dna },
  { name: 'Binary', icon: Binary },
  { name: 'Code', icon: Code },
  { name: 'Music', icon: Music },
  { name: 'HeartPulse', icon: HeartPulse },
  { name: 'Scale', icon: Scale },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Church', icon: Church },
  { name: 'Sigma', icon: Sigma },
  { name: 'Zap', icon: Zap },
  { name: 'Gamepad2', icon: Gamepad2 },
  { name: 'Brush', icon: Brush },
  { name: 'Variable', icon: Variable }
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
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [icon, setIcon] = useState('BookOpen');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);

  const fetchSubjects = async () => {
    setFetching(true);
    try {
      // First try to get total count to see if we have documents that might be missing 'name'
      const allSnap = await getDocs(collection(db, 'subjects'));
      const allDocs = allSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
      
      // Still sort locally if possible
      allDocs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      setSubjects(allDocs);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId && !newSubjectName) return;
    setLoading(true);
    try {
      if (newSubjectName) {
        // Check for duplicate
        const exists = subjects.find(s => s.name?.toLowerCase() === newSubjectName.trim().toLowerCase());
        if (exists) {
          alert("Subject already exists!");
          setLoading(false);
          return;
        }

        await addDoc(collection(db, 'subjects'), {
          name: newSubjectName.trim(),
          icon,
          description,
          createdAt: new Date().toISOString()
        });
        alert("New Subject Created!");
      } else {
        const subRef = doc(db, 'subjects', selectedSubjectId);
        await setDoc(subRef, {
          icon,
          description,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        alert("Subject Metadata Updated!");
      }
      
      setSelectedSubjectId('');
      setNewSubjectName('');
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
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'subjects', id));
      setConfirmingDeleteId(null);
      fetchSubjects();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete subject. It might have linked data.");
    } finally {
      setLoading(false);
    }
  };

  // Find subjects that have questions or were auto-created but not yet "decorated" with description/icon
  const subjectList = subjects;

  return (
    <AdminLayout title="Subject Dashboard">
      <div className="sticky top-0 z-40 pb-6 bg-[#f8fafc]/50 backdrop-blur-md">
        <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-primary tracking-tight">Subject Repositories</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Manage core syllabus categories and their unique identities ({subjects.length} detected)</p>
          </div>
          <div className="flex items-center gap-4">
             <button
              onClick={fetchSubjects}
              disabled={loading || fetching}
              className="p-3 bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-all"
              title="Refresh List"
            >
              <RotateCcw className={`w-5 h-5 ${fetching ? 'animate-spin' : ''}`} />
            </button>
            
            {confirmingBulkDelete ? (
              <div className="flex items-center gap-3 bg-red-50 p-2 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-right-4">
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest px-2">Purge {subjects.length} subjects?</span>
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      let totalDeleted = 0;
                      while (true) {
                        const snap = await getDocs(query(collection(db, 'subjects'), limit(500)));
                        if (snap.empty) break;
                        
                        const docsInBatch = snap.docs;
                        const batch = writeBatch(db);
                        docsInBatch.forEach((docSnap) => batch.delete(docSnap.ref));
                        await batch.commit();
                        
                        totalDeleted += docsInBatch.length;
                        if (totalDeleted > 100000) break;
                      }
                      
                      alert(`Successfully purged ${totalDeleted} subjects.`);
                      setConfirmingBulkDelete(false);
                      fetchSubjects();
                    } catch (err: any) {
                      console.error("Bulk delete failed:", err);
                      alert("Critical Failure: " + (err.message || "Unknown error during deletion."));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white text-[10px] font-black rounded-xl hover:bg-red-700 uppercase tracking-tighter"
                >
                  {loading ? 'Deleting...' : 'Yes, Delete All'}
                </button>
                <button 
                  onClick={() => setConfirmingBulkDelete(false)}
                  disabled={loading}
                  className="px-4 py-2 bg-white text-slate-400 text-[10px] font-black rounded-xl border border-slate-200 uppercase tracking-tighter"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingBulkDelete(true)}
                disabled={loading || subjects.length === 0}
                className="px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 shadow-lg shadow-red-200"
              >
                Bulk Delete All
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Registration Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm sticky top-24">
            <h3 className="text-xl font-black text-primary mb-6 flex items-center gap-2 uppercase tracking-tight">
              {newSubjectName ? 'Create New Subject' : 'Subject Configuration'}
            </h3>
            
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mode</label>
                <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => { setSelectedSubjectId(''); setNewSubjectName(''); }}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${!selectedSubjectId && !newSubjectName ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                  >
                    Add New
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { if(subjects[0]) setSelectedSubjectId(subjects[0].id); setNewSubjectName(''); }}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${selectedSubjectId ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                  >
                    Update Existing
                  </button>
                </div>
              </div>

              {selectedSubjectId ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Choose Subject</label>
                  <select 
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-primary appearance-none"
                    value={selectedSubjectId} 
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedSubjectId(id);
                      const sub = subjects.find(s => s.id === id);
                      if (sub) {
                        setIcon(sub.icon || 'BookOpen');
                        setDescription(sub.description || '');
                      }
                    }}
                  >
                    <option value="">Select Target Subject</option>
                    {subjectList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-2 animate-in slide-in-from-left-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">New Subject Name</label>
                  <input 
                    required
                    placeholder="E.g. Computer Science"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-primary"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Detailed Description</label>
                <textarea 
                  placeholder="What is covered in this subject?"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-primary min-h-[100px] resize-none"
                  value={description} onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 text-center block">Syllabus Icon</label>
                <div className="grid grid-cols-4 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {ICON_OPTIONS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setIcon(item.name)}
                      className={`p-4 rounded-xl flex items-center justify-center transition-all ${icon === item.name ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                      title={item.name}
                    >
                      <item.icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || (!selectedSubjectId && !newSubjectName)}
                className="w-full py-5 bg-primary text-white rounded-2xl font-black tracking-widest uppercase text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : (newSubjectName ? 'Create Subject' : 'Update Metadata')}
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
                          {confirmingDeleteId === sub.id ? (
                            <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-xl border border-red-100 animate-in fade-in slide-in-from-right-2">
                              <span className="text-[7px] font-black text-red-600 uppercase tracking-tighter px-1 whitespace-nowrap leading-none">Sure? Undo not possible</span>
                              <button 
                                onClick={() => handleDelete(sub.id)}
                                disabled={loading}
                                className="px-2 py-1 bg-red-600 text-white text-[9px] font-black rounded-lg hover:bg-red-700 uppercase"
                              >
                                {loading ? '...' : 'Yes'}
                              </button>
                              <button 
                                onClick={() => setConfirmingDeleteId(null)}
                                className="px-2 py-1 bg-white text-slate-400 text-[9px] font-black rounded-lg border border-slate-200"
                              >
                                X
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setConfirmingDeleteId(sub.id)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Subject"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
