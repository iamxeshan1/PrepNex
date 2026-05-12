import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MessageSquare, Star, CheckCircle, XCircle, Trash2, Clock, User, Filter, Shield, Sparkles, Loader2, Info, Search } from 'lucide-react';

interface Review {
  id: string;
  userId: string;
  userName: string;
  content: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    } catch (err) {
       console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'reviews', id), { status });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (err) {
       console.error(err);
    }
  };

  const handleDelete = async (id: string, confirmed = false) => {
    if (!confirmed) { uiConfirm('Verfiy: Delete this review?', () => handleDelete(id, true)); return; }
    try {
      await deleteDoc(doc(db, 'reviews', id));
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
       console.error(err);
    }
  };

  const filteredReviews = reviews.filter(r => 
    (filter === 'all' || r.status === filter) &&
    (r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || r.content?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const StatCard = ({ title, value, span, colorClass = "text-slate-900" }: any) => (
    <div className="bg-white p-4">
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className={`text-3xl font-bold tracking-tight ${colorClass}`}>{value}</h3>
      {span && <p className="text-xs font-semibold text-slate-400 mt-1">{span}</p>}
    </div>
  );

  return (
    <AdminLayout title="Reviews">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 font-medium">Moderate and audit student sentiment and platform reviews.</p>
        <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
           {['all', 'pending', 'approved', 'rejected'].map(s => (
             <button
                key={s}
                onClick={() => setFilter(s as any)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
                  filter === s ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
             >
                {s}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Reviews" value={reviews.length} span="All time" colorClass="text-indigo-600" />
        <StatCard title="Pending" value={reviews.filter(r => r.status === 'pending').length} span="Awaiting moderation" colorClass="text-amber-600" />
        <StatCard title="Approved" value={reviews.filter(r => r.status === 'approved').length} span="Visible publicly" colorClass="text-emerald-600" />
        <StatCard title="Avg Rating" value={(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1)} span="Out of 5.0" colorClass="text-amber-500" />
      </div>

      <div className="bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
           <div className="flex gap-4">
             <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search reviews..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-sm font-medium focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                />
             </div>
           </div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Showing {filteredReviews.length} REVIEWS</p>
        </div>

        {loading ? (
           <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                <th className="p-4 pl-6 font-semibold">User & Rating</th>
                <th className="p-4 font-semibold">Review Content</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr key={review.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                  <td className="p-4 pl-6 align-top">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-100 uppercase">
                          {review.userName?.[0] || 'U'}
                       </div>
                       <div>
                         <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                           {review.userName || 'Anonymous User'}
                         </p>
                         <div className="flex gap-0.5 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                               <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                            ))}
                         </div>
                       </div>
                    </div>
                  </td>
                  <td className="p-4 align-top">
                     <p className="text-sm font-medium text-slate-700 italic max-w-xl leading-relaxed">"{review.content}"</p>
                     <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4 align-top">
                     <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                         review.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                         review.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                         'bg-amber-100 text-amber-700'
                     }`}>
                        {review.status}
                     </span>
                  </td>
                  <td className="p-4 pr-6 text-right align-top">
                     <div className="flex items-center justify-end gap-2">
                        {review.status !== 'approved' && (
                          <button onClick={() => handleStatusChange(review.id, 'approved')} className="p-2 hover:bg-emerald-50 rounded text-emerald-600 transition-colors" title="Approve">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {review.status !== 'rejected' && (
                          <button onClick={() => handleStatusChange(review.id, 'rejected')} className="p-2 hover:bg-rose-50 rounded text-rose-500 transition-colors" title="Reject">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(review.id)} className="p-2 hover:bg-red-50 rounded text-red-500 transition-colors" title="Delete permanently">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
              {filteredReviews.length === 0 && (
                <tr>
                   <td colSpan={4} className="p-8 text-center text-slate-500">No reviews found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
