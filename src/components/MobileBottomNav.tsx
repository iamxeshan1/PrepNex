import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpenText, 
  Trophy, 
  MessageSquare, 
  MessageCircle, 
  LayoutDashboard, 
  Menu, 
  X, 
  User, 
  CreditCard, 
  Megaphone, 
  LogOut, 
  LogIn, 
  ShieldCheck,
  ChevronRight,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isAppMode } from '../lib/appMode';

export const MobileBottomNav = () => {
  const { user, profile, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadChatCount, setUnreadChatCount] = React.useState(0);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Real-time listener for unread chat messages for this user
  React.useEffect(() => {
    if (!user) return;

    // Listen to chats where the user is a participant
    const chatsQ = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubChats = onSnapshot(chatsQ, (snapshot) => {
      snapshot.docs.forEach((chatDoc) => {
        const chatId = chatDoc.id;
        const messagesQ = query(
          collection(db, 'chats', chatId, 'messages'),
          where('read', '==', false)
        );

        onSnapshot(messagesQ, (msgSnap) => {
          const unreadMsgs = msgSnap.docs.filter(
            (doc) => doc.data().senderId !== user.uid
          );
          setUnreadChatCount((prev) => (unreadMsgs.length > 0 ? prev + 1 : prev));
        });
      });
    }, (err) => {
      console.error("Error listening to chats for badge:", err);
    });

    return () => unsubChats();
  }, [user]);

  // Only show navigation in App Mode
  if (!isAppMode()) return null;

  const currentPath = location.pathname;

  // Hide on test page (/test/:id) and result page (/result/:id) to allow full screen focus
  if (currentPath.startsWith('/test/') || currentPath.startsWith('/result/')) {
    return null;
  }

  const handleTabClick = (path: string, requiresAuth: boolean = false) => {
    setIsMoreMenuOpen(false);
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
      name: 'Leaderboard',
      icon: Trophy,
      path: '/leaderboard',
      requiresAuth: false
    },
    {
      name: 'Forum',
      icon: MessageSquare,
      path: '/forum',
      requiresAuth: false
    },
    {
      name: 'Chat',
      icon: MessageCircle,
      path: '/chat',
      badge: unreadChatCount > 0 ? unreadChatCount : undefined,
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
    <>
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
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  />

                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[9px] font-black min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center border border-white dark:border-[#031d19] shadow-sm animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[9px] mt-0.5 font-black uppercase tracking-wider transition-colors duration-250 ${
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

          {/* More Menu Trigger Button */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className="relative flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-500 dark:text-slate-400 select-none cursor-pointer focus:outline-none"
            id="bottom-nav-tab-more"
          >
            <div className="p-1">
              <Menu className="w-5 h-5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300" />
            </div>
            <span className="text-[9px] mt-0.5 font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              More
            </span>
          </button>
        </div>
      </div>

      {/* Slide-Up Full Website Options Drawer */}
      <AnimatePresence>
        {isMoreMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreMenuOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-[#031d19] border-t border-slate-200 dark:border-emerald-950/80 rounded-t-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-emerald-950/50 mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-logo font-black text-2xl text-[#002f26] dark:text-emerald-400">PrepNext</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/80 text-[#006e5d] dark:text-emerald-300">
                    App Navigation
                  </span>
                </div>
                <button
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-emerald-950/40 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Bar */}
              {user ? (
                <div 
                  onClick={() => handleTabClick('/profile', true)}
                  className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between mb-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=006e5d&color=fff`} 
                      alt="User" 
                      className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-emerald-950"
                    />
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">
                        {user.displayName || profile?.name || 'Aspirant'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">Welcome, Aspirant!</h4>
                    <p className="text-xs text-slate-500 font-medium">Sign in to sync mock test progress & join chat.</p>
                  </div>
                  <button
                    onClick={() => handleTabClick('/login')}
                    className="px-4 py-2 bg-[#006e5d] text-white font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" /> Sign In
                  </button>
                </div>
              )}

              {/* Comprehensive Website Menu Links */}
              <div className="space-y-1">
                <button
                  onClick={() => handleTabClick('/exams')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-emerald-950/20 rounded-xl text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-50 dark:bg-emerald-950/50 text-[#006e5d] dark:text-emerald-400">
                      <BookOpenText className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Mock Tests & Exam Series</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabClick('/leaderboard')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-emerald-950/20 rounded-xl text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Live Aspirant Leaderboard</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabClick('/forum')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-emerald-950/20 rounded-xl text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Aspirant Social Discussion Forum</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabClick('/chat', true)}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-emerald-950/20 rounded-xl text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Peer Study Chat & Groups</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabClick('/dashboard', true)}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-emerald-950/20 rounded-xl text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-[#006e5d] dark:text-emerald-400">
                      <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Student Dashboard</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabClick('/profile', true)}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-emerald-950/20 rounded-xl text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">My Profile & Handle</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabClick('/announcements')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-emerald-950/20 rounded-xl text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Notifications & Updates</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleTabClick('/admin/dashboard', true)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-xl text-left transition-colors border border-purple-200/50 dark:border-purple-900/50 my-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <span className="font-extrabold text-sm text-purple-800 dark:text-purple-300">Admin Console</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-400" />
                  </button>
                )}
              </div>

              {/* Sign Out Action if logged in */}
              {user && (
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-emerald-950/50">
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Log Out of PrepNext App
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
