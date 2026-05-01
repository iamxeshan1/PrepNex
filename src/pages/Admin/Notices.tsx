import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Trash2, Bell, Info, AlertTriangle, Zap } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'update';
  createdAt: string;
}

export default function AdminNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'update'>('info');

  const fetchNotices = async () => {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice)));
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'notices'), {
      title,
      content,
      type,
      createdAt: new Date().toISOString()
    });
    setShowAddForm(false);
    setTitle(''); setContent(''); setType('info');
    fetchNotices();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this notice?')) {
      await deleteDoc(doc(db, 'notices', id));
      fetchNotices();
    }
  };

  return (
    <AdminLayout title="Manage Notices">
      <div className="mb-8 flex justify-end">
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> {showAddForm ? 'Cancel' : 'Add New Notice'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mb-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Notice Title</label>
              <input 
                required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold text-primary"
                value={title} onChange={(e) => setTitle(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Notice Type</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold text-primary"
                value={type} onChange={(e: any) => setType(e.target.value)}
              >
                <option value="info">Information</option>
                <option value="warning">Alert/Warning</option>
                <option value="update">Platform Update</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Content</label>
            <textarea 
              required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold text-primary min-h-[100px]"
              value={content} onChange={(e) => setContent(e.target.value)} 
            />
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all">
            Post Notice
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-6">
        {notices.map((notice) => (
          <div key={notice.id} className="bg-white p-6 rounded-2xl border border-slate-100 flex items-start justify-between shadow-sm">
            <div className="flex gap-4">
              <div className={`p-3 rounded-xl ${
                notice.type === 'info' ? 'bg-blue-50 text-blue-600' :
                notice.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                'bg-emerald-50 text-emerald-600'
              }`}>
                {notice.type === 'info' ? <Info className="w-6 h-6" /> :
                 notice.type === 'warning' ? <AlertTriangle className="w-6 h-6" /> :
                 <Zap className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="font-extrabold text-primary tracking-tight">{notice.title}</h4>
                <p className="text-sm text-slate-500 mt-1">{notice.content}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                  {new Date(notice.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button onClick={() => handleDelete(notice.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
