import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpenText, MessageSquare, MessageCircle, LayoutDashboard, Bell } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isAppMode } from '../lib/appMode';

export const MobileBottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadChatCount, setUnreadChatCount] = React.useState(0);

  // Real-time listener for unread chat messages for this user
  React.useEffect(() => {
    if (!user) return;

    // Listen to chats where the user is a participant
    const chatsQ = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubChats = onSnapshot(chatsQ, (snapshot) => {
      let totalUnread = 0;
      
      snapshot.docs.forEach((chatDoc) => {
        const chatId = chatDoc.id;
        // Query messages in this chat that are unread and not sent by current user
        const messagesQ = query(
          collection(db, 'chats', chatId, 'messages'),
          where('read', '==', false)
        );

        onSnapshot(messagesQ, (msgSnap) => {
          const unreadMsgs = msgSnap.docs.filter(
            (doc) => doc.data().senderId !== user.uid
          );
          // Simple state-friendly aggregate
          setUnreadChatCount((prev) => {
            return unreadMsgs.length > 0 ? prev + 1 : prev;
          });
        });
      });
    }, (err) => {
      console.error("Error listening to chats for badge:", err);
    });

    return () => unsubChats();
  }, [user]);

  // Only show navigation for logged in users in App Mode
  if (!user || !isAppMode()) return null;

  const currentPath = location.pathname;

  // Hide on test page (/test/:id) and result page (/result/:id) to allow full screen focus
  if (currentPath.startsWith('/test/') || currentPath.startsWith('/result/')) {
    return null;
  }

  const navItems = [
    {
      name: 'Tests',
      icon: BookOpenText,
      path: '/exams',
    },
    {
      name: 'Forum',
      icon: MessageSquare,
      path: '/forum',
    },
    {
      name: 'Chat',
      icon: MessageCircle,
      path: '/chat',
      badge: unreadChatCount > 0 ? unreadChatCount : undefined,
    },
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
    },
  ];

  return (
    <div id="mobile-bottom-nav" className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#031d19]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-emerald-950/80 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] pb-safe-bottom">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));
          const IconComponent = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-500 dark:text-slate-400 select-none cursor-pointer focus:outline-none"
              id={`bottom-nav-tab-${item.name.toLowerCase()}`}
            >
              <div className="relative p-1">
                {/* Visual Active Aura */}
                {isActive && (
                  <motion.span
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-[#006e5d]/10 dark:bg-emerald-400/10 rounded-full -m-1"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <IconComponent
                  className={`w-5.5 h-5.5 transition-colors duration-250 ${
                    isActive
                      ? 'text-[#006e5d] dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                />

                {/* Badge Indicator */}
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[9px] font-black min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center border border-white dark:border-[#031d19] shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Tab Title */}
              <span
                className={`text-[10px] mt-1 font-black uppercase tracking-wider transition-colors duration-250 ${
                  isActive
                    ? 'text-[#006e5d] dark:text-emerald-400 font-extrabold'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
