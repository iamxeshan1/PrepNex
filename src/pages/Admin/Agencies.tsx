import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';                
import { db } from '../../lib/firebase';
import { Plus, Trash2, Edit3, X, Loader2, Upload, ShieldCheck, Star, Activity, LayoutGrid, Award, Search, FileText, CheckCircle2 } from 'lucide-react';

export default function AdminAgencies() {
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [status, setStatus] = useState('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchAgencies(); }, []);                                                                                                                                                                                                                                                                             
  const fetchAgencies = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'agencies'));
      setAgencies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) return alert("Logo must be under 500KB");

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => { setLogoUrl(reader.result as string); setUploading(false); };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name, description, logoUrl, status, isFeatured,
      updatedAt: new Date().toISOString()
    };
    if (editingId) {
      await updateDoc(doc(db, 'agencies', editingId), data);
    } else {
      await addDoc(collection(db, 'agencies'), { ...data, createdAt: new Date().toISOString() });
    }
    setShowForm(false);
    resetForm();
    fetchAgencies();
  };

  const resetForm = () => {
    setName(''); setDescription(''); setLogoUrl(''); setStatus('draft'); setIsFeatured(false); setEditingId(null);
  };

  const startEdit = (agency: any) => {
    setEditingId(agency.id); setName(agency.name || ''); setDescription(agency.description || ''); setLogoUrl(agency.logoUrl || '');
    setStatus(agency.status || 'draft'); setIsFeatured(!!agency.isFeatured); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, confirmed = false) => {
    if (!window.confirm("Are you sure you want to permanently delete this agency and all its exams, tests, and questions? This action cannot be undone.")) return;
    if (true) {
      try {
        const examsSnap = await getDocs(query(collection(db, 'exams'), where('agencyId', '==', id)));
        for (const eDoc of examsSnap.docs) {
          const testsSnap = await getDocs(query(collection(db, 'tests'), where('examId', '==', eDoc.id)));
          for (const tDoc of testsSnap.docs) {
            const qSnap = await getDocs(query(collection(db, 'questions'), where('testId', '==', tDoc.id)));
            const queries = qSnap.docs.map(qd => deleteDoc(doc(db, 'questions', qd.id)));
            await Promise.all(queries);
            await deleteDoc(doc(db, 'tests', tDoc.id));
          }
          await deleteDoc(doc(db, 'exams', eDoc.id));
        }
        await deleteDoc(doc(db, 'agencies', id));
        fetchAgencies();
      } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete agency permanently");
      }
    }
  };

  const StatCard = ({ title, value, span, icon: Icon, colorClass = "text-slate-900" }: any) => (
    <div className="bg-white p-4">
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className={`text-3xl font-bold tracking-tight ${colorClass}`}>{value}</h3>
      {span && <p className="text-xs font-semibold text-slate-400 mt-1">{span}</p>}
    </div>
  );

  const filtered = agencies.filter(a => a.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AdminLayout title="Agencies (Governing Bodies)">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 font-medium">Manage recruiting agencies and governing learning institutions.</p>
        <button 
          onClick={() => { if(showForm) { setShowForm(false); resetForm(); } else setShowForm(true); }}
          className="bg-[#006e5d] text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-[#005a4d] transition-colors"
        >
           {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
           {showForm ? 'Cancel Entry' : 'Add Agency'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Agencies" value={agencies.length} span="Registered bodies" />
        <StatCard title="Active (Live)" value={agencies.filter(a => a.status === 'live').length} span="Currently accepting info" colorClass="text-emerald-600" />
        <StatCard title="Featured" value={agencies.filter(a => a.isFeatured).length} span="Highlighted bodies" colorClass="text-amber-600" />
        <StatCard title="In Draft" value={agencies.filter(a => a.status === 'draft').length} span="Setup phase" colorClass="text-slate-500" />
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white p-8 mb-8 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6">{editingId ? 'Edit Agency' : 'New Agency'}</h3>
          
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Agency Name</label>
                    <input 
                      type="text" required 
                      placeholder="e.g. UPSC, SSC"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-[#006e5d] focus:border-[#006e5d] font-medium"
                      value={name} onChange={(e) => setName(e.target.value)} 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Agency Logo</label>
                    <div className="flex gap-4 items-center">
                      <label className="flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors w-full h-12">
                        {uploading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : <Upload className="w-5 h-5 text-[#006e5d]" />}
                        <span className="text-sm font-medium text-slate-600">{uploading ? 'Uploading...' : 'Upload Image'}</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                      </label>
                      {logoUrl && <img src={logoUrl} alt="Preview" loading="lazy" decoding="async" width="48" height="48" className="h-12 w-12 rounded-lg object-contain border border-slate-200 bg-white" />}
                    </div>
                 </div>
             </div>
             
             <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-[#006e5d] focus:border-[#006e5d] font-medium min-h-[100px]"
                  placeholder="Details about the agency..."
                  value={description} onChange={(e) => setDescription(e.target.value)} 
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                   <select 
                     className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-[#006e5d] focus:border-[#006e5d] font-medium"
                     value={status} onChange={(e) => setStatus(e.target.value)}
                   >
                     <option value="draft">Draft - Hidden</option>
                     <option value="live">Live - Published</option>
                   </select>
                </div>
                <div className="flex items-end">
                   <button 
                     type="button" 
                     onClick={() => setIsFeatured(!isFeatured)}
                     className={`w-full py-3 px-4 rounded-lg border font-semibold flex items-center justify-center gap-2 transition-colors ${isFeatured ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-300 text-slate-600'}`}
                   >
                      <Star className={`w-5 h-5 ${isFeatured ? 'fill-amber-400 text-amber-500' : ''}`} />
                      {isFeatured ? 'Featured Agency' : 'Set as Featured'}
                   </button>
                </div>
             </div>
          </div>
          <div className="mt-8 flex gap-3">
             <button type="submit" className="bg-[#006e5d] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#005a4d] transition-colors">
               {editingId ? 'Save Changes' : 'Create Agency'}
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
                  placeholder="Search agencies..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-sm font-medium focus:ring-[#006e5d] focus:border-[#006e5d] bg-white shadow-sm"
                />
             </div>
           </div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Showing {filtered.length} AGENCIES</p>
        </div>

        {loading ? (
           <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#006e5d] rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                <th className="p-4 pl-6 font-semibold">Agency Info</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Status / Priority</th>
                <th className="p-4 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((agency) => (
                <tr key={agency.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#006e5d]/5 border border-[#006e5d]/10 flex items-center justify-center text-[#006e5d] font-bold overflow-hidden p-1">
                         {agency.logoUrl ? (
                           <img src={agency.logoUrl} alt={agency.name} loading="lazy" decoding="async" width="40" height="40" className="w-full h-full object-contain" />
                         ) : (
                           <span>{agency.name.charAt(0)}</span>
                         )}
                      </div>
                      <div>
                         <p className="font-bold text-slate-900 group-hover:text-[#006e5d] transition-colors uppercase">
                           {agency.name}
                         </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                     <p className="text-xs font-medium text-slate-500 line-clamp-2 max-w-sm">{agency.description || 'No description provided.'}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1.5 items-start">
                       <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 ${
                        (!agency.status || agency.status === 'live') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                       }`}>
                         {agency.status === 'live' ? <CheckCircle2 className="w-3 h-3" /> : null}
                         {agency.status || 'live'}
                       </span>
                       {agency.isFeatured && (
                         <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-700 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500" /> Featured
                         </span>
                       )}
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                     <div className="flex items-center justify-end gap-2 text-slate-400">
                        <button onClick={() => startEdit(agency)} className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Edit Agency">
                           <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(agency.id)} className="p-2 hover:bg-red-50 rounded text-red-500 transition-colors" title="Delete Agency">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                   <td colSpan={4} className="p-8 text-center text-slate-500">No agencies found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
