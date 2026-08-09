import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  collection, query, orderBy, onSnapshot, addDoc, doc, getDoc, setDoc, updateDoc, where, deleteDoc, limit, arrayUnion
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { 
  MessageSquare, Users, Clock, Shield, Lock, Send, Loader2, Megaphone, User, MessageCircle,
  UserPlus, UserCheck, UserX, Search, X, ChevronLeft, Sparkles, Share2, Bell, CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface BroadcastingChannel {
  id: string;
  name: string;
  icon: string; // 'team', 'megaphone', 'support'
  isVerified: boolean;
  createdAt: any;
}

interface ChannelMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderIcon: string;
  content: string;
  createdAt: any;
  readBy?: string[];
}

interface DmChat {
  id: string;
  users: string[];
  user1: {
    uid: string;
    name: string;
    photoURL: string;
    isPremium?: boolean;
  };
  user2: {
    uid: string;
    name: string;
    photoURL: string;
    isPremium?: boolean;
  };
  lastMessage: string;
  lastMessageAt: string;
}

interface DmMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export default function Chat() {
  const { user: currentUser, profile: currentProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Responsive mobile navigation ('list' displays sidebar, 'chat' displays active stream)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Unified Conversations State
  const [channels, setChannels] = useState<BroadcastingChannel[]>([]);
  const [dms, setDms] = useState<DmChat[]>([]);
  
  // Selected conversation (mutual-exclusion)
  const [selectedChannel, setSelectedChannel] = useState<BroadcastingChannel | null>(null);
  const [selectedDm, setSelectedDm] = useState<DmChat | null>(null);

  // Messages Streams
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [dmMessages, setDmMessages] = useState<DmMessage[]>([]);

  // Loading States
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingDms, setLoadingDms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingDmMessages, setLoadingDmMessages] = useState(false);

  // Friendship & Request Tracking State
  const [friends, setFriends] = useState<any[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [sentRequests, setSentRequests] = useState<Map<string, string>>(new Map()); // targetUserId -> requestId
  const [receivedRequests, setReceivedRequests] = useState<Map<string, { requestId: string, data: any }>>(new Map()); // senderUserId -> { requestId, data }
  const [incomingRequestsList, setIncomingRequestsList] = useState<any[]>([]);
  const [outgoingRequestsList, setOutgoingRequestsList] = useState<any[]>([]);

  // Search/Directory State
  const [searchQuery, setSearchQuery] = useState('');
  const [directorySearchQuery, setDirectorySearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Modals Overlay State
  const [showFindModal, setShowFindModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  // Common UI State
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of message list
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, dmMessages, selectedChannel, selectedDm]);

  // Handle URL parameters for direct navigation
  useEffect(() => {
    const channelIdParam = searchParams.get('channelId');
    const userIdParam = searchParams.get('userId');

    if (userIdParam) {
      startOrGetDm(userIdParam);
      setMobileView('chat');
    } else if (channelIdParam && channels.length > 0) {
      const chan = channels.find(c => c.id === channelIdParam);
      if (chan) {
        setSelectedChannel(chan);
        setSelectedDm(null);
        setMobileView('chat');
      }
    }
  }, [searchParams, currentUser, channels]);

  // Listen to broadcasting channels
  useEffect(() => {
    const q = query(collection(db, 'broadcasting_channels'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BroadcastingChannel[];
      setChannels(data);
      setLoadingChannels(false);

      // Auto-select first channel on load if no conversation is selected yet and there are no URL parameters
      const channelIdParam = searchParams.get('channelId');
      const userIdParam = searchParams.get('userId');
      if (data.length > 0 && !selectedChannel && !selectedDm && !channelIdParam && !userIdParam) {
        setSelectedChannel(data[0]);
      }
    }, (err) => {
      console.error("Error loading channels:", err);
      setLoadingChannels(false);
    });

    return () => unsub();
  }, [searchParams]);

  // Listen to messages of selected channel
  useEffect(() => {
    if (!selectedChannel) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const q = query(
      collection(db, 'broadcasting_channels', selectedChannel.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChannelMessage[];
      setMessages(data);
      setLoadingMessages(false);
    }, (err) => {
      console.error("Error loading messages:", err);
      setLoadingMessages(false);
    });

    return () => unsub();
  }, [selectedChannel]);

  // Mark broadcast messages as read when a student views them
  useEffect(() => {
    if (!currentUser || !selectedChannel || messages.length === 0) return;

    // Only students/non-admins mark as read
    const isStudent = currentProfile?.role !== 'admin';
    if (!isStudent) return;

    // Only mark messages in 'Team Prepnext' broadcast channel as read (or any channel with Prepnext in its name)
    const isPrepnextChannel = selectedChannel.name.toLowerCase().includes('prepnext');
    if (!isPrepnextChannel) return;

    messages.forEach(async (msg) => {
      const readByList = msg.readBy || [];
      if (!readByList.includes(currentUser.uid)) {
        try {
          const msgRef = doc(db, 'broadcasting_channels', selectedChannel.id, 'messages', msg.id);
          await updateDoc(msgRef, {
            readBy: arrayUnion(currentUser.uid)
          });
        } catch (error) {
          console.error("Failed to mark broadcast message as read:", error);
        }
      }
    });
  }, [currentUser, selectedChannel, messages, currentProfile]);

  // Listen to user's DMs list
  useEffect(() => {
    if (!currentUser) return;

    setLoadingDms(true);
    const q = query(
      collection(db, 'chats'),
      where('users', 'array-contains', currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DmChat[];
      list.sort((a, b) => {
        const t1 = new Date(a.lastMessageAt || 0).getTime();
        const t2 = new Date(b.lastMessageAt || 0).getTime();
        return t2 - t1;
      });
      setDms(list);
      setLoadingDms(false);
    }, (err) => {
      console.error("Error loading DMs:", err);
      setLoadingDms(false);
    });

    return () => unsub();
  }, [currentUser]);

  // Listen to messages of selected DM chat
  useEffect(() => {
    if (!selectedDm) {
      setDmMessages([]);
      return;
    }

    setLoadingDmMessages(true);
    const q = query(
      collection(db, 'chats', selectedDm.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DmMessage[];
      setDmMessages(data);
      setLoadingDmMessages(false);
    }, (err) => {
      console.error("Error loading DM messages:", err);
      setLoadingDmMessages(false);
    });

    return () => unsub();
  }, [selectedDm]);

  // Fetch connections list for horizontal quick chat avatars
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(docSnap => {
        const data = docSnap.data();
        const otherUser = data.user1?.uid === currentUser.uid ? data.user2 : data.user1;
        return {
          id: docSnap.id,
          friendId: otherUser?.uid || '',
          name: otherUser?.name || 'Aspirant',
          photoURL: otherUser?.photoURL || '',
          isPremium: Boolean(otherUser?.isPremium)
        };
      }).filter(f => f.friendId !== '');
      setFriends(list);
    }, (err) => {
      console.warn("Connections loading failed or skipped:", err);
    });

    return () => unsub();
  }, [currentUser]);

  // Listen to friendships IDs set
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', currentUser.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const ids = new Set<string>();
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const otherId = data.users?.find((u: string) => u !== currentUser.uid);
        if (otherId) ids.add(otherId);
      });
      setFriendIds(ids);
    }, (err) => {
      console.warn("Friendships IDs query failed:", err);
    });
    return () => unsub();
  }, [currentUser]);

  // Listen to outgoing sent friend requests
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'friend_requests'),
      where('senderId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(q, (snap) => {
      const sent = new Map<string, string>();
      const list = snap.docs.map(docSnap => {
        const data = docSnap.data();
        sent.set(data.receiverId, docSnap.id);
        return { id: docSnap.id, ...data };
      });
      setSentRequests(sent);
      setOutgoingRequestsList(list);
    }, (err) => {
      console.warn("Sent requests tracking error:", err);
    });
    return () => unsub();
  }, [currentUser]);

  // Listen to incoming received friend requests
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'friend_requests'),
      where('receiverId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(q, (snap) => {
      const rec = new Map<string, { requestId: string, data: any }>();
      const list = snap.docs.map(docSnap => {
        const data = docSnap.data();
        rec.set(data.senderId, { requestId: docSnap.id, data });
        return { id: docSnap.id, ...data };
      });
      setReceivedRequests(rec);
      setIncomingRequestsList(list);
    }, (err) => {
      console.warn("Incoming requests tracking error:", err);
    });
    return () => unsub();
  }, [currentUser]);

  // Listen to all users directory when modal is visible
  useEffect(() => {
    if (!showFindModal) return;

    setLoadingSearch(true);
    const q = query(collection(db, 'users'), orderBy('name', 'asc'), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllUsers(list);
      setLoadingSearch(false);
    }, (err) => {
      console.error("Error fetching directory users:", err);
      setLoadingSearch(false);
    });

    return () => unsub();
  }, [showFindModal]);

  // Filter Directory Users based on query input
  useEffect(() => {
    if (!directorySearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const qClean = directorySearchQuery.toLowerCase().trim();
    const filtered = allUsers.filter(u => 
      u.id !== currentUser?.uid && (
        (u.name || '').toLowerCase().includes(qClean) || 
        (u.username || '').toLowerCase().includes(qClean) ||
        (u.email || '').toLowerCase().includes(qClean) ||
        (u.bio || '').toLowerCase().includes(qClean)
      )
    );
    setSearchResults(filtered);
  }, [directorySearchQuery, allUsers, currentUser]);

  // Start or fetch active DM conversation
  const startOrGetDm = async (targetId: string) => {
    if (!currentUser) return;
    setLoadingDms(true);
    try {
      const chatId = [currentUser.uid, targetId].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        setSelectedDm({ id: chatSnap.id, ...chatSnap.data() } as DmChat);
        setSelectedChannel(null);
      } else {
        const userRef = doc(db, 'users', targetId);
        const userSnap = await getDoc(userRef);
        const targetUserData = userSnap.exists() ? userSnap.data() : {};
        
        const myRef = doc(db, 'users', currentUser.uid);
        const mySnap = await getDoc(myRef);
        const myUserData = mySnap.exists() ? mySnap.data() : {};

        const newChatData = {
          users: [currentUser.uid, targetId],
          user1: {
            uid: currentUser.uid,
            name: myUserData.name || currentUser.displayName || 'Aspirant',
            photoURL: myUserData.profilePicture || currentUser.photoURL || '',
            isPremium: Boolean(myUserData.isPremium)
          },
          user2: {
            uid: targetId,
            name: targetUserData.name || 'Aspirant',
            photoURL: targetUserData.profilePicture || targetUserData.photoURL || '',
            isPremium: Boolean(targetUserData.isPremium)
          },
          createdAt: new Date().toISOString(),
          lastMessage: 'Conversation started',
          lastMessageAt: new Date().toISOString()
        };

        await setDoc(chatRef, newChatData);
        setSelectedDm({ id: chatId, ...newChatData } as DmChat);
        setSelectedChannel(null);
      }
    } catch (err) {
      console.error("Error starting DM:", err);
      toast.error("Failed to load conversation");
    } finally {
      setLoadingDms(false);
    }
  };

  // Dispatch message sender
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    try {
      if (selectedChannel) {
        const isAdmin = currentProfile?.role === 'admin';
        if (!isAdmin) {
          toast.error('Only administrators are authorized to send broadcasts.');
          setNewMessage(content);
          setSendingMessage(false);
          return;
        }

        await addDoc(collection(db, 'broadcasting_channels', selectedChannel.id, 'messages'), {
          senderId: currentUser.uid,
          senderName: selectedChannel.name,
          senderIcon: selectedChannel.icon,
          content: content,
          createdAt: new Date().toISOString()
        });

      } else if (selectedDm) {
        const myName = currentProfile?.name || currentUser.displayName || 'Aspirant';

        await addDoc(collection(db, 'chats', selectedDm.id, 'messages'), {
          senderId: currentUser.uid,
          senderName: myName,
          content: content,
          createdAt: new Date().toISOString()
        });

        await updateDoc(doc(db, 'chats', selectedDm.id), {
          lastMessage: content,
          lastMessageAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error('Failed to send message.');
      setNewMessage(content);
    } finally {
      setSendingMessage(false);
    }
  };

  // Connection Request Handling Actions
  const handleAcceptRequest = async (requestId: string, senderId: string, senderName: string, senderPhoto: string, senderIsPremium: boolean) => {
    if (!currentUser) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'friend_requests', requestId), {
        status: 'accepted'
      });

      const friendshipDocId = [currentUser.uid, senderId].sort().join('_');
      const myName = currentProfile?.fullName || currentProfile?.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'Aspirant';
      
      await setDoc(doc(db, 'friendships', friendshipDocId), {
        users: [currentUser.uid, senderId],
        createdAt: Date.now(),
        user1: {
          uid: currentUser.uid,
          name: myName,
          photoURL: currentProfile?.photoURL || currentUser.photoURL || '',
          isPremium: Boolean(currentProfile?.isPremium)
        },
        user2: {
          uid: senderId,
          name: senderName,
          photoURL: senderPhoto,
          isPremium: Boolean(senderIsPremium)
        }
      });

      toast.success(`Connected with ${senderName}!`);
      // Automatically refresh active friend list on connection accepted
      startOrGetDm(senderId);
    } catch (err) {
      console.error("Error accepting request:", err);
      toast.error('Failed to accept request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'friend_requests', requestId));
      toast.success('Connection request declined.');
    } catch (err) {
      console.error("Error declining request:", err);
      toast.error('Failed to decline request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'friend_requests', requestId));
      toast.success('Connection request cancelled.');
    } catch (err) {
      console.error("Error cancelling request:", err);
      toast.error('Failed to cancel request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendRequest = async (targetUser: any) => {
    if (!currentUser) {
      toast.error('Please log in first!');
      return;
    }
    setActionLoading(true);
    try {
      const myName = currentProfile?.fullName || currentProfile?.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'Aspirant';
      const myPhoto = currentProfile?.photoURL || currentUser.photoURL || '';

      await addDoc(collection(db, 'friend_requests'), {
        senderId: currentUser.uid,
        senderName: myName,
        senderPhoto: myPhoto,
        senderIsPremium: Boolean(currentProfile?.isPremium || currentProfile?.role === 'admin'),
        receiverId: targetUser.id || targetUser.uid,
        receiverName: targetUser.name || 'Aspirant',
        receiverPhoto: targetUser.profilePicture || targetUser.photoURL || '',
        receiverIsPremium: Boolean(targetUser.isPremium || targetUser.role === 'admin'),
        status: 'pending',
        createdAt: Date.now()
      });

      toast.success(`Connection request sent to ${targetUser.name}!`);
    } catch (err) {
      console.error("Error sending request:", err);
      toast.error('Failed to send request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartMessageFromDirectory = (userId: string) => {
    startOrGetDm(userId);
    setMobileView('chat');
    setShowFindModal(false);
  };

  const isAdmin = currentProfile?.role === 'admin';

  // Client-side filtering for search input in sidebar
  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDms = dms.filter(chat => {
    const otherUser = chat.user1.uid === currentUser?.uid ? chat.user2 : chat.user1;
    return otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (chat.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-140px)] flex flex-col">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-1 h-full">
          
          {/* Sidebar Panel - Unified Channels & Chats List */}
          <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col shrink-0 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Sidebar Header with global connections actions */}
            <header className="p-4 border-b border-slate-50 shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#006e5d]" /> Inbox
                </h1>
                
                {/* Global Connection Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowFindModal(true)}
                    className="p-1.5 hover:bg-slate-50 text-slate-600 hover:text-[#006e5d] rounded-xl transition-all relative group"
                    title="Find Friends"
                  >
                    <Search className="w-4 h-4" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[9px] font-black uppercase text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Find People
                    </span>
                  </button>

                  <button
                    onClick={() => setShowRequestsModal(true)}
                    className="p-1.5 hover:bg-slate-50 text-slate-600 hover:text-[#006e5d] rounded-xl transition-all relative group"
                    title="Friend Requests"
                  >
                    <UserCheck className="w-4 h-4" />
                    {incomingRequestsList.length > 0 && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[9px] font-black uppercase text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Requests ({incomingRequestsList.length})
                    </span>
                  </button>
                </div>
              </div>

              {/* Sidebar Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search chats & channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-transparent rounded-xl focus:outline-none focus:ring-1 focus:ring-[#006e5d] text-xs font-semibold text-slate-700"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </header>

            {/* Sidebar Scrollable Body - Unified Conversations List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              
              {/* Quick Connections Carousel */}
              {friends.length > 0 && (
                <div className="border-b border-slate-50 pb-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                    My Connections
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-none">
                    {friends.map((friend) => (
                      <button
                        key={friend.friendId}
                        onClick={() => startOrGetDm(friend.friendId)}
                        className="flex flex-col items-center shrink-0 w-12 text-center group"
                      >
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-slate-100 group-hover:border-[#006e5d] transition-all bg-slate-50 flex items-center justify-center">
                          {friend.photoURL ? (
                            <img src={friend.photoURL} alt={friend.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          {friend.isPremium && (
                            <span className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-400 rounded-full border border-white" />
                          )}
                        </div>
                        <span className="text-[8px] font-black text-slate-600 truncate w-full mt-1 group-hover:text-slate-900 leading-none">
                          {friend.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* BROADCAST CHANNELS SECTION */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Broadcast Channels
                </p>
                {loadingChannels ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
                  </div>
                ) : filteredChannels.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic px-1">No channels found</p>
                ) : (
                  filteredChannels.map((chan) => {
                    const isSelected = selectedChannel?.id === chan.id;
                    return (
                      <button
                        key={chan.id}
                        onClick={() => {
                          setSelectedChannel(chan);
                          setSelectedDm(null);
                          setMobileView('chat');
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                          isSelected 
                            ? 'bg-teal-50/40 border-[#006e5d]/30 text-[#006e5d]' 
                            : 'bg-slate-50/20 border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#006e5d] text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {chan.icon === 'team' ? <Users className="w-4 h-4" /> :
                           chan.icon === 'megaphone' ? <Megaphone className="w-4 h-4" /> :
                           chan.icon === 'support' ? <Shield className="w-4 h-4" /> :
                           <MessageSquare className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-bold truncate block ${isSelected ? 'text-[#001f19]' : 'text-slate-800'}`}>
                              {chan.name}
                            </span>
                            {chan.isVerified && (
                              <VerifiedBadge size="xs" variant="yellow" title="Verified Channel" className="ml-0.5 shrink-0" />
                            )}
                          </div>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                            Official Update
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* DIRECT CHATS SECTION */}
              <div className="space-y-1.5 pt-2 border-t border-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Direct Messages
                </p>
                {loadingDms ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
                  </div>
                ) : filteredDms.length === 0 ? (
                  <div className="text-center py-6 px-2 opacity-70">
                    <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-slate-500">No active conversations</p>
                    <button 
                      onClick={() => setShowFindModal(true)}
                      className="text-[9px] font-black uppercase text-[#006e5d] mt-1 hover:underline block mx-auto"
                    >
                      Connect with people
                    </button>
                  </div>
                ) : (
                  filteredDms.map((chat) => {
                    const otherUser = chat.user1.uid === currentUser?.uid ? chat.user2 : chat.user1;
                    const isSelected = selectedDm?.id === chat.id;

                    return (
                      <button
                        key={chat.id}
                        onClick={() => {
                          setSelectedDm(chat);
                          setSelectedChannel(null);
                          setMobileView('chat');
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                          isSelected 
                            ? 'bg-teal-50/40 border-[#006e5d]/30 text-[#006e5d]' 
                            : 'bg-slate-50/20 border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                          {otherUser.photoURL ? (
                            <img src={otherUser.photoURL} alt={otherUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-4 h-4 text-slate-400" />
                          )}
                          {otherUser.isPremium && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-white" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#001f19]' : 'text-slate-800'}`}>
                              {otherUser.name}
                            </span>
                            {chat.lastMessageAt && (
                              <span className="text-[8px] text-slate-400 font-semibold shrink-0">
                                {new Date(chat.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 truncate font-semibold mt-0.5">
                            {chat.lastMessage || 'Conversation started'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

            </div>
          </div>

          {/* Active Chat Stream Area */}
          <div className={`flex-1 flex-col bg-slate-50/15 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
            {selectedChannel ? (
              // CHANNEL STREAM RENDERER
              <div className="flex flex-col h-full overflow-hidden bg-white">
                {/* Header */}
                <header className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button 
                      onClick={() => setMobileView('list')} 
                      className="md:hidden p-2 -ml-2 mr-1 text-slate-500 hover:text-slate-800"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    <div className="w-10 h-10 bg-[#006e5d]/10 text-[#006e5d] rounded-xl flex items-center justify-center shrink-0">
                      {selectedChannel.icon === 'team' ? <Users className="w-5 h-5" /> :
                       selectedChannel.icon === 'megaphone' ? <Megaphone className="w-5 h-5" /> :
                       selectedChannel.icon === 'support' ? <Shield className="w-5 h-5" /> :
                       <MessageSquare className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-base font-black text-slate-900 leading-none truncate">{selectedChannel.name}</h2>
                        {selectedChannel.isVerified && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-yellow-400/10 text-yellow-600 border border-yellow-400/25 shrink-0">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 truncate">
                        Official updates published by Verified Admins
                      </p>
                    </div>
                  </div>
                </header>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {loadingMessages ? (
                    <div className="h-full flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 text-slate-200 animate-spin mb-2" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Streaming Broadcasts...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                      <Megaphone className="w-10 h-10 text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-800">Beginning of Broadcast Feed</p>
                      <p className="text-xs text-slate-400 max-w-xs mt-1">
                        Official announcements from PrepNext Admins appear in real-time.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div key={msg.id || index} className="flex gap-4 items-start bg-white p-5 rounded-3xl border border-slate-100 shadow-xs max-w-2xl">
                        <div className="w-10 h-10 rounded-xl bg-[#006e5d]/10 text-[#006e5d] flex items-center justify-center shrink-0">
                          {selectedChannel.icon === 'team' ? <Users className="w-5 h-5" /> :
                           selectedChannel.icon === 'megaphone' ? <Megaphone className="w-5 h-5" /> :
                           selectedChannel.icon === 'support' ? <Shield className="w-5 h-5" /> :
                           <MessageSquare className="w-5 h-5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-900">{msg.senderName}</span>
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 tracking-wider uppercase border border-yellow-500/20">
                                Team Admin
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedChannel.name.toLowerCase().includes('prepnext') && msg.readBy && msg.readBy.length > 0 && (
                                <div className="flex items-center gap-0.5 text-blue-500 font-black" title={`Viewed by ${msg.readBy.length} student${msg.readBy.length > 1 ? 's' : ''}`}>
                                  <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                                  <span className="text-[9px]">{msg.readBy.length}</span>
                                </div>
                              )}
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap pr-8">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Dispatcher Actions */}
                <div className="border-t border-slate-100 p-4 bg-white shrink-0">
                  {isAdmin ? (
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                      <input
                        type="text"
                        required
                        placeholder={`Broadcast update as ${selectedChannel.name}...`}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#006e5d]/15 text-sm font-medium text-slate-800"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="px-6 py-3 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-teal-50"
                      >
                        {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Broadcast
                      </button>
                    </form>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-center gap-2 text-slate-400 select-none">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-center">
                        Only verified administrators can publish broadcasts to this stream
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : selectedDm ? (
              // DIRECT DM STREAM RENDERER
              <div className="flex flex-col h-full overflow-hidden bg-white">
                {/* Header */}
                <header className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button 
                      onClick={() => setMobileView('list')} 
                      className="md:hidden p-2 -ml-2 mr-1 text-slate-500 hover:text-slate-800"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    {(() => {
                      const otherUser = selectedDm.user1.uid === currentUser?.uid ? selectedDm.user2 : selectedDm.user1;
                      return (
                        <button 
                          onClick={() => navigate(`/student/${otherUser.uid}`)}
                          className="flex items-center gap-3 text-left hover:opacity-80 transition-all min-w-0 group"
                          title="View Profile"
                        >
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 group-hover:scale-105 transition-transform">
                            {otherUser.photoURL ? (
                              <img src={otherUser.photoURL} alt={otherUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="w-5 h-5 text-slate-400" />
                            )}
                            {otherUser.isPremium && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-400 rounded-full border border-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h2 className="text-base font-black text-slate-900 group-hover:text-[#006e5d] transition-colors leading-none truncate">{otherUser.name}</h2>
                              {otherUser.isPremium && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-yellow-400/10 text-yellow-600 border border-yellow-400/25 shrink-0">
                                  Premium
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 truncate">
                              Private 1-on-1 Direct Chat • View Profile
                            </p>
                          </div>
                        </button>
                      );
                    })()}
                  </div>
                </header>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/10">
                  {loadingDmMessages ? (
                    <div className="h-full flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 text-slate-200 animate-spin mb-2" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Streaming conversation...</p>
                    </div>
                  ) : dmMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                      <MessageCircle className="w-10 h-10 text-slate-300 mb-2 animate-bounce" />
                      <p className="text-sm font-bold text-slate-800">Say Hello!</p>
                      <p className="text-xs text-slate-400 max-w-xs mt-1">
                        This is the very beginning of your direct message history.
                      </p>
                    </div>
                  ) : (
                    dmMessages.map((msg, index) => {
                      const isMe = msg.senderId === currentUser?.uid;
                      return (
                        <div 
                          key={msg.id || index} 
                          className={`flex gap-3 max-w-xl ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                        >
                          <div className={`p-4 rounded-3xl border text-xs font-medium leading-relaxed shadow-xs ${
                            isMe 
                              ? 'bg-[#006e5d] text-white border-transparent rounded-tr-none' 
                              : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <div className={`text-[8px] mt-1.5 flex items-center justify-end gap-1 ${
                              isMe ? 'text-teal-200/80' : 'text-slate-400'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Dispatcher Actions */}
                <div className="border-t border-slate-100 p-4 bg-white shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#006e5d]/15 text-sm font-medium text-slate-800"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      className="px-6 py-3 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-teal-50"
                    >
                      {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              // Default Selection Illustration
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white">
                <Megaphone className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
                <h3 className="text-base font-black text-slate-700">Select Conversation Pipeline</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Choose an official broadcast channel or click a direct conversation connection on the left sidebar to start messaging.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* MODAL: FIND PEOPLE DIRECTORY */}
      <AnimatePresence>
        {showFindModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col"
            >
              <header className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#006e5d]/10 flex items-center justify-center text-[#006e5d]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Aspirant Directory</h3>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Search & Connect</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowFindModal(false);
                    setDirectorySearchQuery('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="p-4 bg-slate-50 border-b border-slate-100 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search aspirants by name, bio or email..."
                    value={directorySearchQuery}
                    onChange={(e) => setDirectorySearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#006e5d] text-xs font-semibold text-slate-700"
                  />
                  {directorySearchQuery && (
                    <button
                      onClick={() => setDirectorySearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[250px]">
                {loadingSearch ? (
                  <div className="h-full flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-slate-200 animate-spin mb-2" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Loading Aspirants...</p>
                  </div>
                ) : directorySearchQuery.trim() === '' ? (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                      Aspirant Pool
                    </p>
                    {allUsers.filter(u => u.id !== currentUser?.uid).slice(0, 20).map((u) => {
                      const isFriend = friendIds.has(u.id);
                      const isSentPending = sentRequests.has(u.id);
                      const isReceivedPending = receivedRequests.has(u.id);

                      return (
                        <div key={u.id} className="p-3 bg-slate-50/55 border border-slate-100 rounded-2xl flex items-center justify-between gap-3 hover:bg-slate-50 transition-all">
                          <button 
                            onClick={() => navigate(`/student/${u.id}`)}
                            className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-80 transition-all group"
                            title="View Profile"
                          >
                            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-200 group-hover:scale-105 transition-transform">
                              {u.profilePicture || u.photoURL ? (
                                <img src={u.profilePicture || u.photoURL} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User className="w-5 h-5 text-slate-400 m-auto mt-2" />
                              )}
                              {u.isPremium && (
                                <span className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-400 rounded-full border border-white" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-black text-slate-800 group-hover:text-[#006e5d] transition-colors truncate block">
                                {u.name || 'Aspirant'}
                              </span>
                              <p className="text-[9px] text-slate-400 truncate font-semibold">
                                {u.bio || 'Dedicated PrepNext aspirant 🚀 • Click to view profile'}
                              </p>
                            </div>
                          </button>

                          <div className="shrink-0">
                            {isFriend ? (
                              <button
                                onClick={() => handleStartMessageFromDirectory(u.id)}
                                className="p-2 bg-[#006e5d]/10 text-[#006e5d] hover:bg-[#006e5d] hover:text-white rounded-xl transition-all"
                                title="Message"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            ) : isSentPending ? (
                              <span className="text-[9px] font-black uppercase text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200">
                                Sent
                              </span>
                            ) : isReceivedPending ? (
                              <button
                                onClick={() => {
                                  const reqInfo = receivedRequests.get(u.id);
                                  if (reqInfo) handleAcceptRequest(reqInfo.requestId, u.id, u.name, u.profilePicture || u.photoURL, u.isPremium);
                                }}
                                className="p-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition-all"
                                title="Accept Connection"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSendRequest(u)}
                                className="p-2 bg-slate-100 text-slate-700 hover:bg-[#006e5d] hover:text-white rounded-xl transition-all"
                                title="Connect"
                              >
                                <UserPlus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-12 px-4 opacity-70">
                    <UserX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">No matches found</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Double check spelling or search keywords</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                      Search Results ({searchResults.length})
                    </p>
                    {searchResults.map((u) => {
                      const isFriend = friendIds.has(u.id);
                      const isSentPending = sentRequests.has(u.id);
                      const isReceivedPending = receivedRequests.has(u.id);

                      return (
                        <div key={u.id} className="p-3 bg-slate-50/55 border border-slate-100 rounded-2xl flex items-center justify-between gap-3 hover:bg-slate-50 transition-all">
                          <button 
                            onClick={() => navigate(`/student/${u.id}`)}
                            className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-80 transition-all group"
                            title="View Profile"
                          >
                            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-200 group-hover:scale-105 transition-transform">
                              {u.profilePicture || u.photoURL ? (
                                <img src={u.profilePicture || u.photoURL} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User className="w-5 h-5 text-slate-400 m-auto mt-2" />
                              )}
                              {u.isPremium && (
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-white" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-black text-slate-800 group-hover:text-[#006e5d] transition-colors truncate block">
                                {u.name || 'Aspirant'}
                              </span>
                              <p className="text-[9px] text-slate-400 truncate font-semibold">
                                {u.bio || 'Dedicated PrepNext aspirant 🚀 • Click to view profile'}
                              </p>
                            </div>
                          </button>

                          <div className="shrink-0">
                            {isFriend ? (
                              <button
                                onClick={() => handleStartMessageFromDirectory(u.id)}
                                className="p-2 bg-[#006e5d]/10 text-[#006e5d] hover:bg-[#006e5d] hover:text-white rounded-xl transition-all"
                                title="Message"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            ) : isSentPending ? (
                              <span className="text-[9px] font-black uppercase text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200">
                                Sent
                              </span>
                            ) : isReceivedPending ? (
                              <button
                                onClick={() => {
                                  const reqInfo = receivedRequests.get(u.id);
                                  if (reqInfo) handleAcceptRequest(reqInfo.requestId, u.id, u.name, u.profilePicture || u.photoURL, u.isPremium);
                                }}
                                className="p-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition-all"
                                title="Accept Connection"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSendRequest(u)}
                                className="p-2 bg-slate-100 text-slate-700 hover:bg-[#006e5d] hover:text-white rounded-xl transition-all"
                                title="Connect"
                              >
                                <UserPlus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: FRIEND REQUESTS MANAGEMENT */}
      <AnimatePresence>
        {showRequestsModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col"
            >
              <header className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#006e5d]/10 flex items-center justify-center text-[#006e5d]">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Connection Requests</h3>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Manage Invites</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRequestsModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                
                {/* Received Invites Section */}
                <div className="space-y-2.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Received ({incomingRequestsList.length})
                  </p>
                  {incomingRequestsList.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic px-1">No incoming connection requests.</p>
                  ) : (
                    incomingRequestsList.map((req) => (
                      <div key={req.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5">
                        <button 
                          onClick={() => navigate(`/student/${req.senderId}`)}
                          className="flex items-center gap-2.5 text-left hover:opacity-80 transition-all min-w-0 group"
                          title="View Profile"
                        >
                          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-200 group-hover:scale-105 transition-transform">
                            {req.senderPhoto ? (
                              <img src={req.senderPhoto} alt={req.senderName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="w-4 h-4 text-slate-400 m-auto mt-2" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-black text-slate-800 group-hover:text-[#006e5d] transition-colors truncate block">
                                {req.senderName}
                              </span>
                              {req.senderIsPremium && (
                                <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full inline-block shrink-0" />
                              )}
                            </div>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                              PrepNext Aspirant • View Profile
                            </p>
                          </div>
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(req.id, req.senderId, req.senderName, req.senderPhoto, req.senderIsPremium)}
                            disabled={actionLoading}
                            className="flex-1 py-1.5 bg-[#006e5d] text-white font-black text-[10px] uppercase tracking-wider rounded-lg hover:bg-[#005a4d] transition-all disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(req.id)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider rounded-lg hover:bg-slate-300 transition-all disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Sent Invites Section */}
                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Sent Pending ({outgoingRequestsList.length})
                  </p>
                  {outgoingRequestsList.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic px-1">No pending sent requests.</p>
                  ) : (
                    outgoingRequestsList.map((req) => (
                      <div key={req.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center justify-between gap-2.5">
                        <button 
                          onClick={() => navigate(`/student/${req.receiverId}`)}
                          className="flex items-center gap-2.5 min-w-0 flex-1 text-left hover:opacity-80 transition-all group"
                          title="View Profile"
                        >
                          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-200 group-hover:scale-105 transition-transform">
                            {req.receiverPhoto ? (
                              <img src={req.receiverPhoto} alt={req.receiverName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="w-4 h-4 text-slate-400 m-auto mt-2" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black text-slate-800 group-hover:text-[#006e5d] transition-colors truncate block">
                              {req.receiverName}
                            </span>
                            <span className="text-[8px] text-slate-400 flex items-center gap-0.5 font-bold uppercase tracking-wider">
                              <Clock className="w-2.5 h-2.5 text-yellow-500" /> Pending • View Profile
                            </span>
                          </div>
                        </button>

                        <button
                          onClick={() => handleCancelRequest(req.id)}
                          disabled={actionLoading}
                          className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-all"
                          title="Cancel Invitation"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </Layout>
  );
}
