import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut,
  Bell,
  Ticket,
  Search,
  HelpCircle,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  Banknote,
  Grid,
  Building,
  Target,
  FileBox,
  MessageSquare,
  FileQuestion,
  Activity,
  Megaphone,
  Sparkles,
  Briefcase,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminLayout: React.FC<{ children: React.ReactNode, title: string, backTo?: string | -1 }> = ({ children, title, backTo }) => {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'management': true,
    'content': true,
    'business': true,
    'system': false
  });

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const NavGroup = ({ id, label, items }: { id: string, label: string, items: any[] }) => (
    <div className="mb-2">
      <button 
        onClick={() => toggleGroup(id)}
        className="w-full flex items-center justify-between px-6 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
      >
        <span>{label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openGroups[id] ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {openGroups[id] && (
          <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             className="overflow-hidden space-y-1 block"
          >
            {items.map((item) => {
              const active = location.pathname === item.path || (location.pathname.startsWith(item.path + '/') && item.path !== '/admin');
              return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-2.5 text-sm font-semibold transition-all relative outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500 mx-2 ${
                  active
                    ? 'text-white bg-[#001f19]'
                    : 'text-slate-400 hover:text-white hover:bg-[#001f19]/50'
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-teal-500"></div>
                )}
                <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-teal-400' : ''}`} />
                <span>{item.label}</span>
              </Link>
            )})}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const managementItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'User Directory', path: '/admin/users', icon: Users },
    { label: 'Exam Catalog', path: '/admin/exams', icon: ClipboardList },
    { label: 'Live Test Sessions', path: '/admin/live-tests', icon: Activity },
    { label: 'Mock Test Bank', path: '/admin/mock-tests', icon: FileBox },
  ];

  const contentItems = [
    { label: 'Subjects & Topics', path: '/admin/subjects', icon: Briefcase },
    { label: 'Agencies / Boards', path: '/admin/agencies', icon: Building },
    { label: 'Study Material', path: '/admin/study-material', icon: GraduationCap },
    { label: 'Platform Reviews', path: '/admin/reviews', icon: MessageSquare },
  ];

  const businessItems = [
    { label: 'Revenue & Finance', path: '/admin/revenue', icon: Banknote },
    { label: 'Premium Plans', path: '/admin/premium', icon: Sparkles },
    { label: 'Coupons / Offers', path: '/admin/coupons', icon: Ticket },
  ];

  const systemItems = [
    { label: 'Notices Board', path: '/admin/notices', icon: Megaphone },
    { label: 'Daily Thoughts', path: '/admin/thoughts', icon: Sparkles },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-[#001f19]">
      {/* Sidebar */}
      <aside className="w-[280px] bg-[#111827] flex flex-col shrink-0 relative z-40 text-slate-300 shadow-2xl">
        <header className="p-6 pb-4">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-teal-900/50">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl leading-none">PrepNext</h1>
              <p className="text-[10px] font-bold text-teal-400 mt-1 uppercase tracking-widest">Administrator</p>
            </div>
          </Link>
        </header>

        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <NavGroup id="management" label="App Management" items={managementItems} />
          <div className="my-4 border-t border-[#001f19] mx-6"></div>
          <NavGroup id="content" label="Database & Content" items={contentItems} />
          <div className="my-4 border-t border-[#001f19] mx-6"></div>
          <NavGroup id="business" label="Business & Ops" items={businessItems} />
          <div className="my-4 border-t border-[#001f19] mx-6"></div>
          <NavGroup id="system" label="System Controls" items={systemItems} />
        </nav>

        <footer className="p-4 border-t border-[#001f19] bg-[#002f26]/50">
           <Link 
             to="/admin/helpdesk"
             className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-[#001f19] rounded-lg transition-colors"
           >
             <HelpCircle className="w-4 h-4" />
             <span>Support Tickets</span>
           </Link>
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors mt-1"
           >
             <LogOut className="w-4 h-4" />
             <span>Safe Disconnect</span>
           </button>
        </footer>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex-1 max-w-xl relative">
             <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
             <input 
                type="text" 
                placeholder="Search global registries..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
             />
          </div>

          <div className="flex items-center gap-6 ml-4">
            <Link 
              to="/" 
              className="flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-100 rounded-full text-teal-700 text-xs font-black shadow-sm hover:bg-teal-100 transition-all group"
            >
              <ExternalLink className="w-3.5 h-3.5 text-teal-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              <span className="uppercase tracking-widest">Visit Main Site</span>
            </Link>
            <button className="text-slate-400 hover:text-slate-600 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <Grid className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-700 leading-tight">{profile?.fullName || 'Admin User'}</p>
                  <p className="text-[10px] font-bold text-slate-500">Super Admin</p>
               </div>
               <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                  {profile?.profilePicture ? (
                    <img src={profile.profilePicture} alt="Avatar" width="36" height="36" className="w-full h-full object-cover" />
                  ) : (
                    <img src={`https://ui-avatars.com/api/?name=${profile?.fullName || 'Admin'}&background=0f766e&color=fff`} alt="Avatar" width="36" height="36" className="w-full h-full object-cover" />
                  )}
               </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 relative">
           <div className="max-w-[1600px] mx-auto p-6 md:p-8 relative min-h-screen pb-20">
              <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               key={location.pathname}
              >
                <div className="mb-8 flex items-center gap-4">
                  {backTo && (
                    <button 
                      onClick={() => backTo === -1 ? navigate(-1) : navigate(backTo as string)}
                      className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  {title && <h2 className="text-2xl lg:text-3xl font-bold text-[#002f26] tracking-tight">{title}</h2>}
                </div>
                {children}
              </motion.div>
           </div>
        </div>
      </main>
    </div>
  );
};
