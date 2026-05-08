import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpenText, Book, BarChart3, HelpCircle, User, ShieldCheck, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const DashboardSidebar = () => {
  const { isAdmin } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Mock Tests', icon: BookOpenText, path: '/exams' },
    { name: 'Study Material', icon: Book, path: '/study-material' },
    { name: 'Performance', icon: BarChart3, path: '/performance' },
    { name: 'Transactions', icon: CreditCard, path: '/transactions' },
    { name: 'My Profile', icon: User, path: '/profile' },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin Panel', icon: ShieldCheck, path: '/admin' });
  }

  const handleDoubtClick = () => {
    if (settings?.doubtLink) {
      window.open(settings.doubtLink, '_blank');
    } else {
      alert("Doubt clearing link is not configured yet.");
    }
  };

  return (
    <div className="w-full h-full bg-white border-r border-slate-100 p-6 flex flex-col justify-between">
      <div>
        <Link to="/" className="flex items-center mb-10 px-2 lg:px-4">
            <span className="font-logo font-black text-2xl lg:text-3xl tracking-tight text-[#0f172a]">Prep<span className="text-teal-600">Next</span></span>
        </Link>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex items-center gap-3 px-2 lg:px-4 py-3 rounded-2xl font-bold transition-all ${
                isActive(item.path) ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm lg:text-base">{item.name}</span>
            </Link>
          ))}
          <button 
            onClick={handleDoubtClick}
            className="flex w-full items-center gap-3 px-2 lg:px-4 py-3 rounded-2xl font-bold transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm lg:text-base">Doubt Clearing</span>
          </button>
        </nav>
      </div>

      <div className="bg-orange-50 p-4 lg:p-6 rounded-3xl border border-orange-100">
        <h4 className="text-[10px] lg:text-sm font-black text-orange-900 mb-1">GO PREMIUM</h4>
        <p className="text-[10px] lg:text-xs text-orange-700 font-medium mb-3 lg:mb-4">Access All Mock Tests</p>
        <Link to="/premium" className="block w-full bg-orange-600 text-white py-2 lg:py-3 rounded-xl font-black text-[10px] lg:text-xs uppercase tracking-widest hover:bg-orange-700 transition-all text-center">
          Upgrade
        </Link>
      </div>
    </div>
  );
};
