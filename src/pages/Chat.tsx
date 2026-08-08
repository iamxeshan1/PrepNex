import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  collection, query, where, getDocs, doc, getDoc, addDoc, 
  setDoc, onSnapshot, orderBy, limit, updateDoc, Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { 
  MessageCircle, UserPlus, UserCheck, Search, Send, Clock, 
  Check, X, User, Sparkles, Shield, ArrowLeft, Users, CheckCheck,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Chat() {
  const { user: currentUser, profile: currentProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeUserIdParam = searchParams.get('userId');

  const [activeTab, setActiveTab] = useState<'chats' | 'requests' | 'find'>('chats');

  // Friends & Friend Requests state
  const [friends, setFriends] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  // Search Aspirants state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Selected Chat state
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [isFriend, setIsFriend] = useState<boolean>(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of message list without scrolling the entire window
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        // Use standard scrollTop calculation to scroll only the chat feed
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time online users presence map & real-time profiles
  const [onlineUsersMap, setOnlineUsersMap] = useState<Record<string, { isOnline: boolean; lastSeen?: number }>>({});
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const statusMap: Record<string, { isOnline: boolean; lastSeen?: number }> = {};
      const uMap: Record<string, any> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        statusMap[d.id] = {
          isOnline: Boolean(data.isOnline),
          lastSeen: data.lastSeen ? Number(data.lastSeen) : undefined
        };
        uMap[d.id] = { uid: d.id, ...data };
      });
      setOnlineUsersMap(statusMap);
      setUsersMap(uMap);
    });

    return () => unsubUsers();
  }, []);

  const getUserProfile = (uid: string, fallback?: any) => {
    const u = usersMap[uid];
    const rawName = u?.fullName || u?.name || fallback?.name || fallback?.fullName || 'Aspirant';
    const cleanHandle = (u?.username || fallback?.username || rawName.toLowerCase().replace(/[^a-z0-9_]/g, '')).toLowerCase().replace(/[^a-z0-9_]/g, '');
    const photoURL = u?.photoURL || fallback?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(rawName)}&background=006e5d&color=fff`;
    const isPremium = Boolean(u?.isPremium || u?.role === 'admin' || fallback?.isPremium);
    return {
      uid,
      name: rawName,
      username: cleanHandle,
      handle: `@${cleanHandle}`,
      photoURL,
      isPremium
    };
  };

  const isUserOnline = (uid: string) => {
    const info = onlineUsersMap[uid];
    if (!info) return false;
    if (!info.isOnline) return false;
    if (!info.lastSeen) return true;
    return (Date.now() - info.lastSeen) < 180000; // 3 minutes threshold
  };

  // Load Friends & Requests
  useEffect(() => {
    if (!currentUser) return;

    setLoadingFriends(true);

    // Listen to Friendships
    const friendshipsQ = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', currentUser.uid)
    );

    const unsubFriendships = onSnapshot(friendshipsQ, (snap) => {
      const friendList: any[] = [];
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const other = data.user1?.uid === currentUser.uid ? data.user2 : data.user1;
        if (other) {
          friendList.push({
            friendshipId: docSnap.id,
            ...other
          });
        }
      });
      setFriends(friendList);
      setLoadingFriends(false);
    }, (err) => {
      console.error("Error listening to friendships:", err);
      setLoadingFriends(false);
    });

    // Listen to Incoming Friend Requests
    const incomingQ = query(
      collection(db, 'friend_requests'),
      where('receiverId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubIncoming = onSnapshot(incomingQ, (snap) => {
      setIncomingRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Listen to Sent Friend Requests
    const sentQ = query(
      collection(db, 'friend_requests'),
      where('senderId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubSent = onSnapshot(sentQ, (snap) => {
      setSentRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubFriendships();
      unsubIncoming();
      unsubSent();
    };
  }, [currentUser]);

  // Handle selecting active friend to chat
  useEffect(() => {
    if (!activeUserIdParam || !currentUser) {
      if (friends.length > 0 && !selectedFriend) {
        // Auto-select first friend
        setSelectedFriend(friends[0]);
        setIsFriend(true);
      }
      return;
    }

    const loadFriendData = async () => {
      // Check if target user is in friends list
      const matched = friends.find(f => f.uid === activeUserIdParam);
      if (matched) {
        setSelectedFriend(matched);
        setIsFriend(true);
      } else {
        // Check database to see if they are friends or not
        const friendshipId = [currentUser.uid, activeUserIdParam].sort().join('_');
        const fSnap = await getDoc(doc(db, 'friendships', friendshipId));

        const userSnap = await getDoc(doc(db, 'users', activeUserIdParam));
        const userData = userSnap.exists() ? userSnap.data() : { name: 'Aspirant' };

        setSelectedFriend({
          uid: activeUserIdParam,
          name: userData.name || userData.fullName || 'Aspirant',
          photoURL: userData.photoURL || '',
          isPremium: Boolean(userData.isPremium || userData.role === 'admin')
        });

        setIsFriend(fSnap.exists());
      }
    };

    loadFriendData();
  }, [activeUserIdParam, friends, currentUser]);

  // Real-time listener for chat messages
  useEffect(() => {
    if (!currentUser || !selectedFriend || !isFriend) {
      setMessages([]);
      return;
    }

    const chatId = [currentUser.uid, selectedFriend.uid].sort().join('_');
    const messagesQ = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubMessages = onSnapshot(messagesQ, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(fetched);

      // Symmetrically mark incoming unread messages from the other user as read in real-time
      snap.docs.forEach(async (docSnap) => {
        const data = docSnap.data();
        if (data.senderId === selectedFriend.uid && !data.read) {
          try {
            await updateDoc(docSnap.ref, { read: true, status: 'read' });
          } catch (e) {
            console.error("Error updating read status:", e);
          }
        }
      });
    }, (err) => {
      console.error("Error fetching messages:", err);
    });

    return () => unsubMessages();
  }, [currentUser, selectedFriend, isFriend]);

  // Search Aspirants in database
  const handleSearchAspirants = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const usersQ = query(
        collection(db, 'users'),
        limit(20)
      );
      const snap = await getDocs(usersQ);
      const queryLower = searchQuery.toLowerCase().replace(/^@/, '');

      const results = snap.docs
        .map(d => ({ uid: d.id, ...d.data() }))
        .filter((u: any) => 
          u.uid !== currentUser?.uid && 
          ((u.username && u.username.toLowerCase().includes(queryLower)) ||
           (u.name && u.name.toLowerCase().includes(queryLower)) || 
           (u.fullName && u.fullName.toLowerCase().includes(queryLower)) ||
           (u.email && u.email.toLowerCase().includes(queryLower)))
        );

      setSearchResults(results);
    } catch (err) {
      console.error("Error searching aspirants:", err);
      toast.error('Error searching students.');
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (targetUser: any) => {
    if (!currentUser) {
      toast.error('Please log in first!');
      navigate('/login');
      return;
    }

    try {
      const myName = currentProfile?.fullName || currentProfile?.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'Aspirant';

      await addDoc(collection(db, 'friend_requests'), {
        senderId: currentUser.uid,
        senderName: myName,
        senderPhoto: currentProfile?.photoURL || currentUser.photoURL || '',
        senderIsPremium: Boolean(currentProfile?.isPremium || currentProfile?.role === 'admin'),
        receiverId: targetUser.uid,
        receiverName: targetUser.name || targetUser.fullName || 'Aspirant',
        receiverPhoto: targetUser.photoURL || '',
        receiverIsPremium: Boolean(targetUser.isPremium || targetUser.role === 'admin'),
        status: 'pending',
        createdAt: Date.now()
      });

      toast.success(`Friend request sent to ${targetUser.name || 'Aspirant'}!`);
    } catch (err) {
      console.error("Error sending request:", err);
      toast.error('Failed to send request.');
    }
  };

  const handleAcceptRequest = async (req: any) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'friend_requests', req.id), {
        status: 'accepted'
      });

      const friendshipDocId = [currentUser.uid, req.senderId].sort().join('_');
      const myName = currentProfile?.fullName || currentProfile?.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'Aspirant';

      await setDoc(doc(db, 'friendships', friendshipDocId), {
        users: [currentUser.uid, req.senderId],
        createdAt: Date.now(),
        user1: {
          uid: currentUser.uid,
          name: myName,
          photoURL: currentProfile?.photoURL || currentUser.photoURL || '',
          isPremium: Boolean(currentProfile?.isPremium)
        },
        user2: {
          uid: req.senderId,
          name: req.senderName,
          photoURL: req.senderPhoto || '',
          isPremium: Boolean(req.senderIsPremium)
        }
      });

      toast.success(`Accepted friend request from ${req.senderName}!`);
    } catch (err) {
      console.error("Error accepting request:", err);
      toast.error('Failed to accept request.');
    }
  };

  const handleDeclineRequest = async (reqId: string) => {
    try {
      await updateDoc(doc(db, 'friend_requests', reqId), {
        status: 'declined'
      });
      toast.success('Request declined.');
    } catch (err) {
      console.error("Error declining request:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedFriend || !isFriend || !newMessage.trim()) return;

    setSendingMessage(true);
    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      const chatId = [currentUser.uid, selectedFriend.uid].sort().join('_');

      // Create Chat Doc if missing
      await setDoc(doc(db, 'chats', chatId), {
        participants: [currentUser.uid, selectedFriend.uid],
        lastMessage: msgText,
        lastMessageTime: Date.now(),
        updatedAt: Date.now()
      }, { merge: true });

      // Add Message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: currentUser.uid,
        text: msgText,
        createdAt: Date.now(),
        read: false,
        status: 'sent'
      });

    } catch (err) {
      console.error("Error sending message:", err);
      toast.error('Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  if (!currentUser) {
    return (
      <Layout>
        <div className="min-h-screen pt-32 pb-20 flex justify-center items-center bg-slate-100 dark:bg-slate-950">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-md shadow-xl">
            <MessageCircle className="w-12 h-12 text-[#006e5d] mx-auto mb-3" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Student Chat Hub</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 font-medium">
              Log in to connect, send friend requests, and study together in 1-on-1 chats.
            </p>
            <Link to="/login" className="bg-[#006e5d] text-white font-extrabold text-xs px-6 py-3 rounded-xl inline-block shadow-md">
              Log In to Start Chatting
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const activeProf = selectedFriend ? getUserProfile(selectedFriend.uid, selectedFriend) : null;

  return (
    <Layout>
      <div className="bg-slate-100 dark:bg-slate-950 min-h-[calc(100vh-80px)] text-slate-900 dark:text-slate-100 flex flex-col">
        
        <div className="max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6 flex-1 flex flex-col md:flex-row gap-4 h-[calc(100vh-100px)] min-h-[600px]">
          
          {/* Left Sidebar Pane: Friends, Requests & Discovery */}
          <div className="w-full md:w-80 lg:w-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col shrink-0 overflow-hidden">
            
            {/* Navigation Tabs */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-1">
              <button
                onClick={() => setActiveTab('chats')}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'chats' 
                    ? 'bg-[#006e5d] text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" /> Chats ({friends.length})
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-black transition-all relative flex items-center justify-center gap-1.5 ${
                  activeTab === 'requests' 
                    ? 'bg-[#006e5d] text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" /> Requests
                {incomingRequests.length > 0 && (
                  <span className="w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center ml-1">
                    {incomingRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('find')}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'find' 
                    ? 'bg-[#006e5d] text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Find
              </button>
            </div>

            {/* TAB 1: Direct Chats List */}
            {activeTab === 'chats' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {loadingFriends ? (
                  <div className="text-center py-10 text-xs text-slate-400 font-medium">Loading friends list...</div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-white mb-1">No Study Friends Yet</h4>
                    <p className="text-[11px] text-slate-500 mb-4 font-medium">
                      Send friend requests to fellow aspirants to unlock 1-on-1 study chat!
                    </p>
                    <button 
                      onClick={() => setActiveTab('find')}
                      className="bg-[#006e5d] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
                    >
                      Find Aspirants
                    </button>
                  </div>
                ) : (
                  friends.map((friend) => {
                    const isSelected = selectedFriend?.uid === friend.uid;
                    const uProf = getUserProfile(friend.uid, friend);

                    return (
                      <button
                        key={friend.uid}
                        onClick={() => {
                          setSelectedFriend(friend);
                          setIsFriend(true);
                          setSearchParams({ userId: friend.uid });
                        }}
                        className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all text-left ${
                          isSelected 
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                        }`}
                      >
                        {/* Avatar BEFORE name */}
                        <div className="relative shrink-0">
                          <img 
                            src={uProf.photoURL} 
                            alt={uProf.name} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                          {isUserOnline(friend.uid) ? (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-xs" title="Online now" />
                          ) : (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full border-2 border-white dark:border-slate-900" title="Offline" />
                          )}
                          {uProf.isPremium && (
                            <div className="absolute -top-0.5 -right-0.5">
                              <VerifiedBadge size="xs" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{uProf.name}</span>
                              {uProf.isPremium && <VerifiedBadge size="xs" />}
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium block truncate">
                            {uProf.handle}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: Friend Requests */}
            {activeTab === 'requests' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                
                {/* Incoming Requests */}
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
                    Incoming Friend Requests ({incomingRequests.length})
                  </h4>

                  {incomingRequests.length === 0 ? (
                    <div className="text-xs text-slate-400 font-medium p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center">
                      No pending incoming requests.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {incomingRequests.map((req) => {
                        const reqProf = getUserProfile(req.senderId, { name: req.senderName, photoURL: req.senderPhoto, isPremium: req.senderIsPremium });
                        return (
                          <div key={req.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {/* Avatar BEFORE name */}
                              <img 
                                src={reqProf.photoURL} 
                                alt={reqProf.name} 
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{reqProf.name}</span>
                                  {reqProf.isPremium && <VerifiedBadge size="xs" />}
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium block">{reqProf.handle}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button 
                                onClick={() => handleAcceptRequest(req)}
                                className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                                title="Accept"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                              </button>
                              <button 
                                onClick={() => handleDeclineRequest(req.id)}
                                className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 transition-colors"
                                title="Decline"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sent Pending Requests */}
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
                    Sent Pending Requests ({sentRequests.length})
                  </h4>

                  {sentRequests.length === 0 ? (
                    <div className="text-xs text-slate-400 font-medium p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center">
                      No sent requests pending.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sentRequests.map((req) => {
                        const sentProf = getUserProfile(req.receiverId, { name: req.receiverName, photoURL: req.receiverPhoto, isPremium: req.receiverIsPremium });
                        return (
                          <div key={req.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <img 
                                src={sentProf.photoURL} 
                                alt={sentProf.name} 
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{sentProf.name}</span>
                                  {sentProf.isPremium && <VerifiedBadge size="xs" />}
                                </div>
                                <span className="text-[10px] text-amber-500 font-bold block flex items-center gap-1">
                                  {sentProf.handle} • <Clock className="w-3 h-3" /> Waiting for response
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 3: Find & Add Aspirants */}
            {activeTab === 'find' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <form onSubmit={handleSearchAspirants} className="flex gap-2">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search students by name or handle..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:border-[#006e5d] text-slate-900 dark:text-white"
                  />
                  <button 
                    type="submit"
                    disabled={searching}
                    className="bg-[#006e5d] text-white p-2 rounded-xl text-xs font-bold hover:bg-[#005a4d] transition-colors"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </form>

                <div className="space-y-2 mt-2">
                  {searchResults.map((st) => {
                    const stProf = getUserProfile(st.uid, st);
                    const isAlreadyFriend = friends.some(f => f.uid === st.uid);

                    return (
                      <div key={st.uid} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                        <Link to={`/student/${st.uid}`} className="flex items-center gap-2 min-w-0 group">
                          {/* Avatar BEFORE name */}
                          <div className="relative shrink-0">
                            <img 
                              src={stProf.photoURL} 
                              alt={stProf.name} 
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                            {isUserOnline(st.uid) ? (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" title="Online now" />
                            ) : (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-300 dark:bg-slate-600 rounded-full border-2 border-white dark:border-slate-800" title="Offline" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-black text-xs text-slate-900 dark:text-white group-hover:text-[#006e5d] transition-colors truncate">
                                {stProf.name}
                              </span>
                              {stProf.isPremium && <VerifiedBadge size="xs" />}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              {stProf.handle}
                            </span>
                          </div>
                        </Link>

                        <div>
                          {isAlreadyFriend ? (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-md border border-emerald-200">
                              Friends ✓
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleSendFriendRequest(st)}
                              className="px-3 py-1.5 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-xl text-[11px] font-bold shadow-xs flex items-center gap-1"
                            >
                              <UserPlus className="w-3 h-3" /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {searchResults.length === 0 && searchQuery && !searching && (
                    <div className="text-center py-6 text-xs text-slate-400 font-medium">
                      No students found matching "{searchQuery}".
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right Chat Panel Window */}
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            
            {selectedFriend && activeProf ? (
              <>
                {/* Chat Header Bar */}
                    <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-wrap items-center justify-between gap-2 min-w-0">
                      
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Selected Friend Avatar BEFORE name */}
                        <Link to={`/student/${selectedFriend.uid}`} className="relative shrink-0">
                          <img 
                            src={activeProf.photoURL} 
                            alt={activeProf.name} 
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-[#006e5d]/30"
                          />
                          {isUserOnline(selectedFriend.uid) ? (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-xs" title="Online now" />
                          ) : (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full border-2 border-white dark:border-slate-900" title="Offline" />
                          )}
                          {activeProf.isPremium && (
                            <div className="absolute -top-0.5 -right-0.5">
                              <VerifiedBadge size="xs" />
                            </div>
                          )}
                        </Link>

                        <div className="min-w-0 flex-1">
                          {/* Name followed immediately by Verification Badge */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link to={`/student/${selectedFriend.uid}`} className="font-black text-xs sm:text-sm text-slate-900 dark:text-white hover:text-[#006e5d] transition-colors truncate">
                              {activeProf.name}
                            </Link>
                            {activeProf.isPremium && (
                              <VerifiedBadge size="sm" title="Pass Pro Verified Aspirant" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] sm:text-[11px] font-medium flex-wrap">
                            <span>{activeProf.handle}</span>
                            <span>•</span>
                            {isUserOnline(selectedFriend.uid) ? (
                              <span className="text-emerald-500 font-extrabold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
                              </span>
                            ) : (
                              <span className="text-slate-400 font-semibold">Offline</span>
                            )}
                          </div>
                        </div>
                      </div>

                  <Link 
                    to={`/student/${selectedFriend.uid}`}
                    className="shrink-0 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                  >
                    View Social Profile
                  </Link>

                </div>

                {/* Chat Feed Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 dark:bg-slate-950/20">
                  
                  {/* Strict Friends-Only Guard Banner */}
                  {!isFriend ? (
                    <div className="my-auto py-12 px-6 text-center max-w-md mx-auto">
                      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">
                        Friends Only Chat Guard
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-6 leading-relaxed">
                        To maintain a safe and focused study environment, students can only chat with confirmed friends. Send a friend request to start chatting with {selectedFriend.name}!
                      </p>
                      <button
                        onClick={() => handleSendFriendRequest(selectedFriend)}
                        className="bg-[#006e5d] hover:bg-[#005a4d] text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2 mx-auto"
                      >
                        <UserPlus className="w-4 h-4" /> Send Friend Request
                      </button>
                    </div>
                  ) : (
                    <>
                      {messages.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 font-medium text-xs">
                          <MessageCircle className="w-10 h-10 text-emerald-600/40 mx-auto mb-2" />
                          <span>No messages yet. Say hello to your study friend! 👋</span>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isAdminWarning = msg.senderId === 'admin_warning' || msg.isAdminWarning || msg.text?.includes('OFFICIAL ADMIN WARNING');
                          if (isAdminWarning) {
                            return (
                              <div key={msg.id} className="my-3 p-3.5 bg-amber-500/10 border-2 border-amber-500/40 dark:bg-amber-950/40 dark:border-amber-700/50 rounded-2xl text-amber-900 dark:text-amber-200 text-xs font-semibold shadow-xs">
                                <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[11px] text-amber-700 dark:text-amber-400 mb-1">
                                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                  Official Admin Moderation Notice
                                </div>
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                <div className="text-[9px] mt-1 text-right font-bold text-amber-600 dark:text-amber-400 opacity-80">
                                  {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            );
                          }

                          const isMine = msg.senderId === currentUser.uid;
                          return (
                            <div 
                              key={msg.id}
                              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs font-medium shadow-xs ${
                                isMine 
                                  ? 'bg-[#006e5d] text-white rounded-br-xs' 
                                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-xs'
                              }`}>
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <span className={`text-[9px] font-bold ${isMine ? 'text-emerald-200' : 'text-slate-400'}`}>
                                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {isMine && (
                                    <span className="inline-flex items-center shrink-0">
                                      {msg.read ? (
                                        <CheckCheck className="w-3.5 h-3.5 text-sky-200 stroke-[3]" title="Read" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5 text-emerald-200/60 stroke-[2.5]" title="Sent" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}

                </div>

                {/* Input Footer Bar */}
                {isFriend && (
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
                    <input 
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Type a message to ${selectedFriend.name}...`}
                      className="flex-1 px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#006e5d]"
                    />
                    <button 
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      className="bg-[#006e5d] hover:bg-[#005a4d] text-white p-2.5 rounded-2xl text-xs font-bold shadow-md transition-all disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}

              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <MessageCircle className="w-14 h-14 text-emerald-600/30 mb-3" />
                <h3 className="text-base font-black text-slate-800 dark:text-white mb-1">
                  Select a Friend to Start Chatting
                </h3>
                <p className="text-xs text-slate-500 font-medium max-w-xs mb-4">
                  Choose a study friend from the left sidebar or find new aspirants to connect with.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </Layout>
  );
}
