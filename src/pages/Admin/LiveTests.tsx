import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, query, where, writeBatch } from 'firebase/firestore';
import { 
  Plus, 
  Trash2, 
  Clock, 
  Users, 
  Calendar, 
  Award, 
  X, 
  Database, 
  Loader2, 
  Zap, 
  Layout, 
  Shield, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Ticket, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import ConfirmationModal from '../../components/ConfirmationModal';
import Toast, { ToastType } from '../../components/Toast';


export default function AdminLiveTests() {
  const [liveTests, setLiveTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    testId: '',
    title: '',
    message: ''
  });
  
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as ToastType
  });

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [selectedTestForUsers, setSelectedTestForUsers] = useState<any>(null);
  const [enrolledStudentNames, setEnrolledStudentNames] = useState<string[]>([]);
  const [loadingEnrolled, setLoadingEnrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [showCompositionModal, setShowCompositionModal] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [bankCounts, setBankCounts] = useState<Record<string, Record<string, number>>>({});
  const [composition, setComposition] = useState<Record<string, {count: number, level: string}>>({});
  const [composing, setComposing] = useState(false);
  const [selectedSub, setSelectedSub] = useState('');

  const [compData, setCompData] = useState({
    title: '',
    description: '',
    duration: '60',
    totalMarks: '100',
    positiveMarks: '1',
    negativeMarks: '0.25',
    category: '',
    startTime: '',
    endTime: '',
    enrollmentStartTime: '',
    enrollmentEndTime: '',
    isFree: true,
    price: '0'
  });

  const levels = ['Easy', 'Medium', 'Hard', 'UGC NET'];

  const fetchLiveTests = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, 'liveTests'));
    setLiveTests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  const fetchEnrolledStudents = async (test: any) => {
    setSelectedTestForUsers(test);
    setLoadingEnrolled(true);
    try {
      if (test.enrolledUsers && test.enrolledUsers.length > 0) {
        const usersSnap = await getDocs(query(collection(db, 'users'), where('__name__', 'in', test.enrolledUsers)));
        setEnrolledStudentNames(usersSnap.docs.map(doc => doc.data().name || 'Anonymous'));
      } else {
        setEnrolledStudentNames([]);
      }
    } catch (err) {
       console.error(err);
    } finally {
      setLoadingEnrolled(false);
    }
  };

  const openComposition = async () => {
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
    setComposition({});
    setShowCompositionModal(true);
    setLoading(false);
  };

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compData.title || !compData.startTime || !compData.endTime) return;
    setComposing(true);
    try {
      for (const [subId, config] of Object.entries(composition)) {
        const c = config as {count: number, level: string};
        const available = bankCounts[subId]?.[c.level] || 0;
        if (c.count > available) throw new Error(`Insufficient inventory in ${subjects.find(s => s.id === subId)?.name}`);
      }

      const newTestRef = await addDoc(collection(db, 'liveTests'), {
        title: compData.title, 
        description: compData.description,
        category: compData.category || 'General',
        duration: Number(compData.duration), totalMarks: Number(compData.totalMarks),
        positiveMarks: Number(compData.positiveMarks), negativeMarks: Number(compData.negativeMarks),
        startTime: compData.startTime, endTime: compData.endTime,
        enrollmentStartTime: compData.enrollmentStartTime, enrollmentEndTime: compData.enrollmentEndTime,
        isFree: compData.isFree, price: compData.isFree ? 0 : Number(compData.price),
        enrolledUsers: [], createdAt: new Date().toISOString()
      });

      const batch = writeBatch(db);
      for (const [subId, config] of Object.entries(composition)) {
        const c = config as {count: number, level: string};
        if (c.count <= 0) continue;
        const qSnap = await getDocs(query(collection(db, 'questions'), where('testId', '==', 'MASTER_BANK'), where('subjectId', '==', subId), where('level', '==', c.level)));
        qSnap.docs.slice(0, c.count).forEach(qDoc => {
          batch.update(qDoc.ref, { testId: newTestRef.id, assignedAt: new Date().toISOString() });
        });
      }
      await batch.commit();
      setShowCompositionModal(false);
      fetchLiveTests();
    } catch (err) {
       console.error(err);
    } finally {
      setComposing(false);
    }
  };

  useEffect(() => { fetchLiveTests(); }, []);

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      testId: id,
      title: 'Terminating Live Session',
      message: 'System Alert: Authorized deletion of this live test session. This will permanently purge all enrolled user references and associated question data for this node.'
    });
  };

  const confirmDelete = async () => {
    const id = confirmModal.testId;
    try {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        const qSnap = await getDocs(query(collection(db, 'questions'), where('testId', '==', id)));
        const queries = qSnap.docs.map(qd => deleteDoc(doc(db, 'questions', qd.id)));
        await Promise.all(queries);
        await deleteDoc(doc(db, 'liveTests', id));
        fetchLiveTests();
        setToast({ isVisible: true, message: 'Session purged successfully.', type: 'success' });
    } catch (err) {
        setToast({ isVisible: true, message: 'Failed to purge session.', type: 'error' });
    } finally {
        setLoading(false);
    }
  };

  const filtered = liveTests.filter(t => t.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  const StatCard = ({ title, value, span, colorClass = "text-slate-900" }: any) => (
    <div className="bg-white p-4">
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className={`text-3xl font-bold tracking-tight ${colorClass}`}>{value}</h3>
      {span && <p className="text-xs font-semibold text-slate-400 mt-1">{span}</p>}
    </div>
  );

  return (
    <AdminLayout title="Live Tests">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 font-medium">Manage globally scheduled live examinations.</p>
        <button 
          onClick={openComposition}
          className="bg-[#006e5d] text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-[#005a4d] transition-colors"
        >
          <Plus className="w-5 h-5" /> Create Live Test
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Live Tests" value={liveTests.length} span="Scheduled & Past" colorClass="text-[#006e5d]" />
        <StatCard title="Upcoming" value={liveTests.filter(t => new Date(t.startTime) > new Date()).length} span="Future activations" colorClass="text-emerald-600" />
        <StatCard title="Paid Tests" value={liveTests.filter(t => !t.isFree).length} span="Premium access" colorClass="text-amber-600" />
        <StatCard title="Total Enrolled" value={liveTests.reduce((acc, t) => acc + (t.enrolledUsers?.length || 0), 0)} span="Across all tests" colorClass="text-[#006e5d]" />
      </div>

      {showCompositionModal && (
        <form onSubmit={handleCompose} className="bg-white p-8 mb-8 relative border-b border-slate-200">
           <button type="button" onClick={() => setShowCompositionModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-600 transition-colors">
              <X className="w-5 h-5" />
           </button>

           <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Zap className="w-5 h-5 text-[#006e5d]" /> Compose Live Exam</h3>

           <div className="space-y-6">
              <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Test Title</label>
                 <input 
                    required 
                    placeholder="e.g. Grand Mock 2025"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-[#006e5d] focus:border-[#006e5d] font-medium bg-slate-50"
                    value={compData.title} onChange={e => setCompData({...compData, title: e.target.value})} 
                 />
              </div>

              <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Instructional Description</label>
                 <textarea 
                    placeholder="Briefing for candidates..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-[#006e5d] focus:border-[#006e5d] font-medium min-h-[80px]"
                    value={compData.description} onChange={e => setCompData({...compData, description: e.target.value})} 
                 />
              </div>

              <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                 <input 
                    placeholder="e.g. Quantitative Aptitude"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-[#006e5d] focus:border-[#006e5d] font-medium bg-slate-50"
                    value={compData.category} onChange={e => setCompData({...compData, category: e.target.value})} 
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (Min)</label>
                    <input type="number" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-[#006e5d]" value={compData.duration} onChange={e => setCompData({...compData, duration: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Total Marks</label>
                    <input type="number" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-[#006e5d]" value={compData.totalMarks} onChange={e => setCompData({...compData, totalMarks: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Marks/Q</label>
                    <input type="number" step="0.1" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-[#006e5d]" value={compData.positiveMarks} onChange={e => setCompData({...compData, positiveMarks: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Negative/Q</label>
                    <input type="number" step="0.1" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-[#006e5d]" value={compData.negativeMarks} onChange={e => setCompData({...compData, negativeMarks: e.target.value})} />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#006e5d]/5 p-6 rounded-lg border border-[#006e5d]/10">
                 <div>
                    <label className="block text-sm font-semibold text-[#006e5d] mb-2">Test Start Time</label>
                    <input type="datetime-local" className="w-full px-4 py-2.5 border border-[#006e5d]/20 rounded-lg focus:ring-[#006e5d] bg-white text-[#002f26]" value={compData.startTime} onChange={e => setCompData({...compData, startTime: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-[#006e5d] mb-2">Test End Time</label>
                    <input type="datetime-local" className="w-full px-4 py-2.5 border border-[#006e5d]/20 rounded-lg focus:ring-[#006e5d] bg-white text-[#002f26]" value={compData.endTime} onChange={e => setCompData({...compData, endTime: e.target.value})} />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Access Control</label>
                    <select 
                       className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-[#006e5d] bg-white"
                       value={compData.isFree ? "free" : "paid"}
                       onChange={e => setCompData({...compData, isFree: e.target.value === 'free', price: e.target.value === 'free' ? '0' : compData.price})}
                    >
                       <option value="free">Public (Free)</option>
                       <option value="paid">Premium (Paid)</option>
                    </select>
                 </div>
                 {!compData.isFree && (
                   <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Price (₹)</label>
                      <input type="number" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-[#006e5d]" value={compData.price} onChange={e => setCompData({...compData, price: e.target.value})} />
                   </div>
                 )}
              </div>
           </div>

           <div className="mt-8 pt-8 border-t border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <label className="block text-sm font-semibold text-slate-700">Withdrawal Strategy (Add Subjects)</label>
                <div className="flex items-center gap-3">
                  <select 
                    className="px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:border-[#006e5d] transition-all"
                    value={selectedSub}
                    onChange={e => setSelectedSub(e.target.value)}
                  >
                    <option value="">Select Domain</option>
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
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-all"
                  >
                    Add to Protocol
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                  {Object.keys(composition).length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 text-slate-400 font-medium">
                       Select a subject to configure withdrawal.
                    </div>
                  ) : (
                    Object.entries(composition).map(([subId, config]: [string, any]) => {
                      const s = subjects.find(sub => sub.id === subId);
                      if (!s) return null;
                      return (
                        <div key={subId} className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-4 relative">
                          <button 
                            type="button" 
                            onClick={() => {
                              const newComp = { ...composition };
                              delete newComp[subId];
                              setComposition(newComp);
                            }}
                            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          
                          <div className="flex-1">
                            <p className="font-bold text-slate-700 mb-2">{s.name}</p>
                            <div className="flex gap-4">
                              {levels.map(l => (
                                <span key={l} className="text-xs font-semibold text-slate-500">
                                  {l.charAt(0)}: {bankCounts[s.id]?.[l] || 0}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 mr-6">
                            <select 
                               className="px-3 py-1.5 border border-slate-300 rounded-md text-sm outline-none"
                               value={config.level}
                               onChange={e => setComposition({...composition, [subId]: {...config, level: e.target.value}})}
                            >
                               {levels.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                            <input 
                               type="number"
                               min="0"
                               className="w-20 px-3 py-1.5 border border-slate-300 rounded-md text-sm text-center outline-none"
                               value={config.count}
                               onChange={e => setComposition({...composition, [subId]: {...config, count: parseInt(e.target.value) || 0}})}
                            />
                            <span className="text-xs font-bold text-slate-500">Q's</span>
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
                className="w-full py-3 bg-[#006e5d] text-white rounded-lg font-bold hover:bg-[#005a4d] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {composing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                {composing ? 'Deploying...' : 'Submit Live Exam'}
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
                  placeholder="Search live tests..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-sm font-medium focus:ring-[#006e5d] focus:border-[#006e5d] bg-white shadow-sm"
                />
             </div>
           </div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Showing {filtered.length} TESTS</p>
        </div>

        {loading ? (
           <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#006e5d] rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                <th className="p-4 pl-6 font-semibold">Live Test Name</th>
                <th className="p-4 font-semibold">Timing</th>
                <th className="p-4 font-semibold">Access</th>
                <th className="p-4 font-semibold">Enrolled</th>
                <th className="p-4 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((test) => (
                <tr key={test.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-lg bg-[#006e5d]/5 border border-[#006e5d]/10 flex items-center justify-center text-[#006e5d]">
                          <Zap className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="font-bold text-slate-900 group-hover:text-[#006e5d] transition-colors">
                           {test.title}
                         </p>
                         <p className="text-xs font-semibold text-slate-500 mt-0.5"><Clock className="w-3 h-3 inline mr-1 text-slate-400" /> {test.duration}m | {test.totalMarks}M</p>
                       </div>
                    </div>
                  </td>
                  <td className="p-4">
                     <div className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                        <span className="text-emerald-700"><span className="text-slate-400 uppercase tracking-widest text-[10px] block">Start</span> {new Date(test.startTime).toLocaleString()}</span>
                        <span className="text-rose-700"><span className="text-slate-400 uppercase tracking-widest text-[10px] block">End</span> {new Date(test.endTime).toLocaleString()}</span>
                     </div>
                  </td>
                  <td className="p-4">
                     {test.isFree ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700">Free</span>
                     ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">Premium - ₹{test.price}</span>
                     )}
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => fetchEnrolledStudents(test)} 
                      className="px-3 py-1.5 bg-slate-100 hover:bg-[#006e5d]/5 text-slate-700 hover:text-[#006e5d] rounded-md text-xs font-bold transition-colors flex items-center gap-2"
                    >
                      <Users className="w-3.5 h-3.5" /> {(test.enrolledUsers?.length || 0)} Users
                    </button>
                  </td>
                  <td className="p-4 pr-6 text-right">
                     <div className="flex items-center justify-end gap-2 text-slate-400">
                        <Link 
                           to={`/admin/live-test/manage/${test.id}`}
                           className="px-3 py-1.5 bg-[#006e5d]/5 hover:bg-[#006e5d]/10 text-[#006e5d] rounded text-xs font-bold transition-colors"
                        >
                           Manage
                        </Link>
                        <Link 
                           to={`/admin/live-test/edit/${test.id}`}
                           className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-bold transition-colors"
                        >
                           Edit
                        </Link>
                        <button onClick={() => handleDelete(test.id)} className="p-2 hover:bg-red-50 rounded text-red-500 transition-colors" title="Delete Live Test">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                   <td colSpan={5} className="p-8 text-center text-slate-500">No live tests scheduled.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedTestForUsers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#002f26]/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h3 className="font-bold text-[#002f26]">Enrolled Students</h3>
              <button onClick={() => setSelectedTestForUsers(null)} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {loadingEnrolled ? (
                <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#006e5d]" /></div>
              ) : enrolledStudentNames.length > 0 ? (
                <ul className="space-y-2">
                  {enrolledStudentNames.map((name, i) => (
                    <li key={i} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-sm font-semibold text-slate-700 flex items-center gap-3">
                       <span className="w-6 h-6 rounded bg-[#006e5d]/10 text-[#006e5d] flex items-center justify-center text-xs">{i+1}</span>
                       {name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-slate-500 py-8">No students enrolled yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
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
