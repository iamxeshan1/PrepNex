import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminLayout } from '../../components/AdminLayout';
import { Trash2, MessageCircle, ExternalLink } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { Link } from 'react-router-dom';

export default function AdminForum() {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteData, setDeleteData] = useState<{ id: string, name: string } | null>(null);

  const fetchThreads = async () => {
    try {
      const q = query(collection(db, 'forum_posts'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setThreads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching threads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  const handleDelete = async () => {
    if (!deleteData) return;
    try {
      // Note: Ideally we would also delete the comments for this thread, 
      // but for simplicity, we just delete the thread document here.
      await deleteDoc(doc(db, 'forum_posts', deleteData.id));
      setDeleteData(null);
      fetchThreads();
    } catch (error) {
      console.error("Error deleting thread:", error);
    }
  };

  return (
    <AdminLayout title="Community Forum Moderation">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 font-medium">Moderate community discussions and doubt solving threads.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Thread Details</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Author</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stats</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">Loading threads...</td></tr>
            ) : threads.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">No active discussions found.</td></tr>
            ) : (
              threads.map((thread) => (
                <tr key={thread.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 max-w-md">
                     <p className="text-sm font-bold text-slate-900 line-clamp-1">{thread.title}</p>
                     <p className="text-xs text-slate-500 line-clamp-2 mt-1">{thread.content}</p>
                     <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold tracking-wider">{thread.category || 'General'}</span>
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-sm font-bold text-slate-900">{thread.authorName}</p>
                     <p className="text-xs text-slate-500">{new Date(thread.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                        <MessageCircle className="w-4 h-4 text-slate-400" /> {thread.replyCount || 0} Replies
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Link to={`/forum/${thread.id}`} target="_blank" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <ExternalLink className="w-4 h-4" />
                       </Link>
                       <button onClick={() => setDeleteData({ id: thread.id, name: thread.title })} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleteData && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setDeleteData(null)}
          onConfirm={handleDelete}
          title="Delete Thread"
          message={`Are you sure you want to permanently remove this thread: "${deleteData.name}"? This will not delete the replies automatically in this simple implementation.`}
          confirmText="Delete"
        />
      )}
    </AdminLayout>
  );
}
