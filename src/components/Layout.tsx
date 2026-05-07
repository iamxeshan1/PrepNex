import React from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { 
  Search, 
  Bell, 
  ShoppingCart, 
  Youtube, 
  Instagram, 
  Facebook,
  Send,
  MessageCircle,
  MessageSquare,
  Menu,
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [searchValue, setSearchValue] = React.useState(initialSearch);
  const [socialLinks, setSocialLinks] = React.useState<any>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Left side: Logo & Links */}
            <div className="flex items-center gap-8 xl:gap-12">
              <Link to="/" className="flex items-center">
                <span className="font-logo font-black text-4xl tracking-tight text-[#0f172a]">Prep<span className="text-teal-600">Next</span></span>
              </Link>

              <div className="hidden lg:flex items-center gap-10">
                <Link to="/exams" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/exams') ? 'text-teal-600' : 'text-slate-600 hover:text-slate-900'}`}>Exams</Link>
                <Link to="/subjects" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/subjects') ? 'text-teal-600' : 'text-slate-600 hover:text-slate-900'}`}>Subjects</Link>
                <Link to="/live-tests" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/live-tests') ? 'text-teal-600' : 'text-slate-600 hover:text-slate-900'}`}>Live Tests</Link>
                <Link to="/study-material" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/study-material') ? 'text-teal-600' : 'text-slate-600 hover:text-slate-900'}`}>Study Material</Link>
                {user && (
                  <Link to="/dashboard" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/dashboard') ? 'text-teal-600' : 'text-slate-600 hover:text-slate-900'}`}>My Library</Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/admin') ? 'text-teal-600' : 'text-slate-600 hover:text-slate-900'}`}>Admin Panel</Link>
                )}
              </div>
            </div>

            {/* Right side: Icons & Profile */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                {user ? (
                  <div className="hidden md:flex items-center gap-4">
                    <button className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                      <Bell className="w-5 h-5" />
                      <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full border-2 border-white"></span>
                    </button>
                    <button onClick={handleLogout} className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Log Out</button>
                    <Link to="/profile" className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 cursor-pointer hover:border-teal-500 transition-colors">
                      <img src={`https://ui-avatars.com/api/?name=${user.email || 'User'}&background=0D8ABC&color=fff`} alt="User" className="w-full h-full object-cover" />
                    </Link>
                  </div>
                ) : (
                  <div className="hidden md:flex items-center gap-4">
                    <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Log In</Link>
                    <Link to="/signup" className="text-sm font-bold bg-teal-700 text-white px-5 py-2.5 rounded-xl hover:bg-teal-800 transition-colors shadow-sm">Get Started</Link>
                  </div>
                )}
                
                {/* Mobile Menu Button */}
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t border-slate-100 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                <Link 
                  to="/exams" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block text-sm font-bold p-3 rounded-xl ${isActive('/exams') ? 'bg-teal-50 text-teal-600' : 'text-slate-600'}`}
                >
                  Exams
                </Link>
                <Link 
                  to="/subjects" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block text-sm font-bold p-3 rounded-xl ${isActive('/subjects') ? 'bg-teal-50 text-teal-600' : 'text-slate-600'}`}
                >
                  Subjects
                </Link>
                <Link 
                  to="/live-tests" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block text-sm font-bold p-3 rounded-xl ${isActive('/live-tests') ? 'bg-teal-50 text-teal-600' : 'text-slate-600'}`}
                >
                  Live Tests
                </Link>
                <Link 
                  to="/study-material" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block text-sm font-bold p-3 rounded-xl ${isActive('/study-material') ? 'bg-teal-50 text-teal-600' : 'text-slate-600'}`}
                >
                  Study Material
                </Link>
                {user && (
                  <Link 
                    to="/dashboard" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block text-sm font-bold p-3 rounded-xl ${isActive('/dashboard') ? 'bg-teal-50 text-teal-600' : 'text-slate-600'}`}
                  >
                    My Library
                  </Link>
                )}
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block text-sm font-bold p-3 rounded-xl ${isActive('/admin') ? 'bg-teal-50 text-teal-600' : 'text-slate-600'}`}
                  >
                    Admin Panel
                  </Link>
                )}
                
                <div className="pt-4 border-t border-slate-100">
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${user.email || 'User'}&background=0D8ABC&color=fff`} 
                          alt="User" 
                          className="w-8 h-8 rounded-full" 
                        />
                        <span className="text-sm font-bold text-slate-900 truncate">{user.email}</span>
                      </div>
                      <button 
                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left text-sm font-bold p-3 rounded-xl text-rose-600 hover:bg-rose-50"
                      >
                        Log Out
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <Link 
                        to="/login" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-center text-sm font-bold p-3 rounded-xl text-slate-600 bg-slate-50"
                      >
                        Log In
                      </Link>
                      <Link 
                        to="/signup" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-center text-sm font-bold p-3 rounded-xl text-white bg-teal-700"
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-1 animate-in fade-in duration-500">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 py-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
              <div className="col-span-2 md:col-span-1">
                <Link to="/" className="inline-block mb-6">
                  <span className="font-logo font-black text-2xl tracking-tight text-[#0f172a]">Prep<span className="text-teal-600">Next</span></span>
                </Link>
                <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">
                  Empowering J&K's youth through technology-led education and rigorous exam preparation frameworks.
                </p>
              </div>
              
              <div className="col-span-1">
                <h4 className="text-slate-900 font-sans font-bold mb-6 uppercase text-xs tracking-widest">Explore</h4>
                <ul className="space-y-4">
                  <li><Link to="/exams" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">Exam Library</Link></li>
                  <li><Link to="/subjects" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">Subject Catalog</Link></li>
                  <li><Link to="/live-tests" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">Live Tests</Link></li>
                  <li><Link to="/study-material" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">Study Material</Link></li>
                </ul>
              </div>

              <div className="col-span-1">
                <h4 className="text-slate-900 font-sans font-bold mb-6 uppercase text-xs tracking-widest">Company</h4>
                <ul className="space-y-4">
                  <li><Link to="/about" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">About Us</Link></li>
                  <li><Link to="/privacy-policy" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/contact" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">Contact</Link></li>
                </ul>
              </div>

              <div className="col-span-2 md:col-span-1">
                <h4 className="text-slate-900 font-sans font-bold mb-6 uppercase text-xs tracking-widest">Social</h4>
                <div className="flex flex-wrap items-center gap-4">
                   {/* Social links - update these links in settings panel */}
                   {socialLinks.socialYoutube && (
                     <a href={socialLinks.socialYoutube} target="_blank" rel="noreferrer" className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-all cursor-pointer">
                        <Youtube className="w-5 h-5" />
                     </a>
                   )}
                   {socialLinks.socialInstagram && (
                     <a href={socialLinks.socialInstagram} target="_blank" rel="noreferrer" className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-all cursor-pointer">
                        <Instagram className="w-5 h-5" />
                     </a>
                   )}
                   {socialLinks.socialFacebook && (
                     <a href={socialLinks.socialFacebook} target="_blank" rel="noreferrer" className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-all cursor-pointer">
                        <Facebook className="w-5 h-5" />
                     </a>
                   )}
                   {socialLinks.socialTelegram && (
                     <a href={socialLinks.socialTelegram} target="_blank" rel="noreferrer" className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-all cursor-pointer">
                        <Send className="w-5 h-5" />
                     </a>
                   )}
                   {socialLinks.socialWhatsapp && (
                     <a href={socialLinks.socialWhatsapp} target="_blank" rel="noreferrer" className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-all cursor-pointer">
                        <MessageCircle className="w-5 h-5" />
                     </a>
                   )}
                   {socialLinks.socialDiscord && (
                     <a href={socialLinks.socialDiscord} target="_blank" rel="noreferrer" className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-all cursor-pointer">
                        <MessageSquare className="w-5 h-5" />
                     </a>
                   )}
                </div>
              </div>
            </div>
          
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">© 2026 PREPNEXT EDTECH. MADE WITH CONVICTION.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

