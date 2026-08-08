import React from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { 
  Search, 
  Bell, 
  ShoppingCart, 
  Menu,
  X,
  ChevronRight,
  MessageCircle,
  Zap,
  Sun,
  Moon,
  MessageSquare,
  Gift,
  Ticket,
  Copy,
  Check,
  Clock,
  Archive,
  Trash2,
  ArchiveRestore,
  Inbox,
  Trophy,
  BookOpenText,
  Library,
  LayoutDashboard,
  User,
  ShieldCheck,
  Megaphone,
  Book,
  LogIn,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection, query, where, updateDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { isAppMode } from '../lib/appMode';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [searchValue, setSearchValue] = React.useState(initialSearch);
  const [socialLinks, setSocialLinks] = React.useState<any>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [messages, setMessages] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        setUserProfile(snap.data());
      }
    });
    return () => unsub();
  }, [user]);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [currentTab, setCurrentTab] = React.useState<'inbox' | 'archived'>('inbox');
  const [noticesCount, setNoticesCount] = React.useState(0);
  const [jobAlertsCount, setJobAlertsCount] = React.useState(0);

  React.useEffect(() => {
    if (location.pathname === '/announcements') {
      localStorage.setItem('last_seen_notices_time', Date.now().toString());
      setNoticesCount(0);
    }
    if (location.pathname === '/job-alerts') {
      localStorage.setItem('last_seen_job_alerts_time', Date.now().toString());
      setJobAlertsCount(0);
    }
  }, [location.pathname]);

  React.useEffect(() => {
    const unsubNotices = onSnapshot(collection(db, 'notices'), (snap) => {
      if (window.location.pathname === '/announcements') {
        localStorage.setItem('last_seen_notices_time', Date.now().toString());
        setNoticesCount(0);
        return;
      }
      const lastSeenStr = localStorage.getItem('last_seen_notices_time');
      if (!lastSeenStr) {
        setNoticesCount(snap.docs.length);
      } else {
        const lastSeenMs = Number(lastSeenStr);
        let unread = 0;
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const createdMs = data.createdAt ? new Date(data.createdAt).getTime() : 0;
          if (createdMs > lastSeenMs) {
            unread++;
          }
        });
        setNoticesCount(unread);
      }
    }, (err) => console.error(err));

    const unsubJobAlerts = onSnapshot(collection(db, 'jobAlerts'), (snap) => {
      if (window.location.pathname === '/job-alerts') {
        localStorage.setItem('last_seen_job_alerts_time', Date.now().toString());
        setJobAlertsCount(0);
        return;
      }
      const lastSeenStr = localStorage.getItem('last_seen_job_alerts_time');
      if (!lastSeenStr) {
        setJobAlertsCount(snap.docs.length);
      } else {
        const lastSeenMs = Number(lastSeenStr);
        let unread = 0;
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const createdMs = data.createdAt ? new Date(data.createdAt).getTime() : 0;
          if (createdMs > lastSeenMs) {
            unread++;
          }
        });
        setJobAlertsCount(unread);
      }
    }, (err) => console.error(err));

    return () => {
      unsubNotices();
      unsubJobAlerts();
    };
  }, []);

  React.useEffect(() => {
    if (!user) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'user_messages'),
      where('userId', 'in', [user.uid, 'all'])
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a: any, b: any) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      setMessages(list);
    });

    return () => unsub();
  }, [user]);

  const unreadCount = React.useMemo(() => {
    if (!user) return 0;
    return messages.filter(msg => {
      const isDeleted = msg.deletedBy?.includes(user.uid);
      const isArchived = msg.archivedBy?.includes(user.uid);
      const isRead = msg.readBy?.includes(user.uid);
      return !isDeleted && !isArchived && !isRead;
    }).length;
  }, [messages, user]);

  const totalHeaderNotifications = React.useMemo(() => {
    return unreadCount + noticesCount + jobAlertsCount;
  }, [unreadCount, noticesCount, jobAlertsCount]);

  const showHeaderBadge = isAppMode() && totalHeaderNotifications > 0;

  const filteredMessages = React.useMemo(() => {
    if (!user) return [];
    return messages.filter(msg => {
      const isDeleted = msg.deletedBy?.includes(user.uid);
      const isArchived = msg.archivedBy?.includes(user.uid);

      if (currentTab === 'inbox') {
        return !isDeleted && !isArchived;
      } else {
        return !isDeleted && isArchived;
      }
    });
  }, [messages, user, currentTab]);

  const markAsRead = async (msg: any) => {
    if (!user) return;
    const currentReadBy = msg.readBy || [];
    if (currentReadBy.includes(user.uid)) return;

    try {
      await updateDoc(doc(db, 'user_messages', msg.id), {
        readBy: [...currentReadBy, user.uid]
      });
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  React.useEffect(() => {
    if (isNotifOpen && user && messages.length > 0) {
      messages.forEach(msg => {
        const isRead = msg.readBy?.includes(user.uid);
        if (!isRead) {
          markAsRead(msg);
        }
      });
    }
  }, [isNotifOpen, user, messages]);

  const archiveMessage = async (msg: any) => {
    if (!user) return;
    const currentArchivedBy = msg.archivedBy || [];
    if (currentArchivedBy.includes(user.uid)) return;

    try {
      await updateDoc(doc(db, 'user_messages', msg.id), {
        archivedBy: [...currentArchivedBy, user.uid],
        readBy: msg.readBy?.includes(user.uid) ? msg.readBy : [...(msg.readBy || []), user.uid]
      });
    } catch (err) {
      console.error("Failed to archive message:", err);
    }
  };

  const unarchiveMessage = async (msg: any) => {
    if (!user) return;
    const currentArchivedBy = msg.archivedBy || [];

    try {
      await updateDoc(doc(db, 'user_messages', msg.id), {
        archivedBy: currentArchivedBy.filter((uid: string) => uid !== user.uid)
      });
    } catch (err) {
      console.error("Failed to unarchive message:", err);
    }
  };

  const deleteMessage = async (msg: any) => {
    if (!user) return;
    const currentDeletedBy = msg.deletedBy || [];
    if (currentDeletedBy.includes(user.uid)) return;

    try {
      await updateDoc(doc(db, 'user_messages', msg.id), {
        deletedBy: [...currentDeletedBy, user.uid],
        readBy: msg.readBy?.includes(user.uid) ? msg.readBy : [...(msg.readBy || []), user.uid]
      });
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        setSocialLinks(snap.data());
      }
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    setSearchValue(searchParams.get('search') || '');
  }, [searchParams]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#02100d] flex flex-col font-sans text-[#001f19] dark:text-slate-200 transition-colors duration-300">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-white dark:bg-[#031d19] border-b border-slate-200 dark:border-emerald-950/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Left side: Logo & Links */}
            <div className="flex items-center gap-8 xl:gap-12">
              <Link to="/" className="flex items-center">
                <span className="font-logo font-black text-4xl tracking-tight text-[#006e5d] dark:text-emerald-400">PrepNext</span>
              </Link>

              <div className="hidden lg:flex items-center gap-10">
                <Link to="/exams" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/exams') ? 'text-[#006e5d] dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>Exams</Link>
                <Link to="/premium" className={`text-sm font-[700] tracking-tight transition-colors flex items-center gap-1 ${isActive('/premium') ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400'}`}>
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                  Pass Pro
                </Link>
                <Link to="/live-tests" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/live-tests') ? 'text-[#006e5d] dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>Live Tests</Link>
                <Link to="/study-material" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/study-material') ? 'text-[#006e5d] dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>Study Material</Link>
                <Link to="/forum" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/forum') ? 'text-[#006e5d] dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>Forum</Link>
                {user && (
                  <>
                    <Link to="/chat" className={`text-sm font-[700] tracking-tight transition-colors flex items-center gap-1 ${isActive('/chat') ? 'text-[#006e5d] dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
                      <MessageCircle className="w-4 h-4 text-[#006e5d]" />
                      Chat
                    </Link>
                    <Link to="/dashboard" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/dashboard') ? 'text-[#006e5d] dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>My Library</Link>
                  </>
                )}
                {isAdmin && (
                  <Link to="/admin" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/admin') ? 'text-[#006e5d] dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>Admin Panel</Link>
                )}
              </div>
            </div>

            {/* Right side: Icons & Profile */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                {user ? (
                  <div className="hidden md:flex items-center gap-4">
                    <Link to="/premium" className="hidden lg:flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-sm">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      Get Pass Pro
                    </Link>
                    <button onClick={() => setIsNotifOpen(true)} className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-950/30 transition-colors" aria-label="Notifications">
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full border border-white dark:border-[#031d19] text-[9px] font-black flex items-center justify-center shadow-lg">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    <button onClick={handleLogout} className="text-sm font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">Log Out</button>
                    <Link to="/profile" className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 cursor-pointer hover:border-[#006e5d] transition-colors bg-slate-50">
                      <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email || 'User'}&background=006e5d&color=fff`} alt="User" className="w-full h-full object-cover" width="36" height="36" fetchPriority="high" />
                    </Link>
                  </div>
                ) : (
                  <div className="hidden md:flex items-center gap-4">
                    <Link to="/premium" className="hidden lg:flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 text-sm font-bold mr-2 transition-colors">
                      <Zap className="w-4 h-4 fill-current" />
                      Pass Pro
                    </Link>
                    <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">Log In</Link>
                    <Link to="/signup" className="text-sm font-bold bg-[#006e5d] text-white px-5 py-2.5 rounded-xl hover:bg-[#005a4d] transition-colors shadow-sm">Get Started</Link>
                  </div>
                )}
                
                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-emerald-950/50 text-slate-500 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-emerald-950/25 hover:text-[#006e5d] dark:hover:text-emerald-300 transition-all focus:outline-none cursor-pointer"
                  title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  aria-label="Toggle Theme"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Mobile Menu Button */}
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`lg:hidden relative w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    showHeaderBadge
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-2 border-rose-500 shadow-xs'
                      : 'text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-emerald-950/40'
                  }`}
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  {showHeaderBadge && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-rose-600 text-white rounded-full border-2 border-white dark:border-[#031d19] text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                      {totalHeaderNotifications > 99 ? '99+' : totalHeaderNotifications}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
              />

              {/* Slide-up Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                className="relative bg-white dark:bg-[#031d19] border-t border-slate-200 dark:border-emerald-950/80 rounded-t-3xl p-5 shadow-2xl max-h-[88vh] flex flex-col overflow-hidden"
              >
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-emerald-950/60 mb-4 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="font-logo font-black text-2xl tracking-tight text-[#002f26] dark:text-emerald-400">PrepNext</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/80 text-[#006e5d] dark:text-emerald-300 tracking-wider">
                      App Navigation
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-emerald-950/40 text-slate-400 dark:text-slate-500 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Scrollable Content */}
                <div className="overflow-y-auto pr-1 space-y-3 flex-1 pb-4">
                  {/* User Profile / Welcome Card */}
                  {user ? (
                    <div 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/60 dark:to-teal-950/60 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 flex items-center justify-between cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-700 transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img 
                          src={user.photoURL || userProfile?.profilePicture || `https://ui-avatars.com/api/?name=${userProfile?.name || user.displayName || user.email || 'User'}&background=006e5d&color=fff`} 
                          alt="User" 
                          className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-emerald-950 shadow-md shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">
                            {userProfile?.name || user.displayName || 'Aspirant'}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-emerald-950/40 rounded-2xl border border-slate-200 dark:border-emerald-900/40 flex items-center justify-between shadow-xs">
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">Welcome, Aspirant!</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sign in to sync mock test progress & join chat.</p>
                      </div>
                      <Link
                        to="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="px-4 py-2 bg-[#006e5d] hover:bg-[#005a4d] text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 shrink-0 transition-all"
                      >
                        <LogIn className="w-4 h-4" /> Sign In
                      </Link>
                    </div>
                  )}

                  {/* Navigation Links Grid */}
                  <div className="space-y-1.5 pt-1">
                    <Link 
                      to="/exams" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${isActive('/exams') ? 'bg-[#006e5d]/10 text-[#006e5d] dark:text-emerald-400 font-black' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-emerald-950/30'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/80 text-[#006e5d] dark:text-emerald-400">
                          <BookOpenText className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black">Mock Tests & Exam Series</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
                    </Link>

                    <Link 
                      to="/subjects" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${isActive('/subjects') ? 'bg-[#006e5d]/10 text-[#006e5d] dark:text-emerald-400 font-black' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-emerald-950/30'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-teal-100/70 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400">
                          <Library className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black">Subjects & Syllabus</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
                    </Link>

                    <Link 
                      to="/leaderboard" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${isActive('/leaderboard') ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-black' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-emerald-950/30'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100/70 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black">Live Aspirant Leaderboard</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
                    </Link>

                    <Link 
                      to="/forum" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${isActive('/forum') ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-black' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-emerald-950/30'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100/70 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black">Aspirant Social Forum</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
                    </Link>

                    <Link 
                      to="/chat" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${isActive('/chat') ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 font-black' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-emerald-950/30'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100/70 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black">Peer Study Chat & Groups</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
                    </Link>

                    {user && (
                      <>
                        <Link 
                          to="/dashboard" 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${isActive('/dashboard') ? 'bg-emerald-50 text-[#006e5d] dark:bg-emerald-950/50 dark:text-emerald-400 font-black' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-emerald-950/30'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/80 text-[#006e5d] dark:text-emerald-400">
                              <LayoutDashboard className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-black">Student Dashboard</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
                        </Link>

                        <Link 
                          to="/profile" 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${isActive('/profile') ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 font-black' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-emerald-950/30'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100/70 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
                              <User className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-black">My Profile & Settings</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
                        </Link>

                        <button 
                          onClick={() => { setIsNotifOpen(true); setIsMobileMenuOpen(false); }}
                          className="w-full flex items-center justify-between p-3.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-emerald-950/30 transition-all text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/80 text-[#006e5d] dark:text-emerald-400">
                              <Bell className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-black">Student Message Inbox</span>
                          </div>
                          {unreadCount > 0 ? (
                            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                              {unreadCount} new
                            </span>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
                          )}
                        </button>
                      </>
                    )}

                    <Link 
                      to="/job-alerts" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${isActive('/job-alerts') ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 font-black' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-emerald-950/30'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-sky-100/70 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400">
                          <Bell className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black">Job Alerts</span>
                      </div>
                      {jobAlertsCount > 0 ? (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                          {jobAlertsCount}
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
                      )}
                    </Link>

                    <Link 
                      to="/live-tests" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${isActive('/live-tests') ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-black' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-emerald-950/30'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100/70 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                          <Zap className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black">Live Speed Tests</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
                    </Link>

                    <Link 
                      to="/announcements" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${isActive('/announcements') ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 font-black' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-emerald-950/30'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-rose-100/70 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                          <Megaphone className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black">Announcements</span>
                      </div>
                      {noticesCount > 0 ? (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                          {noticesCount}
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
                      )}
                    </Link>

                    <Link 
                      to="/study-material" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${isActive('/study-material') ? 'bg-emerald-50 text-[#006e5d] dark:bg-emerald-950/40 dark:text-emerald-400 font-black' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-emerald-950/30'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                          <Book className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black">Study Material & eBooks</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
                    </Link>

                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-900/60 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-200/70 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-black">Admin Panel</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-purple-400" />
                      </Link>
                    )}
                  </div>

                  {/* Sign Out Account */}
                  {user && (
                    <div className="pt-3 border-t border-slate-100 dark:border-emerald-950/60 mt-2">
                      <button 
                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out Account</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className={`flex-1 animate-in fade-in duration-500 ${isAppMode() ? 'pb-20 lg:pb-0' : ''}`}>
        {children}
      </main>

      {/* Footer */}
      {!isAppMode() && (
      <footer className="bg-[#002f26] py-20 relative overflow-hidden mt-12">
        {/* Glow Effects */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#006e5d]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#006e5d]/10 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-9 gap-12 mb-16">
              <div className="col-span-1 md:col-span-4">
                <Link to="/" className="inline-block mb-6">
                  <span className="font-logo font-black text-3xl tracking-tight text-white drop-shadow-md">PrepNext</span>
                </Link>
                <p className="text-slate-400 text-sm font-medium leading-relaxed pr-8 lg:pr-12 mb-8">
                  Empowering candidates through technology-led education and rigorous exam preparation frameworks.
                </p>
                <div className="flex items-center gap-3">
                   {/* Social links */}
                   <a href={socialLinks.socialYoutube || "#"} target="_blank" rel="noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-[#FF0000] hover:text-white hover:border-transparent transition-all cursor-pointer shadow-lg">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                         <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.377.505 9.377.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                   </a>
                   <a href={socialLinks.socialInstagram || "#"} target="_blank" rel="noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#bc1888] hover:text-white hover:border-transparent transition-all cursor-pointer shadow-lg">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                         <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975-.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.28.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/>
                      </svg>
                   </a>
                   <a href={socialLinks.socialFacebook || "#"} target="_blank" rel="noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-[#1877F2] hover:text-white hover:border-transparent transition-all cursor-pointer shadow-lg">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                         <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                   </a>
                   <a href={socialLinks.socialTelegram || "#"} target="_blank" rel="noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-[#24A1DE] hover:text-white hover:border-transparent transition-all cursor-pointer shadow-lg">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                         <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.24.24-.43.24l.197-2.76 5.03-4.545c.219-.196-.048-.306-.34-.11l-6.22 3.91-2.67-.833c-.58-.182-.592-.581.12-.861l10.424-4.015c.483-.182.905.11.7.982z"/>
                      </svg>
                   </a>
                   <a href={socialLinks.socialWhatsapp || "#"} target="_blank" rel="noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-[#25D366] hover:text-white hover:border-transparent transition-all cursor-pointer shadow-lg">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                         <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                   </a>
                   <a href={socialLinks.socialDiscord || "#"} target="_blank" rel="noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-[#5865F2] hover:text-white hover:border-transparent transition-all cursor-pointer shadow-lg">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                         <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                   </a>
                </div>
              </div>
              
              <div className="col-span-1 md:col-span-5 grid grid-cols-2 gap-8 md:gap-12">
                <div className="col-span-1 md:col-span-1">
                  <h4 className="text-white font-sans font-bold mb-6 uppercase text-xs tracking-[0.2em]">Explore</h4>
                  <ul className="space-y-3">
                    <li><Link to="/exams" className="text-slate-400 hover:text-[#006e5d] text-sm font-medium transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-[#006e5d]" /> Exam Library</Link></li>
                    <li><Link to="/subjects" className="text-slate-400 hover:text-[#006e5d] text-sm font-medium transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-[#006e5d]" /> Subject Catalog</Link></li>
                    <li><Link to="/live-tests" className="text-slate-400 hover:text-[#006e5d] text-sm font-medium transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-[#006e5d]" /> Live Tests</Link></li>
                    <li><Link to="/study-material" className="text-slate-400 hover:text-[#006e5d] text-sm font-medium transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-[#006e5d]" /> Study Material</Link></li>
                    <li><Link to="/forum" className="text-slate-400 hover:text-[#006e5d] text-sm font-medium transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-[#006e5d]" /> Community Forum</Link></li>
                    {socialLinks.doubtLink && (
                      <li className="pt-2"><a href={socialLinks.doubtLink} target="_blank" rel="noreferrer" className="text-[#006e5d] py-1.5 px-3 rounded-lg bg-[#006e5d]/10 hover:bg-[#006e5d]/20 text-xs font-bold transition-colors inline-flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> Doubt Clearing Hub</a></li>
                    )}
                  </ul>
                </div>

                <div className="col-span-1 md:col-span-1">
                  <h4 className="text-white font-sans font-bold mb-6 uppercase text-xs tracking-[0.2em]">Company</h4>
                  <ul className="space-y-3">
                    <li><Link to="/about" className="text-slate-400 hover:text-[#006e5d] text-sm font-medium transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-[#006e5d]" /> About Us</Link></li>
                    <li><Link to="/privacy-policy" className="text-slate-400 hover:text-[#006e5d] text-sm font-medium transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-[#006e5d]" /> Privacy Policy</Link></li>
                    <li><Link to="/contact" className="text-slate-400 hover:text-[#006e5d] text-sm font-medium transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-[#006e5d]" /> Contact Support</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          
          <div className="pt-10 pb-6 border-t border-white/5 relative flex flex-col items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-3">
               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">100% Secure Payments Accepted</p>
               <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                  <div className="h-6 px-2 bg-white rounded flex items-center justify-center">
                     <img src="https://upload.wikimedia.org/wikipedia/en/1/12/Jammu_%26_Kashmir_Bank_Logo.svg" alt="J&K Bank" className="h-2.5" />
                  </div>
                  <div className="h-6 px-2 bg-white rounded flex items-center justify-center">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-3.5" />
                  </div>
                  <div className="h-6 px-2 bg-white rounded flex items-center justify-center">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Rupay-Logo.png" alt="RuPay" className="h-3" />
                  </div>
                  <div className="h-6 px-2 bg-white rounded flex items-center justify-center">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="MasterCard" className="h-3.5" />
                  </div>
                  <div className="h-6 px-2 bg-white rounded flex items-center justify-center">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/9/98/Visa_Inc._logo_%282005%E2%80%932014%29.svg" alt="Visa" className="h-2.5" />
                  </div>
                  <div className="h-6 px-2 bg-white rounded flex items-center justify-center">
                     <img src="https://upload.wikimedia.org/wikipedia/en/5/58/State_Bank_of_India_logo.svg" alt="SBI" className="h-3.5" />
                  </div>
                  <div className="h-6 px-2 bg-white rounded flex items-center justify-center">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/b/b2/Punjab_National_Bank_new_logo.svg" alt="PNB" className="h-3.5" />
                  </div>
                  <div className="h-6 px-2 bg-white rounded flex items-center justify-center">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-2.5" />
                  </div>
               </div>
            </div>


          </div>
        </div>
      </footer>
      )}

      {/* Notifications Side Drawer */}
      <AnimatePresence>
        {isNotifOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotifOpen(false)}
              className="fixed inset-0 bg-[#001f19]/40 backdrop-blur-xs z-50 cursor-pointer"
            />
            {/* Side Drawer Body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-[#031d19] shadow-2xl z-50 border-l border-slate-100 dark:border-emerald-950/45 p-6 flex flex-col"
            >
               <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-emerald-950/30">
                  <div className="flex items-center gap-2.5">
                     <div className="w-10 h-10 bg-[#006e5d]/10 rounded-xl flex items-center justify-center text-[#006e5d] dark:text-emerald-400">
                        <Bell className="w-5 h-5" />
                     </div>
                     <div>
                        <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase font-display">Student Inbox</h2>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-emerald-400/70 uppercase tracking-widest leading-none mt-1">Direct admin broadcasts & rewards</p>
                     </div>
                  </div>
                  <button onClick={() => setIsNotifOpen(false)} className="p-2 border border-slate-100 dark:border-emerald-950/40 rounded-xl hover:bg-slate-50 dark:hover:bg-emerald-950/20 text-slate-400 dark:text-emerald-400 transition-all">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="flex border-b border-slate-100 dark:border-emerald-950/30 mt-3 shrink-0">
                  <button 
                    onClick={() => setCurrentTab('inbox')} 
                    className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider transition-all border-b-2 items-center justify-center gap-1.5 flex ${currentTab === 'inbox' ? 'border-[#006e5d] text-[#006e5d] dark:text-emerald-400 dark:border-emerald-400' : 'border-transparent text-slate-400 dark:text-emerald-600/60 hover:text-slate-600'}`}
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    Active ({messages.filter(msg => !msg.deletedBy?.includes(user?.uid) && !msg.archivedBy?.includes(user?.uid)).length})
                  </button>
                  <button 
                    onClick={() => setCurrentTab('archived')} 
                    className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider transition-all border-b-2 items-center justify-center gap-1.5 flex ${currentTab === 'archived' ? 'border-[#006e5d] text-[#006e5d] dark:text-emerald-400 dark:border-emerald-400' : 'border-transparent text-slate-400 dark:text-emerald-600/60 hover:text-slate-600'}`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archived ({messages.filter(msg => !msg.deletedBy?.includes(user?.uid) && msg.archivedBy?.includes(user?.uid)).length})
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-1">
                  {filteredMessages.length > 0 ? (
                     filteredMessages.map((msg) => {
                        const isRead = msg.readBy?.includes(user?.uid || '');
                        return (
                           <div 
                             key={msg.id} 
                             onClick={() => markAsRead(msg)}
                             className={`p-5 rounded-2xl border transition-all relative cursor-pointer ${isRead ? 'bg-slate-50/50 dark:bg-[#02100d]/30 border-slate-100 dark:border-emerald-950/20' : 'bg-[#e6f3f0]/50 dark:bg-emerald-950/20 border-[#006e5d]/25 dark:border-emerald-400/20 hover:border-[#006e5d] dark:hover:border-emerald-400'}`}
                           >
                              {!isRead && (
                                 <span className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                              )}
                              <div className="flex gap-4">
                                 <div className="w-10 h-10 bg-white dark:bg-[#02100d] rounded-xl border border-slate-100 dark:border-emerald-[#006e5d]/30 flex items-center justify-center shrink-0 shadow-xs">
                                    {msg.type === 'voucher' ? (
                                       <Gift className="w-5 h-5 text-amber-500" />
                                    ) : msg.type === 'coupon' ? (
                                       <Ticket className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                                    ) : (
                                       <MessageSquare className="w-5 h-5 text-[#006e5d] dark:text-emerald-400" />
                                    )}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight mb-1">{msg.title}</h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    
                                    {msg.code && (
                                       <div className="mt-4 p-3 bg-white dark:bg-[#02100d] border border-slate-100 dark:border-emerald-950/40 rounded-xl flex items-center justify-between">
                                          <div className="text-xs font-black text-[#006e5d] dark:text-emerald-400 font-mono tracking-wider">{msg.code}</div>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleCopyCode(msg.code, msg.id); }}
                                            className="px-3 py-1.5 bg-[#006e5d] dark:bg-emerald-800 text-white rounded-lg text-[10px] font-extrabold uppercase transition-all flex items-center gap-1 hover:bg-[#005a4d]"
                                          >
                                             {copiedId === msg.id ? (
                                                <>
                                                   <Check className="w-3.5 h-3.5 text-emerald-300" /> Copied
                                                </>
                                             ) : (
                                                <>
                                                   <Copy className="w-3.5 h-3.5" /> Copy Code
                                                </>
                                             )}
                                          </button>
                                       </div>
                                    )}

                                    <div className="flex items-center justify-between gap-1.5 mt-4 pt-4 border-t border-slate-100 dark:border-emerald-950/20">
                                       <div className="text-[8px] font-black text-slate-300 dark:text-emerald-600/70 uppercase tracking-widest flex items-center gap-1.5">
                                          <Clock className="w-3 h-3" />
                                          {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'Just now'}
                                       </div>
                                       
                                       <div className="flex items-center gap-1 shrink-0">
                                          {currentTab === 'inbox' ? (
                                             <button
                                               onClick={(e) => { e.stopPropagation(); archiveMessage(msg); }}
                                               className="p-1.5 bg-slate-100/40 hover:bg-slate-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/90 rounded-lg text-slate-500 dark:text-emerald-400 hover:text-slate-700 dark:hover:text-emerald-300 transition-all"
                                               title="Archive Message"
                                             >
                                                <Archive className="w-3.5 h-3.5" />
                                             </button>
                                          ) : (
                                             <button
                                               onClick={(e) => { e.stopPropagation(); unarchiveMessage(msg); }}
                                               className="p-1.5 bg-[#e6f3f0] hover:bg-teal-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-950/90 rounded-lg text-[#006e5d] dark:text-emerald-400 hover:text-[#005a4d] transition-all"
                                               title="Restore to active inbox"
                                             >
                                                <ArchiveRestore className="w-3.5 h-3.5" />
                                             </button>
                                          )}
                                          <button
                                            onClick={(e) => { e.stopPropagation(); deleteMessage(msg); }}
                                            className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/50 rounded-lg text-rose-400 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 transition-all"
                                            title="Permanently remove / dismiss"
                                          >
                                             <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        );
                     })
                  ) : (
                     <div className="py-24 text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-emerald-950/20 border-2 border-dashed border-slate-100 dark:border-emerald-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                           <MessageSquare className="w-6 h-6 text-slate-300 dark:text-emerald-600" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">
                           All caught up! {currentTab === 'inbox' ? 'Active inbox is empty.' : 'Archived list is empty.'}
                        </p>
                     </div>
                  )}
               </div>

               <div className="pt-4 border-t border-slate-100 dark:border-emerald-950/30 flex justify-between items-center text-[8px] text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                  <span>Verified Security Node</span>
                  <span>Prepnext student message systems</span>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

