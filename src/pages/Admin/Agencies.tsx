import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';                
import { db, auth } from '../../lib/firebase';
import { Plus, Trash2, Edit3, X, Loader2, Upload } from 'lucide-react';

export default function AdminAgencies() {
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [status, setStatus] = useState('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchAgencies();
  }, []);
                                                                                                                                                                                                                                                                            
  const fetchAgencies = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'agencies'));
      setAgencies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    } catch (error: any) {
      console.error("Fetch agencies error:", error);
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500000) {
      alert("Logo file is too large. Please keep it under 500KB.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoUrl(reader.result as string);
      setUploading(false);
    };
    reader.onerror = () => {
      alert("Failed to read file.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const data = {
      name: name || '',
      description: description || '',
      logoUrl: logoUrl || '',
      status: status || 'draft',
      isFeatured: !!isFeatured,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'agencies', editingId), data);
      } else {
        await addDoc(collection(db, 'agencies'), {
          ...data,
          createdAt: new Date().toISOString()
        });
      }

      setShowForm(false);
      setEditingId(null);
      resetForm();
      await fetchAgencies();
      alert(editingId ? "Agency updated!" : "Agency added!");
    } catch (error: any) {
      console.error("Save error:", error);
      alert(`Failed to save agency: ${error.message}`);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setLogoUrl('');
    setStatus('draft');
    setIsFeatured(false);
    setEditingId(null);
  };

  const startEdit = (agency: any) => {
    setEditingId(agency.id);
    setName(agency.name || '');
    setDescription(agency.description || '');
    setLogoUrl(agency.logoUrl || '');
    setStatus(agency.status || 'draft');
    setIsFeatured(!!agency.isFeatured);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const docRef = doc(db, 'agencies', id);
      await deleteDoc(docRef);
      setConfirmingDeleteId(null);
      await fetchAgencies();
      alert("Agency deleted successfully!");
    } catch (error: any) {
      console.error("Delete operation failed:", error);
      alert(`Failed to delete agency: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <AdminLayout title="Agencies (Recruitment)">
      {!showForm && (
        <div className="mb-6">
          <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" /> Add New Agency
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mb-10 space-y-6">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl mb-4">
            <h3 className="font-bold text-primary">{editingId ? 'Edit Agency' : 'Add New Agency'}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Agency Name (e.g. JKSSB, UPSC)</label>
              <input 
                type="text" required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                value={name} onChange={(e) => setName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Logo (Optional)</label>
              <div className="flex gap-4">
                <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : <Upload className="w-5 h-5 text-slate-400" />}
                  <span className="text-sm font-medium text-slate-600">{uploading ? 'Uploading...' : 'Choose Image'}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                </label>
                {logoUrl && <img src={logoUrl} alt="Preview" className="h-12 w-12 rounded-xl object-cover border border-slate-200" />}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Description (Optional)</label>
              <textarea 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                value={description} onChange={(e) => setDescription(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Status</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                value={status} onChange={(e) => setStatus(e.target.value)}
              >
                <option value="draft">Draft (Hidden)</option>
                <option value="live">Live (Published)</option>
              </select>
            </div>
            <div className="space-y-2 flex items-center gap-2 pt-6">
              <input 
                type="checkbox"
                className="w-5 h-5 rounded border-slate-200 text-primary focus:ring-primary"
                checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} 
              />
              <label className="text-sm font-bold text-slate-700">Mark as Featured</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl">Cancel</button>
            <button type="submit" className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
              {editingId ? 'Update Agency' : 'Save Agency'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agencies.map((agency) => (
            <div key={agency.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group hover:border-primary/20 transition-all">
              <div className="flex gap-4 items-start mb-4">
                {agency.logoUrl ? (
                  <img src={agency.logoUrl} alt={agency.name} className="w-12 h-12 rounded-2xl object-cover bg-slate-50 border border-slate-100" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 font-black">
                    {agency.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-extrabold text-primary tracking-tight">{agency.name}</h4>
                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-full tracking-wider ${
                    (!agency.status || agency.status === 'live') ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {agency.status || 'live'}
                  </span>
                </div>
              </div>
              {agency.description && (
                <p className="text-sm text-slate-500 mb-6 line-clamp-2">{agency.description}</p>
              )}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button onClick={() => startEdit(agency)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
                {confirmingDeleteId === agency.id ? (
                  <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-xl border border-red-100">
                    <span className="text-[7px] font-black text-red-600 uppercase tracking-tighter px-1">Delete?</span>
                    <button 
                      onClick={(e) => handleDelete(agency.id, e)}
                      className="px-2 py-1 bg-red-600 text-white text-[9px] font-black rounded-lg hover:bg-red-700"
                    >
                      Yes
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setConfirmingDeleteId(null); }}
                      className="px-1.5 py-1 bg-white text-slate-400 text-[9px] font-black rounded-lg"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); setConfirmingDeleteId(agency.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Delete Agency">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {agencies.length === 0 && (
            <div className="col-span-full text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-500">
              No agencies added yet. Create one to get started.
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
