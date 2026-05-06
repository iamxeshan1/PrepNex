import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpenText, Book, BarChart3, HelpCircle, Zap, Settings, LogOut } from 'lucide-react';

export const DashboardSidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Mock Tests', icon: BookOpenText, path: '/mock-tests' },
    { name: 'Study Material', icon: Book, path: '/study-material' },
    { name: 'Performance', icon: BarChart3, path: '/performance' },
    { name: 'Doubt Clearing', icon: HelpCircle, path: '/doubt-clearing' },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-100 min-h-screen p-6 flex flex-col justify-between">
      <div>
        <Link to="/" className="flex items-center mb-10 px-2">
            <span className="font-logo font-black text-3xl tracking-tight text-[#0f172a]">Prep<span className="text-teal-600">Next</span></span>
        </Link>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                isActive(item.path) ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
        <h4 className="text-sm font-black text-orange-900 mb-1">GO PREMIUM</h4>
        <p className="text-xs text-orange-700 font-medium mb-4">Access All Mock Tests</p>
        <button className="w-full bg-orange-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all">
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
};
