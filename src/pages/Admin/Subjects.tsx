import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Loader2, 
  Search, 
  Database, 
  Sparkles,
  ArrowRight,
  BookOpen, Brain, Calculator, Globe, Microscope, History, Map, Cpu, FileText, Palette, Atom, MessageSquare, Languages, FlaskConical, Dna, Binary, Code, Music, HeartPulse, Scale, Briefcase, Church, Sigma, Zap, Gamepad2, Brush, Variable,
  AlertTriangle
} from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import Toast, { ToastType } from '../../components/Toast';


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
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showForm, setShowForm] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    subjectId: '',
    title: '',
    message: ''
  });

  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as ToastType
  });

  const fetchSubjects = async () => {
    setFetching(true);
    try {
      const allSnap = await getDocs(collection(db, 'subjects'));
      const allDocs = allSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
      allDocs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setSubjects(allDocs);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId && !newSubjectName) return;
    setLoading(true);
    try {
      if (newSubjectName) {
        const exists = subjects.find(s => s.name?.toLowerCase() === newSubjectName.trim().toLowerCase());
        if (exists) {
          setToast({
            isVisible: true,
            message: "Domain node already exists in registry.",
            type: 'error'
          });
          setLoading(false);
          return;
        }

        await addDoc(collection(db, 'subjects'), {
          name: newSubjectName.trim(),
          icon,
          description,
          createdAt: new Date().toISOString()
        });
      } else {
        const subRef = doc(db, 'subjects', selectedSubjectId);
        await setDoc(subRef, {
          icon,
          description,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      
      resetForm();
      fetchSubjects();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedSubjectId('');
    setNewSubjectName('');
    setDescription('');
    setIcon('BookOpen');
    setShowForm(false);
  };

  const startEdit = (subject: Subject) => {
    setSelectedSubjectId(subject.id);
    setNewSubjectName('');
    setDescription(subject.description || '');
    setIcon(subject.icon || 'BookOpen');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startCreate = () => {
    setSelectedSubjectId('');
    setNewSubjectName('');
    setDescription('');
    setIcon('BookOpen');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      subjectId: id,
      title: 'Decommissioning Subject Node',
      message: 'System Alert: Authorized deletion of this subject domain. This will permanently purge all associated tests and question sub-nodes from the registry. This protocol is irreversible.'
    });
  };

  const confirmDelete = async () => {
    const id = confirmModal.subjectId;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    setLoading(true);
    try {
      const testsSnap = await getDocs(query(collection(db, 'tests'), where('subjectId', '==', id)));
      for (const tDoc of testsSnap.docs) {
        const qSnap = await getDocs(query(collection(db, 'questions'), where('testId', '==', tDoc.id)));
        const queries = qSnap.docs.map(qd => deleteDoc(doc(db, 'questions', qd.id)));
        await Promise.all(queries);
        await deleteDoc(doc(db, 'tests', tDoc.id));
      }
      
      const subQuestionsSnap = await getDocs(query(collection(db, 'questions'), where('subjectId', '==', id)));
      const qQueries = subQuestionsSnap.docs.map(qd => deleteDoc(doc(db, 'questions', qd.id)));
      await Promise.all(qQueries);

      await deleteDoc(doc(db, 'subjects', id));
      fetchSubjects();
      setToast({
        isVisible: true,
        message: 'Subject node decommissioned successfully.',
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      setToast({
        isVisible: true,
        message: 'Decommissioning protocol failed.',
        type: 'error'
      });
    }
    setLoading(false);
  };

  const StatCard = ({ title, value, span, icon: Icon, colorClass = "text-slate-900" }: any) => (
    <div className="bg-white p-4">
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className={`text-3xl font-bold tracking-tight ${colorClass}`}>{value}</h3>
      {span && <p className="text-xs font-semibold text-slate-400 mt-1">{span}</p>}
    </div>
  );

  const filtered = subjects.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AdminLayout title="Subjects (Domains)">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 font-medium">Manage academic domains and study materials.</p>
        <button 
          onClick={() => showForm ? resetForm() : startCreate()}
          className="bg-teal-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-teal-800 transition-colors"
        >
           {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
           {showForm ? 'Cancel Entry' : 'Add Subject'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Subjects" value={subjects.length} span="Academic domains" colorClass="text-teal-600" />
        <StatCard title="Recently Added" value={subjects.filter(s => new Date(s.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} span="Last 7 days" colorClass="text-amber-600" />
        <StatCard title="Active Materials" value="-" span="Under development" colorClass="text-teal-600" />
      </div>

      {showForm && (
        <form onSubmit={handleRegister} className="bg-white p-8 mb-8 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6">{selectedSubjectId ? 'Edit Subject' : 'New Subject'}</h3>
          
          <div className="space-y-6">
             <div className="grid grid-cols-1 gap-6">
                {selectedSubjectId ? (
                   <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Subject Name (Locked)</label>
                      <input 
                        type="text" 
                        disabled
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-500"
                        value={subjects.find(s => s.id === selectedSubjectId)?.name || ''} 
                      />
                   </div>
                ) : (
                   <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Subject Name</label>
                      <input 
                        required
                        placeholder="e.g. Constitutional Law"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 font-medium text-slate-900"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                      />
                   </div>
                )}
             </div>

             <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 font-medium min-h-[100px]"
                  placeholder="Details about the domain boundaries..."
                  value={description} onChange={(e) => setDescription(e.target.value)} 
                />
             </div>

             <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Visual Icon</label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-4 bg-slate-50 rounded-lg border border-slate-200">
                  {ICON_OPTIONS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setIcon(item.name)}
                      className={`p-3 rounded-lg transition-colors border ${icon === item.name ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-white border-slate-200 text-slate-400 hover:border-teal-300 hover:text-teal-600'}`}
                    >
                      <item.icon className="w-6 h-6" />
                    </button>
                  ))}
                </div>
             </div>
          </div>
          <div className="mt-8 flex gap-3">
             <button type="submit" disabled={loading} className="bg-teal-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-teal-800 transition-colors disabled:opacity-50">
               {loading ? 'Saving...' : (selectedSubjectId ? 'Save Changes' : 'Create Subject')}
             </button>
          </div>
        </form>
      )}

      <div className="bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
           <div className="flex gap-4">
             <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search subjects..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-sm font-medium focus:ring-teal-500 focus:border-teal-500 bg-white shadow-sm"
                />
             </div>
           </div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Showing {filtered.length} SUBJECTS</p>
        </div>

        {fetching ? (
           <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                <th className="p-4 pl-6 font-semibold">Subject Domain</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Created Date</th>
                <th className="p-4 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => {
                const IconComp = ICON_OPTIONS.find(i => i.name === sub.icon)?.icon || BookOpen;
                return (
                  <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 font-bold overflow-hidden">
                            <IconComp className="w-5 h-5" />
                         </div>
                         <div>
                           <p className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors uppercase">
                             {sub.name}
                           </p>
                         </div>
                      </div>
                    </td>
                    <td className="p-4">
                       <p className="text-xs font-medium text-slate-500 line-clamp-2 max-w-sm">{sub.description || 'Global domain for targeted academic training.'}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium text-slate-600">{new Date(sub.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                       <div className="flex items-center justify-end gap-2 text-slate-400">
                          <Link 
                             to={`/admin/subject-tests/${sub.id}`} 
                             className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors flex items-center gap-1"
                             title="View Materials/Tests"
                          >
                             <Database className="w-4 h-4" />
                          </Link>
                          <button onClick={() => startEdit(sub)} className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Edit Subject">
                             <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(sub.id)} className="p-2 hover:bg-red-50 rounded text-red-500 transition-colors" title="Delete Subject">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                )}
              )}
              {filtered.length === 0 && (
                <tr>
                   <td colSpan={4} className="p-8 text-center text-slate-500">No subjects found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
        confirmText="Confirm Purge"
      />

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </AdminLayout>
  );
}
