import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Plus, Trash2, ChevronRight, Settings2, Upload, X, Loader2, Edit3 } from 'lucide-react';

export default function AdminExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [cat, setCat] = useState('Government Jobs');
  const [price, setPrice] = useState('0');
  const [isPaid, setIsPaid] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [difficulty, setDifficulty] = useState('Medium');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    const snapshot = await getDocs(collection(db, 'exams'));
    setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const examData = {
      name,
      organization: org,
      category: cat,
      price: Number(price),
      difficulty,
      isPaid,
      logoUrl,
      isPopular,
      updatedAt: new Date().toISOString()
    };

    if (editingId) {
      const { doc: firestoreDoc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'exams', editingId), examData);
    } else {
      await addDoc(collection(db, 'exams'), {
        ...examData,
        createdAt: new Date().toISOString()
      });
    }

    setShowAddForm(false);
    setEditingId(null);
    fetchExams();
    // Reset form
    setName(''); setOrg(''); setPrice('0'); setIsPaid(false); setLogoUrl(''); setIsPopular(false); setDifficulty('Medium');
  };

  const startEdit = (exam: any) => {
    setEditingId(exam.id);
    setName(exam.name);
    setOrg(exam.organization);
    setCat(exam.category);
    setPrice((exam.price ?? 0).toString());
    setIsPaid(exam.isPaid);
    setLogoUrl(exam.logoUrl || '');
    setIsPopular(exam.isPopular || false);
    setDifficulty(exam.difficulty || 'Medium');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setName(''); setOrg(''); setPrice('0'); setIsPaid(false); setLogoUrl(''); setIsPopular(false); setDifficulty('Medium');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    setUploading(true);
    const storageRef = ref(storage, `exam-logos/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      null,
      (error) => {
        console.error("Upload error:", error);
        alert('Upload failed. Using default icon.');
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setLogoUrl(downloadURL);
        setUploading(false);
      }
    );
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure? This will not delete sub-tests automatically but will break links.')) {
      await deleteDoc(doc(db, 'exams', id));
      fetchExams();
    }
  };

  return (
    <AdminLayout title="Manage Exams">
      <div className="mb-8 flex justify-end">
        <button 
          onClick={() => { if(showAddForm) cancelForm(); else setShowAddForm(true); }}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> {showAddForm ? 'Cancel' : 'Create New Exam'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mb-10 space-y-6 animate-in zoom-in-95 duration-300">
          <h3 className="text-xl font-bold text-primary">{editingId ? 'Edit Exam' : 'Create New Exam'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Exam Name</label>
              <input 
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                value={name} onChange={(e) => setName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Organization</label>
              <input 
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                value={org} onChange={(e) => setOrg(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Category</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                value={cat} onChange={(e) => setCat(e.target.value)}
              >
                {['Government Jobs', 'Medical', 'Engineering', 'Banking', 'Police'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Difficulty</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Exam Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? (
                    <div className="relative w-full h-full group">
                      <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    uploading ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <Settings2 className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="relative cursor-pointer group">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-primary/20 text-primary rounded-xl font-bold hover:bg-primary hover:text-white hover:border-primary transition-all">
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Upload Logo'}
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Recommended: Square image, max 2MB.</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 flex items-end">
              <button 
                type="button"
                onClick={() => setIsPopular(!isPopular)}
                className={`w-full py-3 rounded-xl font-bold border-2 transition-all ${isPopular ? 'border-secondary bg-secondary/5 text-secondary' : 'border-slate-100 text-slate-400'}`}
              >
                {isPopular ? 'Popular Exam (Featured)' : 'Not Featured'}
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Pricing Model</label>
              <div className="flex items-center gap-4">
                <button 
                  type="button"
                  onClick={() => setIsPaid(false)}
                  className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${!isPaid ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-400'}`}
                >
                  Free
                </button>
                <button 
                  type="button"
                  onClick={() => setIsPaid(true)}
                  className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${isPaid ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-400'}`}
                >
                  Paid
                </button>
              </div>
            </div>
            {isPaid && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Price (INR)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                  value={price} onChange={(e) => setPrice(e.target.value)} 
                />
              </div>
            )}
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all">
            {editingId ? 'Update Exam Details' : 'Save Exam Category'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {exams.map((exam) => (
          <div key={exam.id} className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors shrink-0">
                {exam.logoUrl ? (
                  <img src={exam.logoUrl} alt={exam.name} className="w-full h-full object-cover" />
                ) : (
                  <Settings2 className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-primary tracking-tight truncate">{exam.name}</h4>
                  {exam.isPopular && (
                    <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[8px] font-black uppercase rounded-full tracking-wider">Popular</span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  <span className="truncate">{exam.organization}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200 shrink-0" />
                  <span className="truncate">{exam.category}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200 shrink-0" />
                  <span className={`px-2 py-0.5 rounded-md ${exam.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : exam.difficulty === 'Hard' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{exam.difficulty || 'Medium'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest flex-wrap justify-end">
              <button 
                onClick={() => startEdit(exam)}
                className="flex-1 sm:flex-none justify-center px-4 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-secondary hover:text-white transition-all flex items-center gap-2"
              >
                Edit <Edit3 className="w-3.5 h-3.5" />
              </button>
              <Link to={`/admin/tests/${exam.id}`} className="flex-1 sm:flex-none justify-center px-4 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-2">
                Manage <ChevronRight className="w-4 h-4" />
              </Link>
              <button 
                onClick={() => handleDelete(exam.id)} 
                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
