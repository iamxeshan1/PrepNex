import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, setDoc, doc, updateDoc, increment, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { 
  MessageCircle, Search, Plus, User, Clock, ChevronRight, Heart, 
  Share2, Bookmark, BarChart2, BadgeCheck, CheckCircle2, Sparkles, 
  HelpCircle, Check, X, Filter, Zap, Award, Image, RefreshCw, Send,
  TrendingUp, Users, CheckSquare, Pin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { StudyGroupsTab } from '../components/StudyGroupsTab';
import { PinPostModal } from '../components/PinPostModal';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollData {
  question: string;
  options: PollOption[];
  totalVotes: number;
  votedUsers: { [userId: string]: string }; // userId -> optionId
  correctOptionId?: string;
  explanation?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  authorIsPremium?: boolean;
  authorRole?: string;
  replyCount: number;
  likeCount: number;
  likedUsers?: { [userId: string]: boolean };
  poll?: PollData;
  createdAt: number;
  tags?: string[];
}

const DEFAULT_POSTS: Post[] = [
  {
    id: 'demo_1',
    title: 'JKSSB FAA / Panchayat Secretary General Knowledge Poll',
    content: 'Which Section of the Jammu and Kashmir Reorganisation Act, 2019 deals with the formation of the Legislative Assembly for the Union Territory of Jammu and Kashmir?',
    category: 'JKSSB',
    tags: ['#JKSSB', '#JKReorganisation', '#GeneralKnowledge'],
    authorId: 'demo_user_1',
    authorName: 'Aarav Sharma',
    authorPhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    authorIsPremium: true,
    authorRole: 'student',
    replyCount: 18,
    likeCount: 42,
    createdAt: Date.now() - 1000 * 60 * 25, // 25 mins ago
    poll: {
      question: 'Which Section deals with the Legislative Assembly of UT of J&K?',
      options: [
        { id: 'opt_a', text: 'Section 13', votes: 14 },
        { id: 'opt_b', text: 'Section 14', votes: 68 },
        { id: 'opt_c', text: 'Section 15', votes: 9 },
        { id: 'opt_d', text: 'Section 18', votes: 12 }
      ],
      totalVotes: 103,
      votedUsers: {},
      correctOptionId: 'opt_b',
      explanation: 'Section 14 of the J&K Reorganisation Act, 2019 provisions for the Legislative Assembly of the Union Territory of Jammu and Kashmir.'
    }
  },
  {
    id: 'demo_2',
    title: 'SSC CGL Quant Shortcut: Compound Interest Tricks',
    content: 'Find the compound interest on ₹12,000 at 10% per annum for 2 years 73 days, compounded annually. What is the fastest ratio method to solve this under 45 seconds?',
    category: 'SSC CGL',
    tags: ['#SSC_CGL', '#QuantTricks', '#Maths'],
    authorId: 'demo_user_2',
    authorName: 'Dr. Priya Verma',
    authorPhotoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    authorIsPremium: true,
    authorRole: 'admin',
    replyCount: 24,
    likeCount: 89,
    createdAt: Date.now() - 1000 * 60 * 180, // 3 hours ago
    poll: {
      question: 'What is the correct CI value?',
      options: [
        { id: 'opt_1', text: '₹2,832', votes: 19 },
        { id: 'opt_2', text: '₹2,928', votes: 54 },
        { id: 'opt_3', text: '₹3,050', votes: 12 },
        { id: 'opt_4', text: '₹2,750', votes: 8 }
      ],
      totalVotes: 93,
      votedUsers: {},
      correctOptionId: 'opt_2',
      explanation: 'For 2 years 73 days: 73 days = 1/5 year. Rate for fractional period = 10% / 5 = 2%. Effective CI = 10% + 10% + 2% + compound ratio = ₹2,928.'
    }
  },
  {
    id: 'demo_3',
    title: 'Current Affairs 2026: Ramsar Sites Update',
    content: 'How many total recognized Ramsar Wetlands sites are currently designated in India as of recent 2025/2026 notifications? Drop your answer in the poll below!',
    category: 'Current Affairs',
    tags: ['#CurrentAffairs', '#UPSC', '#GeneralAwareness'],
    authorId: 'demo_user_3',
    authorName: 'Sahil Bhat',
    authorPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    authorIsPremium: true,
    authorRole: 'student',
    replyCount: 9,
    likeCount: 31,
    createdAt: Date.now() - 1000 * 60 * 420, // 7 hours ago
    poll: {
      question: 'Total Ramsar sites in India?',
      options: [
        { id: 'r_1', text: '75 Sites', votes: 11 },
        { id: 'r_2', text: '80 Sites', votes: 38 },
        { id: 'r_3', text: '85 Sites', votes: 82 },
        { id: 'r_4', text: '90 Sites', votes: 15 }
      ],
      totalVotes: 146,
      votedUsers: {},
      correctOptionId: 'r_3',
      explanation: 'India currently boasts 85 designated Ramsar Wetland sites of international importance.'
    }
  }
];

export default function Forum() {
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'polls' | 'doubts' | 'verified' | 'saved' | 'groups'>('all');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [isPollMode, setIsPollMode] = useState(false);

  // Study Groups Pinning & Counter States
  const [studyGroupsCount, setStudyGroupsCount] = useState(0);
  const [pinningPost, setPinningPost] = useState<Post | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);

  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIdx, setCorrectOptionIdx] = useState<number | null>(null);
  const [pollExplanation, setPollExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Local interaction states for offline/fast UI
  const [votedPolls, setVotedPolls] = useState<{ [postId: string]: string }>({});
  const [likedPosts, setLikedPosts] = useState<{ [postId: string]: boolean }>({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState<{ [postId: string]: boolean }>({});

  const isUserVerified = profile?.isPremium || profile?.role === 'admin';

  // Load saved bookmarks from localStorage and Firestore user profile
  useEffect(() => {
    const userId = user?.uid || 'guest';
    const storageKey = `passpro_forum_bookmarks_${userId}`;
    try {
      const local = localStorage.getItem(storageKey);
      if (local) {
        setBookmarkedPosts(JSON.parse(local));
      }
    } catch (e) {
      console.error('Error reading local bookmarks:', e);
    }

    if (profile?.savedForumPosts) {
      setBookmarkedPosts(prev => ({
        ...prev,
        ...profile.savedForumPosts
      }));
    }
  }, [user?.uid, profile]);

  // Sync activeTab with URL parameter e.g. ?tab=saved
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'saved' || tabParam === 'polls' || tabParam === 'doubts' || tabParam === 'verified' || tabParam === 'all' || tabParam === 'groups') {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Sync Study Groups Count
  useEffect(() => {
    if (!user) {
      setStudyGroupsCount(0);
      return;
    }
    const q = query(collection(db, 'study_groups'), where('members', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setStudyGroupsCount(snap.size);
    }, (err) => {
      console.error("Error listening to study groups count:", err);
    });
    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, 'forum_posts'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const fetched: Post[] = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          content: data.content || '',
          category: data.category || 'General',
          authorId: data.authorId || '',
          authorName: data.authorName || 'Aspirant',
          authorPhotoURL: data.authorPhotoURL || '',
          authorIsPremium: data.authorIsPremium || false,
          authorRole: data.authorRole || 'student',
          replyCount: data.replyCount || 0,
          likeCount: data.likeCount || 0,
          likedUsers: data.likedUsers || {},
          poll: data.poll || undefined,
          createdAt: data.createdAt || Date.now(),
          tags: data.tags || []
        };
      });

      if (fetched.length === 0) {
        setPosts(DEFAULT_POSTS);
      } else {
        setPosts(fetched);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts(DEFAULT_POSTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleVotePoll = async (postId: string, optionId: string) => {
    if (!user) {
      toast.error('Please log in to vote on polls!');
      navigate('/login');
      return;
    }

    // Check if already voted
    if (votedPolls[postId]) {
      toast.error('You have already voted on this poll!');
      return;
    }

    // Update local state for snappy response
    setVotedPolls(prev => ({ ...prev, [postId]: optionId }));

    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id !== postId || !p.poll) return p;
      const updatedOptions = p.poll.options.map(opt => {
        if (opt.id === optionId) {
          return { ...opt, votes: opt.votes + 1 };
        }
        return opt;
      });
      return {
        ...p,
        poll: {
          ...p.poll,
          options: updatedOptions,
          totalVotes: p.poll.totalVotes + 1,
          votedUsers: { ...p.poll.votedUsers, [user.uid]: optionId }
        }
      };
    }));

    toast.success('Vote recorded!');

    // Persist to Firestore if it's a real post
    if (!postId.startsWith('demo_')) {
      try {
        const postRef = doc(db, 'forum_posts', postId);
        const targetPost = posts.find(p => p.id === postId);
        if (targetPost && targetPost.poll) {
          const updatedOptions = targetPost.poll.options.map(opt => 
            opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
          );
          await updateDoc(postRef, {
            'poll.options': updatedOptions,
            'poll.totalVotes': increment(1),
            [`poll.votedUsers.${user.uid}`]: optionId
          });
        }
      } catch (err) {
        console.error("Error persisting vote:", err);
      }
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) {
      toast.error('Please log in to like posts');
      return;
    }

    const isCurrentlyLiked = likedPosts[postId];
    setLikedPosts(prev => ({ ...prev, [postId]: !isCurrentlyLiked }));

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        likeCount: isCurrentlyLiked ? Math.max(0, p.likeCount - 1) : p.likeCount + 1
      };
    }));

    if (!postId.startsWith('demo_')) {
      try {
        const postRef = doc(db, 'forum_posts', postId);
        await updateDoc(postRef, {
          likeCount: increment(isCurrentlyLiked ? -1 : 1),
          [`likedUsers.${user.uid}`]: !isCurrentlyLiked
        });
      } catch (err) {
        console.error("Error updating like:", err);
      }
    }
  };

  const handleToggleBookmark = async (postId: string) => {
    if (!user) {
      toast.error('Please log in to save posts for revision!');
      navigate('/login');
      return;
    }

    const isBookmarked = Boolean(bookmarkedPosts[postId]);
    const nextState = !isBookmarked;

    const updated = { ...bookmarkedPosts, [postId]: nextState };
    setBookmarkedPosts(updated);

    const userId = user.uid;
    const storageKey = `passpro_forum_bookmarks_${userId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving bookmark to localStorage:', e);
    }

    if (nextState) {
      toast.success('Post saved to your revision list! 🔖');
    } else {
      toast('Removed from saved posts');
    }

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        [`savedForumPosts.${postId}`]: nextState
      });
    } catch (err) {
      console.error('Error updating Firestore bookmarks:', err);
    }
  };

  const handleShare = (post: Post) => {
    const url = `${window.location.origin}/forum/${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Post link copied to clipboard!');
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions(prev => [...prev, '']);
    } else {
      toast.error('Maximum 6 options allowed');
    }
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(prev => prev.filter((_, i) => i !== idx));
      if (correctOptionIdx === idx) setCorrectOptionIdx(null);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!formTitle.trim()) {
      toast.error('Please provide a title or question');
      return;
    }

    setSubmitting(true);

    try {
      let createdPoll: PollData | undefined = undefined;

      if (isPollMode) {
        const validOptions = pollOptions.filter(o => o.trim() !== '');
        if (validOptions.length < 2) {
          toast.error('Please provide at least 2 valid poll options');
          setSubmitting(false);
          return;
        }

        const formattedOptions: PollOption[] = validOptions.map((optText, index) => ({
          id: `opt_${Date.now()}_${index}`,
          text: optText.trim(),
          votes: 0
        }));

        const selectedCorrectId = correctOptionIdx !== null && formattedOptions[correctOptionIdx]
          ? formattedOptions[correctOptionIdx].id 
          : null;

        const pollDataObj: any = {
          question: formTitle.trim(),
          options: formattedOptions,
          totalVotes: 0,
          votedUsers: {}
        };

        if (selectedCorrectId) {
          pollDataObj.correctOptionId = selectedCorrectId;
        }

        if (pollExplanation.trim()) {
          pollDataObj.explanation = pollExplanation.trim();
        }

        createdPoll = pollDataObj;
      }

      // Generate automatic tags based on title and category
      const autoTags = [`#${formCategory.replace(/\s+/g, '')}`];
      if (formTitle.toLowerCase().includes('jkssb')) autoTags.push('#JKSSB');
      if (formTitle.toLowerCase().includes('ssc')) autoTags.push('#SSC_CGL');
      if (formTitle.toLowerCase().includes('math') || formTitle.toLowerCase().includes('quant')) autoTags.push('#Quant');

      const authorName = profile?.fullName || profile?.name || user.displayName || user.email?.split('@')[0] || 'Aspirant';
      const authorPhotoURL = profile?.photoURL || user.photoURL || '';
      const authorIsPremium = Boolean(profile?.isPremium || profile?.role === 'admin');

      const newPostId = doc(collection(db, 'forum_posts')).id;
      const newPostData: any = {
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
        authorId: user.uid,
        authorName,
        authorPhotoURL: authorPhotoURL || '',
        authorIsPremium,
        authorRole: profile?.role || 'student',
        replyCount: 0,
        likeCount: 0,
        createdAt: Date.now(),
        tags: autoTags
      };

      if (createdPoll) {
        newPostData.poll = createdPoll;
      }

      await setDoc(doc(db, 'forum_posts', newPostId), newPostData);

      toast.success('Posted successfully!');
      setShowComposeModal(false);

      // Reset form
      setFormTitle('');
      setFormContent('');
      setFormCategory('General');
      setPollQuestion('');
      setPollOptions(['', '', '', '']);
      setCorrectOptionIdx(null);
      setPollExplanation('');
      setIsPollMode(false);

      fetchPosts();
    } catch (err) {
      console.error("Error creating post:", err);
      toast.error('Failed to publish post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter logic
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.tags && post.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

    if (!matchesSearch) return false;

    if (activeTab === 'polls') return Boolean(post.poll);
    if (activeTab === 'doubts') return !post.poll;
    if (activeTab === 'verified') return Boolean(post.authorIsPremium);
    if (activeTab === 'saved') return Boolean(bookmarkedPosts[post.id]);

    return true;
  });

  return (
    <Layout>
      <div className="bg-slate-100 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 pb-24">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white pt-24 pb-12 px-4 relative overflow-hidden border-b border-emerald-900/40">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/30 mb-3">
                <Sparkles className="w-3.5 h-3.5" /> X-Feed for Aspirants & Educators
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
                Aspirant <span className="text-emerald-400">Social Feed</span>
              </h1>
              <p className="text-slate-300 text-sm md:text-base font-medium max-w-xl">
                Post doubts, create MCQ poll questions, vote on live practice polls, and connect with verified Pass Pro aspirants!
              </p>
            </div>

            <button
              onClick={() => user ? setShowComposeModal(true) : navigate('/login')}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold px-6 py-3.5 rounded-full text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Post Doubt or MCQ Poll
            </button>
          </div>
        </div>

        {/* Main Feed Container */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-6">

          {/* Quick Top Pill Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar border-b border-slate-200/80 dark:border-slate-800/80">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-[#006e5d] text-white shadow-md shadow-emerald-700/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> All Discussions ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('polls')}
              className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'polls'
                  ? 'bg-[#006e5d] text-white shadow-md shadow-emerald-700/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-emerald-500" /> MCQ Polls ({posts.filter(p => p.poll).length})
            </button>
            <button
              onClick={() => setActiveTab('doubts')}
              className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'doubts'
                  ? 'bg-[#006e5d] text-white shadow-md shadow-emerald-700/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> Doubts ({posts.filter(p => !p.poll).length})
            </button>
            <button
              onClick={() => setActiveTab('verified')}
              className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'verified'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500" /> Verified Pros ({posts.filter(p => p.authorIsPremium).length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-950 fill-amber-950" /> Saved ({Object.values(bookmarkedPosts).filter(Boolean).length})
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'groups'
                  ? 'bg-[#006e5d] text-white shadow-md shadow-emerald-700/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-500" /> Study Groups ({studyGroupsCount})
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Main Primary Column - Aspirant Posts Timeline FIRST */}
            <div className={`${activeTab === 'groups' ? 'lg:col-span-12' : 'lg:col-span-8'} order-1 space-y-4`}>

              {activeTab === 'groups' ? (
                <StudyGroupsTab />
              ) : (
                <>
                  {/* Inline Composer Trigger Box (X-Style Compose Card) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex items-start gap-3">
                  <img
                    src={profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || user?.email || 'Student')}&background=006e5d&color=fff`}
                    alt="User"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div className="flex-grow">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {profile?.fullName || user?.displayName || user?.email?.split('@')[0] || 'Aspirant'}
                      </span>
                      {isUserVerified && (
                        <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500 shrink-0" title="Pass Pro Verified Member" />
                      )}
                    </div>

                    <button
                      onClick={() => user ? setShowComposeModal(true) : navigate('/login')}
                      className="w-full text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-400 dark:text-slate-500 text-xs font-medium transition-all"
                    >
                      Post a doubt, question, or create an MCQ poll...
                    </button>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (!user) { navigate('/login'); return; }
                            setIsPollMode(true);
                            setShowComposeModal(true);
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <BarChart2 className="w-4 h-4" /> Create MCQ Poll
                        </button>
                        <button
                          onClick={() => {
                            if (!user) { navigate('/login'); return; }
                            setIsPollMode(false);
                            setShowComposeModal(true);
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <HelpCircle className="w-4 h-4" /> Ask Doubt
                        </button>
                      </div>

                      <button
                        onClick={() => user ? setShowComposeModal(true) : navigate('/login')}
                        className="bg-[#006e5d] hover:bg-[#005a4d] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Saved Tab Information Banner */}
              {activeTab === 'saved' && (
                <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 flex items-center gap-3 text-amber-900 dark:text-amber-200 text-xs font-medium">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-xl shrink-0">
                    <Bookmark className="w-5 h-5 text-amber-600 dark:text-amber-400 fill-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-amber-950 dark:text-amber-100 mb-0.5">Your Revision Library</h4>
                    <p>All saved doubts, MCQ practice polls, and difficult questions are stored here for fast revision before your upcoming exams.</p>
                  </div>
                </div>
              )}

              {/* Feed List */}
              {loading ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#006e5d] mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">Loading aspirant timeline...</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8">
                  {activeTab === 'saved' ? (
                    <>
                      <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/50 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-200 dark:border-amber-800/40">
                        <Bookmark className="w-8 h-8 text-amber-500 fill-amber-500" />
                      </div>
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-white mb-1">No Saved Posts Yet</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mb-5 max-w-sm mx-auto leading-relaxed font-medium">
                        Click the bookmark icon on any doubt, MCQ poll, or question thread in the feed to save it for quick revision!
                      </p>
                      <button
                        onClick={() => setActiveTab('all')}
                        className="bg-[#006e5d] text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-sm hover:bg-[#005a4d] transition-colors"
                      >
                        Explore All Discussions
                      </button>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-white mb-1">No Posts Found</h3>
                      <p className="text-slate-500 text-xs mb-4">Be the first aspirant to post a doubt or MCQ poll in this feed!</p>
                      <button
                        onClick={() => user ? setShowComposeModal(true) : navigate('/login')}
                        className="bg-[#006e5d] text-white text-xs font-bold px-5 py-2 rounded-full"
                      >
                        Post Now
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPosts.map((post) => {
                    const hasVoted = Boolean(votedPolls[post.id] || (user && post.poll?.votedUsers && post.poll.votedUsers[user.uid]));
                    const userVotedOptionId = votedPolls[post.id] || (user && post.poll?.votedUsers ? post.poll.votedUsers[user.uid] : undefined);
                    const isLiked = Boolean(likedPosts[post.id]);
                    const isBookmarked = Boolean(bookmarkedPosts[post.id]);

                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        {/* Author Header Row */}
                        <div className="flex items-start gap-3">
                          {/* Student Profile Picture BEFORE name */}
                          <Link to={`/student/${post.authorId}`}>
                            <img
                              src={post.authorPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName)}&background=006e5d&color=fff`}
                              alt={post.authorName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm hover:scale-105 transition-transform"
                            />
                          </Link>

                          <div className="flex-grow min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* Student Name */}
                                <Link to={`/student/${post.authorId}`} className="text-sm font-black text-slate-900 dark:text-white truncate hover:text-[#006e5d] transition-colors">
                                  {post.authorName}
                                </Link>

                                {/* Verification Badge AFTER name if Pass Pro subscriber or admin */}
                                {post.authorIsPremium && (
                                  <VerifiedBadge size="xs" title="Verified Pass Pro Member" />
                                )}

                                <span className="text-xs font-medium text-slate-400">
                                  @{post.authorName.toLowerCase().replace(/\s+/g, '_')}
                                </span>

                                <span className="text-slate-300 dark:text-slate-700">•</span>

                                <span className="text-[11px] font-medium text-slate-400">
                                  {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-[#006e5d] dark:text-emerald-400 rounded-md text-[10px] font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/40">
                                {post.category}
                              </span>
                            </div>

                            {/* Title / Question text */}
                            <Link to={`/forum/${post.id}`} className="block group">
                              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-[#006e5d] dark:group-hover:text-emerald-400 transition-colors leading-snug mb-1">
                                {post.title}
                              </h2>
                            </Link>

                            {/* Description Content */}
                            {post.content && (
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed mb-3 whitespace-pre-line">
                                {post.content}
                              </p>
                            )}

                            {/* Tags */}
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {post.tags.map((tag, tIdx) => (
                                  <span key={tIdx} className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* MCQ Poll Card Section */}
                            {post.poll && (
                              <div className="my-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                                <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-2">
                                  <span className="flex items-center gap-1.5">
                                    <BarChart2 className="w-4 h-4 text-emerald-600" /> MCQ Practice Poll
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {post.poll.totalVotes} votes
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  {post.poll.options.map((opt, oIdx) => {
                                    const percentage = post.poll?.totalVotes 
                                      ? Math.round((opt.votes / post.poll.totalVotes) * 100) 
                                      : 0;
                                    const isSelected = userVotedOptionId === opt.id;
                                    const isCorrect = post.poll?.correctOptionId === opt.id;

                                    return (
                                      <button
                                        key={opt.id}
                                        disabled={hasVoted}
                                        onClick={() => handleVotePoll(post.id, opt.id)}
                                        className={`w-full text-left relative overflow-hidden rounded-xl border p-3 text-xs font-bold transition-all ${
                                          hasVoted
                                            ? isSelected
                                              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                                              : isCorrect
                                              ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200'
                                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800'
                                        }`}
                                      >
                                        {/* Voting Percentage Bar */}
                                        {hasVoted && (
                                          <div
                                            className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${
                                              isCorrect ? 'bg-emerald-200/50 dark:bg-emerald-800/40' : 'bg-slate-200/60 dark:bg-slate-700/50'
                                            }`}
                                            style={{ width: `${percentage}%` }}
                                          />
                                        )}

                                        <div className="relative z-10 flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black flex items-center justify-center shrink-0">
                                              {String.fromCharCode(65 + oIdx)}
                                            </span>
                                            <span className="truncate">{opt.text}</span>
                                          </div>

                                          {hasVoted && (
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
                                              <span className="text-slate-500 dark:text-slate-400 text-xs font-black">
                                                {percentage}%
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Poll Explanation box if voted */}
                                {hasVoted && post.poll.explanation && (
                                  <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 mt-3"
                                  >
                                    <span className="font-extrabold flex items-center gap-1 mb-0.5 text-[#006e5d] dark:text-emerald-400">
                                      <Sparkles className="w-3.5 h-3.5" /> Explanation:
                                    </span>
                                    {post.poll.explanation}
                                  </motion.div>
                                )}
                              </div>
                            )}

                            {/* Social Actions Footer Bar (X Style) */}
                            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 pt-2 text-xs font-bold border-t border-slate-100 dark:border-slate-800">
                              
                              {/* Replies */}
                              <Link
                                to={`/forum/${post.id}`}
                                className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span>{post.replyCount || 0}</span>
                              </Link>

                              {/* Likes */}
                              <button
                                onClick={() => handleToggleLike(post.id)}
                                className={`flex items-center gap-1.5 transition-colors p-1.5 rounded-lg ${
                                  isLiked 
                                    ? 'text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/30' 
                                    : 'hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                }`}
                              >
                                <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                                <span>{post.likeCount || 0}</span>
                              </button>

                              {/* Share */}
                              <button
                                onClick={() => handleShare(post)}
                                className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                title="Share post link"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>

                              {/* Bookmark / Save for Revision */}
                              <button
                                onClick={() => handleToggleBookmark(post.id)}
                                className={`flex items-center gap-1.5 transition-all px-2.5 py-1 rounded-lg ${
                                  isBookmarked 
                                    ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 font-bold' 
                                    : 'hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                }`}
                                title={isBookmarked ? "Saved for revision (Click to remove)" : "Save post for revision"}
                              >
                                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                                <span className="text-[11px] font-bold hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
                              </button>

                              {/* Pin to Study Group */}
                              {user && (
                                <button
                                  onClick={() => {
                                    setPinningPost(post);
                                    setShowPinModal(true);
                                  }}
                                  className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                  title="Pin to Study Group for Collaborative Study"
                                >
                                  <Pin className="w-4 h-4 rotate-45" />
                                  <span className="text-[11px] font-bold hidden sm:inline">Pin to Group</span>
                                </button>
                              )}
                            </div>

                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

            {/* Secondary Column - Feed Navigation, Trending Topics & Verified Educators */}
            {activeTab !== 'groups' && (
              <div className="lg:col-span-4 order-2 space-y-4">

                {/* Feed Navigation Box */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm sticky top-20">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 px-2">Feed Navigation</h3>
                  <nav className="space-y-1">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                        activeTab === 'all' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#006e5d] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4" /> All Discussions
                      </span>
                      <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px]">
                        {posts.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab('polls')}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                        activeTab === 'polls' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#006e5d] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <BarChart2 className="w-4 h-4 text-emerald-600" /> MCQ Practice Polls
                      </span>
                      <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {posts.filter(p => p.poll).length}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab('doubts')}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                        activeTab === 'doubts' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#006e5d] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <HelpCircle className="w-4 h-4 text-blue-500" /> Standard Doubts
                      </span>
                      <span className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-[10px]">
                        {posts.filter(p => !p.poll).length}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab('verified')}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                        activeTab === 'verified' 
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" /> Verified Pass Pros
                      </span>
                      <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full text-[10px]">
                        {posts.filter(p => p.authorIsPremium).length}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab('saved')}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                        activeTab === 'saved' 
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500" /> Saved for Revision
                      </span>
                      <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {Object.values(bookmarkedPosts).filter(Boolean).length}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab('groups')}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                        activeTab === 'groups' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#006e5d] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-emerald-600" /> Study Groups
                      </span>
                      <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                        {studyGroupsCount}
                      </span>
                    </button>
                  </nav>

                  <hr className="my-4 border-slate-100 dark:border-slate-800" />

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search posts or #tags..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              {/* Trending Hashtags Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> Trending Topics
                </h3>
                <div className="space-y-2.5">
                  {[
                    { tag: '#JKSSB_FAA', count: '1.2k posts' },
                    { tag: '#SSC_CGL_2026', count: '3.4k posts' },
                    { tag: '#GeneralKnowledge', count: '890 posts' },
                    { tag: '#CurrentAffairs_2026', count: '2.1k posts' },
                    { tag: '#QuantSpeedMaths', count: '650 posts' }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSearchTerm(item.tag)}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{item.tag}</div>
                        <div className="text-[10px] font-medium text-slate-400">{item.count}</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Verified Aspirants & Educators Widget */}
              <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900 text-white rounded-2xl p-4 border border-emerald-800/50 shadow-md">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider mb-3">
                  <BadgeCheck className="w-4 h-4 text-blue-400 fill-blue-500" /> Verified Pass Pros
                </div>
                <p className="text-slate-300 text-xs mb-4 font-medium">
                  Subscribe to <span className="text-amber-400 font-bold">Pass Pro</span> to get the official Verified Aspirant badge next to your profile!
                </p>
                <Link
                  to="/premium"
                  className="block text-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20"
                >
                  Get Verified Badge
                </Link>
              </div>
            </div>
          )}

          </div>
        </div>
      </div>

      {/* X-Style Compose Modal (Doubt or MCQ Poll) */}
      <AnimatePresence>
        {showComposeModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    Create New Post
                  </span>
                  {isUserVerified && (
                    <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" title="Pass Pro Verified Member" />
                  )}
                </div>
                <button
                  onClick={() => setShowComposeModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Compose Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                
                {/* Author Info Banner */}
                <div className="flex items-center gap-3">
                  <img
                    src={profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || user?.email || 'Student')}&background=006e5d&color=fff`}
                    alt="User"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {profile?.fullName || user?.displayName || user?.email?.split('@')[0]}
                      </span>
                      {isUserVerified && (
                        <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Posting publicly to Aspirant Social Feed
                    </span>
                  </div>
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsPollMode(false)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      !isPollMode 
                        ? 'bg-white dark:bg-slate-900 text-[#006e5d] dark:text-emerald-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" /> Standard Doubt / Question
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPollMode(true)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      isPollMode 
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <BarChart2 className="w-4 h-4" /> MCQ Practice Poll
                  </button>
                </div>

                {/* Question / Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isPollMode ? 'Poll Question / Problem Statement *' : 'Doubt Title or Question *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder={isPollMode ? "e.g., Which Article of the Indian Constitution abolishes Untouchability?" : "e.g., How to solve blood relation problems quickly?"}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Exam / Subject Category *</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-xs text-slate-900 dark:text-white"
                  >
                    <option value="JKSSB">JKSSB Exams</option>
                    <option value="SSC CGL">SSC CGL / CHSL</option>
                    <option value="RRB NTPC">RRB Railways</option>
                    <option value="NEET UG">NEET UG</option>
                    <option value="JEE Main">JEE Main</option>
                    <option value="Banking">IBPS / SBI Bank PO</option>
                    <option value="General Knowledge">General Knowledge</option>
                    <option value="Mathematics">Quantitative Aptitude</option>
                    <option value="Reasoning">Logical Reasoning</option>
                    <option value="English">English Language</option>
                  </select>
                </div>

                {/* Detailed Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isPollMode ? 'Additional Context / Instructions (Optional)' : 'Description & Details'}
                  </label>
                  <textarea
                    rows={3}
                    value={formContent}
                    onChange={e => setFormContent(e.target.value)}
                    placeholder="Provide extra details or background information..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-xs text-slate-900 dark:text-white resize-none"
                  />
                </div>

                {/* MCQ Poll Builder */}
                {isPollMode && (
                  <div className="p-4 bg-emerald-50/50 dark:bg-slate-800/50 rounded-2xl border border-emerald-100 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4" /> MCQ Options Builder
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">At least 2 options required</span>
                    </div>

                    <div className="space-y-2">
                      {pollOptions.map((optText, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <input
                            type="text"
                            value={optText}
                            onChange={e => {
                              const updated = [...pollOptions];
                              updated[index] = e.target.value;
                              setPollOptions(updated);
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            className="flex-grow px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-medium text-slate-900 dark:text-white focus:border-emerald-500"
                          />

                          {/* Correct Answer Selector Checkbox */}
                          <button
                            type="button"
                            onClick={() => setCorrectOptionIdx(correctOptionIdx === index ? null : index)}
                            title="Mark as correct answer"
                            className={`px-2.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
                              correctOptionIdx === index
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {correctOptionIdx === index ? 'Correct' : 'Mark'}
                          </button>

                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePollOption(index)}
                              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {pollOptions.length < 6 && (
                      <button
                        type="button"
                        onClick={handleAddPollOption}
                        className="text-xs font-bold text-[#006e5d] dark:text-emerald-400 hover:underline flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Option
                      </button>
                    )}

                    {/* Explanation field */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Explanation / Answer Key (Revealed after students vote)
                      </label>
                      <input
                        type="text"
                        value={pollExplanation}
                        onChange={e => setPollExplanation(e.target.value)}
                        placeholder="Explain why the marked option is correct..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-medium text-slate-900 dark:text-white focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0 bg-slate-50 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitPost}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : isPollMode ? 'Publish MCQ Poll' : 'Post Question'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pin to Study Group Modal */}
      <AnimatePresence>
        {showPinModal && pinningPost && (
          <PinPostModal
            isOpen={showPinModal}
            onClose={() => {
              setShowPinModal(false);
              setPinningPost(null);
            }}
            postId={pinningPost.id}
            postTitle={pinningPost.title || pinningPost.content}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
