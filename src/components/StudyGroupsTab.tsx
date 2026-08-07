import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Lock, Unlock, Plus, Pin, FileText, Send, Search, 
  X, ChevronRight, Trophy, Trash2, ExternalLink, MessageSquare, 
  Check, Info, Sparkles, LogOut, ArrowLeft, Bookmark
} from 'lucide-react';
import { 
  collection, query, where, getDocs, addDoc, doc, 
  updateDoc, arrayUnion, arrayRemove, onSnapshot, orderBy, serverTimestamp, getDoc, setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string;
  createdAt: number;
  isPrivate: boolean;
  members: string[];
  pinnedPostIds: string[];
  pinnedTestIds: string[];
}

interface GroupMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
}

interface ForumPost {
  id: string;
  title: string;
  category: string;
  authorName: string;
}

interface MockTest {
  id: string;
  title: string;
  examId: string;
  totalMarks: number;
  duration: number;
}

export function StudyGroupsTab() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Navigation states
  const [activeSubTab, setActiveSubTab] = useState<'my_groups' | 'browse'>('my_groups');
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);

  // Data states
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [publicGroups, setPublicGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  
  // Pinned assets states
  const [pinnedPosts, setPinnedPosts] = useState<ForumPost[]>([]);
  const [pinnedTests, setPinnedTests] = useState<MockTest[]>([]);

  // Search and Forms
  const [searchQuery, setSearchQuery] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupPrivate, setNewGroupPrivate] = useState(false);
  const [submittingGroup, setSubmittingGroup] = useState(false);

  // Chat message state
  const [newMessageText, setNewMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pin test modal state
  const [showPinTestModal, setShowPinTestModal] = useState(false);
  const [availableTests, setAvailableTests] = useState<MockTest[]>([]);
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [loadingTests, setLoadingTests] = useState(false);

  // Listeners
  const chatUnsubscribe = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Fetch user's joined groups and public groups
    setLoading(true);
    const groupsRef = collection(db, 'study_groups');

    const unsubscribe = onSnapshot(groupsRef, (snapshot) => {
      const allGroups: StudyGroup[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StudyGroup));

      const joined = allGroups.filter(g => g.members.includes(user.uid));
      const notJoinedPublic = allGroups.filter(g => !g.members.includes(user.uid) && !g.isPrivate);

      setMyGroups(joined);
      setPublicGroups(notJoinedPublic);
      setLoading(false);

      // If a group is currently selected, refresh its data in our state
      if (selectedGroup) {
        const refreshed = allGroups.find(g => g.id === selectedGroup.id);
        if (refreshed) {
          setSelectedGroup(refreshed);
        }
      }
    }, (error) => {
      console.error("Error watching groups:", error);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  // Handle viewing a group
  useEffect(() => {
    if (!selectedGroup) {
      setMessages([]);
      setPinnedPosts([]);
      setPinnedTests([]);
      if (chatUnsubscribe.current) {
        chatUnsubscribe.current();
        chatUnsubscribe.current = null;
      }
      return;
    }

    // Set up chat subcollection listener
    setLoadingMessages(true);
    const msgsRef = collection(db, 'study_groups', selectedGroup.id, 'messages');
    const msgsQuery = query(msgsRef, orderBy('createdAt', 'asc'));

    chatUnsubscribe.current = onSnapshot(msgsQuery, (snapshot) => {
      const fetchedMsgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as GroupMessage));
      setMessages(fetchedMsgs);
      setLoadingMessages(false);
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (err) => {
      console.error("Error reading group chat:", err);
      setLoadingMessages(false);
    });

    // Fetch pinned posts and tests
    fetchPinnedAssets(selectedGroup);

    return () => {
      if (chatUnsubscribe.current) {
        chatUnsubscribe.current();
        chatUnsubscribe.current = null;
      }
    };
  }, [selectedGroup?.id]);

  // Fetch pinned posts and tests details
  const fetchPinnedAssets = async (group: StudyGroup) => {
    try {
      // Fetch posts
      if (group.pinnedPostIds && group.pinnedPostIds.length > 0) {
        const postsTemp: ForumPost[] = [];
        for (const pId of group.pinnedPostIds) {
          const postDoc = await getDoc(doc(db, 'forum_posts', pId));
          if (postDoc.exists()) {
            postsTemp.push({
              id: postDoc.id,
              title: postDoc.data().title || 'Untitled Post',
              category: postDoc.data().category || 'General',
              authorName: postDoc.data().authorName || 'Anonymous'
            });
          } else {
            // Clean up orphan pins
            await updateDoc(doc(db, 'study_groups', group.id), {
              pinnedPostIds: arrayRemove(pId)
            });
          }
        }
        setPinnedPosts(postsTemp);
      } else {
        setPinnedPosts([]);
      }

      // Fetch tests
      if (group.pinnedTestIds && group.pinnedTestIds.length > 0) {
        const testsTemp: MockTest[] = [];
        for (const tId of group.pinnedTestIds) {
          const testDoc = await getDoc(doc(db, 'tests', tId));
          if (testDoc.exists()) {
            testsTemp.push({
              id: testDoc.id,
              title: testDoc.data().title || 'Untitled Test',
              examId: testDoc.data().examId || '',
              totalMarks: testDoc.data().totalMarks || 100,
              duration: testDoc.data().duration || 120
            });
          } else {
            // Clean up orphan pins
            await updateDoc(doc(db, 'study_groups', group.id), {
              pinnedTestIds: arrayRemove(tId)
            });
          }
        }
        setPinnedTests(testsTemp);
      } else {
        setPinnedTests([]);
      }
    } catch (e) {
      console.error("Error fetching pinned items:", e);
    }
  };

  // Create group handler
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newGroupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    setSubmittingGroup(true);
    try {
      const groupData = {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        creatorId: user.uid,
        creatorName: profile?.name || user.displayName || 'Aspirant',
        createdAt: Date.now(),
        isPrivate: newGroupPrivate,
        members: [user.uid],
        pinnedPostIds: [],
        pinnedTestIds: []
      };

      const docRef = await addDoc(collection(db, 'study_groups'), groupData);
      toast.success(`Study Group "${newGroupName}" created!`);
      
      // Reset form
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupPrivate(false);
      setShowCreateModal(false);
      
      // Auto select the new group
      setSelectedGroup({ id: docRef.id, ...groupData });
    } catch (err) {
      console.error("Error creating group:", err);
      toast.error("Failed to create study group.");
    } finally {
      setSubmittingGroup(false);
    }
  };

  // Join group handler
  const handleJoinGroup = async (groupId: string, name: string) => {
    if (!user) {
      toast.error("Please log in to join study groups");
      return;
    }

    try {
      await updateDoc(doc(db, 'study_groups', groupId), {
        members: arrayUnion(user.uid)
      });
      toast.success(`You joined the study group "${name}"!`);
      
      // Find and select the joined group
      const refDoc = await getDoc(doc(db, 'study_groups', groupId));
      if (refDoc.exists()) {
        setSelectedGroup({ id: refDoc.id, ...refDoc.data() } as StudyGroup);
      }
    } catch (err) {
      console.error("Error joining group:", err);
      toast.error("Failed to join study group.");
    }
  };

  // Join private group via join code / group ID
  const handleJoinPrivateWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedCode = joinCodeInput.trim();
    if (!trimmedCode) return;

    try {
      const docRef = doc(db, 'study_groups', trimmedCode);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as StudyGroup;
        if (data.members.includes(user.uid)) {
          toast.success("You are already a member of this group!");
          setSelectedGroup({ id: docSnap.id, ...data });
          setJoinCodeInput('');
          return;
        }

        await updateDoc(docRef, {
          members: arrayUnion(user.uid)
        });
        toast.success(`Successfully joined private study group "${data.name}"!`);
        setSelectedGroup({ id: docSnap.id, ...data, members: [...data.members, user.uid] });
        setJoinCodeInput('');
      } else {
        toast.error("No study group found with this ID.");
      }
    } catch (err) {
      console.error("Error joining with ID:", err);
      toast.error("Invalid join ID or permission denied.");
    }
  };

  // Leave group handler
  const handleLeaveGroup = async (groupId: string, name: string) => {
    if (!user) return;
    if (!window.confirm(`Are you sure you want to leave "${name}"?`)) return;

    try {
      await updateDoc(doc(db, 'study_groups', groupId), {
        members: arrayRemove(user.uid)
      });
      toast.success(`You have left "${name}".`);
      setSelectedGroup(null);
    } catch (err) {
      console.error("Error leaving group:", err);
      toast.error("Failed to leave study group.");
    }
  };

  // Send message inside group chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedGroup || !newMessageText.trim()) return;

    const textToSend = newMessageText.trim();
    setNewMessageText('');

    try {
      await addDoc(collection(db, 'study_groups', selectedGroup.id, 'messages'), {
        senderId: user.uid,
        senderName: profile?.name || user.displayName || 'Aspirant',
        text: textToSend,
        createdAt: Date.now()
      });
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message.");
    }
  };

  // Pin a test handler
  const handlePinTest = async (testId: string, testTitle: string) => {
    if (!selectedGroup) return;

    try {
      await updateDoc(doc(db, 'study_groups', selectedGroup.id), {
        pinnedTestIds: arrayUnion(testId)
      });
      toast.success(`Pinned test "${testTitle}"!`);
      setShowPinTestModal(false);
      
      // Refresh assets list
      const updatedSnap = await getDoc(doc(db, 'study_groups', selectedGroup.id));
      if (updatedSnap.exists()) {
        fetchPinnedAssets({ id: updatedSnap.id, ...updatedSnap.data() } as StudyGroup);
      }
    } catch (e) {
      console.error("Error pinning test:", e);
      toast.error("Failed to pin test.");
    }
  };

  // Unpin test handler
  const handleUnpinTest = async (testId: string, testTitle: string) => {
    if (!selectedGroup) return;
    if (!window.confirm(`Unpin "${testTitle}" from this study group?`)) return;

    try {
      await updateDoc(doc(db, 'study_groups', selectedGroup.id), {
        pinnedTestIds: arrayRemove(testId)
      });
      toast.success(`Unpinned test "${testTitle}".`);
      
      // Refresh assets list
      const updatedSnap = await getDoc(doc(db, 'study_groups', selectedGroup.id));
      if (updatedSnap.exists()) {
        fetchPinnedAssets({ id: updatedSnap.id, ...updatedSnap.data() } as StudyGroup);
      }
    } catch (e) {
      console.error("Error unpinning test:", e);
    }
  };

  // Unpin post handler
  const handleUnpinPost = async (postId: string, postTitle: string) => {
    if (!selectedGroup) return;
    if (!window.confirm(`Unpin post "${postTitle}"?`)) return;

    try {
      await updateDoc(doc(db, 'study_groups', selectedGroup.id), {
        pinnedPostIds: arrayRemove(postId)
      });
      toast.success(`Unpinned post.`);
      
      // Refresh assets list
      const updatedSnap = await getDoc(doc(db, 'study_groups', selectedGroup.id));
      if (updatedSnap.exists()) {
        fetchPinnedAssets({ id: updatedSnap.id, ...updatedSnap.data() } as StudyGroup);
      }
    } catch (e) {
      console.error("Error unpinning post:", e);
    }
  };

  // Open Pin Test Modal and Load Tests
  const openPinTestModal = async () => {
    setShowPinTestModal(true);
    setLoadingTests(true);
    try {
      const snap = await getDocs(collection(db, 'tests'));
      const fetched = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MockTest));
      setAvailableTests(fetched);
    } catch (err) {
      console.error("Error loading tests:", err);
    } finally {
      setLoadingTests(false);
    }
  };

  const filteredMyGroups = myGroups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPublicGroups = publicGroups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Dynamic Header row with Group back button or Join private input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {selectedGroup ? (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedGroup(null)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="Back to group list"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">{selectedGroup.name}</h2>
                {selectedGroup.isPrivate ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/30">
                    <Lock className="w-3 h-3" /> Private Study Group
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-[#006e5d] dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                    <Unlock className="w-3 h-3" /> Public
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedGroup.description || 'Collaborative revision, mock discussions, and doubt clearances.'}</p>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Aspirant Study Groups</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Create private study networks, share mock practice benchmarks, and pin post discussions.</p>
          </div>
        )}

        {/* Buttons / Actions */}
        {!selectedGroup ? (
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleJoinPrivateWithCode} className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Enter Private Join ID"
                value={joinCodeInput}
                onChange={e => setJoinCodeInput(e.target.value)}
                className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold rounded-xl outline-none focus:border-[#006e5d] transition-all"
              />
              <button 
                type="submit" 
                className="bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-slate-950 transition-all shrink-0"
              >
                Join
              </button>
            </form>

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#006e5d] text-white text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm hover:bg-[#005a4c] transition-all"
            >
              <Plus className="w-4 h-4" /> Create Group
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLeaveGroup(selectedGroup.id, selectedGroup.name)}
              className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 text-xs font-bold px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-4 h-4" /> Leave Group
            </button>
          </div>
        )}
      </div>

      {/* Main Area */}
      {!selectedGroup ? (
        // LIST OF GROUPS VIEW
        <div className="space-y-4">
          {/* Sub Navigation & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-850 p-1 rounded-xl">
              <button
                onClick={() => setActiveSubTab('my_groups')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeSubTab === 'my_groups'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                My Groups ({myGroups.length})
              </button>
              <button
                onClick={() => setActiveSubTab('browse')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeSubTab === 'browse'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Browse Public ({publicGroups.length})
              </button>
            </div>

            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search study groups..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-xs font-medium outline-none focus:border-[#006e5d] transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <Users className="w-10 h-10 text-slate-300 animate-pulse mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Loading Study Groups...</p>
            </div>
          ) : activeSubTab === 'my_groups' ? (
            // User's own groups
            filteredMyGroups.length === 0 ? (
              <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-1">No Groups Joined Yet</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto mb-5">Create your own private collaborative space or explore public groups to prepare for JKSSB, SSC, and state exams together!</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setActiveSubTab('browse')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all"
                  >
                    Browse Public Groups
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#006e5d] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#005a4c] transition-all"
                  >
                    Create Group
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMyGroups.map((group) => (
                  <div 
                    key={group.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-[#006e5d] transition-all text-sm leading-tight">{group.name}</h3>
                        {group.isPrivate ? (
                          <span className="flex items-center gap-1 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-rose-400 border border-red-100 dark:border-red-900/30 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0">
                            <Lock className="w-2.5 h-2.5" /> Private
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-emerald-50 text-[#006e5d] dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0">
                            <Unlock className="w-2.5 h-2.5" /> Public
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed mb-4">{group.description || 'No description provided.'}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold text-[#006e5d] dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50/60 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg">
                        <Users className="w-3.5 h-3.5" /> {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                      </span>
                      
                      <button
                        onClick={() => setSelectedGroup(group)}
                        className="text-slate-700 dark:text-slate-300 hover:text-[#006e5d] dark:hover:text-[#006e5d] font-black flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        Enter Group <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Public Groups Browse list
            filteredPublicGroups.length === 0 ? (
              <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 p-6">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-1">No Public Groups</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto mb-4">No other public study groups match your search or exist at the moment.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#006e5d] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#005a4c] transition-all"
                >
                  Create a Public Group
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPublicGroups.map((group) => (
                  <div 
                    key={group.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">{group.name}</h3>
                        <span className="flex items-center gap-1 bg-emerald-50 text-[#006e5d] dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0">
                          <Unlock className="w-2.5 h-2.5" /> Public
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mb-4 leading-relaxed">{group.description || 'No description provided.'}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                      </span>
                      
                      <button
                        onClick={() => handleJoinGroup(group.id, group.name)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-[#006e5d] dark:bg-emerald-950/60 dark:text-emerald-300 px-3.5 py-1.5 rounded-xl font-extrabold transition-all"
                      >
                        Join Group
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      ) : (
        // SELECTED GROUP COLLABORATIVE DASHBOARD VIEW
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left / Middle: Group Assets & Collaborative Chat */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Pinned Board Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Pinned Posts Box */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Pin className="w-4 h-4 text-amber-500 fill-amber-500 rotate-45 shrink-0" />
                    Pinned Discussions ({pinnedPosts.length})
                  </h3>
                </div>

                {pinnedPosts.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50/60 dark:bg-slate-850 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4">
                    <Bookmark className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs text-slate-500 font-medium">No pinned posts yet.</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Click "Pin to Group" on any forum thread to organize study material here.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {pinnedPosts.map(post => (
                      <div 
                        key={post.id} 
                        className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-800 transition-all"
                      >
                        <div className="min-w-0 flex-1">
                          <Link 
                            to={`/forum/${post.id}`} 
                            className="block font-bold text-xs text-slate-900 dark:text-white hover:text-[#006e5d] transition-all truncate"
                          >
                            {post.title}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-medium">
                            <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-md text-[9px] font-black">{post.category}</span>
                            <span>• By {post.authorName}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnpinPost(post.id, post.title)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all shrink-0"
                          title="Unpin Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pinned Practice Tests Box */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
                    Pinned Practice Tests ({pinnedTests.length})
                  </h3>
                  
                  <button
                    onClick={openPinTestModal}
                    className="text-[11px] font-extrabold text-[#006e5d] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Pin Test
                  </button>
                </div>

                {pinnedTests.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50/60 dark:bg-slate-850 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4">
                    <FileText className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs text-slate-500 font-medium">No tests pinned yet.</p>
                    <button
                      onClick={openPinTestModal}
                      className="text-[10px] text-[#006e5d] font-bold underline mt-1"
                    >
                      Pin first mock test
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {pinnedTests.map(test => (
                      <div 
                        key={test.id}
                        className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-800 transition-all"
                      >
                        <div className="min-w-0 flex-1">
                          <button
                            onClick={() => navigate(`/test/${test.id}`)}
                            className="block text-left font-bold text-xs text-slate-900 dark:text-white hover:text-[#006e5d] transition-all truncate"
                          >
                            {test.title}
                          </button>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-medium">
                            <span>{test.duration} mins</span>
                            <span>•</span>
                            <span>{test.totalMarks} Marks</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/test/${test.id}`)}
                            className="p-1.5 hover:bg-emerald-50 text-slate-500 hover:text-[#006e5d] rounded-lg transition-all shrink-0"
                            title="Attempt Test"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleUnpinTest(test.id, test.title)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all shrink-0"
                            title="Unpin Test"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Collaborative Chat Board */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[480px]">
              {/* Chat Header */}
              <div className="bg-slate-50 dark:bg-slate-850 px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4.5 h-4.5 text-[#006e5d]" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Group Study Discussion</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black animate-pulse">
                  Live Sync
                </span>
              </div>

              {/* Chat Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40 dark:bg-slate-900/40">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-slate-400 font-medium animate-pulse">Loading discussion board...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                    <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-bold">No messages yet.</p>
                    <p className="text-[10px] mt-0.5">Start collaborating! Type a message below to share notes or study plans.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === user?.uid;
                    return (
                      <div 
                        key={msg.id || idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        {/* Sender info */}
                        <span className="text-[10px] text-slate-400 font-bold mb-0.5 px-1">
                          {isMe ? 'You' : msg.senderName}
                        </span>
                        
                        {/* Bubble */}
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed ${
                          isMe 
                            ? 'bg-[#006e5d] text-white rounded-br-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-700 rounded-bl-none shadow-sm'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Footer */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a collaborative note or doubt..."
                  value={newMessageText}
                  onChange={e => setNewMessageText(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-850 px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-[#006e5d] transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim()}
                  className="bg-[#006e5d] hover:bg-[#005a4c] disabled:opacity-40 text-white p-2.5 rounded-xl transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Group Meta / Code & Members info */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Private Access Sharing Code */}
            <div className="bg-gradient-to-br from-slate-900 to-[#002f26] text-white rounded-2xl p-5 border border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Users className="w-24 h-24 text-white" />
              </div>
              
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-2">Group Join Code</h3>
              <p className="text-xs text-slate-300 font-medium mb-3">Instruct other aspirants to enter this unique ID to join your private study group.</p>
              
              <div className="flex items-center gap-2">
                <code className="bg-slate-950/80 border border-slate-800 text-xs font-mono font-black select-all px-3 py-2 rounded-xl text-emerald-300 block flex-1 text-center truncate">
                  {selectedGroup.id}
                </code>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedGroup.id);
                    toast.success("Join code copied!");
                  }}
                  className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-xs font-bold transition-all text-white"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Info / Rules Panel */}
            <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-4 space-y-3">
              <div className="flex gap-2 text-amber-800 dark:text-amber-400">
                <Info className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black">Private Collaboration Guide</h4>
                  <p className="text-[11px] font-medium leading-relaxed mt-1 text-amber-700/90 dark:text-amber-300/80">
                    Use this study group to consolidate relevant MCQ polls, difficult questions, and discuss specific mock exam targets securely. Pinned items are synchronized in real-time for all joined members.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* CREATE STUDY GROUP MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#006e5d]" />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Create Study Group</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 ml-1">Group Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Panchayat Secretary GK Prep"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#006e5d] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 ml-1">Short Description</label>
                  <textarea
                    placeholder="Brief objective of this study group..."
                    rows={3}
                    value={newGroupDesc}
                    onChange={e => setNewGroupDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#006e5d] transition-all resize-none"
                  />
                </div>

                {/* Privacy Setting Toggle */}
                <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-white">Private Group</span>
                    <p className="text-[10px] text-slate-400 font-medium">Require unique Join ID to join</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setNewGroupPrivate(!newGroupPrivate)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors outline-none shrink-0 ${
                      newGroupPrivate ? 'bg-[#006e5d]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      newGroupPrivate ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingGroup}
                    className="px-4 py-2 bg-[#006e5d] hover:bg-[#005a4c] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                  >
                    {submittingGroup ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PIN PRACTICE TEST MODAL */}
      <AnimatePresence>
        {showPinTestModal && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Pin Practice Mock Test</h3>
                </div>
                <button
                  onClick={() => setShowPinTestModal(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Test Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search mock tests..."
                  value={testSearchQuery}
                  onChange={e => setTestSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#006e5d] transition-all"
                />
              </div>

              {/* List of tests */}
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                {loadingTests ? (
                  <p className="text-xs text-slate-400 text-center py-4 animate-pulse">Loading mock tests bank...</p>
                ) : availableTests.filter(t => t.title.toLowerCase().includes(testSearchQuery.toLowerCase())).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No matching tests found in bank.</p>
                ) : (
                  availableTests
                    .filter(t => t.title.toLowerCase().includes(testSearchQuery.toLowerCase()))
                    .map(test => {
                      const isAlreadyPinned = selectedGroup?.pinnedTestIds?.includes(test.id);
                      return (
                        <div 
                          key={test.id}
                          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-all"
                        >
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block truncate max-w-[280px]">
                              {test.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {test.duration} mins • {test.totalMarks} Marks
                            </span>
                          </div>
                          
                          {isAlreadyPinned ? (
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Pinned
                            </span>
                          ) : (
                            <button
                              onClick={() => handlePinTest(test.id, test.title)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-[#006e5d] text-[10px] font-black px-2.5 py-1 rounded-lg transition-all"
                            >
                              Pin Test
                            </button>
                          )}
                        </div>
                      );
                    })
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPinTestModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
