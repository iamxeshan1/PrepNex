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
  MessageCircle
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-[#001f19]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Left side: Logo & Links */}
            <div className="flex items-center gap-8 xl:gap-12">
              <Link to="/" className="flex items-center">
                <span className="font-logo font-black text-4xl tracking-tight text-[#002f26]">Prep<span className="text-teal-600">Next</span></span>
              </Link>

              <div className="hidden lg:flex items-center gap-10">
                <Link to="/exams" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/exams') ? 'text-teal-600' : 'text-slate-600 hover:text-[#002f26]'}`}>Exams</Link>
                <Link to="/subjects" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/subjects') ? 'text-teal-600' : 'text-slate-600 hover:text-[#002f26]'}`}>Subjects</Link>
                <Link to="/live-tests" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/live-tests') ? 'text-teal-600' : 'text-slate-600 hover:text-[#002f26]'}`}>Live Tests</Link>
                <Link to="/announcements" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/announcements') ? 'text-teal-600' : 'text-slate-600 hover:text-[#002f26]'}`}>Announcements</Link>
                <Link to="/study-material" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/study-material') ? 'text-teal-600' : 'text-slate-600 hover:text-[#002f26]'}`}>Study Material</Link>
                {user && (
                  <Link to="/dashboard" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/dashboard') ? 'text-teal-600' : 'text-slate-600 hover:text-[#002f26]'}`}>My Library</Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/admin') ? 'text-teal-600' : 'text-slate-600 hover:text-[#002f26]'}`}>Admin Panel</Link>
                )}
              </div>
            </div>

            {/* Right side: Icons & Profile */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                {user ? (
                  <div className="hidden md:flex items-center gap-4">
                    <button className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors" aria-label="Notifications">
                      <Bell className="w-5 h-5" />
                      <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full border-2 border-white"></span>
                    </button>
                    <button onClick={handleLogout} className="text-sm font-bold text-slate-600 hover:text-[#002f26] transition-colors">Log Out</button>
                    <Link to="/profile" className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 cursor-pointer hover:border-teal-500 transition-colors">
                      <img src={`https://ui-avatars.com/api/?name=${user.email || 'User'}&background=0D8ABC&color=fff`} alt="User" className="w-full h-full object-cover" width="36" height="36" fetchpriority="high" />
                    </Link>
                  </div>
                ) : (
                  <div className="hidden md:flex items-center gap-4">
                    <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-[#002f26] transition-colors">Log In</Link>
                    <Link to="/signup" className="text-sm font-bold bg-teal-700 text-white px-5 py-2.5 rounded-xl hover:bg-teal-800 transition-colors shadow-sm">Get Started</Link>
                  </div>
                )}
                
                {/* Mobile Menu Button */}
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden w-11 h-11 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Toggle menu"
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
                  to="/announcements" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block text-sm font-bold p-3 rounded-xl ${isActive('/announcements') ? 'bg-teal-50 text-teal-600' : 'text-slate-600'}`}
                >
                  Announcements
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
                          width="32"
                          height="32"
                          loading="lazy"
                          className="w-8 h-8 rounded-full" 
                        />
                        <span className="text-sm font-bold text-[#002f26] truncate">{user.email}</span>
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
      <footer className="bg-[#002f26] py-20 relative overflow-hidden mt-12">
        {/* Glow Effects */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-9 gap-12 mb-16">
              <div className="col-span-1 md:col-span-4">
                <Link to="/" className="inline-block mb-6">
                  <span className="font-logo font-black text-3xl tracking-tight text-white drop-shadow-md">Prep<span className="text-teal-400">Next</span></span>
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
                    <li><Link to="/exams" className="text-slate-400 hover:text-teal-400 text-sm font-medium transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-teal-500" /> Exam Library</Link></li>
                    <li><Link to="/subjects" className="text-slate-400 hover:text-teal-400 text-sm font-medium transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-teal-500" /> Subject Catalog</Link></li>
                    <li><Link to="/live-tests" className="text-slate-400 hover:text-teal-400 text-sm font-medium transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-teal-500" /> Live Tests</Link></li>
                    <li><Link to="/study-material" className="text-slate-400 hover:text-teal-400 text-sm font-medium transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-teal-500" /> Study Material</Link></li>
                    {socialLinks.doubtLink && (
                      <li className="pt-2"><a href={socialLinks.doubtLink} target="_blank" rel="noreferrer" className="text-teal-400 py-1.5 px-3 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-xs font-bold transition-colors inline-flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> Doubt Clearing Hub</a></li>
                    )}
                  </ul>
                </div>

                <div className="col-span-1 md:col-span-1">
                  <h4 className="text-white font-sans font-bold mb-6 uppercase text-xs tracking-[0.2em]">Company</h4>
                  <ul className="space-y-3">
                    <li><Link to="/about" className="text-slate-400 hover:text-teal-400 text-sm font-medium transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-teal-500" /> About Us</Link></li>
                    <li><Link to="/privacy-policy" className="text-slate-400 hover:text-teal-400 text-sm font-medium transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-teal-500" /> Privacy Policy</Link></li>
                    <li><Link to="/contact" className="text-slate-400 hover:text-teal-400 text-sm font-medium transition-colors flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-teal-500" /> Contact Support</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          
          <div className="pt-10 pb-6 border-t border-white/5 relative flex flex-col items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-3">
               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">100% Secure Payments Accepted</p>
               <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                  <div className="h-6 px-2 bg-white rounded flex items-center justify-center">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-2.5" />
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
                     <img src="https://upload.wikimedia.org/wikipedia/en/1/12/Jammu_%26_Kashmir_Bank_Logo.svg" alt="J&K Bank" className="h-2.5" />
                  </div>
               </div>
            </div>

            <p className="text-slate-500/70 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-center">
              © 2026 PREPNEXT EDTECH. MADE WITH CONVICTION.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

