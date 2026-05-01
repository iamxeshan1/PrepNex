import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './Layout';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Settings, 
  PlusCircle, 
  ArrowLeft,
  ShieldCheck,
  Bell,
  Sparkles,
  Layers,
  CreditCard,
  Ticket,
  MessageCircle,
  Mail,
  Activity,
  Crown
} from 'lucide-react';

export const AdminLayout: React.FC<{ children: React.ReactNode, title: string, backTo?: string }> = ({ children, title, backTo }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Admin Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 lg:p-6 lg:sticky lg:top-24 overflow-hidden">
              <div className="hidden lg:flex items-center gap-2 mb-8 px-2">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
                <span className="text-xs font-black text-orange-600 uppercase tracking-[0.2em]">Management</span>
              </div>
              
              <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide">
                {[
                  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
                  { label: 'Notices', path: '/admin/notices', icon: Bell },
                  { label: 'Thoughts', path: '/admin/thoughts', icon: Sparkles },
                  { label: 'Subjects', path: '/admin/subjects', icon: Layers },
                  { label: 'Exams', path: '/admin/exams', icon: BookOpen },
                  { label: 'Live Tests', path: '/admin/live-tests', icon: CreditCard },
                  { label: 'Users', path: '/admin/users', icon: Users },
                  { label: 'Coupons', path: '/admin/coupons', icon: Ticket },
                  { label: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard },
                  { label: 'Activity Log', path: '/admin/activity', icon: Activity },
                  { label: 'Reviews', path: '/admin/reviews', icon: MessageCircle },
                  { label: 'Materials', path: '/admin/study-material', icon: BookOpen },
                  { label: 'Helpdesk', path: '/admin/helpdesk', icon: MessageCircle },
                  { label: 'Marketing', path: '/admin/marketing', icon: Mail },
                  { label: 'Premium Plan', path: '/admin/premium', icon: Crown },
                  { label: 'Settings', path: '/admin/settings', icon: Settings },
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all shrink-0 lg:shrink-1 ${
                      isActive(item.path) 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-primary bg-slate-50 lg:bg-transparent'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="hidden lg:block mt-12 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest mb-1">Warning</p>
                <p className="text-[10px] text-orange-600 leading-tight">Admin actions directly affect live production data. Exercise caution.</p>
              </div>
            </div>
          </aside>

          {/* Main Admin Content */}
          <div className="flex-1">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {backTo && (
                  <Link to={backTo} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <ArrowLeft className="w-4 h-4 text-slate-600" />
                  </Link>
                )}
                <h1 className="text-2xl font-black text-primary tracking-tight">{title}</h1>
              </div>
              <div id="admin-actions" />
            </header>
            
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
