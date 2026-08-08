import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  collection, query, orderBy, onSnapshot, addDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { 
  MessageSquare, Users, CheckCircle2, Clock, Shield, Lock, Send, Loader2, Megaphone
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

export default function Chat() {
  const { user: currentUser, profile: currentProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [channels, setChannels] = useState<BroadcastingChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<BroadcastingChannel | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
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
  }, [messages]);

  // Listen to channels
  useEffect(() => {
    const q = query(collection(db, 'broadcasting_channels'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BroadcastingChannel[];
      setChannels(data);
      setLoadingChannels(false);

      // Select first channel automatically if none selected
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel || !newMessage.trim() || !currentUser) return;
    
    // Only admins can message broadcasting channels
    const isAdmin = currentProfile?.role === 'admin';
    if (!isAdmin) {
      toast.error('Only administrators are authorized to send broadcasts.');
      return;
    }

    setSendingMessage(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'broadcasting_channels', selectedChannel.id, 'messages'), {
        senderId: currentUser.uid,
        senderName: selectedChannel.name,
        senderIcon: selectedChannel.icon,
        content: content,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to dispatch message.');
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
            <header className="p-6 border-b border-slate-50 shrink-0">
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-[#006e5d]" /> Channels
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                Verified Broadcasting streams
              </p>
            </header>

            {/* Channels List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingChannels ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-slate-200 animate-spin mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syncing Channels...</p>
                </div>
              ) : channels.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60 px-4">
                  <Megaphone className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-800">No active channels</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">
                    Check back later for updates
                  </p>
                </div>
              ) : (
                channels.map((chan) => {
                  const isSelected = selectedChannel?.id === chan.id;
                  return (
                    <button
                      key={chan.id}
                      onClick={() => setSelectedChannel(chan)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${isSelected ? 'bg-teal-50/40 border-[#006e5d]/30 text-[#006e5d]' : 'bg-slate-50/20 border-transparent hover:bg-slate-50'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#006e5d] text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {chan.icon === 'team' ? <Users className="w-5 h-5" /> :
                         chan.icon === 'megaphone' ? <Megaphone className="w-5 h-5" /> :
                         chan.icon === 'support' ? <Shield className="w-5 h-5" /> :
                         <MessageSquare className="w-5 h-5" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className={`text-sm font-black truncate block ${isSelected ? 'text-[#001f19]' : 'text-slate-800'}`}>
                            {chan.name}
                          </span>
                          {chan.isVerified && (
                            <span className="text-yellow-500 inline-block shrink-0" title="Verified Channels Badge">
                              <CheckCircle2 className="w-4 h-4 fill-current text-white" />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold tracking-wider mt-0.5 truncate uppercase">
                          Official Board
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Box Area */}
          <div className="hidden md:flex flex-1 flex-col bg-slate-50/15">
            {selectedChannel ? (
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
                      <div key={msg.id || index} className="flex gap-4 items-start bg-white p-5 rounded-3xl border border-slate-100 shadow-xs max-w-3xl">
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
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <Megaphone className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
                <h3 className="text-base font-black text-slate-700">Select Broadcasting Pipeline</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Choose a verified channel from the left sidebar list to stream official team announcements.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
