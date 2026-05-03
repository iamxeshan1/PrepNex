import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Trash2, ChevronRight, Settings2, Upload, X, Loader2, Edit3 } from 'lucide-react';

export default function AdminExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<'recruitment' | 'competitive'>('recruitment');
  
  // Form State
  const [name, setName] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [cat, setCat] = useState('Government Jobs');
  const [price, setPrice] = useState('0');
  const [isPaid, setIsPaid] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [status, setStatus] = useState('draft');
  const [subjectsWeightage, setSubjectsWeightage] = useState<{subjectId: string, marks: string}[]>([]);
  const [totalPosts, setTotalPosts] = useState('');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [postDistribution, setPostDistribution] = useState<{category: string, count: string}[]>([]);

  useEffect(() => {
    fetchExamsAndAgencies();
  }, []);

  const fetchExamsAndAgencies = async () => {
    const [examsSnap, agenciesSnap, subjectsSnap] = await Promise.all([
      getDocs(collection(db, 'exams')),
      getDocs(collection(db, 'agencies')),
      getDocs(collection(db, 'subjects'))
    ]);
    setExams(examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setAgencies(agenciesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setSubjects(subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  const addSubject = () => {
    setSubjectsWeightage([...subjectsWeightage, { subjectId: '', marks: '' }]);
  };

  const updateSubject = (index: number, field: 'subjectId'|'marks', value: string) => {
    const newArr = [...subjectsWeightage];
    newArr[index][field] = value;
    setSubjectsWeightage(newArr);
  };

  const removeSubject = (index: number) => {
    setSubjectsWeightage(subjectsWeightage.filter((_, i) => i !== index));
  };

  const addPostCategory = () => {
    setPostDistribution([...postDistribution, { category: '', count: '' }]);
  };

  const updatePostCategory = (index: number, field: 'category'|'count', value: string) => {
    const newArr = [...postDistribution];
    newArr[index][field] = value;
    setPostDistribution(newArr);
  };

  const removePostCategory = (index: number) => {
    setPostDistribution(postDistribution.filter((_, i) => i !== index));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const examData = {
      name,
      agencyId,
      type,
      category: type === 'recruitment' ? cat : 'Competitive',
      price: Number(price),
      isPaid: isPaid,
      subjectsWeightage: subjectsWeightage.map(sw => ({
        ...sw,
        subject: subjects.find(s => s.id === sw.subjectId)?.name || 'Unknown'
      })),
      totalPosts: type === 'recruitment' ? Number(totalPosts) : 0,
      postDistribution: type === 'recruitment' ? postDistribution.map(p => ({ category: p.category, count: Number(p.count) })) : [],
      isPopular,
      status,
      updatedAt: new Date().toISOString()
    };

    if (editingId) {
      await updateDoc(doc(db, 'exams', editingId), examData);
    } else {
      await addDoc(collection(db, 'exams'), {
        ...examData,
        createdAt: new Date().toISOString()
      });
    }

    setShowAddForm(false);
    setEditingId(null);
    fetchExamsAndAgencies();
    // Reset form
    resetForm();
  };

  const startEdit = (exam: any) => {
    setEditingId(exam.id);
    setName(exam.name);
    setAgencyId(exam.agencyId || '');
    setType(exam.type || 'recruitment');
    setCat(exam.category || 'Government Jobs');
    setPrice((exam.price ?? 0).toString());
    setIsPaid(exam.isPaid || false);
    setSubjectsWeightage(exam.subjectsWeightage || []);
    setTotalPosts((exam.totalPosts ?? '').toString());
    setPostDistribution((exam.postDistribution || []).map((p: any) => ({ category: p.category, count: p.count.toString() })));
    setIsPopular(exam.isPopular || false);
    setStatus(exam.status || 'draft');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setName(''); setAgencyId(''); setPrice('0'); setIsPaid(false); setSubjectsWeightage([]); setTotalPosts(''); setPostDistribution([]); setIsPopular(false); setStatus('draft'); setType('recruitment');
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    resetForm();
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    try {
      await deleteDoc(doc(db, 'exams', id));
      alert("Exam deleted successfully!");
      setConfirmingDeleteId(null);
      fetchExamsAndAgencies();
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(`Failed to delete exam: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <AdminLayout title="Manage Exams">
      <div className="sticky top-0 z-40 pb-6 bg-[#f8fafc]/50 backdrop-blur-md">
        <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-primary tracking-tight">Exam Categories</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Configure syllabus and subject weightage for various competitive exams</p>
          </div>
          <button 
            onClick={() => { if(showAddForm) cancelForm(); else setShowAddForm(true); }}
            className="bg-primary text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> {showAddForm ? 'Cancel' : 'Register New Exam Category'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mb-10 space-y-6 animate-in zoom-in-95 duration-300">
          <h3 className="text-xl font-bold text-primary">{editingId ? 'Edit Exam' : 'Create New Exam'}</h3>
          
          <div className="flex gap-4 p-1 bg-slate-100 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setType('recruitment')}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${type === 'recruitment' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Recruitment Exam
            </button>
            <button
              type="button"
              onClick={() => setType('competitive')}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${type === 'competitive' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Competitive Exam
            </button>
          </div>

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
              <label className="text-sm font-bold text-slate-700">Agency</label>
              <select 
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                value={agencyId} onChange={(e) => setAgencyId(e.target.value)} 
              >
                <option value="">Select Agency</option>
                {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-4 md:col-span-2 border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">Subjects & Weightage</label>
                <button type="button" onClick={addSubject} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                  <Plus className="w-3 h-3" /> Include Subject
                </button>
              </div>
              <div className="space-y-3">
                 {subjectsWeightage.map((sw, i) => (
                   <div key={i} className="flex gap-4 items-center bg-slate-50 p-2 border border-slate-200 rounded-xl">
                      <select 
                        required
                        value={sw.subjectId} onChange={e => updateSubject(i, 'subjectId', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm outline-none focus:ring-1 focus:ring-primary appearance-none font-bold"
                      >
                        <option value="">Select Included Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <input 
                        placeholder="Q Count"
                        title="Number of questions from this subject"
                        value={sw.marks} onChange={e => updateSubject(i, 'marks', e.target.value)}
                        className="w-24 px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button type="button" onClick={() => removeSubject(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                 ))}
                 {subjectsWeightage.length === 0 && (
                   <p className="text-xs text-slate-400 font-medium">No subjects added. Add subjects and their marks weightage.</p>
                 )}
              </div>
            </div>

            {type === 'recruitment' && (
              <>

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
                  <label className="text-sm font-bold text-slate-700">Total Posts Advertised</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    value={totalPosts} onChange={(e) => setTotalPosts(e.target.value)} 
                  />
                </div>

                <div className="space-y-4 md:col-span-2 border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-700">Category-wise Post Distribution</label>
                    <button type="button" onClick={addPostCategory} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                      <Plus className="w-3 h-3" /> Add Category
                    </button>
                  </div>
                  <div className="space-y-3">
                     {postDistribution.map((pd, i) => (
                       <div key={i} className="flex gap-4 items-center bg-slate-50 p-2 border border-slate-200 rounded-xl">
                          <input 
                            placeholder="Category (e.g. Gen, RBA, OBC)"
                            value={pd.category} onChange={e => updatePostCategory(i, 'category', e.target.value)}
                            className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm outline-none focus:ring-1 focus:ring-primary"
                          />
                          <input 
                            type="number"
                            placeholder="Count"
                            value={pd.count} onChange={e => updatePostCategory(i, 'count', e.target.value)}
                            className="w-24 px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm outline-none focus:ring-1 focus:ring-primary"
                          />
                          <button type="button" onClick={() => removePostCategory(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                     ))}
                     {postDistribution.length === 0 && (
                       <p className="text-xs text-slate-400 font-medium">No distribution added. Add categories if required.</p>
                     )}
                  </div>
                </div>
              </>
            )}
            
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
                {(() => {
                  const agency = agencies.find(a => a.id === exam.agencyId);
                  if (agency?.logoUrl) return <img src={agency.logoUrl} alt={agency.name} className="w-full h-full object-cover" />;
                  if (exam.logoUrl) return <img src={exam.logoUrl} alt={exam.name} className="w-full h-full object-cover" />;
                  return <Settings2 className="w-6 h-6" />;
                })()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-primary tracking-tight truncate">{exam.name}</h4>
                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-full tracking-wider ${
                    (!exam.status || exam.status === 'live') ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {exam.status || 'live'}
                  </span>
                  {exam.isPopular && (
                    <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[8px] font-black uppercase rounded-full tracking-wider">Popular</span>
                  )}
                  {exam.type === 'competitive' && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded-full tracking-wider">Competitive</span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  <span className="truncate">{agencies.find(a => a.id === exam.agencyId)?.name || 'No Agency'}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200 shrink-0" />
                  <span className="truncate">{exam.type === 'competitive' ? 'Competitive Program' : exam.category}</span>
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
              {confirmingDeleteId === exam.id ? (
                <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-xl border border-red-100 animate-in fade-in slide-in-from-right-2">
                  <span className="text-[7px] font-black text-red-600 uppercase tracking-tighter px-1 whitespace-nowrap">Delete permanently?</span>
                  <button 
                    onClick={(e) => handleDelete(exam.id, e)}
                    className="px-2 py-1 bg-red-600 text-white text-[9px] font-black rounded-lg hover:bg-red-700 uppercase"
                  >
                    Yes
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setConfirmingDeleteId(null); }}
                    className="px-2 py-1 bg-white text-slate-400 text-[9px] font-black rounded-lg border border-slate-200"
                  >
                    X
                  </button>
                </div>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); setConfirmingDeleteId(exam.id); }} 
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  title="Delete Exam"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
