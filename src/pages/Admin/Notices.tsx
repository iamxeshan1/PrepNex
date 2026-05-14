import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Trash2, Bell, Info, AlertTriangle, Zap, X, Megaphone, Calendar, Clock, Loader2, Search } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'update'>('info');

  const fetchNotices = async () => {
    setLoading(true);
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice)));
    setLoading(false);
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'notices'), {
      title, content, type,
      createdAt: new Date().toISOString()
    });
    setShowAddForm(false);
    setTitle(''); setContent(''); setType('info');
    fetchNotices();
  };

  const handleDelete = async (id: string, confirmed = false) => {
    if (!window.confirm('Delete this notice?')) return;
    if (true) {
      await deleteDoc(doc(db, 'notices', id));
      fetchNotices();
    }
  };

  const filtered = notices.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const StatCard = ({ title, value, span, colorClass = "text-slate-900" }: any) => (
    <div className="bg-white p-6 border border-slate-200">
      <p className="text-sm font-medium text-slate-500 mb-2">{title}</p>
      <h3 className={`text-4xl font-bold tracking-tight mb-2 ${colorClass}`}>{value}</h3>
      {span && <p className="text-xs font-semibold text-slate-400 mt-2">{span}</p>}
    </div>
  );

  return (
    <AdminLayout title="Notice Board">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 font-medium">Publish global announcements and platform alerts.</p>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-teal-700 text-white px-5 py-2.5 font-semibold text-sm flex items-center gap-2 hover:bg-teal-800 transition-colors"
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showAddForm ? 'Cancel Dispatch' : 'New Announcement'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Notices" value={notices.length} span="All time" colorClass="text-teal-600" />
        <StatCard title="Recent" value={notices.filter(n => new Date(n.createdAt).getTime() > Date.now() - 7*86400000).length} span="Last 7 days" colorClass="text-emerald-600" />
        <StatCard title="Critical" value={notices.filter(n => n.type === 'warning').length} span="Warnings issued" colorClass="text-amber-600" />
        <StatCard title="Updates" value={notices.filter(n => n.type === 'update').length} span="System changes" colorClass="text-teal-600" />
      </div>

       {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white p-8 border border-slate-200 mb-8 relative">
           <button type="button" onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-600 transition-colors">
              <X className="w-5 h-5" />
           </button>

           <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Megaphone className="w-5 h-5 text-teal-600" /> Compose Notice</h3>

           <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Notice Title</label>
                 <input 
                   required 
                   placeholder="e.g. Server Maintenance or Exam Shift"
                   className="w-full px-4 py-3 border border-slate-300 focus:ring-teal-500 focus:border-teal-500 font-medium bg-slate-50"
                   value={title} onChange={(e) => setTitle(e.target.value)} 
                 />
               </div>
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Notice Type</label>
                 <select 
                    className="w-full px-4 py-3 border border-slate-300 focus:ring-teal-500 focus:border-teal-500 font-medium bg-slate-50"
                    value={type} onChange={(e: any) => setType(e.target.value)}
                 >
                    <option value="info">Information</option>
                    <option value="warning">Warning / Alert</option>
                    <option value="update">System Update</option>
                 </select>
               </div>
             </div>
             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-2">Content</label>
               <textarea 
                 required 
                 placeholder="Compose the detailed announcement content here..."
                 className="w-full px-4 py-3 border border-slate-300 focus:ring-teal-500 focus:border-teal-500 font-medium min-h-[120px] bg-slate-50"
                 value={content} onChange={(e) => setContent(e.target.value)} 
               />
             </div>
           </div>

           <div className="mt-8">
              <button type="submit" className="bg-teal-700 text-white px-6 py-2.5 font-semibold hover:bg-teal-800 transition-colors flex items-center gap-2">
                <Megaphone className="w-4 h-4" /> Publish Notice
              </button>
           </div>
        </form>
      )}

      <div className="bg-white border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
           <div className="flex gap-4">
             <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search notices..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-sm font-medium focus:ring-teal-500 focus:border-teal-500 bg-white shadow-sm"
                />
             </div>
           </div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Showing {filtered.length} NOTICES</p>
        </div>

        {loading ? (
           <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                <th className="p-4 pl-6 font-semibold">Notice Subject</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Date Posted</th>
                <th className="p-4 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((notice) => (
                <tr key={notice.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-start gap-4">
                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                         notice.type === 'info' ? 'bg-teal-50 text-teal-600 border border-teal-100' :
                         notice.type === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                         'bg-emerald-50 text-emerald-600 border border-emerald-100'
                       }`}>
                         {notice.type === 'info' ? <Info className="w-5 h-5" /> :
                          notice.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                          <Zap className="w-5 h-5" />}
                       </div>
                       <div>
                         <p className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors max-w-lg truncate">
                           {notice.title}
                         </p>
                         <p className="text-xs font-semibold text-slate-500 mt-0.5 line-clamp-1 max-w-lg">{notice.content}</p>
                       </div>
                    </div>
                  </td>
                  <td className="p-4">
                     <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                         notice.type === 'info' ? 'bg-teal-50 text-teal-700' :
                         notice.type === 'warning' ? 'bg-amber-50 text-amber-700' :
                         'bg-emerald-50 text-emerald-700'
                     }`}>
                        {notice.type}
                     </span>
                  </td>
                  <td className="p-4">
                     <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(notice.createdAt).toLocaleDateString()}
                     </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                     <button onClick={() => handleDelete(notice.id)} className="p-2 hover:bg-red-50 rounded text-red-500 transition-colors" title="Delete Notice">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                   <td colSpan={4} className="p-8 text-center text-slate-500">No notices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
