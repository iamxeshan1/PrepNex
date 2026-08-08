import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpenText, 
  Library, 
  MessageCircle, 
  LayoutDashboard,
  Trophy
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isAppMode } from '../lib/appMode';

export const MobileBottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadChatMsgs, setUnreadChatMsgs] = React.useState(0);
  const [pendingRequests, setPendingRequests] = React.useState(0);

  // Real-time listener for incoming pending friend requests
  React.useEffect(() => {
    if (!user) {
      setPendingRequests(0);
      return;
    }

    const requestsQ = query(
      collection(db, 'friend_requests'),
      where('receiverId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubRequests = onSnapshot(requestsQ, (snap) => {
      setPendingRequests(snap.docs.length);
    }, (err) => {
      console.error("Error listening to pending friend requests:", err);
    });

    return () => unsubRequests();
  }, [user]);

  // Real-time listener for unread chat messages for this user
  React.useEffect(() => {
    if (!user) {
      setUnreadChatMsgs(0);
      return;
    }

    // Listen to chats where the user is a participant
    const chatsQ = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    let childUnsubs: (() => void)[] = [];

    const unsubChats = onSnapshot(chatsQ, (snapshot) => {
      // Clean up previous child listeners before registering new ones
      childUnsubs.forEach(unsub => unsub());
      childUnsubs = [];

      const chatIds = snapshot.docs.map((d) => d.id);
      if (chatIds.length === 0) {
        setUnreadChatMsgs(0);
        return;
      }

      const unreadCountsMap = new Map<string, number>();

      chatIds.forEach((cId) => {
        const messagesQ = query(
          collection(db, 'chats', cId, 'messages'),
          where('read', '==', false)
        );

        const u = onSnapshot(messagesQ, (msgSnap) => {
          const unreadForChat = msgSnap.docs.filter(
            (doc) => doc.data().senderId !== user.uid
          ).length;
          unreadCountsMap.set(cId, unreadForChat);

          let total = 0;
          unreadCountsMap.forEach((cnt) => { total += cnt; });
          setUnreadChatMsgs(total);
        });

        childUnsubs.push(u);
      });
    }, (err) => {
      console.error("Error listening to chats for badge:", err);
    });

    return () => {
      unsubChats();
      childUnsubs.forEach(unsub => unsub());
    };
  }, [user]);

  const totalChatNotifications = location.pathname === '/chat' ? 0 : unreadChatMsgs + pendingRequests;

  // Only show navigation in App Mode
  if (!isAppMode()) return null;

  const currentPath = location.pathname;

  // Hide on test page (/test/:id) to allow full screen focus during exam
  if (currentPath.startsWith('/test/')) {
    return null;
  }

  const handleTabClick = (path: string, requiresAuth: boolean = false) => {
    if (requiresAuth && !user) {
      navigate('/login');
      return;
    }
    navigate(path);
  };

  const mainNavItems = [
    {
      name: 'Tests',
      icon: BookOpenText,
      path: '/exams',
      requiresAuth: false
    },
    {
      name: 'Subjects',
      icon: Library,
      path: '/subjects',
      requiresAuth: false
    },
    {
      name: 'Chat',
      icon: MessageCircle,
      path: '/chat',
      badge: totalChatNotifications > 0 ? totalChatNotifications : undefined,
      requiresAuth: true
    },
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      requiresAuth: true
    }
  ];

  return (
    <div id="mobile-bottom-nav" className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#031d19]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-emerald-950/80 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] pb-safe-bottom">
      <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-around">
        {mainNavItems.map((item) => {
          const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));
          const IconComponent = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => handleTabClick(item.path, item.requiresAuth)}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-500 dark:text-slate-400 select-none cursor-pointer focus:outline-none"
              id={`bottom-nav-tab-${item.name.toLowerCase()}`}
            >
              <div className="relative p-1">
                {isActive && (
                  <motion.span
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-[#006e5d]/10 dark:bg-emerald-400/10 rounded-full -m-1"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <IconComponent
                  className={`w-5 h-5 transition-colors duration-250 ${
                    isActive
                      ? 'text-[#006e5d] dark:text-emerald-400'
                      : item.badge !== undefined
                      ? 'text-rose-500 font-bold'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                />

                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-[#031d19] shadow-md animate-pulse">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] mt-0.5 font-black uppercase tracking-wider transition-colors duration-250 ${
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
