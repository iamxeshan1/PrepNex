import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Trash2, Clock, Users, Calendar, Award } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';

export default function AdminLiveTests() {
  const [liveTests, setLiveTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  
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

  useEffect(() => {
    fetchLiveTests();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) return;
    
    try {
      const newRef = doc(collection(db, 'liveTests'));
      await setDoc(newRef, {
        title,
        description,
        duration: Number(duration),
        totalMarks: Number(totalMarks),
        positiveMarks: Number(positiveMarks),
        negativeMarks: Number(negativeMarks),
        enrollmentStartTime,
        enrollmentEndTime,
        startTime,
        endTime,
        isFree,
        price: isFree ? 0 : Number(price),
        enrolledUsers: [],
        createdAt: new Date().toISOString()
      });
      
      setShowAdd(false);
      fetchLiveTests();
      resetForm();
    } catch (err) {
      alert("Failed to add live test.");
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription('');
    setDuration(60); setTotalMarks(100);
    setPositiveMarks(1); setNegativeMarks(0.25);
    setEnrollmentStartTime(''); setEnrollmentEndTime('');
    setStartTime(''); setEndTime('');
    setIsFree(true); setPrice(100);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this live test?")) return;
    try {
      await deleteDoc(doc(db, 'liveTests', id));
      fetchLiveTests();
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  return (
    <AdminLayout title="Live Exams Management">
      <div className="flex justify-end mb-8">
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-primary/20"
        >
          {showAdd ? 'Cancel' : <><Plus className="w-5 h-5" /> Schedule New Live Test</>}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 mb-10 animate-in zoom-in-95">
          <h3 className="text-xl font-black text-primary tracking-tight uppercase">New Live Test Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Test Title</label>
              <input type="text" required placeholder="e.g. JKSSB Mega Live Mock Test" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Description</label>
              <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold h-24" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Duration (Minutes)</label>
              <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Total Marks</label>
              <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold" value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Positive Marks per Question</label>
              <input type="number" step="0.01" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold" value={positiveMarks} onChange={(e) => setPositiveMarks(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Negative Marks per Question</label>
              <input type="number" step="0.01" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold" value={negativeMarks} onChange={(e) => setNegativeMarks(Number(e.target.value))} />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Enrollment Starts</label>
              <input type="datetime-local" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold" value={enrollmentStartTime} onChange={(e) => setEnrollmentStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Enrollment Ends</label>
              <input type="datetime-local" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold" value={enrollmentEndTime} onChange={(e) => setEnrollmentEndTime(e.target.value)} />
            </div>
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <label className="text-sm font-bold text-[#002D62]">Test Starts (Final Date/Time)</label>
              <input type="datetime-local" required className="w-full px-4 py-3 bg-[#F0F4FF] border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-black text-[#002D62]" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <label className="text-sm font-bold text-[#002D62]">Test Ends (Final Date/Time)</label>
              <input type="datetime-local" required className="w-full px-4 py-3 bg-[#F0F4FF] border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-black text-[#002D62]" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 w-full cursor-pointer hover:bg-slate-100 transition-all">
                <input type="checkbox" className="w-6 h-6 rounded text-primary focus:ring-primary border-gray-300" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
                <span className="text-sm font-black text-slate-700 uppercase tracking-tight">Allow all users to join for free</span>
              </label>
            </div>
            {!isFree && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Access Fee (₹)</label>
                <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
              </div>
            )}
          </div>
          <button type="submit" className="w-full py-5 bg-[#002D62] text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-900/10 hover:bg-[#003B7F] transition-all uppercase tracking-widest">
            Publish Live Schedule
          </button>
        </form>
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
                <button
                  onClick={() => handleDelete(test.id)}
                  className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  title="Delete Test"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <a 
                  href={`/admin/questions/${test.id}`}
                  className="flex-1 h-12 bg-[#002D62] text-white flex items-center justify-center font-bold rounded-2xl hover:bg-[#003B7F] shadow-lg shadow-blue-900/10 transition-all text-xs uppercase tracking-widest"
                >
                  Manage Questions
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
