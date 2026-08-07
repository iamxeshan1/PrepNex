import React, { useState, useEffect } from 'react';
import { Users, X, Check, Pin } from 'lucide-react';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface PinPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
}

interface SimpleGroup {
  id: string;
  name: string;
  pinnedPostIds: string[];
}

export function PinPostModal({ isOpen, onClose, postId, postTitle }: PinPostModalProps) {
  const { user } = useAuth();
  const [joinedGroups, setJoinedGroups] = useState<SimpleGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchMyGroups = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'study_groups'),
          where('members', 'array-contains', user.uid)
        );
        const snap = await getDocs(q);
        const groups = snap.docs.map(docSnap => ({
          id: docSnap.id,
          name: docSnap.data().name || 'Unnamed Group',
          pinnedPostIds: docSnap.data().pinnedPostIds || []
        }));
        setJoinedGroups(groups);
      } catch (err) {
        console.error("Error fetching joined groups for pinning:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyGroups();
  }, [isOpen, user?.uid]);

  const handlePinToGroup = async (group: SimpleGroup) => {
    try {
      await updateDoc(doc(db, 'study_groups', group.id), {
        pinnedPostIds: arrayUnion(postId)
      });
      toast.success(`Pinned to "${group.name}"!`);
      
      // Update local state to reflect change instantly
      setJoinedGroups(prev => prev.map(g => {
        if (g.id === group.id) {
          return { ...g, pinnedPostIds: [...g.pinnedPostIds, postId] };
        }
        return g;
      }));
    } catch (err) {
      console.error("Error pinning post to study group:", err);
      toast.error("Failed to pin discussion.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pin className="w-5 h-5 text-emerald-600 rotate-45" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">Pin to Study Group</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Organize this discussion in one of your active collaborative networks:
          </p>
          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
            "{postTitle}"
          </div>
        </div>

        <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <p className="text-xs text-slate-400 text-center py-4 animate-pulse">Loading study groups list...</p>
          ) : joinedGroups.length === 0 ? (
            <div className="text-center py-6 text-slate-400 space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold">You are not a member of any study group.</p>
              <p className="text-[10px]">Create or join a study group first inside the "Study Groups" forum tab.</p>
            </div>
          ) : (
            joinedGroups.map(group => {
              const isAlreadyPinned = group.pinnedPostIds.includes(postId);
              return (
                <div 
                  key={group.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-all"
                >
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate max-w-[240px]">
                    {group.name}
                  </span>
                  
                  {isAlreadyPinned ? (
                    <span className="text-[10px] bg-slate-150 text-slate-500 font-bold px-2 py-1 rounded-lg flex items-center gap-1 shrink-0">
                      <Check className="w-3.5 h-3.5" /> Pinned
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePinToGroup(group)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-[#006e5d] text-[10px] font-black px-3 py-1 rounded-lg transition-all shrink-0"
                    >
                      Pin Here
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
