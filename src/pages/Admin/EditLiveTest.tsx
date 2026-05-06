import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, Save } from 'lucide-react';

export default function AdminEditLiveTest() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTest = async () => {
      if (!testId) return;
      const snap = await getDoc(doc(db, 'liveTests', testId));
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
      await updateDoc(doc(db, 'liveTests', testId), {
        title: test.title,
        description: test.description,
        duration: Number(test.duration),
        startTime: test.startTime,
        endTime: test.endTime,
        isFree: test.isFree,
        price: test.isFree ? 0 : Number(test.price),
      });
      alert('Live Test updated successfully');
      navigate('/admin/live-tests');
    } catch (err: any) {
      alert('Failed to update: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout title="Loading..."><div className="p-8"><Loader2 className="animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout title="Edit Live Test" backTo="/admin/live-tests">
      <form onSubmit={handleSave} className="bg-white border border-slate-200 p-8 max-w-2xl mx-auto rounded-xl">
        <h2 className="text-xl font-bold mb-6 text-slate-900">Edit Test: {test.title}</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-1">Test Title</label>
            <input className="w-full px-4 py-2 border rounded" value={test.title} onChange={e => setTest({...test, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Description</label>
            <textarea className="w-full px-4 py-2 border rounded" value={test.description} onChange={e => setTest({...test, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-semibold mb-1">Start Time</label>
                <input type="datetime-local" className="w-full px-4 py-2 border rounded" value={test.startTime?.substring(0, 16)} onChange={e => setTest({...test, startTime: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-semibold mb-1">End Time</label>
                <input type="datetime-local" className="w-full px-4 py-2 border rounded" value={test.endTime?.substring(0, 16)} onChange={e => setTest({...test, endTime: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Pricing Model</label>
            <select className="w-full px-4 py-2 border rounded" value={test.isFree ? "free" : "paid"} onChange={e => setTest({...test, isFree: e.target.value === 'free', price: e.target.value === 'free' ? '0' : test.price})}>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
            </select>
          </div>
          {!test.isFree && (
            <div>
                <label className="block text-sm font-semibold mb-1">Price (₹)</label>
                <input type="number" className="w-full px-4 py-2 border rounded" value={test.price} onChange={e => setTest({...test, price: e.target.value})} />
            </div>
          )}
          <button type="submit" disabled={saving} className="bg-indigo-700 text-white px-6 py-2 rounded flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
