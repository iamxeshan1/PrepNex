import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, onSnapshot, query, orderBy, limit, addDoc, doc, setDoc, updateDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  MessageSquare, Shield, AlertTriangle, Search, Filter, Send, 
  User, CheckCircle2, AlertCircle, Clock, ExternalLink, Flag, 
  Users, Sparkles, RefreshCw, Eye, ShieldAlert, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// Keywords to auto-flag for derogatory, abusive, or suspicious intent
const SUSPICIOUS_KEYWORDS = [
  'cheat', 'cheating', 'hack', 'leak', 'scam', 'money', 'pay me',
  'abuse', 'hate', 'stupid', 'idiot', 'fool', 'fake', 'bitch', 'bastard',
  'threat', 'kill', 'shut up', 'get lost', 'slur', 'harass', 'warning'
];

export default function AdminChatMonitor() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'flagged' | 'warned'>('all');

  // Warning state
  const [warningText, setWarningText] = useState('⚠️ OFFICIAL ADMIN WARNING: Please ensure all communications remain polite, respectful, and focused on study support. Derogatory or abusive remarks violate PrepNext community rules.');
  const [sendingWarning, setSendingWarning] = useState(false);

  // Listen to active conversations from 'chats' and 'friendships'
  useEffect(() => {
    setLoading(true);

    const chatsQ = query(
      collection(db, 'chats'),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(chatsQ, async (snap) => {
      const chatList: any[] = [];

      for (const chatDoc of snap.docs) {
        const cData = chatDoc.data();
        const chatId = chatDoc.id;
        const participants = cData.participants || [];

        // Fetch participant details if available
        let user1Info = { uid: participants[0] || 'user1', name: 'Student 1', photoURL: '' };
        let user2Info = { uid: participants[1] || 'user2', name: 'Student 2', photoURL: '' };

        // Fetch from friendships if exists
        try {
          const friendshipDoc = await getDocs(query(collection(db, 'friendships'), where('users', 'array-contains', participants[0] || '')));
          const match = friendshipDoc.docs.find(d => d.id === chatId);
          if (match) {
            const fData = match.data();
            if (fData.user1) user1Info = fData.user1;
            if (fData.user2) user2Info = fData.user2;
          } else {
            // Fetch directly from users collection if missing
            if (participants[0]) {
              const u1Snap = await getDocs(query(collection(db, 'users'), where('__name__', '==', participants[0])));
              if (!u1Snap.empty) {
                const u1 = u1Snap.docs[0].data();
                user1Info = { uid: u1Snap.docs[0].id, name: u1.fullName || u1.name || 'Student 1', photoURL: u1.photoURL || '' };
              }
            }
            if (participants[1]) {
              const u2Snap = await getDocs(query(collection(db, 'users'), where('__name__', '==', participants[1])));
              if (!u2Snap.empty) {
                const u2 = u2Snap.docs[0].data();
                user2Info = { uid: u2Snap.docs[0].id, name: u2.fullName || u2.name || 'Student 2', photoURL: u2.photoURL || '' };
              }
            }
          }
        } catch (e) {
          console.error("Error populating chat metadata:", e);
        }

        // Check if last message has suspicious words
        const lastMsgText = (cData.lastMessage || '').toLowerCase();
        const hasFlag = SUSPICIOUS_KEYWORDS.some(k => lastMsgText.includes(k));

        chatList.push({
          id: chatId,
          ...cData,
          user1: user1Info,
          user2: user2Info,
          hasFlag,
          adminWarningIssued: Boolean(cData.adminWarningIssued)
        });
      }

      setConversations(chatList);
      setLoading(false);

      if (chatList.length > 0 && !selectedChat) {
        setSelectedChat(chatList[0]);
      }
    }, (err) => {
      console.error("Error fetching chats for admin monitor:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Listen to messages for selected conversation
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);
    const messagesQ = query(
      collection(db, 'chats', selectedChat.id, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubMessages = onSnapshot(messagesQ, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(fetched);
      setMessagesLoading(false);
    }, (err) => {
      console.error("Error loading chat messages:", err);
      setMessagesLoading(false);
    });

    return () => unsubMessages();
  }, [selectedChat?.id]);

  // Handle sending official warning into chat
  const handleSendAdminWarning = async () => {
    if (!selectedChat || !warningText.trim()) return;

    setSendingWarning(true);
    const warningMsg = warningText.trim();

    try {
      // 1. Post message into chats/{chatId}/messages
      await addDoc(collection(db, 'chats', selectedChat.id, 'messages'), {
        senderId: 'admin_warning',
        isAdminWarning: true,
        text: warningMsg,
        createdAt: Date.now()
      });

      // 2. Update chat parent doc
      await updateDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: `⚠️ ADMIN WARNING: ${warningMsg.slice(0, 50)}...`,
        lastMessageTime: Date.now(),
        adminWarningIssued: true,
        updatedAt: Date.now()
      });

      toast.success('Official Admin Warning issued directly into student conversation thread!');
    } catch (err) {
      console.error("Error sending admin warning:", err);
      toast.error('Failed to issue admin warning.');
    } finally {
      setSendingWarning(false);
    }
  };

  // Filtered conversations
  const filteredConversations = conversations.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    const u1Name = (c.user1?.name || '').toLowerCase();
    const u2Name = (c.user2?.name || '').toLowerCase();
    const lastMsg = (c.lastMessage || '').toLowerCase();

    const matchesSearch = u1Name.includes(searchLower) || u2Name.includes(searchLower) || lastMsg.includes(searchLower);

    if (!matchesSearch) return false;

    if (filterType === 'flagged') return c.hasFlag;
    if (filterType === 'warned') return c.adminWarningIssued;

    return true;
  });

  const flaggedCount = conversations.filter(c => c.hasFlag).length;
  const warnedCount = conversations.filter(c => c.adminWarningIssued).length;

  return (
    <AdminLayout title="Student Chat Monitor & Moderation">
      <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
        
        {/* Top Header & Alert Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#003d33] text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-[#006e5d] text-emerald-200 text-[10px] font-black uppercase rounded-md tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3" /> Live Moderation System
              </span>
              <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase rounded-md border border-rose-500/30">
                Safety First
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Student Chat & Conversation Oversight
            </h1>
            <p className="text-xs text-slate-300 font-medium mt-1 max-w-2xl">
              Monitor 1-on-1 student conversations to prevent bullying, derogatory remarks, cheating, or abusive speech. Issue real-time warnings directly into threads.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-center border border-white/10">
              <div className="text-[10px] uppercase font-black text-slate-400">Total Chats</div>
              <div className="text-lg font-black text-white">{conversations.length}</div>
            </div>
            <div className="px-4 py-2 bg-amber-500/20 backdrop-blur-md rounded-xl text-center border border-amber-500/30">
              <div className="text-[10px] uppercase font-black text-amber-300">Flagged Words</div>
              <div className="text-lg font-black text-amber-300">{flaggedCount}</div>
            </div>
            <div className="px-4 py-2 bg-rose-500/20 backdrop-blur-md rounded-xl text-center border border-rose-500/30">
              <div className="text-[10px] uppercase font-black text-rose-300">Warnings Issued</div>
              <div className="text-lg font-black text-rose-300">{warnedCount}</div>
            </div>
          </div>
        </div>

        {/* Main Interface Layout: Left Chat List | Right Message Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
          
          {/* Left Column: Chat Channels List */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col overflow-hidden">
            
            {/* Search & Filter Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students or message keyword..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#006e5d]/20 focus:border-[#006e5d]"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setFilterType('all')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  All ({conversations.length})
                </button>
                <button
                  onClick={() => setFilterType('flagged')}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${filterType === 'flagged' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-amber-600'}`}
                >
                  <AlertTriangle className="w-3 h-3" /> Flagged ({flaggedCount})
                </button>
                <button
                  onClick={() => setFilterType('warned')}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${filterType === 'warned' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-rose-600'}`}
                >
                  <ShieldAlert className="w-3 h-3" /> Warned ({warnedCount})
                </button>
              </div>
            </div>

            {/* Conversation Items Feed */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[550px]">
              {loading ? (
                <div className="p-8 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#006e5d]" /> Loading chat records...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-slate-400">
                  No student chats found matching search criteria.
                </div>
              ) : (
                filteredConversations.map(chat => {
                  const isSelected = selectedChat?.id === chat.id;
                  return (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={`p-4 cursor-pointer transition-all hover:bg-slate-50 flex items-start justify-between gap-3 ${isSelected ? 'bg-emerald-50/60 border-l-4 border-l-[#006e5d]' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        {/* Participants names */}
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {chat.user1?.name || 'Student 1'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-black">↔</span>
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {chat.user2?.name || 'Student 2'}
                          </span>
                        </div>

                        {/* Last Message snippet */}
                        <p className="text-[11px] font-medium text-slate-500 truncate">
                          {chat.lastMessage || 'Conversation started'}
                        </p>

                        {/* Badges Bar */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {chat.hasFlag && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded-md flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> Keyword Flagged
                            </span>
                          )}
                          {chat.adminWarningIssued && (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black rounded-md flex items-center gap-1">
                              <ShieldAlert className="w-2.5 h-2.5" /> Warning Issued
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(chat.lastMessageTime || chat.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <Eye className={`w-4 h-4 shrink-0 transition-all ${isSelected ? 'text-[#006e5d]' : 'text-slate-300'}`} />
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Right Column: Detailed Thread Inspector & Action Control */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col overflow-hidden">
            {selectedChat ? (
              <>
                {/* Selected Thread Bar */}
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-0.5">
                      Chat Room Inspector • ID: {selectedChat.id.slice(0, 12)}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                      <Link to={`/student/${selectedChat.user1?.uid}`} target="_blank" className="hover:text-[#006e5d] transition-colors flex items-center gap-1">
                        {selectedChat.user1?.name} <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                      <span className="text-slate-400 font-normal">&amp;</span>
                      <Link to={`/student/${selectedChat.user2?.uid}`} target="_blank" className="hover:text-[#006e5d] transition-colors flex items-center gap-1">
                        {selectedChat.user2?.name} <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/student/${selectedChat.user1?.uid}`}
                      target="_blank"
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      User 1 Profile
                    </Link>
                    <Link
                      to={`/student/${selectedChat.user2?.uid}`}
                      target="_blank"
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      User 2 Profile
                    </Link>
                  </div>
                </div>

                {/* Messages Feed View */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 min-h-[300px] max-h-[380px]">
                  {messagesLoading ? (
                    <div className="text-center py-12 text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#006e5d]" /> Loading transcript...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-xs font-bold text-slate-400">
                      No messages recorded in this channel yet.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isAdminWarning = msg.senderId === 'admin_warning' || msg.isAdminWarning || msg.text?.includes('OFFICIAL ADMIN WARNING');
                      
                      if (isAdminWarning) {
                        return (
                          <div key={msg.id} className="p-3 bg-amber-500/10 border-2 border-amber-500/40 rounded-xl text-amber-900 text-xs font-bold my-2 shadow-xs">
                            <div className="flex items-center gap-1.5 text-amber-700 uppercase font-black text-[10px] mb-1">
                              <ShieldAlert className="w-4 h-4" /> Official Admin Moderation Notice
                            </div>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        );
                      }

                      const isUser1 = msg.senderId === selectedChat.user1?.uid;
                      const senderName = isUser1 ? (selectedChat.user1?.name || 'Student 1') : (selectedChat.user2?.name || 'Student 2');
                      
                      // Highlight suspicious words
                      const msgLower = (msg.text || '').toLowerCase();
                      const containsSuspicious = SUSPICIOUS_KEYWORDS.some(k => msgLower.includes(k));

                      return (
                        <div 
                          key={msg.id}
                          className={`flex flex-col ${isUser1 ? 'items-start' : 'items-end'}`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 mb-1">
                            <span>{senderName}</span>
                            <span>•</span>
                            <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium ${
                            containsSuspicious 
                              ? 'bg-rose-50 border-2 border-rose-300 text-rose-900 shadow-xs' 
                              : isUser1 
                                ? 'bg-white border border-slate-200 text-slate-800' 
                                : 'bg-slate-800 text-white'
                          }`}>
                            {containsSuspicious && (
                              <div className="flex items-center gap-1 text-[10px] font-black text-rose-600 uppercase mb-1">
                                <AlertCircle className="w-3 h-3" /> Flagged Words Detected
                              </div>
                            )}
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Admin Warning Control Box */}
                <div className="p-4 border-t border-slate-200 bg-slate-900 text-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-amber-400" /> Issue Admin Moderation Warning
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Appears directly in student thread
                    </span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => setWarningText('⚠️ OFFICIAL ADMIN WARNING: Please ensure all communications remain polite, respectful, and focused on study support. Derogatory or abusive remarks violate PrepNext community rules.')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg shrink-0 transition-all border border-slate-700"
                    >
                      General Respect Warning
                    </button>
                    <button
                      type="button"
                      onClick={() => setWarningText('🚨 FINAL MODERATION NOTICE: Offensive or derogatory language has been flagged in this conversation. Repeat offenses will result in permanent account suspension.')}
                      className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-[10px] font-bold rounded-lg shrink-0 transition-all border border-rose-800"
                    >
                      Strict Final Notice
                    </button>
                  </div>

                  {/* Textarea for Custom Warning */}
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={warningText}
                      onChange={(e) => setWarningText(e.target.value)}
                      placeholder="Type official admin warning..."
                      className="flex-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006e5d] font-medium"
                    />
                    <button
                      onClick={handleSendAdminWarning}
                      disabled={sendingWarning || !warningText.trim()}
                      className="px-4 py-2 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 shrink-0 disabled:opacity-50 shadow-md shadow-emerald-950"
                    >
                      <Send className="w-4 h-4" />
                      <span>{sendingWarning ? 'Sending...' : 'Send Warning'}</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="m-auto py-24 text-center text-slate-400 max-w-sm">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-black text-slate-700 mb-1">Select a Conversation</h3>
                <p className="text-xs font-medium text-slate-400">
                  Select a student chat from the left panel to inspect messages and issue moderation warnings.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
