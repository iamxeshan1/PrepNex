import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  collection, query, orderBy, onSnapshot, addDoc, doc, getDoc, setDoc, updateDoc, where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { 
  MessageSquare, Users, CheckCircle2, Clock, Shield, Lock, Send, Loader2, Megaphone, User, MessageCircle
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

  const [activeTab, setActiveTab] = useState<'channels' | 'dms'>('channels');

  // Channels State
  const [channels, setChannels] = useState<BroadcastingChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<BroadcastingChannel | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // DMs State
  const [dms, setDms] = useState<DmChat[]>([]);
  const [selectedDm, setSelectedDm] = useState<DmChat | null>(null);
  const [dmMessages, setDmMessages] = useState<DmMessage[]>([]);
  const [loadingDms, setLoadingDms] = useState(true);
  const [loadingDmMessages, setLoadingDmMessages] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);

  // Common UI State
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

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
  }, [messages, dmMessages]);

  // Handle auto-selection and URL search params for channels & direct chats
  useEffect(() => {
    const channelIdParam = searchParams.get('channelId');
    const userIdParam = searchParams.get('userId');

    if (userIdParam) {
      setActiveTab('dms');
      startOrGetDm(userIdParam);
    } else if (channelIdParam) {
      setActiveTab('channels');
    }
  }, [searchParams, currentUser]);

  // Listen to channels
  useEffect(() => {
    const q = query(collection(db, 'broadcasting_channels'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BroadcastingChannel[];
      setChannels(data);
      setLoadingChannels(false);

      // Select first channel automatically if none selected and not on DM mode
      const activeIdParam = searchParams.get('channelId');
      if (activeIdParam) {
        const found = data.find(c => c.id === activeIdParam);
        if (found) setSelectedChannel(found);
      } else if (data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0]);
      }
    }, (err) => {
      console.error("Error loading channels:", err);
      setLoadingChannels(false);
    });

    return () => unsub();
  }, [searchParams, selectedChannel]);

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

  // Fetch student friendships to start new conversations easily
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
      console.warn("Friendships list failed or permissions omitted:", err);
    });

    return () => unsub();
  }, [currentUser]);

  // Helper function to create or open a DM chat with another user
  const startOrGetDm = async (targetId: string) => {
    if (!currentUser) return;
    setLoadingDms(true);
    try {
      const chatId = [currentUser.uid, targetId].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        setSelectedDm({ id: chatSnap.id, ...chatSnap.data() } as DmChat);
      } else {
        // Fetch target user info
        const userRef = doc(db, 'users', targetId);
        const userSnap = await getDoc(userRef);
        const targetUserData = userSnap.exists() ? userSnap.data() : {};
        
        // Fetch current user info
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
      }
    } catch (err) {
      console.error("Error starting DM:", err);
      toast.error("Failed to load conversation");
    } finally {
      setLoadingDms(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    try {
      if (activeTab === 'channels' && selectedChannel) {
        // Broadcast Channel Message (Admin only)
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

      } else if (activeTab === 'dms' && selectedDm) {
        // Direct Peer message
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

  const isAdmin = currentProfile?.role === 'admin';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-140px)] flex flex-col">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-1 h-full">
          
          {/* Sidebar Panel */}
          <div className="w-full md:w-80 border-r border-slate-100 flex flex-col shrink-0">
            {/* Header with Navigation Tabs */}
            <header className="p-4 border-b border-slate-50 shrink-0">
              <div className="flex bg-slate-100 p-1 rounded-xl mb-3">
                <button
                  onClick={() => setActiveTab('channels')}
                  className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'channels' 
                      ? 'bg-white text-[#006e5d] shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Megaphone className="w-4 h-4" />
                  Channels
                </button>
                <button
                  onClick={() => setActiveTab('dms')}
                  className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'dms' 
                      ? 'bg-white text-[#006e5d] shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Direct
                </button>
              </div>

              <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                {activeTab === 'channels' ? (
                  <>
                    <Users className="w-4 h-4 text-[#006e5d]" /> Broadcast Channels
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 text-[#006e5d]" /> Direct Messages
                  </>
                )}
              </h1>
            </header>

            {/* Sidebar Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {activeTab === 'channels' ? (
                // CHANNELS TAB
                loadingChannels ? (
                  <div className="h-full flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-slate-200 animate-spin mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syncing Channels...</p>
                  </div>
                ) : channels.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-12">
                    <Megaphone className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-800">No active channels</p>
                  </div>
                ) : (
                  channels.map((chan) => {
                    const isSelected = selectedChannel?.id === chan.id;
                    return (
                      <button
                        key={chan.id}
                        onClick={() => {
                          setSelectedChannel(chan);
                          setSelectedDm(null);
                        }}
                        className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                          isSelected 
                            ? 'bg-teal-50/40 border-[#006e5d]/30 text-[#006e5d]' 
                            : 'bg-slate-50/20 border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#006e5d] text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {chan.icon === 'team' ? <Users className="w-4 h-4" /> :
                           chan.icon === 'megaphone' ? <Megaphone className="w-4 h-4" /> :
                           chan.icon === 'support' ? <Shield className="w-4 h-4" /> :
                           <MessageSquare className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-black truncate block ${isSelected ? 'text-[#001f19]' : 'text-slate-800'}`}>
                              {chan.name}
                            </span>
                            {chan.isVerified && (
                              <span className="text-yellow-500 inline-block shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5 fill-current text-white text-yellow-500" />
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                            Official Channel
                          </p>
                        </div>
                      </button>
                    );
                  })
                )
              ) : (
                // DMs TAB
                <div className="space-y-4">
                  {/* Quick Connect Friends List */}
                  {friends.length > 0 && (
                    <div className="border-b border-slate-100 pb-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                        My Connections
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-none">
                        {friends.map((friend) => (
                          <button
                            key={friend.friendId}
                            onClick={() => startOrGetDm(friend.friendId)}
                            className="flex flex-col items-center shrink-0 w-14 text-center group"
                          >
                            <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-slate-100 group-hover:border-[#006e5d] transition-all bg-slate-50 flex items-center justify-center">
                              {friend.photoURL ? (
                                <img src={friend.photoURL} alt={friend.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User className="w-4 h-4 text-slate-400" />
                              )}
                              {friend.isPremium && (
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-white" />
                              )}
                            </div>
                            <span className="text-[9px] font-bold text-slate-600 truncate w-full mt-1 group-hover:text-slate-900">
                              {friend.name.split(' ')[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active DM Chats */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                      Recent Chats
                    </p>
                    {loadingDms ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                      </div>
                    ) : dms.length === 0 ? (
                      <div className="text-center py-8 px-4 opacity-70">
                        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">No active chats</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Connect with friends on their profile pages to start private DMs!
                        </p>
                      </div>
                    ) : (
                      dms.map((chat) => {
                        const otherUser = chat.user1.uid === currentUser?.uid ? chat.user2 : chat.user1;
                        const isSelected = selectedDm?.id === chat.id;

                        return (
                          <button
                            key={chat.id}
                            onClick={() => {
                              setSelectedDm(chat);
                              setSelectedChannel(null);
                            }}
                            className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                              isSelected 
                                ? 'bg-teal-50/40 border-[#006e5d]/30 text-[#006e5d]' 
                                : 'bg-slate-50/20 border-transparent hover:bg-slate-50'
                            }`}
                          >
                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-100">
                              {otherUser.photoURL ? (
                                <img src={otherUser.photoURL} alt={otherUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User className="w-4 h-4 text-slate-400" />
                              )}
                              {otherUser.isPremium && (
                                <span className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-400 rounded-full border border-white" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-black truncate ${isSelected ? 'text-[#001f19]' : 'text-slate-800'}`}>
                                  {otherUser.name}
                                </span>
                                {chat.lastMessageAt && (
                                  <span className="text-[8px] text-slate-400 font-medium shrink-0">
                                    {new Date(chat.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate font-medium mt-0.5">
                                {chat.lastMessage || 'Open conversation'}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Chat Box Area */}
          <div className="hidden md:flex flex-1 flex-col bg-slate-50/15">
            {activeTab === 'channels' && selectedChannel ? (
              // CHANNEL STREAM
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header */}
                <header className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#006e5d]/10 text-[#006e5d] rounded-xl flex items-center justify-center shrink-0">
                      {selectedChannel.icon === 'team' ? <Users className="w-5 h-5" /> :
                       selectedChannel.icon === 'megaphone' ? <Megaphone className="w-5 h-5" /> :
                       selectedChannel.icon === 'support' ? <Shield className="w-5 h-5" /> :
                       <MessageSquare className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-base font-black text-slate-900 leading-none">{selectedChannel.name}</h2>
                        {selectedChannel.isVerified && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-yellow-400/10 text-yellow-600 border border-yellow-400/25">
                            <CheckCircle2 className="w-3 h-3 fill-current text-white text-yellow-500" /> Verified
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                        Only verified admins can publish broadcasts
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
                        Announcements from the admin team will appear in real-time.
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
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
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
                        placeholder={`Broadcast official update as ${selectedChannel.name}...`}
                        className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#006e5d]/15 text-sm font-medium"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="px-6 py-3.5 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-teal-50"
                      >
                        {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Broadcast
                      </button>
                    </form>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-center gap-2 text-slate-400 select-none">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Only verified administrators can publish broadcasts to this stream
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'dms' && selectedDm ? (
              // DM STREAM
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header */}
                <header className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const otherUser = selectedDm.user1.uid === currentUser?.uid ? selectedDm.user2 : selectedDm.user1;
                      return (
                        <>
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                            {otherUser.photoURL ? (
                              <img src={otherUser.photoURL} alt={otherUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="w-5 h-5 text-slate-400" />
                            )}
                            {otherUser.isPremium && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-400 rounded-full border border-white" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h2 className="text-base font-black text-slate-900 leading-none">{otherUser.name}</h2>
                              {otherUser.isPremium && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-yellow-400/10 text-yellow-600 border border-yellow-400/25">
                                  Premium
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                              Private 1-on-1 Direct Chat
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </header>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
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
                      className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#006e5d]/15 text-sm font-medium"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      className="px-6 py-3.5 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-teal-50"
                    >
                      {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <Megaphone className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
                <h3 className="text-base font-black text-slate-700">Select Conversation Pipeline</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Choose a verified channel or direct chat conversation from the left sidebar to start messaging.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
