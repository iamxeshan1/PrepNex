import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, getDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Trash2, ChevronRight, FileText, Clock, Award, Upload, Download, Info, X, Shield, Edit3, Database, Loader2, Search } from 'lucide-react';

export default function AdminTests() {
  const { examId, subjectId } = useParams();
  const [parent, setParent] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
  const [composition, setComposition] = useState<Record<string, Record<string, number>>>({});
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
      setSubjects(allSubjects);
      setComposition({}); 
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
      for (const [subId, levelsObj] of Object.entries(composition)) {
        for (const [level, count] of Object.entries(levelsObj)) {
          if ((count as number) <= 0) continue;
          const available = bankCounts[subId]?.[level] || 0;
          if ((count as number) > available) {
            throw new Error(`Not enough ${level} questions in ${subjects.find(s => s.id === subId)?.name}. Requested: ${count}, Available: ${available}`);
          }
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

      for (const [subId, levelsObj] of Object.entries(composition)) {
        for (const [level, count] of Object.entries(levelsObj)) {
          if ((count as number) <= 0) continue;

          const qSnap = await getDocs(query(
            collection(db, 'questions'), 
            where('testId', '==', 'MASTER_BANK'), 
            where('subjectId', '==', subId),
            where('level', '==', level)
          ));
          
          const selectedDocs = qSnap.docs.slice(0, (count as number));
          selectedDocs.forEach(qDoc => {
            batch.update(qDoc.ref, { 
              testId: newTestRef.id,
              assignedAt: new Date().toISOString() 
            });
            totalImported++;
          });
        }
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
    if (window.confirm("Are you sure you want to permanently delete this test and all its questions? This action cannot be undone.")) {
      try {
        const qSnap = await getDocs(query(collection(db, 'questions'), where('testId', '==', id)));
        const queries = qSnap.docs.map(qd => deleteDoc(doc(db, 'questions', qd.id)));
        await Promise.all(queries);
        await deleteDoc(doc(db, 'tests', id));
        setTests(tests.filter(t => t.id !== id));
      } catch (error: any) {
        console.error("Delete error:", error);
        alert(`Failed to delete test permanently`);
      }
    }
  };

  const filtered = tests.filter(t => t.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  const StatCard = ({ title, value, span, colorClass = "text-slate-900" }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200">
      <p className="text-sm font-medium text-slate-500 mb-2">{title}</p>
      <h3 className={`text-4xl font-bold tracking-tight mb-2 ${colorClass}`}>{value}</h3>
      {span && <p className="text-xs font-semibold text-slate-400 mt-2">{span}</p>}
    </div>
  );

  return (
    <AdminLayout title={`Tests: ${parent?.name || 'Loading...'}`} backTo={examId ? "/admin/exams" : "/admin/subjects"}>
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 font-medium">Manage and compose mock tests for this registry.</p>
        <button 
          onClick={fetchBankData}
          className="bg-teal-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-teal-800 transition-colors"
        >
          <Database className="w-5 h-5" /> Withdraw Questions (Compose Mock Test)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Mock Tests" value={tests.length} span="In this registry" colorClass="text-teal-600" />
        <StatCard title="Live Mode" value={tests.filter(t => t.status === 'live' || !t.status).length} span="Available to users" colorClass="text-emerald-600" />
        <StatCard title="Scheduled" value={tests.filter(t => t.status === 'scheduled').length} span="Future activation" colorClass="text-blue-600" />
        <StatCard title="Premium Only" value={tests.filter(t => !t.isFree).length} span="Paid access" colorClass="text-amber-600" />
      </div>

      {showCompositionModal && (
        <form onSubmit={handleCompose} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm mb-8 relative">
           <button type="button" onClick={() => setShowCompositionModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-600 transition-colors">
              <X className="w-5 h-5" />
           </button>

           <h3 className="text-xl font-bold text-slate-900 mb-6">Compose Mock Test</h3>

           <div className="space-y-6">
              <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Test Name</label>
                 <input 
                    required 
                    placeholder="e.g. Mock Set 05"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 font-medium bg-slate-50"
                    value={compData.title} onChange={e => setCompData({...compData, title: e.target.value})} 
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (Min)</label>
                    <input type="number" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" value={compData.duration} onChange={e => setCompData({...compData, duration: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Total Marks</label>
                    <input type="number" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" value={compData.totalMarks} onChange={e => setCompData({...compData, totalMarks: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Marks/Q</label>
                    <input type="number" step="0.1" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" value={compData.marksPerQuestion} onChange={e => setCompData({...compData, marksPerQuestion: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Negative/Q</label>
                    <input type="number" step="0.1" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" value={compData.negativeMarks} onChange={e => setCompData({...compData, negativeMarks: e.target.value})} />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Access Type</label>
                    <select 
                       className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 bg-white"
                       value={compData.isFree ? "free" : "paid"}
                       onChange={e => setCompData({...compData, isFree: e.target.value === 'free', price: e.target.value === 'free' ? '0' : compData.price})}
                    >
                       <option value="free">Free Access</option>
                       <option value="paid">Paid (Premium) Access</option>
                    </select>
                 </div>
                 {!compData.isFree && (
                   <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Price (₹)</label>
                      <input type="number" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" value={compData.price} onChange={e => setCompData({...compData, price: e.target.value})} />
                   </div>
                 )}
              </div>
           </div>

           <div className="mt-8 pt-8 border-t border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <label className="block text-sm font-semibold text-slate-700">Withdrawal Strategy (Add Subjects)</label>
                <div className="flex items-center gap-3">
                  <select 
                    className="px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:border-teal-500 transition-all"
                    value={selectedSub}
                    onChange={e => setSelectedSub(e.target.value)}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    onClick={() => {
                      if (selectedSub && !composition[selectedSub]) {
                        setComposition({...composition, [selectedSub]: {
                          'Easy': 0,
                          'Medium': 0,
                          'Hard': 0,
                          'UGC NET': 0
                        }});
                        setSelectedSub('');
                      }
                    }}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-all"
                  >
                    Add to Composition
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                  {Object.keys(composition).length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 text-slate-400 font-medium">
                       Select a subject to include its questions.
                    </div>
                  ) : (
                    Object.entries(composition).map(([subId, levelsConfig]: [string, any]) => {
                      const s = subjects.find(sub => sub.id === subId);
                      if (!s) return null;
                      return (
                        <div key={subId} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-4 relative">
                          <button 
                            type="button" 
                            onClick={() => {
                              const newComp = { ...composition };
                              delete newComp[subId];
                              setComposition(newComp);
                            }}
                            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          
                          <div>
                            <p className="font-bold text-slate-700 mb-4">{s.name} <span className="text-xs font-semibold text-slate-400 bg-slate-200 px-2 rounded-full ml-2">Bank total: {bankCounts[s.id]?.['total'] || 0}</span></p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {levels.map(lvl => (
                                <div key={lvl}>
                                  <label className="text-xs font-bold text-slate-500 mb-1 block">
                                    {lvl} ({bankCounts[s.id]?.[lvl] || 0} avail)
                                  </label>
                                  <input 
                                    type="number"
                                    min="0"
                                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-teal-500"
                                    value={levelsConfig[lvl]}
                                    onChange={e => {
                                      const val = parseInt(e.target.value) || 0;
                                      setComposition({
                                        ...composition,
                                        [subId]: { ...levelsConfig, [lvl]: val }
                                      });
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
              </div>
           </div>

           <div className="mt-8 pt-8 border-t border-slate-200">
              <button 
                type="submit" 
                disabled={composing || Object.keys(composition).length === 0}
                className="w-full py-3 bg-teal-700 text-white rounded-lg font-bold hover:bg-teal-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {composing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                {composing ? 'Withdrawing...' : 'Execute Withdrawal & Create Mock'}
              </button>
           </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
           <div className="flex gap-4">
             <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search tests..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-sm font-medium focus:ring-teal-500 focus:border-teal-500 bg-white shadow-sm"
                />
             </div>
           </div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Showing {filtered.length} TESTS</p>
        </div>

        {loading ? (
           <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                <th className="p-4 pl-6 font-semibold">Test Name</th>
                <th className="p-4 font-semibold">Details</th>
                <th className="p-4 font-semibold">Access</th>
                <th className="p-4 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((test) => (
                <tr key={test.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                          <FileText className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                           {test.title}
                         </p>
                         <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">{test.status || 'live'}</p>
                       </div>
                    </div>
                  </td>
                  <td className="p-4">
                     <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> {test.duration} Minutes</span>
                        <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-slate-400" /> {test.totalMarks} Marks</span>
                     </div>
                  </td>
                  <td className="p-4">
                     {test.isFree ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700">Free</span>
                     ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">Premium - ₹{test.price}</span>
                     )}
                  </td>
                  <td className="p-4 pr-6 text-right">
                     <div className="flex items-center justify-end gap-2 text-slate-400">
                        <Link 
                           to={`/admin/questions/${test.id}`}
                           className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 rounded text-xs font-bold transition-colors"
                        >
                           Questions
                        </Link>
                        <button onClick={(e) => handleDelete(test.id, e)} className="p-2 hover:bg-red-50 rounded text-red-500 transition-colors" title="Delete Test">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                   <td colSpan={4} className="p-8 text-center text-slate-500">No tests found in this registry.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
