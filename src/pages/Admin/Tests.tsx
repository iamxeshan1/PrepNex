import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, getDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Trash2, ChevronRight, FileText, Clock, Award, Upload, Download, Info, X, Shield, Edit3, Database, Loader2 } from 'lucide-react';

export default function AdminTests() {
  const { examId, subjectId } = useParams();
  const [parent, setParent] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('60');
  const [totalMarks, setTotalMarks] = useState('100');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('0');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const parentCol = examId ? 'exams' : 'subjects';
      const parentId = examId || subjectId;
      if (!parentId) return;

      const [pSnap, tSnap] = await Promise.all([
        getDoc(doc(db, parentCol, parentId)),
        getDocs(query(
          collection(db, 'tests'), 
          where(examId ? 'examId' : 'subjectId', '==', parentId)
        ))
      ]);
      if (pSnap.exists()) setParent(pSnap.data());
      setTests(tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchData();
  }, [examId, subjectId]);

  const refreshTests = async () => {
    const parentId = examId || subjectId;
    const tSnap = await getDocs(query(
      collection(db, 'tests'), 
      where(examId ? 'examId' : 'subjectId', '==', parentId)
    ));
    setTests(tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const [showCompositionModal, setShowCompositionModal] = useState(false);
  const [bankCounts, setBankCounts] = useState<Record<string, Record<string, number>>>({});
  const [composition, setComposition] = useState<Record<string, {count: number, level: string}>>({});
  const [composing, setComposing] = useState(false);
  const [selectedSub, setSelectedSub] = useState('');

  // New Test Data for Composition
  const [compData, setCompData] = useState({
    title: '',
    duration: '60',
    totalMarks: '100',
    marksPerQuestion: '1',
    negativeMarks: '0.25',
    isFree: true,
    price: '0',
    scheduledStartTime: ''
  });

  const fetchBankData = async () => {
    setLoading(true);
    try {
      const parentCol = examId ? 'exams' : 'subjects';
      const parentId = examId || subjectId;
      
      const [qSnap, sSnap, pSnap] = await Promise.all([
        getDocs(query(collection(db, 'questions'), where('testId', '==', 'MASTER_BANK'))),
        getDocs(collection(db, 'subjects')),
        getDoc(doc(db, parentCol, parentId!))
      ]);
      
      const counts: Record<string, Record<string, number>> = {};
      qSnap.docs.forEach(doc => {
        const q = doc.data();
        if (!counts[q.subjectId]) counts[q.subjectId] = {};
        const level = q.level || 'Medium';
        counts[q.subjectId][level] = (counts[q.subjectId][level] || 0) + 1;
        counts[q.subjectId]['total'] = (counts[q.subjectId]['total'] || 0) + 1;
      });
      
      setBankCounts(counts);

      const allSubjects = sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      let availableSubjects = [];
      const initialComp: Record<string, {count: number, level: string}> = {};

      if (subjectId) {
        // Mode: Subject-Specific Test
        availableSubjects = allSubjects.filter(s => s.id === subjectId);
        initialComp[subjectId] = { count: 10, level: 'Medium' };
      } else if (examId && pSnap.exists()) {
        // Mode: Exam Category Test (Auto-fetch subjects from weightage)
        const data = pSnap.data();
        const syllabusSubIds = (data.subjectsWeightage || []).map((item: any) => item.subjectId);
        availableSubjects = allSubjects.filter(s => syllabusSubIds.includes(s.id));
        
        // Auto-populate all syllabus subjects into the composition list
        syllabusSubIds.forEach((sId: string) => {
          initialComp[sId] = { count: 0, level: 'Medium' };
        });
      }

      setSubjects(availableSubjects);
      setComposition(initialComp);
      setShowCompositionModal(true);
    } catch (err: any) {
      alert("Failed to fetch bank data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const levels = ['Easy', 'Medium', 'Hard', 'UGC NET'];

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compData.title) return alert("Title required");
    if (Object.keys(composition).length === 0) return alert("Select at least one subject");
    
    setComposing(true);
    try {
      // 1. Verify availability
      for (const [subId, config] of Object.entries(composition)) {
        const c = config as { count: number; level: string };
        const available = bankCounts[subId]?.[c.level] || 0;
        if (c.count > available) {
          throw new Error(`Not enough ${c.level} questions in ${subjects.find(s => s.id === subId)?.name}. Requested: ${c.count}, Available: ${available}`);
        }
      }

      // 2. Create Registry
      const newTestRef = await addDoc(collection(db, 'tests'), {
        ...(examId ? { examId } : { subjectId }),
        title: compData.title,
        duration: Number(compData.duration),
        totalMarks: Number(compData.totalMarks),
        marksPerQuestion: Number(compData.marksPerQuestion),
        negativeMarks: Number(compData.negativeMarks),
        isFree: compData.isFree,
        price: compData.isFree ? 0 : Number(compData.price),
        status: compData.scheduledStartTime ? 'scheduled' : 'live',
        scheduledStartTime: compData.scheduledStartTime || null,
        createdAt: new Date().toISOString()
      });

      // 3. Physical Withdrawal
      const batch = writeBatch(db);
      let totalImported = 0;

      for (const [subId, config] of Object.entries(composition)) {
        const c = config as { count: number; level: string };
        if (c.count <= 0) continue;

        const qSnap = await getDocs(query(
          collection(db, 'questions'), 
          where('testId', '==', 'MASTER_BANK'), 
          where('subjectId', '==', subId),
          where('level', '==', c.level)
        ));
        
        const selectedDocs = qSnap.docs.slice(0, c.count);
        selectedDocs.forEach(qDoc => {
          batch.update(qDoc.ref, { 
            testId: newTestRef.id,
            assignedAt: new Date().toISOString() 
          });
          totalImported++;
        });
      }

      await batch.commit();
      alert(`Test Created! ${totalImported} questions withdrawn from Repository.`);
      setShowCompositionModal(false);
      refreshTests();
    } catch (err: any) {
      alert("Composition failed: " + err.message);
    } finally {
      setComposing(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    try {
      await deleteDoc(doc(db, 'tests', id));
      alert("Test deleted successfully!");
      setConfirmingDeleteId(null);
      setTests(tests.filter(t => t.id !== id));
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(`Failed to delete test: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <AdminLayout title={`Tests: ${parent?.name || 'Loading...'}`} backTo={examId ? "/admin/exams" : "/admin/subjects"}>
      <div className="sticky top-0 z-40 pb-6 bg-[#f8fafc]/50 backdrop-blur-md">
        <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-primary tracking-tight">Withdraw & Compose Mock Tests</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
              {examId ? 'Composed from specific syllabus subjects' : `Withdrawing questions from repo`}
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={fetchBankData}
              className="px-8 py-4 bg-primary text-white rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 whitespace-nowrap"
            >
              <Database className="w-5 h-5" /> Withdraw from Master Bank
            </button>
          </div>
        </div>
      </div>

      {showCompositionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white z-20 shrink-0">
              <div>
                <h3 className="text-2xl font-black text-primary uppercase tracking-tight">Compose Mock Test from Bank</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Inventory restricted to {examId ? `Exam Syllabus` : `Subject Repo`}</p>
              </div>
              <button 
                onClick={() => setShowCompositionModal(false)} 
                className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-colors"
                type="button"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            
            <form id="compose-mock-form" onSubmit={handleCompose} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="md:col-span-2 space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">Test Name (e.g. Mock Set 05)</label>
                   <input required className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-primary focus:border-primary transition-all" value={compData.title} onChange={e => setCompData({...compData, title: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Duration (Min)</label>
                    <input type="number" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none font-bold" value={compData.duration} onChange={e => setCompData({...compData, duration: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Total Marks</label>
                    <input type="number" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none font-bold" value={compData.totalMarks} onChange={e => setCompData({...compData, totalMarks: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Marks/Q</label>
                    <input type="number" step="0.1" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none font-bold" value={compData.marksPerQuestion} onChange={e => setCompData({...compData, marksPerQuestion: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Negative/Q</label>
                    <input type="number" step="0.1" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none font-bold" value={compData.negativeMarks} onChange={e => setCompData({...compData, negativeMarks: e.target.value})} />
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center gap-4 pt-2">
                  <button type="button" onClick={() => setCompData({...compData, isFree: !compData.isFree})} className={`px-5 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${compData.isFree ? 'bg-secondary text-white border-secondary' : 'bg-white text-slate-400 border-slate-200'}`}>
                    {compData.isFree ? 'FREE ACCESS' : 'PAID ACCESS'}
                  </button>
                  {!compData.isFree && <input type="number" placeholder="₹" className="w-24 px-3 py-3 rounded-xl border border-slate-200 font-black text-primary" value={compData.price} onChange={e => setCompData({...compData, price: e.target.value})} />}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Withdrawal Strategy</label>
                  {!subjectId && !examId && (
                    <div className="flex items-center gap-3">
                      <select 
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-secondary transition-all"
                        value={selectedSub}
                        onChange={e => setSelectedSub(e.target.value)}
                      >
                        <option value="">Select Subject to Add</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <button 
                        type="button"
                        onClick={() => {
                          if (selectedSub && !composition[selectedSub]) {
                            setComposition({...composition, [selectedSub]: { count: 10, level: 'Medium' }});
                            setSelectedSub('');
                          }
                        }}
                        className="px-4 py-2 bg-secondary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                      >
                        Add Subject
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 min-h-[100px]">
                  {Object.keys(composition).length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center bg-slate-50/50">
                      <Database className="w-8 h-8 text-slate-200 mb-2" />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No subjects selected for withdrawal</p>
                    </div>
                  ) : (
                    Object.entries(composition).map(([subId, config]: [string, any]) => {
                      const s = subjects.find(sub => sub.id === subId);
                      if (!s) return null;
                      return (
                        <div key={subId} className="p-5 bg-white border border-slate-100 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-secondary transition-all shadow-sm relative overflow-visible">
                          {!subjectId && !examId && (
                            <button 
                              type="button" 
                              onClick={() => {
                                const newComp = { ...composition };
                                delete newComp[subId];
                                setComposition(newComp);
                              }}
                              className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg z-30"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          <div className="flex-1">
                            <h4 className="font-extrabold text-primary uppercase text-xs tracking-tight">{s.name}</h4>
                            <div className="flex gap-2 mt-2">
                               {levels.map(lvl => (
                                 <span key={lvl} className={`text-[8px] font-black uppercase ${bankCounts[s.id]?.[lvl] ? 'text-primary' : 'text-slate-300'}`}>
                                   {lvl.slice(0,1)}: {bankCounts[s.id]?.[lvl] || 0}
                                 </span>
                               ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <select 
                              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:bg-white"
                              value={config.level}
                              onChange={e => setComposition({...composition, [subId]: { ...config, level: e.target.value }})}
                            >
                              {levels.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                            <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 px-3">
                               <input 
                                type="number" 
                                min="1"
                                className="w-16 py-2 bg-transparent text-center font-black text-primary outline-none text-xs"
                                value={config.count}
                                onChange={e => setComposition({...composition, [subId]: { ...config, count: parseInt(e.target.value) || 0 }})}
                              />
                              <span className="text-[8px] font-black text-slate-400 uppercase">Qty</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </form>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 rounded-b-[2.5rem] shrink-0 z-20">
              <button 
                form="compose-mock-form"
                type="submit" 
                disabled={composing}
                className="w-full py-5 bg-secondary text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-secondary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {composing ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Database className="w-6 h-6" />}
                {composing ? 'Withdrawing Questions...' : 'Create Mock & Finalize Withdrawal'}
              </button>
              <p className="text-center text-[9px] font-black text-slate-400 mt-4 uppercase tracking-widest">Questions will be migrated from the Global Registry to this Mock Test</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tests.length === 0 && !loading && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <Database className="w-16 h-16 text-slate-100 mx-auto mb-4" />
            <p className="font-bold text-slate-400 uppercase tracking-widest">No tests in this registry</p>
          </div>
        )}
        {tests.map((test) => (
          <div key={test.id} className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-sm transition-all hover:border-primary">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-primary tracking-tight truncate">{test.title}</h4>
                <div className="flex items-center gap-2 sm:gap-4 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Clock className="w-3 h-3" /> {test.duration}m</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Award className="w-3 h-3" /> {test.totalMarks}M</span>
                  {test.marksPerQuestion && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">+{test.marksPerQuestion} / -{test.negativeMarks || 0}</span>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-tighter ${(!test.status || test.status === 'live') ? 'text-green-600 bg-green-50' : 'text-slate-600 bg-slate-200'}`}>
                    {test.status || 'live'}
                  </span>
                  {test.isFree ? (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded tracking-tighter">FREE</span>
                  ) : (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded tracking-tighter">₹{test.price || 0}</span>
                  )}
                  {test.sections?.length > 0 && (
                    <span className="text-[10px] font-bold text-secondary bg-secondary/5 px-2 py-0.5 rounded tracking-tighter">
                      {test.sections.length} SECTIONS
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
              <Link to={`/admin/questions/${test.id}`} className="flex-1 sm:flex-none justify-center px-4 py-2 bg-slate-50 text-slate-600 rounded-lg font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2">
                Questions <ChevronRight className="w-4 h-4" />
              </Link>
              {confirmingDeleteId === test.id ? (
                <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-xl border border-red-100 animate-in fade-in slide-in-from-right-2">
                  <span className="text-[7px] font-black text-red-600 uppercase tracking-tighter px-1 whitespace-nowrap leading-none">Delete All Content?</span>
                  <button 
                    onClick={(e) => handleDelete(test.id, e)}
                    className="px-2 py-1 bg-red-600 text-white text-[9px] font-black rounded-lg hover:bg-red-700 uppercase"
                  >
                    Confirm
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
                  onClick={(e) => { e.stopPropagation(); setConfirmingDeleteId(test.id); }} 
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 rounded-lg hover:bg-red-50"
                  title="Delete Test Registry"
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

