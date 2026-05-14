import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BookOpen, Plus, Search, ExternalLink, Trash2, Edit3, X, FileText, Database, Loader2, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import Toast, { ToastType } from '../../components/Toast';

interface Material {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string;
  createdAt: string;
}

export default function AdminStudyMaterial() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    materialId: '',
    title: '',
    message: ''
  });

  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as ToastType
  });

  // Form State
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'study_material'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setMaterials(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Material)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMaterials(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'study_material', editingId), {
          title, url, category, description, updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'study_material'), {
          title, url, category, description, createdAt: new Date().toISOString()
        });
      }
      resetForm();
      fetchMaterials();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setTitle(''); setUrl(''); setCategory('General'); setDescription('');
    setIsAdding(false); setEditingId(null);
  };

  const handleEdit = (m: Material) => {
    setTitle(m.title); setUrl(m.url); setCategory(m.category); setDescription(m.description || '');
    setEditingId(m.id); setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      materialId: id,
      title: 'Purging Resource Node',
      message: 'System Alert: Authorized deletion of this study resource. This will permanently remove the link from the network registry. The physical file on the external server will not be affected.'
    });
  };

  const confirmDelete = async () => {
    const id = confirmModal.materialId;
    try {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      await deleteDoc(doc(db, 'study_material', id));
      setMaterials(prev => prev.filter(m => m.id !== id));
      setToast({
        isVisible: true,
        message: 'Resource node purged successfully.',
        type: 'success'
      });
    } catch (err) {
      setToast({
        isVisible: true,
        message: 'Purge protocol failed.',
        type: 'error'
      });
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ title, value, span, colorClass = "text-slate-900" }: any) => (
    <div className="bg-white p-4">
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className={`text-3xl font-bold tracking-tight ${colorClass}`}>{value}</h3>
      {span && <p className="text-xs font-semibold text-slate-400 mt-1">{span}</p>}
    </div>
  );

  return (
    <AdminLayout title="Study Material">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 font-medium">Manage and distribute study resources for students.</p>
        <button 
          onClick={() => { if(isAdding) resetForm(); else setIsAdding(true); }}
          className="bg-teal-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-teal-800 transition-colors"
        >
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {isAdding ? 'Cancel' : 'Add Material'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Resources" value={materials.length} span="In library" colorClass="text-teal-600" />
        <StatCard title="Recent Added" value={materials.filter(m => new Date(m.createdAt) > new Date(Date.now() - 7*24*60*60*1000)).length} span="Last 7 days" colorClass="text-emerald-600" />
        <StatCard title="Categories" value={new Set(materials.map(m => m.category)).size} span="Distinct domains" colorClass="text-amber-600" />
        <StatCard title="Storage" value="-" span="Cloud links" colorClass="text-slate-600" />
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-8 mb-8 relative border-b border-slate-200">
           <button type="button" onClick={resetForm} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-600 transition-colors">
              <X className="w-5 h-5" />
           </button>

           <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><BookOpen className="w-5 h-5 text-teal-600" /> {editingId ? 'Edit Study Material' : 'Add Study Material'}</h3>

           <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Resource Title</label>
                    <input 
                       required 
                       placeholder="e.g. History Notes PDF"
                       className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 font-medium bg-slate-50"
                       value={title} onChange={(e) => setTitle(e.target.value)} 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                    <input 
                       required 
                       placeholder="e.g. UPSC Prelims"
                       className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 font-medium bg-slate-50"
                       value={category} onChange={(e) => setCategory(e.target.value)} 
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">URL / Link</label>
                 <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                       required 
                       placeholder="https://drive.google.com/..."
                       className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 font-medium bg-slate-50"
                       value={url} onChange={(e) => setUrl(e.target.value)} 
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Description / Context</label>
                 <textarea 
                    placeholder="Provide a brief overview of the material..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 font-medium min-h-[100px] bg-slate-50"
                    value={description} onChange={(e) => setDescription(e.target.value)} 
                 />
              </div>
           </div>

           <div className="mt-8">
              <button 
                type="submit" 
                className="bg-teal-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-teal-800 transition-colors"
              >
                 {editingId ? 'Save Changes' : 'Publish Resource'}
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
                  placeholder="Search resources..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-sm font-medium focus:ring-teal-500 focus:border-teal-500 bg-white shadow-sm"
                />
             </div>
           </div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Showing {filteredMaterials.length} RESOURCES</p>
        </div>

        {loading ? (
           <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                <th className="p-4 pl-6 font-semibold">Resource Title</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Added On</th>
                <th className="p-4 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                          <FileText className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate max-w-sm">
                           {m.title}
                         </p>
                         <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate max-w-sm">{m.description || 'No description'}</p>
                       </div>
                    </div>
                  </td>
                  <td className="p-4">
                     <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                        {m.category}
                     </span>
                  </td>
                  <td className="p-4">
                     <span className="text-xs font-semibold text-slate-600">
                        {new Date(m.createdAt).toLocaleDateString()}
                     </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                     <div className="flex items-center justify-end gap-2 text-slate-400">
                        <a 
                           href={m.url}
                           target="_blank"
                           rel="noreferrer"
                           className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 rounded text-xs font-bold transition-colors flex items-center gap-1"
                        >
                           Open <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => handleEdit(m)} className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Edit Resource">
                           <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="p-2 hover:bg-red-50 rounded text-red-500 transition-colors" title="Delete Resource">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
              {filteredMaterials.length === 0 && (
                <tr>
                   <td colSpan={4} className="p-8 text-center text-slate-500">No study materials found.</td>
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
