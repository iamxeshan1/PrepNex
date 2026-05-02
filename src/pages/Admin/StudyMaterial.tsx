import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BookOpen, Plus, Search, ExternalLink, Trash2, Edit2, Save, X, Link as LinkIcon } from 'lucide-react';

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

  useEffect(() => {
    fetchMaterials();
  }, []);

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
    setTitle('');
    setUrl('');
    setCategory('General');
    setDescription('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (m: Material) => {
    setTitle(m.title);
    setUrl(m.url);
    setCategory(m.category);
    setDescription(m.description || '');
    setEditingId(m.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this study material document?')) return;
    
    try {
      await deleteDoc(doc(db, 'study_material', id));
      setMaterials(prev => prev.filter(m => m.id !== id));
      alert("Material successfully removed from library.");
    } catch (err: any) {
      console.error("Delete Error:", err);
      alert("Error deleting material: " + (err.message || "Unknown error"));
    }
  };

  return (
    <AdminLayout title="Study Material Manager">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Resource Library</h2>
          <p className="text-xs text-slate-500">Manage external links for notes and practice material.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Material
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Document Title</label>
                <input 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                  value={title} onChange={(e) => setTitle(e.target.value)} required
                  placeholder="e.g. History of J&K Complete Notes"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Category</label>
                <input 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                  value={category} onChange={(e) => setCategory(e.target.value)} required
                  placeholder="e.g. JKSSB / General Knowledge"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest">External Link (Drive/Cloud)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                    value={url} onChange={(e) => setUrl(e.target.value)} required
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Brief Description (Optional)</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm font-medium min-h-[80px]"
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell students what this material covers..."
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                type="submit"
                className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest"
              >
                <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save'} Material
              </button>
              <button 
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 px-8 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />)}
        </div>
      ) : materials.length > 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Material Name</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {materials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary mb-0.5">{m.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium max-w-[300px] truncate">{m.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-widest">
                        {m.category}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <a 
                          href={m.url} target="_blank" rel="noreferrer"
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="Preview Link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => handleEdit(m)}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(m.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
          <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-black text-primary tracking-tight">No Material Added Yet</h3>
          <p className="text-sm text-slate-400 font-medium">Click "Add New Material" to start building your library.</p>
        </div>
      )}
    </AdminLayout>
  );
}
