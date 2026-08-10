import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { 
  collection, 
  addDoc, 
  updateDoc,
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc,
  getDocs,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Send, 
  Trash2, 
  Plus, 
  Edit3,
  Lock,
  Globe,
  CheckCircle2, 
  Clock, 
  Shield, 
  MessageSquare, 
  Users, 
  Loader2, 
  Megaphone,
  Check,
  User,
  Hash,
  AlertTriangle,
  Sparkles,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmationModal from '../../components/ConfirmationModal';
import Toast, { ToastType } from '../../components/Toast';

interface BroadcastingChannel {
  id: string;
  name: string;
  icon: string; // e.g. 'team', 'megaphone', 'support'
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
}

export default function Broadcasts() {
  const [channels, setChannels] = useState<BroadcastingChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<BroadcastingChannel | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [creatingChannel, setCreatingChannel] = useState(false);

  // Edit Channel Modal State
  const [editingChannel, setEditingChannel] = useState<BroadcastingChannel | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    icon: 'team',
    whoCanPost: 'admin_only' as 'admin_only' | 'everyone'
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Channel Creation Form State
  const [channelForm, setChannelForm] = useState({
    name: 'Team Prepnext',
    icon: 'team',
    whoCanPost: 'admin_only' as 'admin_only' | 'everyone'
  });

  // Message Send Form State
  const [messageContent, setMessageContent] = useState('');

  // Toast State
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as ToastType
  });

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    actionType: 'channel' as 'channel' | 'message',
    targetId: '',
    title: '',
    message: ''
  });

  // Listen to all broadcasting channels in real-time
  useEffect(() => {
    const q = query(collection(db, 'broadcasting_channels'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BroadcastingChannel[];
      setChannels(data);
      setLoadingChannels(false);

      // Set default selected channel if none selected and channels exist
      if (data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0]);
      }
    }, (err) => {
      console.error("Error loading channels:", err);
      setLoadingChannels(false);
    });

    return () => unsub();
  }, [selectedChannel]);

  // Listen to messages of the selected channel in real-time
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
      console.error("Error loading channel messages:", err);
      setLoadingMessages(false);
    });

    return () => unsub();
  }, [selectedChannel]);

  // Create a new broadcasting channel
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelForm.name.trim()) return;

    setCreatingChannel(true);
    try {
      const allowAspirantMessages = channelForm.whoCanPost === 'everyone';

      // Add channel document
      const docRef = await addDoc(collection(db, 'broadcasting_channels'), {
        name: channelForm.name.trim(),
        icon: channelForm.icon,
        isVerified: true, // Admin-created channels are always automatically verified
        allowAspirantMessages: allowAspirantMessages,
        whoCanPost: channelForm.whoCanPost,
        createdAt: new Date().toISOString()
      });

      // Send initial welcome message
      await addDoc(collection(db, 'broadcasting_channels', docRef.id, 'messages'), {
        senderId: 'admin',
        senderName: channelForm.name.trim(),
        senderIcon: channelForm.icon,
        content: `Welcome to the ${channelForm.name.trim()} verified channel. Stay tuned for official updates, notifications, and study strategies directly from the core team!`,
        createdAt: new Date().toISOString()
      });

      setToast({
        isVisible: true,
        message: `Verified Channel "${channelForm.name}" created successfully!`,
        type: 'success'
      });

      // Reset form to default
      setChannelForm({
        name: 'Team Prepnext',
        icon: 'team',
        whoCanPost: 'admin_only'
      });
    } catch (err) {
      console.error(err);
      setToast({
        isVisible: true,
        message: 'Failed to create channel.',
        type: 'error'
      });
    } finally {
      setCreatingChannel(false);
    }
  };

  // Open Edit Channel Modal
  const handleOpenEditChannel = (channel: BroadcastingChannel) => {
    setEditingChannel(channel);
    setEditForm({
      name: channel.name,
      icon: channel.icon || 'team',
      whoCanPost: channel.whoCanPost || (channel.allowAspirantMessages ? 'everyone' : 'admin_only')
    });
  };

  // Update existing channel
  const handleUpdateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel || !editForm.name.trim()) return;

    setSavingEdit(true);
    try {
      const allowAspirantMessages = editForm.whoCanPost === 'everyone';
      const channelRef = doc(db, 'broadcasting_channels', editingChannel.id);

      await updateDoc(channelRef, {
        name: editForm.name.trim(),
        icon: editForm.icon,
        allowAspirantMessages: allowAspirantMessages,
        whoCanPost: editForm.whoCanPost
      });

      // Update local state if currently selected
      if (selectedChannel?.id === editingChannel.id) {
        setSelectedChannel(prev => prev ? {
          ...prev,
          name: editForm.name.trim(),
          icon: editForm.icon,
          allowAspirantMessages: allowAspirantMessages,
          whoCanPost: editForm.whoCanPost
        } : null);
      }

      setToast({
        isVisible: true,
        message: 'Channel settings updated successfully!',
        type: 'success'
      });
      setEditingChannel(null);
    } catch (err) {
      console.error("Error updating channel:", err);
      setToast({
        isVisible: true,
        message: 'Failed to update channel.',
        type: 'error'
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // Send message to current channel
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel || !messageContent.trim()) return;

    setSendingMessage(true);
    const textToSend = messageContent.trim();
    setMessageContent('');

    try {
      await addDoc(collection(db, 'broadcasting_channels', selectedChannel.id, 'messages'), {
        senderId: 'admin',
        senderName: selectedChannel.name,
        senderIcon: selectedChannel.icon,
        content: textToSend,
        createdAt: new Date().toISOString()
      });

      setToast({
        isVisible: true,
        message: 'Message broadcasted successfully!',
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      setToast({
        isVisible: true,
        message: 'Failed to dispatch message.',
        type: 'error'
      });
      setMessageContent(textToSend); // Restore if failed
    } finally {
      setSendingMessage(false);
    }
  };

  // Delete channel confirmation
  const handleDeleteChannel = (channel: BroadcastingChannel) => {
    setConfirmModal({
      isOpen: true,
      actionType: 'channel',
      targetId: channel.id,
      title: 'Delete Broadcasting Channel',
      message: `Are you sure you want to permanently delete the channel "${channel.name}"? This action will permanently remove all messages and revoke access for all aspirants.`
    });
  };

  // Delete message confirmation
  const handleDeleteMessage = (msgId: string) => {
    if (!selectedChannel) return;
    setConfirmModal({
      isOpen: true,
      actionType: 'message',
      targetId: msgId,
      title: 'Delete Broadcast Message',
      message: 'Are you sure you want to remove this specific message from the broadcasting ledger? This cannot be undone.'
    });
  };

  const handleConfirmAction = async () => {
    const { actionType, targetId } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    try {
      if (actionType === 'channel') {
        await deleteDoc(doc(db, 'broadcasting_channels', targetId));
        if (selectedChannel?.id === targetId) {
          setSelectedChannel(null);
        }
        setToast({
          isVisible: true,
          message: 'Broadcasting channel successfully deleted.',
          type: 'success'
        });
      } else if (actionType === 'message' && selectedChannel) {
        await deleteDoc(doc(db, 'broadcasting_channels', selectedChannel.id, 'messages', targetId));
        setToast({
          isVisible: true,
          message: 'Broadcast message removed successfully.',
          type: 'success'
        });
      }
    } catch (err) {
      console.error(err);
      setToast({
        isVisible: true,
        message: 'Operation failed.',
        type: 'error'
      });
    }
  };

  return (
    <AdminLayout title="Broadcasting Channels Manager">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Verified Broadcasting Channels</h2>
          <p className="text-[10px] font-black text-[#006e5d] uppercase tracking-widest mt-1 italic">
            Manage official broadcasting pipelines with yellow verified badges. Only admins can message these streams.
          </p>
        </div>
        <div className="w-14 h-14 bg-[#006e5d] text-white rounded-2xl flex items-center justify-center shadow-xl shadow-teal-100">
          <Megaphone className="w-7 h-7" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-32">
        {/* Left Column: Create Channel & Channels List */}
        <div className="space-y-8">
          {/* Create Channel Block */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#006e5d]" /> Create Broadcasting Channel
            </h3>
            
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Channel Name
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g., Team Prepnext"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#006e5d]/10 outline-none"
                  value={channelForm.name}
                  onChange={e => setChannelForm({ ...channelForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Icon Identifier
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#006e5d]/10 outline-none"
                  value={channelForm.icon}
                  onChange={e => setChannelForm({ ...channelForm, icon: e.target.value })}
                >
                  <option value="team">Team / Users Icon 👥</option>
                  <option value="megaphone">Megaphone Icon 📢</option>
                  <option value="support">Help/Shield Icon 🛡️</option>
                  <option value="academic">Academic/Graduation Icon 🎓</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Who Can Post Messages?
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#006e5d]/10 outline-none"
                  value={channelForm.whoCanPost}
                  onChange={e => setChannelForm({ ...channelForm, whoCanPost: e.target.value as 'admin_only' | 'everyone' })}
                >
                  <option value="admin_only">🔒 Only Admin (Broadcast Only)</option>
                  <option value="everyone">🌐 Admin + Aspirants (Everyone can post)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creatingChannel}
                className="w-full py-3 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {creatingChannel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Verified Channel
              </button>
            </form>
          </div>

          {/* Channels List Block */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col min-h-[300px]">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Active Channels ({channels.length})</span>
            </h3>

            {loadingChannels ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10">
                <Loader2 className="w-8 h-8 text-slate-200 animate-spin mb-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading channels...</p>
              </div>
            ) : channels.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-60">
                <Megaphone className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-400">No active broadcasting channels.</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[400px] pr-1">
                {channels.map((chan) => {
                  const isSelected = selectedChannel?.id === chan.id;
                  return (
                    <div 
                      key={chan.id}
                      onClick={() => setSelectedChannel(chan)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${isSelected ? 'bg-teal-50/50 border-[#006e5d]/30 text-[#006e5d]' : 'bg-slate-50/40 border-slate-100 hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#006e5d] text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {chan.icon === 'team' ? <Users className="w-4 h-4" /> :
                           chan.icon === 'megaphone' ? <Megaphone className="w-4 h-4" /> :
                           chan.icon === 'support' ? <Shield className="w-4 h-4" /> :
                           <MessageSquare className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className={`text-sm font-black truncate ${isSelected ? 'text-[#001f19]' : 'text-slate-800'}`}>
                              {chan.name}
                            </span>
                            {chan.isVerified && (
                              <span className="text-yellow-500 inline-block shrink-0" title="Verified Channel">
                                <CheckCircle2 className="w-3.5 h-3.5 fill-current text-white" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                              chan.allowAspirantMessages || chan.whoCanPost === 'everyone'
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              {chan.allowAspirantMessages || chan.whoCanPost === 'everyone' ? (
                                <><Globe className="w-2.5 h-2.5" /> Everyone Can Post</>
                              ) : (
                                <><Lock className="w-2.5 h-2.5" /> Only Admin</>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditChannel(chan);
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#006e5d] hover:bg-teal-50 rounded-lg transition-all"
                          title="Edit Channel Settings"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChannel(chan);
                          }}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Channel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Channel Detail, Messages Log & Dispatch Form */}
        <div className="lg:col-span-2 space-y-8">
          {selectedChannel ? (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
              {/* Channel Header Banner */}
              <div className="bg-slate-50/80 border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#006e5d]/10 text-[#006e5d] rounded-xl flex items-center justify-center">
                    {selectedChannel.icon === 'team' ? <Users className="w-5 h-5" /> :
                     selectedChannel.icon === 'megaphone' ? <Megaphone className="w-5 h-5" /> :
                     selectedChannel.icon === 'support' ? <Shield className="w-5 h-5" /> :
                     <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-base font-extrabold text-slate-900">{selectedChannel.name}</h4>
                      {selectedChannel.isVerified && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-yellow-400/10 text-yellow-600 border border-yellow-400/30">
                          <CheckCircle2 className="w-3 h-3 fill-current text-white text-yellow-500" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Disseminates verified notices directly to all students
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenEditChannel(selectedChannel)}
                    className="p-2 text-slate-500 hover:text-[#006e5d] hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
                    title="Edit Channel Settings"
                  >
                    <Edit3 className="w-4 h-4 text-[#006e5d]" />
                    <span>Edit Channel</span>
                  </button>

                  <div className="text-right border-l border-slate-200 pl-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Created</span>
                    <span className="text-xs font-black text-slate-600">
                      {new Date(selectedChannel.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Channel Message Log */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20 space-y-4">
                {loadingMessages ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-slate-300 animate-spin mb-2" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Streaming messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                    <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-xs font-medium text-slate-400">No messages sent in this channel yet.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="bg-white p-4 rounded-2xl border border-slate-100/80 shadow-xs relative group flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        {selectedChannel.icon === 'team' ? <Users className="w-4 h-4" /> :
                         selectedChannel.icon === 'megaphone' ? <Megaphone className="w-4 h-4" /> :
                         selectedChannel.icon === 'support' ? <Shield className="w-4 h-4" /> :
                         <MessageSquare className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-800">{msg.senderName}</span>
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 tracking-wider uppercase border border-yellow-500/20">
                              Admin Broadcast
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-400">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1 text-slate-300 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
                              title="Delete Message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap pr-10">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Dispatcher Form */}
              <div className="border-t border-slate-100 p-4 bg-white shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    required
                    placeholder={`Message #${selectedChannel.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#006e5d]/15 text-sm font-medium"
                    value={messageContent}
                    onChange={e => setMessageContent(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !messageContent.trim()}
                    className="px-6 py-3.5 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Broadcast
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center p-12 h-[600px] opacity-75">
              <Megaphone className="w-12 h-12 text-slate-300 mb-4 animate-bounce" />
              <h4 className="text-lg font-black text-slate-800">No Channel Selected</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Select an active broadcasting pipeline from the left sidebar panel or create a new "Team Prepnext" channel.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Channel Modal */}
      <AnimatePresence>
        {editingChannel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 relative"
            >
              <button
                onClick={() => setEditingChannel(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#006e5d]" /> Edit Channel Settings
              </h3>

              <form onSubmit={handleUpdateChannel} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#006e5d]/10"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Icon Identifier
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#006e5d]/10"
                    value={editForm.icon}
                    onChange={e => setEditForm({ ...editForm, icon: e.target.value })}
                  >
                    <option value="team">Team / Users Icon 👥</option>
                    <option value="megaphone">Megaphone Icon 📢</option>
                    <option value="support">Help/Shield Icon 🛡️</option>
                    <option value="academic">Academic/Graduation Icon 🎓</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Who Can Post Messages?
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#006e5d]/10"
                    value={editForm.whoCanPost}
                    onChange={e => setEditForm({ ...editForm, whoCanPost: e.target.value as 'admin_only' | 'everyone' })}
                  >
                    <option value="admin_only">🔒 Only Admin (Broadcast Only)</option>
                    <option value="everyone">🌐 Admin + Aspirants (Everyone can post)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingChannel(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit || !editForm.name.trim()}
                    className="px-5 py-2.5 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
        confirmText="Confirm Purge"
      />

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </AdminLayout>
  );
}
