import React from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { Search, Bell, ShoppingCart, Youtube, Instagram, Facebook } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [searchValue, setSearchValue] = React.useState(initialSearch);

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
                <Link to="/dashboard" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/dashboard') ? 'text-teal-600' : 'text-slate-600 hover:text-slate-900'}`}>My Library</Link>
                {isAdmin && (
                  <Link to="/admin" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/admin') ? 'text-teal-600' : 'text-slate-600 hover:text-slate-900'}`}>Admin Panel</Link>
                )}
                <Link to="/analysis" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/analysis') ? 'text-teal-600' : 'text-slate-600 hover:text-slate-900'}`}>Analysis</Link>
                <Link to="/resources" className={`text-sm font-[700] tracking-tight transition-colors ${isActive('/resources') ? 'text-teal-600' : 'text-slate-600 hover:text-slate-900'}`}>Resources</Link>
              </div>
            </div>

            {/* Right side: Icons & Profile */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                {user ? (
                  <>
                    <button className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                      <Bell className="w-5 h-5" />
                      <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full border-2 border-white"></span>
                    </button>
                    <button onClick={handleLogout} className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Log Out</button>
                    <Link to="/dashboard" className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 cursor-pointer hover:border-teal-500 transition-colors">
                      <img src={`https://ui-avatars.com/api/?name=${user.email || 'User'}&background=0D8ABC&color=fff`} alt="User" className="w-full h-full object-cover" />
                    </Link>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Log In</Link>
                    <Link to="/signup" className="text-sm font-bold bg-teal-700 text-white px-5 py-2.5 rounded-xl hover:bg-teal-800 transition-colors shadow-sm">Get Started</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 animate-in fade-in duration-500">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 py-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <Link to="/" className="inline-block mb-6">
                <span className="font-logo font-black text-2xl tracking-tight text-[#0f172a]">Prep<span className="text-teal-600">Next</span></span>
              </Link>
              <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">
                Empowering J&K's youth through technology-led education and rigorous exam preparation frameworks.
              </p>
            </div>
            
            <div>
              <h4 className="text-slate-900 font-sans font-bold mb-6 uppercase text-xs tracking-widest">Explore</h4>
              <ul className="space-y-4">
                <li><Link to="/exams" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">Exam Library</Link></li>
                <li><Link to="/study-material" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">Study Material</Link></li>
                <li><Link to="/articles" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">Articles</Link></li>
                <li><Link to="/updates" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">JKPSC Updates</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-900 font-sans font-bold mb-6 uppercase text-xs tracking-widest">Company</h4>
              <ul className="space-y-4">
                <li><Link to="/about" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">About Us</Link></li>
                <li><Link to="/success-stories" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">Success Stories</Link></li>
                <li><Link to="/privacy" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">Privacy Policy</Link></li>
                <li><Link to="/contact" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-900 font-sans font-bold mb-6 uppercase text-xs tracking-widest">Social</h4>
              <div className="flex items-center gap-4">
                 {/* Social links - update these links in settings panel */}
                 <a href="#" className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-all cursor-pointer">
                    <Youtube className="w-5 h-5" />
                 </a>
                 <a href="#" className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-all cursor-pointer">
                    <Instagram className="w-5 h-5" />
                 </a>
                 <a href="#" className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-all cursor-pointer">
                    <Facebook className="w-5 h-5" />
                 </a>
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

