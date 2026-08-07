import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, getDoc, addDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { MessageCircle, Clock, ArrowLeft, Send, BarChart2, Heart, Share2, Check, X, Sparkles, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ForumThread() {
  const { id } = useParams();
  const [thread, setThread] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Local Poll Vote State & Bookmark State
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Check initial bookmark status from localStorage & profile
  useEffect(() => {
    if (id) {
      const userId = user?.uid || 'guest';
      const storageKey = `passpro_forum_bookmarks_${userId}`;
      try {
        const local = localStorage.getItem(storageKey);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed[id]) setIsBookmarked(true);
        }
      } catch (e) {}

      if (profile?.savedForumPosts?.[id]) {
        setIsBookmarked(true);
      }
    }
  }, [user?.uid, id, profile]);

  const handleToggleBookmark = async () => {
    if (!user) {
      toast.error('Please log in to save posts for revision!');
      navigate('/login');
      return;
    }
    if (!id) return;

    const nextState = !isBookmarked;
    setIsBookmarked(nextState);

    const userId = user.uid;
    const storageKey = `passpro_forum_bookmarks_${userId}`;
    let currentMap: any = {};
    try {
      const local = localStorage.getItem(storageKey);
      if (local) currentMap = JSON.parse(local);
    } catch (e) {}

    currentMap[id] = nextState;
    try {
      localStorage.setItem(storageKey, JSON.stringify(currentMap));
    } catch (e) {}

    if (nextState) {
      toast.success('Post saved to your revision list! 🔖');
    } else {
      toast('Removed from saved posts');
    }

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        [`savedForumPosts.${id}`]: nextState
      });
    } catch (err) {
      console.error('Error updating Firestore bookmark:', err);
    }
  };

  const fetchThreadAndComments = async () => {
    if (!id) return;
    try {
      const docRef = doc(db, 'forum_posts', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setThread({ id: docSnap.id, ...data });
        if (user && data.poll?.votedUsers?.[user.uid]) {
          setVotedOptionId(data.poll.votedUsers[user.uid]);
        }
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

  const handleVotePoll = async (optionId: string) => {
    if (!user) {
      toast.error('Please log in to vote!');
      navigate('/login');
      return;
    }
    if (votedOptionId) return;

    setVotedOptionId(optionId);
    setThread((prev: any) => {
      if (!prev || !prev.poll) return prev;
      const updatedOptions = prev.poll.options.map((opt: any) =>
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      );
      return {
        ...prev,
        poll: {
          ...prev.poll,
          options: updatedOptions,
          totalVotes: prev.poll.totalVotes + 1
        }
      };
    });

    toast.success('Vote recorded!');

    if (id && !id.startsWith('demo_')) {
      try {
        const postRef = doc(db, 'forum_posts', id);
        const updatedOpts = thread.poll.options.map((opt: any) =>
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        );
        await updateDoc(postRef, {
          'poll.options': updatedOpts,
          'poll.totalVotes': increment(1),
          [`poll.votedUsers.${user.uid}`]: optionId
        });
      } catch (err) {
        console.error("Error updating vote:", err);
      }
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newComment.trim()) return;

    setSubmittingComment(true);

    try {
      const authorName = profile?.fullName || profile?.name || user.displayName || user.email?.split('@')[0] || 'Aspirant';
      const authorPhotoURL = profile?.photoURL || user.photoURL || '';
      const authorIsPremium = Boolean(profile?.isPremium || profile?.role === 'admin');

      await addDoc(collection(db, 'forum_posts', id, 'comments'), {
        content: newComment.trim(),
        authorId: user.uid,
        authorName,
        authorPhotoURL,
        authorIsPremium,
        createdAt: Date.now()
      });

      if (!id.startsWith('demo_')) {
        await updateDoc(doc(db, 'forum_posts', id), {
          replyCount: increment(1)
        });
      }

      setNewComment('');
      toast.success('Reply posted!');
      fetchThreadAndComments();
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error('Failed to post reply.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen pt-32 pb-20 flex justify-center bg-slate-100 dark:bg-slate-950">
           <div className="text-slate-500 font-medium">Loading discussion thread...</div>
        </div>
      </Layout>
    );
  }

  if (!thread) return null;

  const isThreadAuthorVerified = thread.authorIsPremium || thread.authorRole === 'admin';

  return (
    <Layout>
      <div className="bg-slate-100 dark:bg-slate-950 min-h-screen pb-24 text-slate-900 dark:text-slate-100">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white pt-24 pb-10 px-4 border-b border-emerald-900/40">
           <div className="max-w-4xl mx-auto">
              <Link to="/forum" className="inline-flex items-center gap-2 text-emerald-400 hover:text-white font-bold text-xs mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Aspirant Feed
              </Link>

              {/* Author Row with Avatar BEFORE name and Verification Badge AFTER name */}
              <div className="flex items-center gap-3 mb-4">
                <Link to={`/student/${thread.authorId}`}>
                  <img
                    src={thread.authorPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(thread.authorName || 'Aspirant')}&background=006e5d&color=fff`}
                    alt={thread.authorName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500/50 shrink-0 shadow-md hover:scale-105 transition-transform"
                  />
                </Link>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link to={`/student/${thread.authorId}`} className="text-base font-black text-white hover:text-emerald-300 transition-colors">
                      {thread.authorName}
                    </Link>
                    {isThreadAuthorVerified && (
                      <VerifiedBadge size="sm" title="Pass Pro Verified Aspirant" />
                    )}
                    <span className="text-xs text-slate-400">
                      @{thread.authorName?.toLowerCase().replace(/\s+/g, '_')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-xs mt-0.5">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(thread.createdAt).toLocaleString()}</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] uppercase font-bold tracking-wider">{thread.category || 'General'}</span>
                  </div>
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2 leading-snug">
                {thread.title}
              </h1>
           </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 mt-8">
           
           {/* Original Post Main Card */}
           <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-8">
              <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed text-base font-medium mb-4">
                {thread.content}
              </p>

              {/* MCQ Poll Card if thread has poll */}
              {thread.poll && (
                <div className="my-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-emerald-600" /> MCQ Practice Poll
                    </span>
                    <span className="text-slate-400 font-medium">{thread.poll.totalVotes} total votes</span>
                  </div>

                  <div className="space-y-2">
                    {thread.poll.options.map((opt: any, oIdx: number) => {
                      const percentage = thread.poll.totalVotes 
                        ? Math.round((opt.votes / thread.poll.totalVotes) * 100) 
                        : 0;
                      const isSelected = votedOptionId === opt.id;
                      const isCorrect = thread.poll.correctOptionId === opt.id;

                      return (
                        <button
                          key={opt.id}
                          disabled={Boolean(votedOptionId)}
                          onClick={() => handleVotePoll(opt.id)}
                          className={`w-full text-left relative overflow-hidden rounded-xl border p-3 text-xs font-bold transition-all ${
                            votedOptionId
                              ? isSelected
                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                                : isCorrect
                                ? 'border-emerald-400 bg-emerald-50/30 text-slate-800 dark:text-slate-200'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/30 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {votedOptionId && (
                            <div
                              className={`absolute left-0 top-0 bottom-0 ${
                                isCorrect ? 'bg-emerald-200/50 dark:bg-emerald-800/40' : 'bg-slate-200/60 dark:bg-slate-700/50'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          )}

                          <div className="relative z-10 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black flex items-center justify-center shrink-0">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span>{opt.text}</span>
                            </div>

                            {votedOptionId && (
                              <div className="flex items-center gap-2 shrink-0">
                                {isCorrect && (
                                  <span className="text-[10px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <Check className="w-3 h-3" /> Correct
                                  </span>
                                )}
                                {isSelected && !isCorrect && (
                                  <span className="text-[10px] bg-rose-500 text-white font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <X className="w-3 h-3" /> Selected
                                  </span>
                                )}
                                <span className="text-xs font-black text-slate-500">{percentage}%</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {votedOptionId && thread.poll.explanation && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 mt-3">
                      <span className="font-extrabold flex items-center gap-1 mb-0.5 text-[#006e5d] dark:text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5" /> Explanation:
                      </span>
                      {thread.poll.explanation}
                    </div>
                  )}
                </div>
              )}

              {/* Action Bar Footer for Original Post */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleToggleBookmark}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                    isBookmarked 
                      ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20' 
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-amber-400 hover:text-amber-600'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-white' : ''}`} />
                  <span>{isBookmarked ? 'Saved for Revision' : 'Save Post for Revision'}</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Thread link copied to clipboard!');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
           </div>

           {/* Comments / Replies Section Header */}
           <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                 <MessageCircle className="w-5 h-5 text-emerald-600" /> 
                 {comments.length} Discussion Replies
              </h3>
           </div>

           {/* Comments List */}
           <div className="space-y-4 mb-8">
              {comments.map((comment) => {
                const isCommentVerified = comment.authorIsPremium;
                return (
                  <div key={comment.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                     {/* Commenter Profile Picture BEFORE name */}
                     <Link to={`/student/${comment.authorId}`}>
                       <img
                         src={comment.authorPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName || 'Aspirant')}&background=006e5d&color=fff`}
                         alt={comment.authorName}
                         className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 hover:scale-105 transition-transform"
                       />
                     </Link>
                     <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                           <div className="flex items-center gap-1.5">
                              <Link to={`/student/${comment.authorId}`} className="font-extrabold text-sm text-slate-900 dark:text-white hover:text-[#006e5d] transition-colors">
                                {comment.authorName}
                              </Link>
                              {/* Verification Badge AFTER name if Pass Pro subscriber */}
                              {isCommentVerified && (
                                <VerifiedBadge size="xs" title="Verified Pass Pro Member" />
                              )}
                              <span className="text-xs text-slate-400 font-medium">@{comment.authorName?.toLowerCase().replace(/\s+/g, '_')}</span>
                           </div>
                           <span className="text-[11px] font-medium text-slate-400">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-xs font-medium leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                     </div>
                  </div>
                );
              })}

              {comments.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-slate-500 text-xs font-medium">
                   No discussion replies yet. Be the first aspirant to answer!
                </div>
              )}
           </div>

           {/* Add Comment / Reply Form */}
           <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">Add Your Reply</h4>
              {user ? (
                 <form onSubmit={handlePostComment}>
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={profile?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || user.email || 'User')}&background=006e5d&color=fff`}
                        alt="User"
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {profile?.fullName || user.displayName || user.email?.split('@')[0]}
                        </span>
                        {(profile?.isPremium || profile?.role === 'admin') && (
                          <VerifiedBadge size="xs" />
                        )}
                      </div>
                    </div>

                    <textarea 
                      required
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Type your explanation, answer or doubt reply..."
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-xs font-medium resize-none mb-3 text-slate-900 dark:text-white"
                    />
                    <div className="flex justify-end">
                       <button 
                        type="submit" 
                        disabled={submittingComment}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                          {submittingComment ? 'Posting...' : 'Post Reply'} <Send className="w-3.5 h-3.5" />
                       </button>
                    </div>
                 </form>
              ) : (
                 <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-600 dark:text-slate-300 text-xs mb-3 font-medium">Please log in to participate in the discussion.</p>
                    <Link to="/login" className="inline-block bg-[#006e5d] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm">
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
