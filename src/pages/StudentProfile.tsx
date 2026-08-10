import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, setDoc, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { SnapchatStreakBadge } from '../components/SnapchatStreakBadge';
import { 
  User, MapPin, Calendar, Award, Trophy, MessageSquare, 
  UserPlus, UserCheck, UserX, MessageCircle, BarChart2, Share2, 
  Edit3, Sparkles, CheckCircle2, ShieldCheck, Heart, 
  BookOpen, Target, Clock, ArrowLeft, Send, Check, X,
  Search, ExternalLink, AtSign, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, profile: currentProfile } = useAuth();
  const navigate = useNavigate();

  const targetId = userId || currentUser?.uid;
  const isSelf = currentUser && currentUser.uid === targetId;
  const isAdmin = Boolean(currentProfile?.role === 'admin' || currentProfile?.isAdmin);
  const canSeePerformance = Boolean(isSelf || isAdmin);

  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'performance' | 'badges' | 'friends'>('posts');

  // Posts & Activity
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Test Results / Performance
  const [testResults, setTestResults] = useState<any[]>([]);

  // Friend status
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends'>('none');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [friendCount, setFriendCount] = useState<number>(0);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Bio / Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editState, setEditState] = useState('');
  const [editExam, setEditExam] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<{ available: boolean | null; message: string }>({ available: null, message: '' });
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    const cleanHandle = editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanHandle) {
      setUsernameStatus({ available: false, message: 'Username cannot be empty.' });
      return;
    }

    if (cleanHandle.length < 3) {
      setUsernameStatus({ available: false, message: 'Username must be at least 3 characters.' });
      return;
    }

    if (cleanHandle.length > 20) {
      setUsernameStatus({ available: false, message: 'Username cannot exceed 20 characters.' });
      return;
    }

    if (studentData?.username && cleanHandle === studentData.username.toLowerCase()) {
      setUsernameStatus({ available: true, message: 'This is your current active username.' });
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const q = query(collection(db, 'users'), where('username', '==', cleanHandle));
        const querySnap = await getDocs(q);

        let isTaken = false;
        querySnap.forEach(docSnap => {
          if (docSnap.id !== currentUser?.uid) {
            isTaken = true;
          }
        });

        if (isTaken) {
          setUsernameStatus({ available: false, message: 'Username is already taken by another aspirant.' });
        } else {
          setUsernameStatus({ available: true, message: 'Username is available!' });
        }
      } catch (err) {
        console.error('Error checking username availability:', err);
        setUsernameStatus({ available: null, message: 'Error checking availability.' });
      } finally {
        setCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [editUsername, studentData?.username, currentUser?.uid]);

  useEffect(() => {
    if (!targetId) return;

    const userDocRef = doc(db, 'users', targetId);
    
    // Subscribe to real-time updates for user profile & presence
    const unsubUser = onSnapshot(userDocRef, (userSnap) => {
      if (userSnap.exists()) {
        const data = userSnap.data();
        setStudentData({ id: userSnap.id, ...data });
        setEditName(data.name || data.fullName || '');
        setEditPhone(data.phoneNumber || data.phone || '');
        setEditBio(data.bio || 'Dedicated aspirant preparing for competitive exams on PrepNext 🚀');
        setEditDistrict(data.district || '');
        setEditState(data.state || '');
        setEditExam(data.targetExam || 'JKSSB / SSC');
        setEditUsername(data.username || '');
      } else {
        setStudentData({
          id: targetId,
          name: 'Aspirant',
          email: 'student@prepnext.in',
          isPremium: false,
          role: 'student',
          testsAttempted: 0,
          averageScore: 0
        });
      }
      setLoading(false);
    });

    const fetchStudentProfile = async () => {
      try {
        // Fetch Forum Posts created by this student
        const postsQ = query(
          collection(db, 'forum_posts'),
          where('authorId', '==', targetId),
          limit(30)
        );
        const postsSnap = await getDocs(postsQ);
        const fetchedPosts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort descending locally
        fetchedPosts.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        setUserPosts(fetchedPosts);
        setPostsLoading(false);

        // Fetch Test Results for performance tab
        const resultsQ = query(
          collection(db, 'results'),
          where('userId', '==', targetId),
          limit(20)
        );
        const resultsSnap = await getDocs(resultsQ);
        const fetchedResults = resultsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        fetchedResults.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setTestResults(fetchedResults);

        // Fetch Friends Count and friends list
        try {
          const friendshipsQ1 = query(
            collection(db, 'friendships'),
            where('users', 'array-contains', targetId)
          );
          const fSnap = await getDocs(friendshipsQ1);
          setFriendCount(fSnap.size);

          const fetchedFriends = fSnap.docs.map(docSnap => {
            const data = docSnap.data();
            const otherUser = data.user1?.uid === targetId ? data.user2 : data.user1;
            return {
              id: docSnap.id,
              friendId: otherUser?.uid || '',
              name: otherUser?.name || 'Aspirant',
              photoURL: otherUser?.photoURL || '',
              isPremium: Boolean(otherUser?.isPremium)
            };
          }).filter(f => f.friendId !== '');
          setFriends(fetchedFriends);
        } catch (err) {
          console.warn("Friendships are disabled:", err);
          setFriendCount(0);
          setFriends([]);
        }
        setFriendsLoading(false);

        // Check Friendship / Request Status if logged in & viewing another student
        if (currentUser && !isSelf) {
          try {
            checkFriendStatus(currentUser.uid, targetId);
          } catch (err) {
            console.warn("Check friend status is disabled:", err);
          }
        }

      } catch (err) {
        console.error("Error loading student profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();

    return () => {
      unsubUser();
    };
  }, [targetId, currentUser]);

  const checkFriendStatus = async (myUid: string, otherUid: string) => {
    try {
      // Check active friendship
      const friendshipDocId = [myUid, otherUid].sort().join('_');
      const fRef = doc(db, 'friendships', friendshipDocId);
      const fSnap = await getDoc(fRef);

      if (fSnap.exists()) {
        setFriendshipStatus('friends');
        return;
      }

      // Check pending friend request sent by me using deterministic ID
      const reqSentId = `${myUid}_${otherUid}`;
      const reqSentRef = doc(db, 'friend_requests', reqSentId);
      const reqSentSnap = await getDoc(reqSentRef);

      if (reqSentSnap.exists() && reqSentSnap.data()?.status === 'pending') {
        setFriendshipStatus('pending_sent');
        setRequestId(reqSentSnap.id);
        return;
      }

      // Check pending friend request received from them using deterministic ID
      const reqRecId = `${otherUid}_${myUid}`;
      const reqRecRef = doc(db, 'friend_requests', reqRecId);
      const reqRecSnap = await getDoc(reqRecRef);

      if (reqRecSnap.exists() && reqRecSnap.data()?.status === 'pending') {
        setFriendshipStatus('pending_received');
        setRequestId(reqRecSnap.id);
        return;
      }

      // Fallback query search if created with old random ID
      const reqSentQ = query(
        collection(db, 'friend_requests'),
        where('senderId', '==', myUid),
        where('receiverId', '==', otherUid),
        where('status', '==', 'pending')
      );
      const reqSentQuerySnap = await getDocs(reqSentQ);
      if (!reqSentQuerySnap.empty) {
        setFriendshipStatus('pending_sent');
        setRequestId(reqSentQuerySnap.docs[0].id);
        return;
      }

      const reqRecQ = query(
        collection(db, 'friend_requests'),
        where('senderId', '==', otherUid),
        where('receiverId', '==', myUid),
        where('status', '==', 'pending')
      );
      const reqRecQuerySnap = await getDocs(reqRecQ);
      if (!reqRecQuerySnap.empty) {
        setFriendshipStatus('pending_received');
        setRequestId(reqRecQuerySnap.docs[0].id);
        return;
      }

      setFriendshipStatus('none');
    } catch (err) {
      console.error("Error checking friendship:", err);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!currentUser || !targetId) {
      toast.error('Please log in to send friend requests!');
      navigate('/login');
      return;
    }

    if (friendshipStatus !== 'none') {
      if (friendshipStatus === 'pending_sent') {
        toast.error('Friend request already sent!');
      } else if (friendshipStatus === 'friends') {
        toast.error('You are already connected!');
      }
      return;
    }

    setActionLoading(true);
    try {
      const myName = currentProfile?.fullName || currentProfile?.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'Aspirant';
      const myPhoto = currentProfile?.photoURL || currentUser.photoURL || '';
      const reqId = `${currentUser.uid}_${targetId}`;

      await setDoc(doc(db, 'friend_requests', reqId), {
        senderId: currentUser.uid,
        senderName: myName,
        senderPhoto: myPhoto,
        senderIsPremium: Boolean(currentProfile?.isPremium || currentProfile?.role === 'admin'),
        receiverId: targetId,
        receiverName: studentData?.name || 'Aspirant',
        receiverPhoto: studentData?.photoURL || '',
        receiverIsPremium: Boolean(studentData?.isPremium || studentData?.role === 'admin'),
        status: 'pending',
        createdAt: Date.now()
      });

      setFriendshipStatus('pending_sent');
      setRequestId(reqId);
      toast.success('Friend request sent!');
    } catch (err) {
      console.error("Error sending friend request:", err);
      toast.error('Failed to send friend request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!currentUser || !requestId) return;

    setActionLoading(true);
    try {
      // Update request status
      await updateDoc(doc(db, 'friend_requests', requestId), {
        status: 'accepted'
      });

      // Create friendship doc
      const friendshipDocId = [currentUser.uid, targetId].sort().join('_');
      const myName = currentProfile?.fullName || currentProfile?.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'Aspirant';
      
      await setDoc(doc(db, 'friendships', friendshipDocId), {
        users: [currentUser.uid, targetId],
        createdAt: Date.now(),
        user1: {
          uid: currentUser.uid,
          name: myName,
          photoURL: currentProfile?.photoURL || currentUser.photoURL || '',
          isPremium: Boolean(currentProfile?.isPremium)
        },
        user2: {
          uid: targetId,
          name: studentData?.name || 'Aspirant',
          photoURL: studentData?.photoURL || '',
          isPremium: Boolean(studentData?.isPremium)
        }
      });

      setFriendshipStatus('friends');
      setFriendCount(prev => prev + 1);
      toast.success('Friend request accepted! You can now chat.');
    } catch (err) {
      console.error("Error accepting friend request:", err);
      toast.error('Failed to accept request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!currentUser || !targetId) return;
    if (!window.confirm('Are you sure you want to remove this friend?')) return;

    setActionLoading(true);
    try {
      const friendshipDocId = [currentUser.uid, targetId].sort().join('_');
      await deleteDoc(doc(db, 'friendships', friendshipDocId));

      // Clean up any friend request documents between these two users
      const reqQ1 = query(collection(db, 'friend_requests'), where('senderId', '==', currentUser.uid), where('receiverId', '==', targetId));
      const reqQ2 = query(collection(db, 'friend_requests'), where('senderId', '==', targetId), where('receiverId', '==', currentUser.uid));
      const [snap1, snap2] = await Promise.all([getDocs(reqQ1), getDocs(reqQ2)]);
      
      const deletions = [...snap1.docs, ...snap2.docs].map(d => deleteDoc(d.ref));
      await Promise.all(deletions);

      setFriendshipStatus('none');
      setFriendCount(prev => Math.max(0, prev - 1));
      toast.success('Friend removed successfully.');
    } catch (err) {
      console.error("Error removing friend:", err);
      toast.error('Failed to remove friend.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProfileEdit = async () => {
    if (!currentUser) return;

    const cleanName = editName.trim();
    if (!cleanName) {
      toast.error('Full Name is required.');
      return;
    }

    const cleanPhone = editPhone.trim();
    if (!cleanPhone) {
      toast.error('Mobile Number is required.');
      return;
    }

    const numericPhone = cleanPhone.replace(/[^0-9]/g, '');
    if (numericPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    const cleanUsername = editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 20) {
      toast.error('Username must be between 3 and 20 characters.');
      return;
    }
    if (usernameStatus.available !== true) {
      toast.error(usernameStatus.message || 'Please choose an available username.');
      return;
    }

    setUpdatingProfile(true);
    try {
      // Final guard check before save
      const q = query(collection(db, 'users'), where('username', '==', cleanUsername));
      const querySnap = await getDocs(q);
      let isTaken = false;
      querySnap.forEach(docSnap => {
        if (docSnap.id !== currentUser.uid) {
          isTaken = true;
        }
      });

      if (isTaken) {
        setUsernameStatus({ available: false, message: 'Username is already taken.' });
        toast.error('This username is already taken. Please choose another one.');
        setUpdatingProfile(false);
        return;
      }

      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: cleanName,
        fullName: cleanName,
        phoneNumber: cleanPhone,
        phone: cleanPhone,
        username: cleanUsername,
        bio: editBio.trim(),
        district: editDistrict.trim(),
        state: editState.trim(),
        targetExam: editExam.trim(),
        updatedAt: new Date().toISOString()
      });

      setStudentData((prev: any) => ({
        ...prev,
        name: cleanName,
        fullName: cleanName,
        phoneNumber: cleanPhone,
        phone: cleanPhone,
        username: cleanUsername,
        bio: editBio.trim(),
        district: editDistrict.trim(),
        state: editState.trim(),
        targetExam: editExam.trim()
      }));

      setShowEditModal(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error('Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen pt-32 pb-20 flex justify-center items-center bg-slate-100 dark:bg-slate-950">
          <div className="flex flex-col items-center gap-3 text-slate-500 font-bold">
            <div className="w-8 h-8 border-4 border-[#006e5d] border-t-transparent rounded-full animate-spin"></div>
            <span>Loading Student Profile...</span>
          </div>
        </div>
      </Layout>
    );
  }

  const isVerified = Boolean(studentData?.isPremium || studentData?.role === 'admin');
  const studentName = studentData?.fullName || studentData?.name || 'Aspirant';
  const handle = studentData?.username ? `@${studentData.username}` : `@${studentName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
  const avatarUrl = studentData?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=006e5d&color=fff`;

  // Calculated National Rank estimate based on test scores
  const scoreAvg = Math.round(studentData?.averageScore || 0);
  const testsCount = studentData?.testsAttempted || testResults.length || 0;
  const calculatedRank = scoreAvg > 90 ? '#8' : scoreAvg > 80 ? '#24' : scoreAvg > 70 ? '#58' : scoreAvg > 50 ? '#142' : '#320';

  return (
    <Layout>
      <div className="bg-slate-100 dark:bg-slate-950 min-h-screen pb-24 text-slate-900 dark:text-slate-100">
        
        {/* Top X-style Header Bar */}
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black text-slate-900 dark:text-white leading-none">
                {studentName}
              </h1>
              {isVerified && <VerifiedBadge size="sm" title="Pass Pro Verified Aspirant" />}
            </div>
            <span className="text-xs text-slate-400 font-medium">{userPosts.length} Posts & Doubts</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 pt-6">

          {/* Profile Header Main Box */}
          <div className="bg-white dark:bg-slate-900 px-6 py-6 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm mb-6 relative">
            
            {/* Top row: Avatar & Action Buttons */}
            <div className="flex justify-between items-start flex-wrap gap-4">
              
              {/* Profile Avatar BEFORE name */}
              <div className="relative">
                <img 
                  src={avatarUrl} 
                  alt={studentName} 
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800 shadow-md bg-slate-200"
                />
                {Boolean(studentData?.isOnline) && Boolean(studentData?.lastSeen) && (Date.now() - Number(studentData.lastSeen) < 180000) ? (
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center" title="Online now">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  </div>
                ) : (
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-slate-400 rounded-full border-2 border-white dark:border-slate-900 shadow-md" title="Offline" />
                )}
                {isVerified && (
                  <div className="absolute top-0 right-0 p-0.5 bg-white dark:bg-slate-900 rounded-full shadow-md">
                    <VerifiedBadge size="md" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {isSelf ? (
                  <>
                    <button 
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 font-extrabold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Profile link copied!');
                      }}
                      className="p-2 rounded-full border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Share Profile"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    {friendshipStatus === 'friends' && (
                      <button 
                        onClick={() => navigate(`/chat?userId=${targetId}`)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#006e5d] text-white font-extrabold text-xs hover:bg-[#005a4d] transition-all shadow-md shadow-emerald-600/20"
                      >
                        <MessageCircle className="w-4 h-4" /> Message
                      </button>
                    )}

                    {friendshipStatus === 'none' && (
                      <button 
                        onClick={handleSendFriendRequest}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition-all shadow-xs disabled:opacity-50"
                      >
                        <UserPlus className="w-4 h-4 text-emerald-500" /> Connect
                      </button>
                    )}

                    {friendshipStatus === 'pending_sent' && (
                      <button 
                        disabled
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-extrabold text-xs border border-slate-200 dark:border-slate-800"
                      >
                        <Clock className="w-4 h-4 animate-pulse" /> Pending Request
                      </button>
                    )}

                    {friendshipStatus === 'pending_received' && (
                      <button 
                        onClick={handleAcceptFriendRequest}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 font-extrabold text-xs transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                      >
                        <UserCheck className="w-4 h-4" /> Accept Connection
                      </button>
                    )}

                    {friendshipStatus === 'friends' && (
                      <button 
                        onClick={handleRemoveFriend}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-rose-200 hover:bg-rose-50 dark:border-rose-950 dark:hover:bg-rose-950/30 text-rose-600 font-extrabold text-xs transition-all disabled:opacity-50"
                      >
                        <UserX className="w-4 h-4" /> Disconnect
                      </button>
                    )}

                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Profile link copied!');
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 font-extrabold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs"
                      title="Share Profile"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Name & Handle Row */}
            <div className="mt-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {studentName}
                </h2>
                
                {/* Verification Badge AFTER student name */}
                {isVerified && (
                  <VerifiedBadge size="md" title="Pass Pro Verified Student" />
                )}

                {/* Snapchat Style Streak Flame Badge */}
                <SnapchatStreakBadge 
                  streakCount={Number(studentData?.studyStreak || studentData?.streak || 14)} 
                  size="md" 
                />

                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 text-[#006e5d] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {studentData?.role === 'admin' ? 'Super Admin' : isVerified ? 'Pass Pro Aspirant' : 'Aspirant'}
                </span>

                {Boolean(studentData?.isOnline) && Boolean(studentData?.lastSeen) && (Date.now() - Number(studentData.lastSeen) < 180000) ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500 text-white flex items-center gap-1 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> Online Now
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                    Offline
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-slate-400 mt-0.5">
                {handle}
              </div>

              {/* Bio */}
              <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mt-3 leading-relaxed max-w-2xl">
                {studentData?.bio || 'Dedicated aspirant preparing for competitive exams on PrepNext 🚀'}
              </p>

              {/* Metadata Info Bar */}
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium mt-3 flex-wrap">
                {(studentData?.district || studentData?.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#006e5d]" /> 
                    {[studentData?.district, studentData?.state].filter(Boolean).join(', ')}
                  </span>
                )}
                {studentData?.targetExam && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500" /> 
                    {studentData.targetExam}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> 
                  Joined {studentData?.createdAt ? new Date(studentData.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '2026'}
                </span>
                <button 
                  onClick={() => setActiveTab('friends')}
                  className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 hover:text-[#006e5d] dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  title="View aspirant connections"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> 
                  {friendCount} {friendCount === 1 ? 'Friend' : 'Friends'}
                </button>
              </div>

            </div>

            {/* X-style Stats Bar Counter */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center">
                <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                  <Trophy className="w-3 h-3 text-amber-500" /> Est. Rank
                </div>
                <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {canSeePerformance ? calculatedRank : '🔒 Private'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center">
                <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                  <Target className="w-3 h-3 text-emerald-500" /> Tests Taken
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {canSeePerformance ? testsCount : '🔒 Private'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center">
                <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                  <BarChart2 className="w-3 h-3 text-blue-500" /> Avg Score
                </div>
                <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                  {canSeePerformance ? `${scoreAvg}%` : '🔒 Private'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center">
                <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                  <MessageSquare className="w-3 h-3 text-purple-500" /> Posts
                </div>
                <div className="text-lg font-black text-purple-600 dark:text-purple-400">
                  {userPosts.length}
                </div>
              </div>
            </div>

            {!canSeePerformance && (
              <div className="mt-3 p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-center text-[11px] font-extrabold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-[#006e5d]" />
                Test scores & rank analytics are kept strictly private to student and admins.
              </div>
            )}

          </div>

          {/* Profile Navigation Tabs */}
          <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 sm:px-4 sm:rounded-t-2xl mb-4 min-w-0">
            <button
              onClick={() => setActiveTab('posts')}
              className={`shrink-0 py-3.5 px-3.5 sm:px-4 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 ${
                activeTab === 'posts'
                  ? 'border-[#006e5d] text-[#006e5d] dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Doubts & Polls ({userPosts.length})
            </button>

            {canSeePerformance && (
              <button
                onClick={() => setActiveTab('performance')}
                className={`shrink-0 py-3.5 px-3.5 sm:px-4 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 ${
                  activeTab === 'performance'
                    ? 'border-[#006e5d] text-[#006e5d] dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-4 h-4" /> Performance ({testResults.length})
              </button>
            )}

            <button
              onClick={() => setActiveTab('badges')}
              className={`shrink-0 py-3.5 px-3.5 sm:px-4 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 ${
                activeTab === 'badges'
                  ? 'border-[#006e5d] text-[#006e5d] dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4" /> Earned Badges
            </button>

            <button
              onClick={() => setActiveTab('friends')}
              className={`shrink-0 py-3.5 px-3.5 sm:px-4 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 ${
                activeTab === 'friends'
                  ? 'border-[#006e5d] text-[#006e5d] dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-500" /> Connections ({friendCount})
            </button>
          </div>

          {/* TAB 1: Posts & Polls Feed */}
          {activeTab === 'posts' && (
            <div className="space-y-4 px-2 sm:px-0">
              {postsLoading ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 font-medium text-xs">
                  Loading aspirant posts...
                </div>
              ) : userPosts.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-medium">
                  No doubts or polls posted by {studentName} yet.
                </div>
              ) : (
                userPosts.map(post => (
                  <div key={post.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {/* Avatar BEFORE name */}
                        <img 
                          src={avatarUrl} 
                          alt={studentName} 
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div className="flex items-center gap-1">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">{studentName}</span>
                          {isVerified && <VerifiedBadge size="xs" />}
                          <span className="text-[11px] text-slate-400">{handle}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-[#006e5d] text-[10px] font-black rounded uppercase">
                        {post.category || 'General'}
                      </span>
                    </div>

                    <Link to={`/forum/${post.id}`} className="block group">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-[#006e5d] transition-colors mb-1">
                        {post.title}
                      </h3>
                      {post.content && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-3 mb-3">
                          {post.content}
                        </p>
                      )}
                    </Link>

                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> 
                        {new Date(post.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                      <Link to={`/forum/${post.id}`} className="flex items-center gap-1 text-[#006e5d] font-bold hover:underline">
                        <MessageCircle className="w-3.5 h-3.5" /> {post.replyCount || 0} Replies
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Practice Performance */}
          {activeTab === 'performance' && (
            <div className="space-y-4 px-2 sm:px-0">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs mb-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#006e5d]" /> Test History & Analytics
                </h3>

                {testResults.length === 0 ? (
                  <p className="text-xs text-slate-500 font-medium text-center py-6">
                    No mock test results recorded yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {testResults.map(res => {
                      const score = Math.round(res.scorePercentage || res.score || 0);
                      return (
                        <div key={res.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white mb-0.5">
                              {res.testTitle || 'Mock Test Practice'}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-medium">
                              Completed on {new Date(res.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className={`text-sm font-black ${score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {score}%
                            </span>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Score Accuracy</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Badges & Verification Showcase */}
          {activeTab === 'badges' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-2 sm:px-0">
              
              {/* Pass Pro Badge */}
              <div className={`p-5 rounded-2xl border ${isVerified ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border-emerald-300 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#006e5d] text-white flex items-center justify-center shrink-0 shadow-md">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      Pass Pro Verified <VerifiedBadge size="xs" />
                    </h4>
                    <span className="text-[11px] font-bold text-[#006e5d] dark:text-emerald-400">
                      {isVerified ? 'Active Verified Pass Pro' : 'Not Unlocked'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Official verified student mark with tick icon badge across PrepNext forums, tests, and mock tests.
                </p>
              </div>

              {/* Mock Test Ace Badge */}
              <div className={`p-5 rounded-2xl border ${testsCount >= 5 ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Mock Test Challenger
                    </h4>
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      {testsCount >= 5 ? 'Unlocked (5+ Mock Tests)' : `${testsCount}/5 Tests Taken`}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Earned by actively practicing mock test series and full-length exam papers.
                </p>
              </div>

              {/* Top Scorer Badge */}
              <div className={`p-5 rounded-2xl border ${scoreAvg >= 75 ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      High Accuracy Master
                    </h4>
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      {scoreAvg >= 75 ? 'Unlocked (Avg Accuracy > 75%)' : 'Requires > 75% Avg Accuracy'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Awarded to students who achieve exceptional accuracy across competitive test sections.
                </p>
              </div>

            </div>
          )}

          {/* TAB 4: Friends & Connections */}
          {activeTab === 'friends' && (
            <div className="space-y-3 px-2 sm:px-0">
              {friendsLoading ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 font-medium text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#006e5d]" /> Loading connections...
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-medium">
                  No active connections found for {studentName}.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {friends.map((f) => (
                    <div 
                      key={f.id || f.friendId} 
                      className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#006e5d]/40 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img 
                            src={f.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=006e5d&color=fff`} 
                            alt={f.name} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" 
                          />
                          {f.isPremium && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{f.name}</h4>
                          <p className="text-[10px] text-slate-400 font-medium">Connected Aspirant</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => navigate(`/student/${f.friendId}`)}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Profile
                        </button>
                        <button 
                          onClick={() => navigate(`/chat?userId=${f.friendId}`)}
                          className="px-2.5 py-1.5 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" /> Chat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white">Edit Student Profile</h3>
                <button onClick={() => setShowEditModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-[#006e5d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number <span className="text-red-500">* (Mandatory)</span>
                  </label>
                  <input 
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-[#006e5d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unique Username / Handle
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-xs">
                      @
                    </div>
                    <input 
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="e.g. jhon_doe"
                      className={`w-full pl-7 pr-8 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:bg-white transition-all ${
                        usernameStatus.available === true
                          ? 'border-emerald-500/80 focus:border-emerald-600 ring-2 ring-emerald-500/10'
                          : usernameStatus.available === false
                          ? 'border-red-400 focus:border-red-500 ring-2 ring-red-500/10'
                          : 'border-slate-200 dark:border-slate-700 focus:border-[#006e5d]'
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                      {checkingUsername ? (
                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                      ) : usernameStatus.available === true ? (
                        <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                      ) : usernameStatus.available === false ? (
                        <X className="w-4 h-4 text-red-500 stroke-[3]" />
                      ) : null}
                    </div>
                  </div>
                  {editUsername.trim() && (
                    <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${
                      usernameStatus.available === true 
                        ? 'text-emerald-600' 
                        : 'text-red-500'
                    }`}>
                      {usernameStatus.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bio / Status
                  </label>
                  <textarea 
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Tell other aspirants about your preparation goal..."
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-[#006e5d]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">District</label>
                    <input 
                      type="text"
                      value={editDistrict}
                      onChange={(e) => setEditDistrict(e.target.value)}
                      placeholder="e.g. Jammu / Srinagar"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-[#006e5d]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">State</label>
                    <input 
                      type="text"
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                      placeholder="e.g. Jammu & Kashmir"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-[#006e5d]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Exam</label>
                  <input 
                    type="text"
                    value={editExam}
                    onChange={(e) => setEditExam(e.target.value)}
                    placeholder="e.g. JKSSB CGL / SSC CGL / NEET"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-[#006e5d]"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button 
                  disabled={updatingProfile}
                  onClick={handleSaveProfileEdit}
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-[#006e5d] text-white hover:bg-[#005a4d] transition-colors shadow-sm disabled:opacity-50"
                >
                  {updatingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
