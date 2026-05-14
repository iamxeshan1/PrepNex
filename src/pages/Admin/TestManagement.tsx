import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, Save } from 'lucide-react';

export default function AdminTestManagement() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTest = async () => {
      if (!testId) return;
      const snap = await getDoc(doc(db, 'tests', testId));
      if (snap.exists()) {
        setTest({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    };
    fetchTest();
  }, [testId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'tests', testId), {
        title: test.title,
        duration: Number(test.duration),
        isFree: test.isFree,
        price: test.isFree ? 0 : Number(test.price),
        status: test.scheduledStartTime ? 'scheduled' : 'live',
        scheduledStartTime: test.scheduledStartTime || null,
      });
      alert('Test updated successfully');
      navigate(-1);
    } catch (err: any) {
      alert('Failed to update: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout title="Loading..."><div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal-600 w-8 h-8" /></div></AdminLayout>;
  if (!test) return <AdminLayout title="Error"><div className="p-8">Test not found</div></AdminLayout>;

  return (
    <AdminLayout title="Manage Test" backTo={-1}>
      <form onSubmit={handleSave} className="bg-white border border-slate-200 p-8 shadow-sm max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Manage Test</h2>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${test.status === 'scheduled' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {test.status || 'Live'}
            </div>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Test Name</label>
              <input className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none" value={test.title} onChange={e => setTest({...test, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (Minutes)</label>
              <input type="number" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none" value={test.duration} onChange={e => setTest({...test, duration: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Pricing Model</label>
              <select className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none" value={test.isFree ? "free" : "paid"} onChange={e => setTest({...test, isFree: e.target.value === 'free', price: e.target.value === 'free' ? 0 : test.price})}>
                <option value="free">Free</option>
                <option value="paid">Premium (Paid)</option>
              </select>
            </div>
          </div>
          
          {!test.isFree && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Premium Price (₹)</label>
              <input type="number" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none" value={test.price} onChange={e => setTest({...test, price: e.target.value})} />
            </div>
          )}
          
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="block text-sm font-semibold text-[#001f19] mb-2">Scheduling</label>
            <input type="datetime-local" className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none" value={test.scheduledStartTime?.substring(0, 16) || ''} onChange={e => setTest({...test, scheduledStartTime: e.target.value, status: e.target.value ? 'scheduled' : 'live'})} />
            <p className="text-xs text-slate-500 mt-2">Setting a date will schedule the test. Leave blank to keep it immediately live.</p>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={saving} className="bg-teal-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-teal-800 shadow-md transition-all">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
