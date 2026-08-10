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
  allowAspirantMessages?: boolean;
  whoCanPost?: 'admin_only' | 'everyone';
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
  createdAt?: string;
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

  // Sidebar Tab navigation ('chats', 'requests', 'find')
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'requests' | 'find'>('chats');

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

  // Unread broadcast message tracking per channel & latest message snippet
  const [channelUnreadCounts, setChannelUnreadCounts] = useState<Record<string, number>>({});
  const [channelLatestMessages, setChannelLatestMessages] = useState<Record<string, { content: string; createdAt: string; senderName?: string }>>({});

  // Real-time listener for unread messages count & latest message across channels
  useEffect(() => {
    if (!currentUser || channels.length === 0) return;

    const unsubs = channels.map(channel => {
      const q = query(collection(db, 'broadcasting_channels', channel.id, 'messages'));
      return onSnapshot(q, (snap) => {
        let unread = 0;
        let latestMsg: { content: string; createdAt: string; senderName?: string } | null = null;
        let latestTime = 0;

        snap.docs.forEach(docSnap => {
          const msgData = docSnap.data();
          const readByList = msgData.readBy || [];
          if (msgData.senderId !== currentUser.uid && !readByList.includes(currentUser.uid)) {
            unread++;
          }

          const msgTime = msgData.createdAt ? new Date(msgData.createdAt).getTime() : 0;
          if (msgTime >= latestTime) {
            latestTime = msgTime;
            latestMsg = {
              content: msgData.content || '',
              createdAt: msgData.createdAt || '',
              senderName: msgData.senderName || ''
            };
          }
        });

        setChannelUnreadCounts(prev => ({ ...prev, [channel.id]: unread }));
        if (latestMsg) {
          setChannelLatestMessages(prev => ({ ...prev, [channel.id]: latestMsg! }));
        }
      }, (err) => {
        console.warn(`Unread count tracking error for channel ${channel.id}:`, err);
      });
    });

    return () => unsubs.forEach(unsub => unsub());
  }, [currentUser, channels]);

  // Mark broadcast messages as read when a student views them
  useEffect(() => {
    if (!currentUser || !selectedChannel || messages.length === 0) return;

    messages.forEach(async (msg) => {
      const readByList = msg.readBy || [];
      if (msg.senderId !== currentUser.uid && !readByList.includes(currentUser.uid)) {
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
  }, [currentUser, selectedChannel, messages]);

  // Unread DM messages tracking per DM chat
  const [dmUnreadCounts, setDmUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!currentUser || dms.length === 0) return;

    const unsubs = dms.map(chat => {
      const q = query(collection(db, 'chats', chat.id, 'messages'));
      return onSnapshot(q, (snap) => {
        let unread = 0;
        snap.docs.forEach(docSnap => {
          const msgData = docSnap.data();
          const readByList = msgData.readBy || [];
          if (msgData.senderId !== currentUser.uid && !readByList.includes(currentUser.uid)) {
            unread++;
          }
        });
        setDmUnreadCounts(prev => ({ ...prev, [chat.id]: unread }));
      }, (err) => {
        console.warn(`Unread DM count tracking error for chat ${chat.id}:`, err);
      });
    });

    return () => unsubs.forEach(unsub => unsub());
  }, [currentUser, dms]);

  // Mark DM messages as read when a DM chat is selected/opened
  useEffect(() => {
    if (!currentUser || !selectedDm || dmMessages.length === 0) return;

    dmMessages.forEach(async (msg) => {
      const readByList = msg.readBy || [];
      if (msg.senderId !== currentUser.uid && !readByList.includes(currentUser.uid)) {
        try {
          const msgRef = doc(db, 'chats', selectedDm.id, 'messages', msg.id);
          await updateDoc(msgRef, {
            readBy: arrayUnion(currentUser.uid)
          });
        } catch (error) {
          console.error("Failed to mark DM message as read:", error);
        }
      }
    });
  }, [currentUser, selectedDm, dmMessages]);

  const totalBroadcastUnread = (Object.values(channelUnreadCounts) as number[]).reduce((a: number, b: number) => a + b, 0);
  const totalDmUnread = (Object.values(dmUnreadCounts) as number[]).reduce((a: number, b: number) => a + b, 0);

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

  // Listen to all users directory
  useEffect(() => {
    if (!currentUser) return;

    setLoadingSearch(true);
    const q = query(collection(db, 'users'), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllUsers(list);
      setLoadingSearch(false);
    }, (err) => {
      console.warn("Directory users load warning:", err);
      setLoadingSearch(false);
    });

    return () => unsub();
  }, [currentUser]);

  // Filter Directory Users based on query input (or show all aspirants if empty)
  useEffect(() => {
    const listWithoutSelf = allUsers.filter(u => u.id !== currentUser?.uid);
    if (!directorySearchQuery.trim()) {
      setSearchResults(listWithoutSelf);
      return;
    }
    const qClean = directorySearchQuery.toLowerCase().trim();
    const filtered = listWithoutSelf.filter(u => 
      (u.name || u.fullName || '').toLowerCase().includes(qClean) || 
      (u.username || '').toLowerCase().includes(qClean) ||
      (u.email || '').toLowerCase().includes(qClean) ||
      (u.bio || u.targetExam || '').toLowerCase().includes(qClean)
    );
    setSearchResults(filtered);
  }, [directorySearchQuery, allUsers, currentUser]);

  // User profiles cache for background resolution
  const [userProfilesCache, setUserProfilesCache] = useState<Record<string, any>>({});

  // Timestamp formatting helper
  const formatChatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Helper to extract the other party's resolved info in a 1-on-1 DM chat
  const getOtherUser = (c: DmChat) => {
    let otherUid = c.users?.find(u => u !== currentUser?.uid) || '';
    let chatUser: any = null;
    if (c.user1 && c.user2) {
      chatUser = c.user1.uid === currentUser?.uid ? c.user2 : c.user1;
    } else if (c.user1 && c.user1.uid !== currentUser?.uid) {
      chatUser = c.user1;
    } else if (c.user2 && c.user2.uid !== currentUser?.uid) {
      chatUser = c.user2;
    }
    if (!otherUid && chatUser?.uid) {
      otherUid = chatUser.uid;
    }

    const friendMatch = friends.find(f => f.friendId === otherUid);
    const userMatch = allUsers.find(u => u.id === otherUid || (u as any).uid === otherUid);
    const cachedProfile = userProfilesCache[otherUid];

    const cachedName = cachedProfile?.fullName || cachedProfile?.name || cachedProfile?.displayName;
    const resolvedDirectoryName = userMatch?.fullName || userMatch?.name || userMatch?.displayName;

    const name = (chatUser?.name && chatUser.name !== 'Aspirant') 
      ? chatUser.name 
      : (friendMatch?.name && friendMatch.name !== 'Aspirant') 
      ? friendMatch.name 
      : (resolvedDirectoryName && resolvedDirectoryName !== 'Aspirant')
      ? resolvedDirectoryName
      : (cachedName && cachedName !== 'Aspirant')
      ? cachedName
      : (chatUser?.name && chatUser.name !== 'Aspirant' ? chatUser.name : '')
      || 'Aspirant';

    const photoURL = chatUser?.photoURL 
      || friendMatch?.photoURL 
      || userMatch?.photoURL 
      || userMatch?.profilePicture 
      || cachedProfile?.photoURL 
      || cachedProfile?.profilePicture 
      || '';

    const isPremium = Boolean(chatUser?.isPremium || friendMatch?.isPremium || userMatch?.isPremium || cachedProfile?.isPremium);

    return { uid: otherUid, name, photoURL, isPremium };
  };

  // Automatically fetch profiles for DM participants whose name is Aspirant or unknown
  useEffect(() => {
    if (!currentUser || dms.length === 0) return;

    dms.forEach((chat) => {
      const otherUid = chat.users?.find(u => u !== currentUser.uid);
      if (!otherUid) return;

      const other = getOtherUser(chat);
      if ((other.name === 'Aspirant' || !other.photoURL) && !userProfilesCache[otherUid]) {
        getDoc(doc(db, 'users', otherUid)).then(userSnap => {
          if (userSnap.exists()) {
            setUserProfilesCache(prev => ({ ...prev, [otherUid]: userSnap.data() }));
          }
        }).catch(e => console.warn("Could not fetch DM participant profile:", otherUid, e));
      }
    });
  }, [currentUser, dms, allUsers, friends]);

  // Helper to extract sender's display name from profile, friends, or user directory
  const getSenderDisplayName = (senderId?: string, fallbackName?: string) => {
    if (!senderId) return (fallbackName && fallbackName !== 'Aspirant') ? fallbackName : 'Aspirant';

    if (currentUser && senderId === currentUser.uid) {
      const myName = currentProfile?.fullName || currentProfile?.name || currentUser.displayName;
      if (myName && myName !== 'Aspirant') return myName;
    }

    const cachedProfile = userProfilesCache[senderId];
    if (cachedProfile) {
      const name = cachedProfile.fullName || cachedProfile.name || cachedProfile.displayName;
      if (name && name !== 'Aspirant') return name;
    }

    const userInDirectory = allUsers.find(u => u.id === senderId || (u as any).uid === senderId);
    if (userInDirectory) {
      const name = userInDirectory.fullName || userInDirectory.name || userInDirectory.displayName;
      if (name && name !== 'Aspirant') return name;
    }

    const friendInList = friends.find(f => f.friendId === senderId);
    if (friendInList?.name && friendInList.name !== 'Aspirant') {
      return friendInList.name;
    }

    if (selectedDm) {
      const other = getOtherUser(selectedDm);
      if (other.uid === senderId && other.name && other.name !== 'Aspirant') {
        return other.name;
      }
    }

    if (fallbackName && fallbackName !== 'Aspirant') {
      return fallbackName;
    }

    return 'Aspirant';
  };

  // Start or fetch active DM conversation
  const startOrGetDm = async (targetId: string) => {
    if (!currentUser || !targetId || targetId === currentUser.uid) return;

    const friendMatch = friends.find(f => f.friendId === targetId);
    const userMatch = allUsers.find(u => u.id === targetId);

    let targetUserData: any = {};
    try {
      const userRef = doc(db, 'users', targetId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) targetUserData = userSnap.data();
    } catch (e) {
      console.warn("Could not fetch target user data:", e);
    }

    const targetName = friendMatch?.name || userMatch?.fullName || userMatch?.name || targetUserData.fullName || targetUserData.name || 'Aspirant';
    const targetPhoto = friendMatch?.photoURL || userMatch?.photoURL || userMatch?.profilePicture || targetUserData.photoURL || targetUserData.profilePicture || '';
    const targetIsPremium = Boolean(friendMatch?.isPremium || userMatch?.isPremium || targetUserData.isPremium);

    const myName = currentProfile?.fullName || currentProfile?.name || currentUser.displayName || 'Aspirant';
    const myPhoto = currentProfile?.photoURL || currentUser.photoURL || '';
    const myIsPremium = Boolean(currentProfile?.isPremium);

    // Check if conversation already exists in active DMs list
    const existingDm = dms.find(d => d.users?.includes(targetId));
    if (existingDm) {
      // Enrich target user info if saved with 'Aspirant' or missing photo
      if (existingDm.user1 && existingDm.user2) {
        if (existingDm.user1.uid === targetId && (existingDm.user1.name === 'Aspirant' || !existingDm.user1.photoURL) && targetName !== 'Aspirant') {
          existingDm.user1.name = targetName;
          existingDm.user1.photoURL = targetPhoto || existingDm.user1.photoURL;
        } else if (existingDm.user2.uid === targetId && (existingDm.user2.name === 'Aspirant' || !existingDm.user2.photoURL) && targetName !== 'Aspirant') {
          existingDm.user2.name = targetName;
          existingDm.user2.photoURL = targetPhoto || existingDm.user2.photoURL;
        }
      }
      setSelectedDm(existingDm);
      setSelectedChannel(null);
      setSidebarTab('chats');
      setMobileView('chat');
      return;
    }

    setLoadingDms(true);
    try {
      const chatId = [currentUser.uid, targetId].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        const fetchedData = chatSnap.data();
        const chatObj: DmChat = { id: chatSnap.id, ...fetchedData } as DmChat;
        
        if (chatObj.user1?.uid === targetId && (chatObj.user1.name === 'Aspirant' || !chatObj.user1.photoURL) && targetName !== 'Aspirant') {
          chatObj.user1.name = targetName;
          chatObj.user1.photoURL = targetPhoto || chatObj.user1.photoURL;
        }
        if (chatObj.user2?.uid === targetId && (chatObj.user2.name === 'Aspirant' || !chatObj.user2.photoURL) && targetName !== 'Aspirant') {
          chatObj.user2.name = targetName;
          chatObj.user2.photoURL = targetPhoto || chatObj.user2.photoURL;
        }

        setSelectedDm(chatObj);
        setSelectedChannel(null);
        setSidebarTab('chats');
        setMobileView('chat');
      } else {
        const isUser1 = currentUser.uid < targetId;
        const newChatData = {
          users: [currentUser.uid, targetId],
          user1: isUser1 ? {
            uid: currentUser.uid,
            name: myName,
            photoURL: myPhoto,
            isPremium: myIsPremium
          } : {
            uid: targetId,
            name: targetName,
            photoURL: targetPhoto,
            isPremium: targetIsPremium
          },
          user2: isUser1 ? {
            uid: targetId,
            name: targetName,
            photoURL: targetPhoto,
            isPremium: targetIsPremium
          } : {
            uid: currentUser.uid,
            name: myName,
            photoURL: myPhoto,
            isPremium: myIsPremium
          },
          createdAt: new Date().toISOString(),
          lastMessage: 'Conversation started',
          lastMessageAt: new Date().toISOString()
        };

        await setDoc(chatRef, newChatData);
        setSelectedDm({ id: chatId, ...newChatData } as DmChat);
        setSelectedChannel(null);
        setSidebarTab('chats');
        setMobileView('chat');
      }
    } catch (err) {
      console.error("Error starting DM:", err);
      // Fallback: local optimistic DM object with resolved target details
      const chatId = [currentUser.uid, targetId].sort().join('_');
      const fallbackChat: DmChat = {
        id: chatId,
        users: [currentUser.uid, targetId],
        user1: {
          uid: currentUser.uid,
          name: myName,
          photoURL: myPhoto,
          isPremium: myIsPremium
        },
        user2: {
          uid: targetId,
          name: targetName,
          photoURL: targetPhoto,
          isPremium: targetIsPremium
        },
        createdAt: new Date().toISOString(),
        lastMessage: 'Conversation started',
        lastMessageAt: new Date().toISOString()
      };
      setSelectedDm(fallbackChat);
      setSelectedChannel(null);
      setSidebarTab('chats');
      setMobileView('chat');
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
        const allowAspirants = selectedChannel.allowAspirantMessages || selectedChannel.whoCanPost === 'everyone';

        if (!isAdmin && !allowAspirants) {
          toast.error('Only administrators are authorized to send broadcasts in this channel.');
          setNewMessage(content);
          setSendingMessage(false);
          return;
        }

        const senderName = isAdmin 
          ? selectedChannel.name 
          : (currentProfile?.fullName || currentProfile?.name || currentUser.displayName || 'Aspirant');

        await addDoc(collection(db, 'broadcasting_channels', selectedChannel.id, 'messages'), {
          senderId: currentUser.uid,
          senderName: senderName,
          senderIcon: isAdmin ? selectedChannel.icon : 'user',
          content: content,
          createdAt: new Date().toISOString(),
          readBy: [currentUser.uid]
        });

      } else if (selectedDm) {
        const myName = currentProfile?.fullName || currentProfile?.name || currentUser.displayName || 'Aspirant';
        const myPhoto = currentProfile?.photoURL || currentUser.photoURL || '';
        const myIsPremium = Boolean(currentProfile?.isPremium);

        const targetUserObj = getOtherUser(selectedDm);

        // Ensure parent chat document exists before adding subcollection message
        const chatRef = doc(db, 'chats', selectedDm.id);
        const chatSnap = await getDoc(chatRef);
        if (!chatSnap.exists()) {
          const targetId = targetUserObj.uid || selectedDm.users?.find(u => u !== currentUser.uid) || '';
          const isUser1 = currentUser.uid < targetId;
          await setDoc(chatRef, {
            users: [currentUser.uid, targetId],
            user1: isUser1 ? {
              uid: currentUser.uid,
              name: myName,
              photoURL: myPhoto,
              isPremium: myIsPremium
            } : {
              uid: targetId,
              name: targetUserObj.name,
              photoURL: targetUserObj.photoURL,
              isPremium: targetUserObj.isPremium
            },
            user2: isUser1 ? {
              uid: targetId,
              name: targetUserObj.name,
              photoURL: targetUserObj.photoURL,
              isPremium: targetUserObj.isPremium
            } : {
              uid: currentUser.uid,
              name: myName,
              photoURL: myPhoto,
              isPremium: myIsPremium
            },
            createdAt: new Date().toISOString(),
            lastMessage: content,
            lastMessageAt: new Date().toISOString()
          });
        } else {
          await updateDoc(chatRef, {
            lastMessage: content,
            lastMessageAt: new Date().toISOString()
          });
        }

        await addDoc(collection(db, 'chats', selectedDm.id, 'messages'), {
          senderId: currentUser.uid,
          senderName: myName,
          content: content,
          createdAt: new Date().toISOString(),
          readBy: [currentUser.uid]
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
    const targetId = targetUser.id || targetUser.uid;
    if (!targetId || targetId === currentUser.uid) return;

    if (friendIds.has(targetId)) {
      toast.error('You are already connected with this aspirant!');
      return;
    }
    if (sentRequests.has(targetId)) {
      toast.error('Connection request already pending!');
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
        receiverName: targetUser.name || targetUser.fullName || 'Aspirant',
        receiverPhoto: targetUser.profilePicture || targetUser.photoURL || '',
        receiverIsPremium: Boolean(targetUser.isPremium || targetUser.role === 'admin'),
        status: 'pending',
        createdAt: Date.now()
      });

      toast.success(`Connection request sent to ${targetUser.name || targetUser.fullName || 'Aspirant'}!`);
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
    const otherUser = getOtherUser(chat);
    return (otherUser.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
           (chat.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-6 h-[calc(100vh-80px)] sm:h-[calc(100vh-120px)] flex flex-col w-full min-w-0">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-1 h-full min-w-0 w-full">
          
          {/* Sidebar Panel - Unified Channels & Chats List */}
          <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col shrink-0 min-w-0 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Sidebar Header with Navigation Tabs */}
            <header className="p-3 sm:p-4 border-b border-slate-100 shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#006e5d]" /> Inbox
                </h1>
              </div>

              {/* Sidebar Navigation Tabs */}
              <div className="flex bg-slate-100/80 p-1 rounded-2xl gap-1">
                <button
                  onClick={() => setSidebarTab('chats')}
                  className={`flex-1 py-1.5 text-[11px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
                    sidebarTab === 'chats'
                      ? 'bg-white text-[#006e5d] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chats
                  {(totalBroadcastUnread + totalDmUnread) > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full animate-pulse shadow-xs">
                      {(totalBroadcastUnread + totalDmUnread) > 99 ? '99+' : (totalBroadcastUnread + totalDmUnread)}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setSidebarTab('requests')}
                  className={`flex-1 py-1.5 text-[11px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
                    sidebarTab === 'requests'
                      ? 'bg-white text-[#006e5d] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Requests
                  {incomingRequestsList.length > 0 && (
                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setSidebarTab('find')}
                  className={`flex-1 py-1.5 text-[11px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    sidebarTab === 'find'
                      ? 'bg-white text-[#006e5d] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Find
                </button>
              </div>

              {/* Filter search bar in Chats tab */}
              {sidebarTab === 'chats' && (
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search chats & channels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-transparent rounded-xl focus:outline-none focus:ring-1 focus:ring-[#006e5d] text-xs font-semibold text-slate-700"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </header>

            {/* Sidebar Scrollable Content based on active tab */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              
              {/* TAB 1: CHATS (Channels & Direct Messages) */}
              {sidebarTab === 'chats' && (
                <>
                  {/* Quick Connections Carousel */}
                  {friends.length > 0 && (
                    <div className="border-b border-slate-50 pb-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                        My Connections
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-none">
                        {friends.map((friend) => {
                          const friendChat = dms.find(d => d.users?.includes(friend.friendId));
                          const unreadCount = friendChat ? (dmUnreadCounts[friendChat.id] || 0) : 0;

                          return (
                            <button
                              key={friend.friendId}
                              onClick={() => startOrGetDm(friend.friendId)}
                              className="flex flex-col items-center shrink-0 w-12 text-center group"
                            >
                              <div className={`relative w-8 h-8 rounded-full overflow-hidden border-2 ${
                                unreadCount > 0 ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-100 group-hover:border-[#006e5d]'
                              } transition-all bg-slate-50 flex items-center justify-center`}>
                                {friend.photoURL ? (
                                  <img src={friend.photoURL} alt={friend.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                )}
                                {unreadCount > 0 ? (
                                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                  </span>
                                ) : friend.isPremium ? (
                                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-400 rounded-full border border-white" />
                                ) : null}
                              </div>
                              <span className={`text-[8px] truncate w-full mt-1 leading-none ${
                                unreadCount > 0 ? 'font-black text-rose-600' : 'font-black text-slate-600 group-hover:text-slate-900'
                              }`}>
                                {friend.name.split(' ')[0]}
                              </span>
                            </button>
                          );
                        })}
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
                        const latestMsg = channelLatestMessages[chan.id];
                        const unreadCount = channelUnreadCounts[chan.id] || 0;

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
                                : unreadCount > 0
                                ? 'bg-rose-50/40 border-rose-200/60 hover:bg-rose-50/60'
                                : 'bg-slate-50/20 border-transparent hover:bg-slate-50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative ${
                              isSelected ? 'bg-[#006e5d] text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {chan.icon === 'team' ? <Users className="w-4 h-4" /> :
                               chan.icon === 'megaphone' ? <Megaphone className="w-4 h-4" /> :
                               chan.icon === 'support' ? <Shield className="w-4 h-4" /> :
                               <MessageSquare className="w-4 h-4" />}
                              {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1 min-w-0">
                                  <span className={`text-xs truncate block ${
                                    isSelected ? 'font-bold text-[#001f19]' : unreadCount > 0 ? 'font-black text-rose-950' : 'font-bold text-slate-800'
                                  }`}>
                                    {chan.name}
                                  </span>
                                  {chan.isVerified && (
                                    <VerifiedBadge size="xs" variant="yellow" title="Verified Channel" className="ml-0.5 shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {latestMsg?.createdAt && (
                                    <span className={`text-[9px] ${unreadCount > 0 ? 'font-bold text-rose-500' : 'font-semibold text-slate-400'}`}>
                                      {new Date(latestMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                  {unreadCount > 0 && (
                                    <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 shadow-xs animate-pulse">
                                      {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {latestMsg ? (
                                <p className={`text-[11px] truncate mt-0.5 ${unreadCount > 0 ? 'font-black text-rose-700' : 'font-medium text-slate-500'}`}>
                                  {latestMsg.senderName ? `${latestMsg.senderName}: ` : ''}{latestMsg.content}
                                </p>
                              ) : (
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                  <span>Official Update</span>
                                  {(chan.allowAspirantMessages || chan.whoCanPost === 'everyone') && (
                                    <span className="text-teal-600 font-extrabold">• Open Chat</span>
                                  )}
                                </p>
                              )}
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
                          onClick={() => setSidebarTab('find')}
                          className="text-[9px] font-black uppercase text-[#006e5d] mt-1 hover:underline block mx-auto"
                        >
                          Find aspirants to chat
                        </button>
                      </div>
                    ) : (
                      filteredDms.map((chat) => {
                        const otherUser = getOtherUser(chat);
                        const isSelected = selectedDm?.id === chat.id;
                        const unreadCount = dmUnreadCounts[chat.id] || 0;

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
                                : unreadCount > 0
                                ? 'bg-rose-50/40 border-rose-200/60 hover:bg-rose-50/60'
                                : 'bg-slate-50/20 border-transparent hover:bg-slate-50'
                            }`}
                          >
                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                              {otherUser.photoURL ? (
                                <img src={otherUser.photoURL} alt={otherUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User className="w-4 h-4 text-slate-400" />
                              )}
                              {unreadCount > 0 ? (
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white" />
                              ) : otherUser.isPremium ? (
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-white" />
                              ) : null}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className={`text-xs truncate ${
                                  isSelected ? 'font-bold text-[#001f19]' : unreadCount > 0 ? 'font-black text-rose-950' : 'font-bold text-slate-800'
                                }`}>
                                  {otherUser.name}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {chat.lastMessageAt && (
                                    <span className={`text-[8px] ${unreadCount > 0 ? 'font-bold text-rose-500' : 'font-semibold text-slate-400'}`}>
                                      {formatChatTimestamp(chat.lastMessageAt)}
                                    </span>
                                  )}
                                  {unreadCount > 0 && (
                                    <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 shadow-xs animate-pulse">
                                      {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className={`text-[9px] truncate mt-0.5 ${unreadCount > 0 ? 'font-black text-rose-700' : 'text-slate-400 font-semibold'}`}>
                                {chat.lastMessage || 'Conversation started'}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {/* TAB 2: REQUESTS */}
              {sidebarTab === 'requests' && (
                <div className="space-y-4">
                  {/* Incoming Requests */}
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 px-1">
                      Incoming Connection Requests ({incomingRequestsList.length})
                    </h3>
                    {incomingRequestsList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic px-1 py-2">No pending requests received.</p>
                    ) : (
                      <div className="space-y-2">
                        {incomingRequestsList.map((req) => (
                          <div key={req.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                                {req.senderPhoto ? (
                                  <img src={req.senderPhoto} alt={req.senderName} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-3.5 h-3.5 text-slate-500" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-800 truncate">{req.senderName}</p>
                                <p className="text-[9px] text-slate-400">Wants to connect with you</p>
                              </div>
                            </div>
                            <div className="flex gap-1.5 pt-1">
                              <button
                                onClick={() => handleAcceptRequest(req.id, req.senderId, req.senderName, req.senderPhoto, Boolean(req.senderIsPremium))}
                                disabled={actionLoading}
                                className="flex-1 py-1 bg-[#006e5d] text-white rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 hover:bg-[#005a4d] transition-colors"
                              >
                                <UserCheck className="w-3 h-3" /> Accept
                              </button>
                              <button
                                onClick={() => handleDeclineRequest(req.id)}
                                disabled={actionLoading}
                                className="p-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-extrabold hover:bg-slate-300 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Outgoing Requests */}
                  <div className="pt-2 border-t border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 px-1">
                      Sent Connection Requests ({outgoingRequestsList.length})
                    </h3>
                    {outgoingRequestsList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic px-1 py-2">No pending sent requests.</p>
                    ) : (
                      <div className="space-y-2">
                        {outgoingRequestsList.map((req) => {
                          const nameToDisplay = req.receiverName || req.targetName || req.receiverEmail || 'Aspirant';
                          const photoToDisplay = req.receiverPhoto || '';
                          return (
                            <div key={req.id} className="p-2.5 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                                  {photoToDisplay ? (
                                    <img src={photoToDisplay} alt={nameToDisplay} className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-4 h-4 text-slate-500" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{nameToDisplay}</p>
                                  <p className="text-[10px] text-amber-600 font-semibold">Request Sent</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase border border-amber-200">
                                  Pending
                                </span>
                                <button
                                  onClick={() => handleCancelRequest(req.id)}
                                  disabled={actionLoading}
                                  className="p-1 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                  title="Cancel Request"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: FIND ASPIRANTS */}
              {sidebarTab === 'find' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Find aspirants by name..."
                      value={directorySearchQuery}
                      onChange={(e) => setDirectorySearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-transparent rounded-xl focus:outline-none focus:ring-1 focus:ring-[#006e5d] text-xs font-semibold text-slate-700"
                    />
                  </div>

                  {loadingSearch ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">No aspirants found.</p>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((user) => {
                        const isConnected = friendIds.has(user.id);
                        const isPending = sentRequests.has(user.id);

                        return (
                          <div key={user.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                            <button
                              onClick={() => navigate(`/student/${user.id}`)}
                              className="flex items-center gap-2 min-w-0 text-left group"
                            >
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                                {user.photoURL ? (
                                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 group-hover:text-[#006e5d] truncate">
                                  {user.name || user.fullName || 'Aspirant'}
                                </p>
                                <p className="text-[9px] text-slate-400 truncate">
                                  {user.username ? `@${user.username}` : user.targetExam || 'Competitive Aspirant'}
                                </p>
                              </div>
                            </button>

                            <div>
                              {isConnected ? (
                                <button
                                  onClick={() => startOrGetDm(user.id)}
                                  className="px-2.5 py-1 bg-[#006e5d] text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-[#005a4d]"
                                >
                                  <MessageSquare className="w-3 h-3" /> Chat
                                </button>
                              ) : isPending ? (
                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                  Sent
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSendRequest(user)}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-slate-800"
                                >
                                  <UserPlus className="w-3 h-3" /> Connect
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Active Chat Stream Area - Mobile Responsive */}
          <div className={`flex-1 flex-col bg-slate-50/15 overflow-hidden min-w-0 w-full ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
            {selectedChannel ? (
              // CHANNEL STREAM RENDERER
              <div className="flex flex-col h-full overflow-hidden bg-white min-w-0 w-full">
                {/* Header */}
                <header className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0 min-w-0 w-full">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <button 
                      onClick={() => setMobileView('list')} 
                      className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 shrink-0"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#006e5d]/10 text-[#006e5d] rounded-xl flex items-center justify-center shrink-0">
                      {selectedChannel.icon === 'team' ? <Users className="w-4 h-4 sm:w-5 sm:h-5" /> :
                       selectedChannel.icon === 'megaphone' ? <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" /> :
                       selectedChannel.icon === 'support' ? <Shield className="w-4 h-4 sm:w-5 sm:h-5" /> :
                       <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h2 className="text-sm sm:text-base font-black text-slate-900 leading-none truncate">{selectedChannel.name}</h2>
                        {selectedChannel.isVerified && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-yellow-400/10 text-yellow-600 border border-yellow-400/25 shrink-0">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 sm:mt-1 truncate">
                        Official updates published by Verified Admins
                      </p>
                    </div>
                  </div>
                </header>

                {/* Messages Stream - Fully Responsive Cards */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 min-w-0 w-full">
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
                    messages.map((msg, index) => {
                      const senderDisplayName = getSenderDisplayName(msg.senderId, msg.senderName);
                      return (
                        <div key={msg.id || index} className="flex gap-2.5 sm:gap-4 items-start bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs max-w-2xl min-w-0 w-full">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#006e5d]/10 text-[#006e5d] flex items-center justify-center shrink-0">
                            {selectedChannel.icon === 'team' ? <Users className="w-4 h-4 sm:w-5 sm:h-5" /> :
                             selectedChannel.icon === 'megaphone' ? <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" /> :
                             selectedChannel.icon === 'support' ? <Shield className="w-4 h-4 sm:w-5 sm:h-5" /> :
                             <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-slate-900">{senderDisplayName}</span>
                                {msg.senderIcon !== 'user' ? (
                                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 tracking-wider uppercase border border-yellow-500/20">
                                    Team Admin
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-teal-500/10 text-[#006e5d] tracking-wider uppercase border border-teal-500/20">
                                    Aspirant
                                  </span>
                                )}
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
                            <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap break-words min-w-0 w-full pr-1 sm:pr-4">
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Dispatcher Actions */}
                <div className="border-t border-slate-100 p-3 sm:p-4 bg-white shrink-0">
                  {isAdmin || selectedChannel.allowAspirantMessages || selectedChannel.whoCanPost === 'everyone' ? (
                    <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
                      <input
                        type="text"
                        required
                        placeholder={isAdmin ? "Broadcast update..." : "Send a message in channel..."}
                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-[#006e5d]/15 text-xs sm:text-sm font-medium text-slate-800"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-xl sm:rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-teal-50"
                      >
                        {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span className="hidden sm:inline">{isAdmin ? "Broadcast" : "Send"}</span>
                      </button>
                    </form>
                  ) : (
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-center gap-2 text-slate-400 select-none">
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-center">
                        Only verified administrators can publish broadcasts to this stream
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : selectedDm ? (
              // DIRECT DM STREAM RENDERER
              <div className="flex flex-col h-full overflow-hidden bg-white min-w-0 w-full">
                {/* Header */}
                <header className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0 min-w-0 w-full">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <button 
                      onClick={() => setMobileView('list')} 
                      className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 shrink-0"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    {(() => {
                      const otherUser = getOtherUser(selectedDm);
                      return (
                        <button 
                          onClick={() => navigate(`/student/${otherUser.uid}`)}
                          className="flex items-center gap-2.5 sm:gap-3 text-left hover:opacity-80 transition-all min-w-0 group"
                          title="View Profile"
                        >
                          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 group-hover:scale-105 transition-transform">
                            {otherUser.photoURL ? (
                              <img src={otherUser.photoURL} alt={otherUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                            )}
                            {otherUser.isPremium && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <h2 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#006e5d] transition-colors leading-none truncate">{otherUser.name}</h2>
                              {otherUser.isPremium && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-yellow-400/10 text-yellow-600 border border-yellow-400/25 shrink-0">
                                  Premium
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 sm:mt-1 truncate">
                              Private 1-on-1 Direct Chat • View Profile
                            </p>
                          </div>
                        </button>
                      );
                    })()}
                  </div>
                </header>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 bg-slate-50/10 min-w-0 w-full">
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
                      const senderDisplayName = getSenderDisplayName(msg.senderId, msg.senderName);
                      return (
                        <div 
                          key={msg.id || index} 
                          className={`flex gap-3 max-w-[88%] sm:max-w-md ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                        >
                          <div className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl border text-xs font-medium leading-relaxed shadow-xs break-words min-w-0 ${
                            isMe 
                              ? 'bg-[#006e5d] text-white border-transparent rounded-tr-none' 
                              : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                          }`}>
                            <p className={`text-[10px] font-black mb-1 ${isMe ? 'text-teal-100/90' : 'text-[#006e5d]'}`}>
                              {isMe ? 'You' : senderDisplayName}
                            </p>
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
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
                <div className="border-t border-slate-100 p-3 sm:p-4 bg-white shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Type your message..."
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-[#006e5d]/15 text-xs sm:text-sm font-medium text-slate-800"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-xl sm:rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-teal-50"
                    >
                      {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span className="hidden sm:inline">Send</span>
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
