import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, getDoc, addDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { MessageCircle, User, Clock, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useParams, useNavigate } from 'react-router-dom';

export default function ForumThread() {
  const { id } = useParams();
  const [thread, setThread] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const fetchThreadAndComments = async () => {
    if (!id) return;
    try {
      const docRef = doc(db, 'forum_posts', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setThread({ id: docSnap.id, ...docSnap.data() });
      } else {
        navigate('/forum');
        return;
      }

      const q = query(collection(db, 'forum_posts', id, 'comments'), orderBy('createdAt', 'asc'));
      const commentsSnap = await getDocs(q);
      setComments(commentsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching thread:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreadAndComments();
  }, [id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newComment.trim()) return;

    try {
      await addDoc(collection(db, 'forum_posts', id, 'comments'), {
        content: newComment,
        authorId: user.uid,
        authorName: profile?.fullName || user.email?.split('@')[0] || 'Anonymous',
        createdAt: Date.now()
      });

      await updateDoc(doc(db, 'forum_posts', id), {
        replyCount: increment(1)
      });

      setNewComment('');
      fetchThreadAndComments();
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen pt-32 pb-20 flex justify-center bg-slate-50">
           <div className="text-slate-500 font-medium">Loading thread...</div>
        </div>
      </Layout>
    );
  }

  if (!thread) return null;

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen pb-20">
        <div className="bg-[#002f26] text-white pt-24 pb-10 px-4">
           <div className="max-w-4xl mx-auto">
              <Link to="/forum" className="inline-flex items-center gap-2 text-emerald-300 hover:text-white font-bold text-sm mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Forum
              </Link>
              <h1 className="text-3xl md:text-4xl font-sans font-[800] tracking-tight mb-4">{thread.title}</h1>
              <div className="flex items-center gap-4 text-emerald-100/80 text-sm font-medium">
                 <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {thread.authorName}</span>
                 <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(thread.createdAt).toLocaleString()}</span>
                 <span className="px-2 py-0.5 bg-white/10 rounded">{thread.category || 'General'}</span>
              </div>
           </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 mt-8">
           {/* Original Post */}
           <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 mb-8">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-lg">{thread.content}</p>
           </div>

           {/* Comments Section */}
           <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                 <MessageCircle className="w-5 h-5 text-emerald-600" /> 
                 {comments.length} Replies
              </h3>
           </div>

           <div className="space-y-4 mb-8">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex gap-4">
                   <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                      {comment.authorName.charAt(0).toUpperCase()}
                   </div>
                   <div className="flex-grow">
                      <div className="flex items-center justify-between mb-2">
                         <span className="font-bold text-slate-900">{comment.authorName}</span>
                         <span className="text-xs font-medium text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-600 whitespace-pre-wrap">{comment.content}</p>
                   </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-500 font-medium">
                   No replies yet. Be the first to answer!
                </div>
              )}
           </div>

           {/* Add Comment */}
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h4 className="text-lg font-bold text-slate-900 mb-4">Add a Reply</h4>
              {user ? (
                 <form onSubmit={handlePostComment}>
                    <textarea 
                      required
                      rows={4}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write your answer..."
                      className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium resize-none mb-4"
                    />
                    <div className="flex justify-end">
                       <button type="submit" className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2">
                          Post Reply <Send className="w-4 h-4" />
                       </button>
                    </div>
                 </form>
              ) : (
                 <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-slate-600 mb-4 font-medium">Please log in to add a reply.</p>
                    <Link to="/login" className="inline-block bg-[#006e5d] text-white px-6 py-2 rounded-lg font-bold shadow-sm">
                       Log In
                    </Link>
                 </div>
              )}
           </div>
        </div>
      </div>
    </Layout>
  );
}
