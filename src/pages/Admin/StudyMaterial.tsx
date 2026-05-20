import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  BookOpen, 
  Plus, 
  Search, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  X, 
  FileText, 
  Loader2, 
  Link as LinkIcon, 
  Lock, 
  Unlock, 
  UploadCloud, 
  Grid,
  Sparkles
} from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import Toast, { ToastType } from '../../components/Toast';

interface Material {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string;
  createdAt: string;
  isFree: boolean;
  coverUrl?: string;
  price?: number;
}

export default function AdminStudyMaterial() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);

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
  const [isFree, setIsFree] = useState(true);
  const [coverUrl, setCoverUrl] = useState('');
  const [price, setPrice] = useState<number | ''>('');

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'study_material'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      // Auto-seeds a beautiful reference eBook if there are 0 materials
      if (items.length === 0) {
        const referenceBook = {
          title: "Ultimate Quantitative Aptitude Prep Masterclass 2026",
          category: "Mathematics",
          description: "An exhaustive master-guide featuring 1,500+ solved practice problems, advanced shortcuts, and expert time-management strategy for competitive examinations.",
          url: "https://example.com/reference_quantitative_aptitude.pdf",
          isFree: false,
          price: 199,
          coverUrl: "",
          createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, 'study_material'), referenceBook);
        items.push({ id: docRef.id, ...referenceBook });
      }

      setMaterials(items);
    } catch (err) {
      console.error("Error fetching study materials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMaterials(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `study_material_covers/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      setCoverUrl(downloadUrl);
      setToast({
        isVisible: true,
        message: 'Cover photo uploaded successfully to Firebase Storage!',
        type: 'success'
      });
    } catch (err: any) {
      console.error(err);
      setToast({
        isVisible: true,
        message: `Upload failed: ${err.message || 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;

    try {
      const payload: any = {
        title,
        url,
        category,
        description,
        isFree,
        coverUrl,
        price: !isFree && price !== '' ? Number(price) : 0,
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        await updateDoc(doc(db, 'study_material', editingId), payload);
        setToast({
          isVisible: true,
          message: 'Study material eBook updated successfully.',
          type: 'success'
        });
      } else {
        await addDoc(collection(db, 'study_material'), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        setToast({
          isVisible: true,
          message: 'Study material eBook published successfully.',
          type: 'success'
        });
      }
      resetForm();
      fetchMaterials();
    } catch (err) {
      console.error(err);
      setToast({
        isVisible: true,
        message: 'Failed to save eBook resource.',
        type: 'error'
      });
    }
  };

  const resetForm = () => {
    setTitle(''); 
    setUrl(''); 
    setCategory('General'); 
    setDescription('');
    setIsFree(true);
    setCoverUrl('');
    setPrice('');
    setIsAdding(false); 
    setEditingId(null);
  };

  const handleEdit = (m: Material) => {
    setTitle(m.title); 
    setUrl(m.url); 
    setCategory(m.category); 
    setDescription(m.description || '');
    setIsFree(m.isFree !== false);
    setCoverUrl(m.coverUrl || '');
    setPrice(m.price !== undefined ? m.price : '');
    setEditingId(m.id); 
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      materialId: id,
      title: 'Purge E-Book Resource',
      message: `Are you sure you want to delete "${name}"? This action will permanently remove it from the study shelf registry.`
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
        message: 'eBook deleted successfully.',
        type: 'success'
      });
    } catch (err) {
      setToast({
        isVisible: true,
        message: 'Failed to delete register.',
        type: 'error'
      });
    }
  };

  // Extract unique covers uploaded before
  const existingCovers = Array.from(
    new Set(materials.map(m => m.coverUrl).filter((url): url is string => !!url))
  );

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ title, value, span, colorClass = "text-slate-900" }: any) => (
    <div className="bg-white p-6 border border-slate-200">
      <p className="text-sm font-semibold text-slate-500 mb-1">{title}</p>
      <h3 className={`text-3xl font-[900] tracking-tight ${colorClass}`}>{value}</h3>
      {span && <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{span}</p>}
    </div>
  );

  return (
    <AdminLayout title="Study Material & eBooks">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <p className="text-slate-500 font-medium text-sm">Publish and organize premium eBooks, PDFs, and prep-guides on the platform grid.</p>
        </div>
        <button 
          onClick={() => { if(isAdding) resetForm(); else setIsAdding(true); }}
          className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md active:scale-95"
          id="toggleStudyFormBtn"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Cancel' : 'Publish New Booklet'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Books/PDFs" value={materials.length} span="Available Content" colorClass="text-[#006e5d]" />
        <StatCard title="Free Access" value={materials.filter(m => m.isFree !== false).length} span="No Subscription" colorClass="text-emerald-600" />
        <StatCard title="Premium eBooks" value={materials.filter(m => m.isFree === false).length} span="Requires Sub Pass" colorClass="text-amber-500" />
        <StatCard title="Distinct Courses" value={new Set(materials.map(m => m.category)).size} span="Target Subjects" colorClass="text-blue-600" />
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-8 mb-8 border border-slate-200 shadow-xl rounded-2xl relative" id="studyMaterialForm">
           <button type="button" onClick={resetForm} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-600 transition-colors">
              <X className="w-5 h-5" />
           </button>

           <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
             <BookOpen className="w-5 h-5 text-teal-600" /> 
             {editingId ? 'Modify eBook Details' : 'Publish New Reference eBook'}
           </h3>

           <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Booklet Title</label>
                    <input 
                       required 
                       placeholder="e.g. UPSC General Studies Mindmaps 2026"
                       className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-semibold text-slate-800 shadow-sm"
                       value={title} onChange={(e) => setTitle(e.target.value)} 
                       id="inputTitle"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Subject / Category</label>
                    <input 
                       required 
                       placeholder="e.g. Mathematics, Indian Polity"
                       className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-semibold text-slate-800 shadow-sm"
                       value={category} onChange={(e) => setCategory(e.target.value)} 
                       id="inputCategory"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                {/* Access Level Toggle */}
                <div>
                   <label className="block text-sm font-extrabold text-slate-800 mb-3">Pricing Tier</label>
                   <div className="flex items-center gap-6">
                     <label className="flex items-center gap-2.5 cursor-pointer select-none">
                       <input 
                         type="radio" 
                         name="pricingTier"
                         checked={isFree === true}
                         onChange={() => setIsFree(true)}
                         className="w-4 h-4 text-teal-600 border-slate-300 focus:ring-teal-500" 
                         id="tierFreeOption"
                       />
                       <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                         <Unlock className="w-3.5 h-3.5 text-emerald-500" /> Free Book
                       </span>
                     </label>
                     <label className="flex items-center gap-2.5 cursor-pointer select-none">
                       <input 
                         type="radio" 
                         name="pricingTier"
                         checked={isFree === false}
                         onChange={() => setIsFree(false)}
                         className="w-4 h-4 text-teal-600 border-slate-300 focus:ring-teal-500" 
                         id="tierPremiumOption"
                       />
                       <span className="text-sm font-bold text-teal-700 flex items-center gap-1">
                         <Lock className="w-3.5 h-3.5 text-amber-500" /> Premium / Paid Only
                       </span>
                     </label>
                   </div>
                   <p className="text-xs font-semibold text-slate-400 mt-2.5">Paid books only unlock for active paid subscribers.</p>

                   {/* Pricing fields for premium book */}
                   {!isFree && (
                     <div className="mt-4 pt-4 border-t border-slate-200">
                       <label className="block text-xs font-black uppercase text-slate-600 mb-1.5">Premium Ebook Access Price (₹)</label>
                       <input 
                         type="number"
                         required
                         placeholder="e.g. 199"
                         min="0"
                         className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-semibold text-sm text-slate-800"
                         value={price} 
                         onChange={(e) => setPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                         id="inputPriceField"
                       />
                       <p className="text-[10px] text-slate-400 font-semibold mt-1">Specify price tag displayed to general students.</p>
                     </div>
                   )}
                </div>

                {/* PDF Link URL */}
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">PDF Document Link (Download / Drive URL)</label>
                   <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                         required 
                         placeholder="https://drive.google.com/..."
                         className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-semibold text-slate-800 shadow-sm"
                         value={url} onChange={(e) => setUrl(e.target.value)} 
                         id="inputUrl"
                      />
                   </div>
                </div>
              </div>

              {/* Cover Design & Upload Module */}
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60">
                <h4 className="text-sm font-extrabold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-teal-600" /> Cover Photo Configuration
                </h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Aspect Ratio Preview */}
                  <div className="lg:col-span-1 flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl aspect-[3/4] shadow-sm relative overflow-hidden group">
                    {coverUrl ? (
                      <>
                        <img src={coverUrl} alt="eBook Cover" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                          <button 
                            type="button" 
                            onClick={() => setCoverUrl('')}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-transform active:scale-95"
                          >
                            Reset Cover
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-400">Default Spine Gradient</p>
                      </div>
                    )}
                  </div>

                  {/* Pick cover or upload cover */}
                  <div className="lg:col-span-3 space-y-4">
                    {/* Direct Cover URL Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Direct Cover Photo URL</label>
                      <input 
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium text-sm text-slate-700 shadow-sm"
                        value={coverUrl}
                        onChange={(e) => setCoverUrl(e.target.value)}
                        id="inputCoverUrl"
                      />
                    </div>

                    {/* Drag / File Upload via Firebase Storage */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">Upload to Server</label>
                      <div className="flex items-center gap-4">
                        <label className="cursor-pointer bg-[#006e5d]/5 hover:bg-[#006e5d]/10 border border-[#006e5d]/20 px-4 py-2.5 rounded-xl text-xs font-bold text-[#006e5d] flex items-center gap-2 transition-all">
                          {uploading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>Select Cover Image</span>
                            </>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileUpload}
                            disabled={uploading} 
                            id="coverFileInput"
                          />
                        </label>
                        <p className="text-[10px] text-slate-400 font-semibold leading-normal">Uploaded straight to your personal Cloud bucket. Automatically stored in historical listings.</p>
                      </div>
                    </div>

                    {/* Pick from previously uploaded covers */}
                    {existingCovers.length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Previously Uploaded Covers ({existingCovers.length})</label>
                        <div className="flex flex-wrap gap-2.5 p-2 bg-slate-100/60 rounded-xl max-h-[100px] overflow-y-auto border border-slate-100">
                          {existingCovers.map((u, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setCoverUrl(u)}
                              className={`w-10 h-14 rounded-md border-2 overflow-hidden transition-all relative shrink-0 ${coverUrl === u ? 'border-teal-600 scale-105 shadow-md shadow-teal-600/20' : 'border-slate-200 hover:border-slate-400'}`}
                            >
                              <img src={u} alt={`Prev Cover ${i}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Booklet Overview / Description</label>
                  <textarea 
                     required
                     placeholder="Provide a detailed roadmap or table of contents context of this booklet..."
                     className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-semibold text-slate-800 shadow-sm min-h-[100px]"
                     value={description} onChange={(e) => setDescription(e.target.value)} 
                     id="inputDescription"
                  />
               </div>
           </div>

           <div className="mt-8 flex justify-end gap-3">
              <button 
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-bold text-sm rounded-xl"
              >
                Discard
              </button>
              <button 
                type="submit" 
                className="bg-teal-700 hover:bg-teal-850 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 flex items-center gap-2"
                id="submitStudyFormBtn"
              >
                <BookOpen className="w-4 h-4" />
                {editingId ? 'Modify Booklet' : 'Publish to Shelf'}
              </button>
           </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/50">
           <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search by title or category..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-xl text-sm font-semibold bg-white shadow-sm"
                id="searchMaterialsInput"
              />
           </div>
           <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right self-center">Showing {filteredMaterials.length} REGISTERED E-BOOKS</p>
        </div>

        {loading ? (
           <div className="py-24 flex justify-center flex-col items-center gap-3">
             <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
             <p className="text-sm font-semibold text-slate-500">Retrieving digital book catalog...</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70">
                  <th className="p-4 pl-6">Book Item & Cover</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Pricing Access</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 pr-6 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.map((m) => {
                  const isFreeBook = m.isFree !== false;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-16 rounded overflow-hidden shadow-md bg-slate-100 shrink-0 border border-slate-200 relative">
                             {m.coverUrl ? (
                               <img src={m.coverUrl} alt={m.title} className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full bg-gradient-to-br from-brand-teal/80 to-teal-800 flex items-center justify-center text-white font-bold text-[8px] p-1 text-center leading-none">
                                 {m.category || 'PDF'}
                               </div>
                             )}
                           </div>
                           <div className="max-w-md">
                             <span className="text-[10px] font-black uppercase tracking-widest text-[#006e5d] bg-[#006e5d]/5 px-2 py-0.5 rounded-full mb-1 inline-block">
                               {m.category}
                             </span>
                             <p className="font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                               {m.title}
                             </p>
                             <p className="text-xs font-semibold text-slate-400 mt-0.5 line-clamp-1">{m.description || 'No summary text provided.'}</p>
                           </div>
                        </div>
                      </td>
                      <td className="p-4">
                         <span className="text-xs font-extrabold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md uppercase tracking-wider">
                            {m.category}
                         </span>
                      </td>
                      <td className="p-4">
                         <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide ${isFreeBook ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {isFreeBook ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            {isFreeBook ? 'Free Access' : `Premium (₹${m.price !== undefined ? m.price : 0})`}
                         </span>
                      </td>
                      <td className="p-4">
                         <span className="text-xs font-semibold text-slate-500">
                            {new Date(m.createdAt).toLocaleDateString()}
                         </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                         <div className="flex items-center justify-end gap-1 text-slate-400">
                            <a 
                               href={m.url}
                               target="_blank"
                               rel="noreferrer"
                               className="p-2 bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-[#006e5d] rounded-lg transition-colors"
                               title="Download Check"
                            >
                               <ExternalLink className="w-4 h-4" />
                            </a>
                            <button onClick={() => handleEdit(m)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-amber-500 transition-colors" title="Edit details">
                               <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(m.id, m.title)} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors" title="Remove forever">
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredMaterials.length === 0 && (
                  <tr>
                     <td colSpan={5} className="p-16 text-center text-slate-500">No matching study materials found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
        confirmText="Confirm Deletion"
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
