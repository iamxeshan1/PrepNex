import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, query, where, writeBatch } from 'firebase/firestore';
import { Plus, Trash2, Clock, Users, Calendar, Award, X, Database, Loader2 } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';

export default function AdminLiveTests() {
  const [liveTests, setLiveTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [totalMarks, setTotalMarks] = useState(100);
  const [positiveMarks, setPositiveMarks] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0.25);
  const [enrollmentStartTime, setEnrollmentStartTime] = useState('');
  const [enrollmentEndTime, setEnrollmentEndTime] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState(100);

  const fetchLiveTests = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, 'liveTests'));
    setLiveTests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  const [showCompositionModal, setShowCompositionModal] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [bankCounts, setBankCounts] = useState<Record<string, Record<string, number>>>({});
  const [composition, setComposition] = useState<Record<string, {count: number, level: string}>>({});
  const [composing, setComposing] = useState(false);
  const [selectedSub, setSelectedSub] = useState('');

  // Composed Live Test Data
  const [compData, setCompData] = useState({
    title: '',
    description: '',
    duration: '60',
    totalMarks: '100',
    positiveMarks: '1',
    negativeMarks: '0.25',
    startTime: '',
    endTime: '',
    enrollmentStartTime: '',
    enrollmentEndTime: '',
    isFree: true,
    price: '0'
  });

  const fetchBankData = async () => {
    setLoading(true);
    const [qSnap, sSnap] = await Promise.all([
      getDocs(query(collection(db, 'questions'), where('testId', '==', 'MASTER_BANK'))),
      getDocs(collection(db, 'subjects'))
    ]);
    
    const counts: Record<string, Record<string, number>> = {};
    qSnap.docs.forEach(doc => {
      const q = doc.data();
      const subId = q.subjectId;
      const level = q.level || 'Medium';
      
      if (!counts[subId]) counts[subId] = {};
      counts[subId][level] = (counts[subId][level] || 0) + 1;
      counts[subId]['total'] = (counts[subId]['total'] || 0) + 1;
    });
    
    setSubjects(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setBankCounts(counts);
    setComposition({}); // Start empty for manual selection
    setShowCompositionModal(true);
    setLoading(false);
  };

  const levels = ['Easy', 'Medium', 'Hard', 'UGC NET'];

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compData.title || !compData.startTime || !compData.endTime) return alert("Title and times required");
    
    setComposing(true);
    try {
      // 1. Check if enough questions are available
      for (const [subId, config] of Object.entries(composition)) {
        const c = config as {count: number, level: string};
        const available = bankCounts[subId]?.[c.level] || 0;
        if (c.count > available) {
          throw new Error(`Not enough ${c.level} questions in ${subjects.find(s => s.id === subId)?.name}. Requested: ${c.count}, Available: ${available}`);
        }
      }

      // 2. Create the live test
      const newTestRef = await addDoc(collection(db, 'liveTests'), {
        title: compData.title,
        description: compData.description,
        duration: Number(compData.duration),
        totalMarks: Number(compData.totalMarks),
        positiveMarks: Number(compData.positiveMarks),
        negativeMarks: Number(compData.negativeMarks),
        startTime: compData.startTime,
        endTime: compData.endTime,
        enrollmentStartTime: compData.enrollmentStartTime,
        enrollmentEndTime: compData.enrollmentEndTime,
        isFree: compData.isFree,
        price: compData.isFree ? 0 : Number(compData.price),
        enrolledUsers: [],
        createdAt: new Date().toISOString()
      });

      // 3. Withdraw questions from Master Bank
      const batch = writeBatch(db);
      let totalImported = 0;

      for (const [subId, config] of Object.entries(composition)) {
        const c = config as {count: number, level: string};
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
      alert(`Live Test Created & Bank Withdrawn! ${totalImported} questions imported.`);
      setShowCompositionModal(false);
      fetchLiveTests();
    } catch (err: any) {
      alert("Composition failed: " + err.message);
    } finally {
      setComposing(false);
    }
  };

  useEffect(() => {
    fetchLiveTests();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'liveTests', id));
      alert("Live test deleted successfully!");
      setConfirmingDeleteId(null);
      fetchLiveTests();
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(`Failed to delete: ${err.message || "Unknown error"}`);
    }
  };

  return (
    <AdminLayout title="Live Exams Management">
      <div className="sticky top-0 z-40 pb-6 bg-[#f8fafc]/50 backdrop-blur-md">
        <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-primary tracking-tight">Live Test Sessions</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Tests are managed via the Master Registry</p>
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
                <h3 className="text-2xl font-black text-primary uppercase tracking-tight">Compose Live Test from Bank</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Directly withdraw available inventory</p>
              </div>
              <button 
                onClick={() => setShowCompositionModal(false)}
                className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-colors"
                type="button"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
          
          <form id="compose-form" onSubmit={handleCompose} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="md:col-span-2 space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">Live Identity</label>
                 <input required placeholder="E.g. Mega Live Challenge #12" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-primary focus:border-primary transition-all" value={compData.title} onChange={e => setCompData({...compData, title: e.target.value})} />
              </div>
              <div className="md:col-span-2 space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">Quick Description</label>
                 <textarea rows={2} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none" value={compData.description} onChange={e => setCompData({...compData, description: e.target.value})} />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Duration / Marks</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Min" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none font-bold" value={compData.duration} onChange={e => setCompData({...compData, duration: e.target.value})} />
                    <input type="number" placeholder="Marks" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none font-bold" value={compData.totalMarks} onChange={e => setCompData({...compData, totalMarks: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1 text-blue-600">Live Window Schedule</label>
                  <div className="space-y-2">
                    <input type="datetime-local" className="w-full px-4 py-2.5 rounded-xl border border-blue-100 bg-blue-50/30 text-xs font-bold text-[#002D62]" value={compData.startTime} onChange={e => setCompData({...compData, startTime: e.target.value})} />
                    <input type="datetime-local" className="w-full px-4 py-2.5 rounded-xl border border-blue-100 bg-blue-50/30 text-xs font-bold text-[#002D62]" value={compData.endTime} onChange={e => setCompData({...compData, endTime: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Admissions Window</label>
                  <div className="space-y-2">
                    <input type="datetime-local" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold" value={compData.enrollmentStartTime} onChange={e => setCompData({...compData, enrollmentStartTime: e.target.value})} />
                    <input type="datetime-local" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold" value={compData.enrollmentEndTime} onChange={e => setCompData({...compData, enrollmentEndTime: e.target.value})} />
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <button type="button" onClick={() => setCompData({...compData, isFree: !compData.isFree})} className={`px-5 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${compData.isFree ? 'bg-secondary text-white border-secondary shadow-lg shadow-secondary/20' : 'bg-white text-slate-400 border-slate-200'}`}>
                    {compData.isFree ? 'FREE ENTRY' : 'PAID ENTRY'}
                  </button>
                  {!compData.isFree && <input type="number" placeholder="₹" className="w-24 px-3 py-3 rounded-xl border border-slate-200 font-black text-primary" value={compData.price} onChange={e => setCompData({...compData, price: e.target.value})} />}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Question Distribution & Subjects</label>
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
              </div>

              <div className="grid grid-cols-1 gap-4 min-h-[100px]">
                {Object.keys(composition).length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center bg-slate-50/50">
                    <Database className="w-8 h-8 text-slate-200 mb-2" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Withdrawal payload is empty</p>
                  </div>
                ) : (
                  Object.entries(composition).map(([subId, config]: [string, any]) => {
                    const s = subjects.find(sub => sub.id === subId);
                    if (!s) return null;
                    return (
                      <div key={subId} className="p-5 bg-white border border-slate-100 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-secondary transition-all shadow-sm relative overflow-visible">
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
              form="compose-form"
              type="submit" 
              disabled={composing}
              className="w-full py-5 bg-secondary text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-secondary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {composing ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Database className="w-6 h-6" />}
              {composing ? 'Withdrawing Questions...' : 'Activate Live Test & Withdraw'}
            </button>
            <p className="text-center text-[9px] font-black text-slate-400 mt-4 uppercase tracking-widest">Questions will be permanently migrated to the Live Registry</p>
          </div>
        </div>
      </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-[2rem] border border-slate-100 animate-pulse" />)}
        </div>
      ) : liveTests.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center">
          <Clock className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800">No scheduled live tests</h3>
          <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Click 'Schedule New' to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {liveTests.map(test => (
            <div key={test.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col group hover:border-primary transition-all">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-lg text-primary leading-tight group-hover:text-[#002D62] transition-colors line-clamp-2">{test.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${test.isFree ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {test.isFree ? 'Public / Free' : `Paid: ₹${test.price}`}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-3 text-sm text-slate-600 font-bold">
                    <Calendar className="w-4 h-4 text-primary" /> 
                    <span className="text-xs">{new Date(test.startTime).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                      <Clock className="w-3.5 h-3.5" /> {test.duration} MINS
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                      <Award className="w-3.5 h-3.5" /> {test.totalMarks} MARKS
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Users className="w-4 h-4" /> {test.enrolledUsers?.length || 0} Registered
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-50">
                {confirmingDeleteId === test.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <button 
                      onClick={() => handleDelete(test.id)}
                      className="flex-1 h-12 bg-red-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-700"
                    >
                      Confirm
                    </button>
                    <button 
                      onClick={() => setConfirmingDeleteId(null)}
                      className="px-4 h-12 bg-slate-100 text-slate-600 rounded-2xl font-bold"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingDeleteId(test.id)}
                    className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    title="Delete Test"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                {!confirmingDeleteId && (
                  <Link 
                    to={`/admin/questions/${test.id}`}
                    className="flex-1 h-12 bg-[#002D62] text-white flex items-center justify-center font-bold rounded-2xl hover:bg-[#003B7F] shadow-lg shadow-blue-900/10 transition-all text-xs uppercase tracking-widest"
                  >
                    Questions
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
