import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MessageSquare, Star, CheckCircle, XCircle, Trash2, Clock, User, Filter } from 'lucide-react';

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

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      setReviews(data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'reviews', id), { status });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review Permanently?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  const filteredReviews = reviews.filter(r => filter === 'all' || r.status === filter);

  return (
    <AdminLayout title="Student Reviews">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 text-slate-500">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Filter Status</span>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-hide">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === s ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-primary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center py-20">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-slate-50 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((review) => (
            <div key={review.id} className={`bg-white p-8 rounded-[2rem] border transition-all shadow-sm group ${
              review.status === 'approved' ? 'border-green-100 bg-green-50/10' :
              review.status === 'rejected' ? 'border-red-100' :
              'border-slate-100'
            }`}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-primary font-black uppercase">
                    {review.userName?.[0] || <User className="w-5 h-5 opacity-20" />}
                  </div>
                  <div>
                    <h4 className="font-black text-primary tracking-tight">{review.userName || 'Anonymous'}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                  ))}
                </div>
              </div>

              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-8 italic">
                "{review.content}"
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${
                    review.status === 'approved' ? 'bg-green-100 text-green-600' :
                    review.status === 'rejected' ? 'bg-red-100 text-red-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {review.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {review.status !== 'approved' && (
                    <button 
                      onClick={() => handleStatusChange(review.id, 'approved')}
                      className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                      title="Approve"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {review.status !== 'rejected' && (
                    <button 
                      onClick={() => handleStatusChange(review.id, 'rejected')}
                      className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                      title="Reject"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(review.id)}
                    className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
          <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-black text-primary tracking-tight">No Reviews Found</h3>
          <p className="text-sm text-slate-400 font-medium">Reviews submitted by students will appear here.</p>
        </div>
      )}
    </AdminLayout>
  );
}
