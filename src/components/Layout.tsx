import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { Logo } from './Logo';
import { User as UserIcon, LogOut, Menu, Shield, X, Home, BookOpen, Layers, BarChart, Bell, Zap, Instagram, Facebook, Youtube, Trophy, Users, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const Navbar = () => {
  const { user, isAdmin, profile } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Exams', path: '/exams', icon: Layers },
    { label: 'Subjects', path: '/subjects', icon: BookOpen },
    { label: 'About Us', path: '/about', icon: Users },
    { label: 'Contact Us', path: '/contact', icon: Bell },
    ...(user ? [{ label: 'Helpdesk', path: '/helpdesk', icon: MessageCircle }] : []),
    ...(user ? [{ label: 'My Dashboard', path: '/dashboard', icon: UserIcon }] : []),
    ...(isAdmin ? [{ label: 'Admin Panel', path: '/admin', icon: Shield }] : []),
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-600"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Link to="/" className="flex items-center gap-2 group">
                <Logo className="text-2xl" />
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/exams" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors uppercase tracking-widest text-[10px]">Exams</Link>
              <Link to="/about" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors uppercase tracking-widest text-[10px]">About</Link>
              <Link to="/contact" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors uppercase tracking-widest text-[10px]">Contact</Link>
              {user && (
                <>
                  <Link to="/helpdesk" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors uppercase tracking-widest text-[10px]">Helpdesk</Link>
                  <Link to="/dashboard" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors uppercase tracking-widest text-[10px]">Portal</Link>
                  {isAdmin && (
                    <Link to="/admin" className="text-sm font-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                      <Shield className="w-3 h-3" /> Admin
                    </Link>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {user ? (
                <div className="flex items-center gap-2 sm:gap-4">
                  <Link to="/dashboard" className="hidden sm:flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-full hover:bg-slate-100 transition-colors">
                    <UserIcon className="w-3.5 h-3.5 text-slate-600" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest truncate max-w-[100px]">{user.email?.split('@')[0]}</span>
                  </Link>
                  <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-error transition-colors">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-3 sm:px-4 py-2 hover:text-primary transition-colors">Log In</Link>
                  <Link to="/signup" className="text-[10px] font-black uppercase tracking-widest text-white bg-primary px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 active:scale-95">Signup</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[60]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-full max-w-xs bg-white z-[70] shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-2">
                  <Logo className="text-2xl" />
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Navigation Shortcuts</p>
                {menuItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-slate-600 hover:bg-primary/5 hover:text-primary transition-all group"
                  >
                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-primary/10 transition-colors">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm uppercase tracking-widest">{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="absolute bottom-8 left-8 right-8">
                {profile?.isPremium ? (
                  <div className="p-6 bg-purple-50 rounded-[2rem] border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-4 h-4 text-purple-600" />
                      <span className="text-[10px] font-black text-purple-900 uppercase tracking-widest">Premium Active</span>
                    </div>
                    <p className="text-[10px] text-purple-600 font-bold leading-relaxed mb-4">You have unlimited access to all tests.</p>
                    <Link to="/exams" onClick={() => setIsSidebarOpen(false)} className="block w-full py-3 bg-white border border-purple-200 rounded-xl text-center text-[10px] font-black text-purple-900 uppercase tracking-widest hover:border-purple-300 transition-colors">
                      Library Max
                    </Link>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-secondary fill-secondary" />
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Premium Status</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed mb-4">Unlock 500+ mock tests with PrepNex Pro.</p>
                    <Link to="/premium" onClick={() => setIsSidebarOpen(false)} className="block w-full py-3 bg-white border border-slate-200 rounded-xl text-center text-[10px] font-black text-primary uppercase tracking-widest hover:border-primary transition-colors">
                      Upgrade Now
                    </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchGeneral = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'general'));
        if (snap.exists()) setSettings(snap.data());
      } catch (err) {
        console.error("Error fetching general settings:", err);
      }
    };
    fetchGeneral();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 animate-in fade-in duration-500">
        {children}
      </main>
      <footer className="mt-40 bg-primary pt-24 pb-12 relative overflow-hidden text-white">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
            <div className="md:col-span-5 space-y-8">
              <div className="space-y-6">
                <Logo className="text-4xl inline-block brightness-0 invert" />
                <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm italic">
                  "Your journey to excellence begins with a single step of practice."
                </p>
              </div>
              
              <div className="flex items-center gap-4 p-5 bg-white/5 rounded-3xl border border-white/10 w-fit backdrop-blur-sm">
                <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center text-secondary">
                  <Zap className="w-6 h-6 fill-secondary" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Reach</p>
                  <p className="text-sm font-bold text-white">Serving 10,000+ Aspirants</p>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 md:col-start-7 space-y-8">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Quick Navigation</h4>
              <nav className="flex flex-col gap-4">
                <Link to="/exams" className="text-sm font-bold text-slate-300 hover:text-white transition-all hover:translate-x-1 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary group-hover:scale-150 transition-all" />
                  Exam Library
                </Link>
                <Link to="/subjects" className="text-sm font-bold text-slate-300 hover:text-white transition-all hover:translate-x-1 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary group-hover:scale-150 transition-all" />
                  Subject Wise
                </Link>
                <Link to="/contact" className="text-sm font-bold text-slate-300 hover:text-white transition-all hover:translate-x-1 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary group-hover:scale-150 transition-all" />
                  Need Help?
                </Link>
              </nav>
            </div>
            
            <div className="md:col-span-2 space-y-8">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Legal</h4>
              <nav className="flex flex-col gap-4">
                <Link to="/privacy-policy" className="text-sm font-bold text-slate-300 hover:text-white transition-all hover:translate-x-1">Privacy Policy</Link>
                <Link to="/login" className="text-sm font-bold text-slate-300 hover:text-white transition-all hover:translate-x-1">Login</Link>
              </nav>
            </div>

            <div className="md:col-span-2 space-y-8">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Social Feed</h4>
              <div className="flex flex-wrap gap-4">
                {settings?.socialInstagram && (
                  <a href={settings.socialInstagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-300 hover:bg-pink-600 hover:text-white transition-all duration-300 border border-white/10">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {settings?.socialFacebook && (
                  <a href={settings.socialFacebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-300 hover:bg-blue-600 hover:text-white transition-all duration-300 border border-white/10">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {settings?.socialYoutube && (
                  <a href={settings.socialYoutube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-300 hover:bg-red-600 hover:text-white transition-all duration-300 border border-white/10">
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-4">
              <span>© {new Date().getFullYear()} PREPNEX EDTECH</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>MADE WITH CONVICTION</span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Traffic Optimized</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
