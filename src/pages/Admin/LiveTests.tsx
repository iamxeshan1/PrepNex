import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Clock, Users, Calendar } from 'lucide-react';

export default function AdminLiveTests() {
  const [liveTests, setLiveTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [totalMarks, setTotalMarks] = useState(100);
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
      setTitle(''); setDescription('');
    } catch (err) {
      alert("Failed to add live test.");
    }
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
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in mt-16 lg:mt-0">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-secondary tracking-tight">Live Tests</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Manage Scheduled Live Exams</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all font-logo"
        >
          {showAdd ? 'Cancel' : <><Plus className="w-5 h-5" /> Add Live Test</>}
        </button>
      </header>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Test Title</label>
              <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Description</label>
              <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold" value={description} onChange={(e) => setDescription(e.target.value)} />
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
              <label className="text-sm font-bold text-slate-700">Enrollment Start Time</label>
              <input type="datetime-local" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold" value={enrollmentStartTime} onChange={(e) => setEnrollmentStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Enrollment End Time</label>
              <input type="datetime-local" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold" value={enrollmentEndTime} onChange={(e) => setEnrollmentEndTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Test Start Time</label>
              <input type="datetime-local" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Test End Time</label>
              <input type="datetime-local" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mt-4 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded text-primary focus:ring-primary border-gray-300" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
                Is this live test free?
              </label>
            </div>
            {!isFree && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Price (₹)</label>
                <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
              </div>
            )}
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all font-logo">
            Create Live Test
          </button>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveTests.map(test => (
            <div key={test.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-secondary leading-tight">{test.title}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{test.isFree ? 'Free' : `₹${test.price}`}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-bold">
                    <Calendar className="w-4 h-4 text-primary" /> 
                    <span>{new Date(test.startTime).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" /> {test.duration} mins • {test.totalMarks} Marks
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" /> {test.enrolledUsers?.length || 0} Enrolled
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleDelete(test.id)}
                  className="flex-1 py-2 text-red-500 font-bold bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all text-sm"
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
                <a 
                  href={`/admin/questions/${test.id}`}
                  className="flex-[3] py-2 bg-slate-100 text-slate-700 text-center font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
                >
                  Manage Questions
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
