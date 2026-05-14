import React from 'react';
import { Bell, LogOut, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const DashboardTopHeader = ({ user, onMenuClick }: { user: any, onMenuClick?: () => void }) => {
  const { logout } = useAuth();
  
  return (
    <header className="bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-8 py-4 lg:py-5 min-h-[64px]">
      {/* Mobile View: Hamburger on Left */}
      <div className="flex items-center lg:hidden flex-1">
         <button onClick={onMenuClick} className="w-11 h-11 flex items-center justify-center -ml-2 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Toggle menu">
            <Menu className="w-6 h-6" />
         </button>
      </div>

      {/* Mobile View: Logo Centered and Bigger */}
      <div className="flex justify-center flex-1 lg:hidden">
        <span className="font-logo font-black text-3xl tracking-tight text-black">Prep<span className="text-[#002f26]">Next</span></span>
      </div>

      {/* Desktop Left (Empty space to push items to right on desktop) */}
      <div className="hidden lg:block flex-1"></div>
      
      {/* Right Side: Logout and Desktop Icons */}
      <div className="flex items-center justify-end gap-4 lg:gap-6 flex-1">
        {/* Desktop View: Keep Bell and Profile */}
        <div className="hidden lg:flex items-center gap-6">
            <button className="relative p-2 hover:bg-slate-50 rounded-full" aria-label="Notifications">
                <Bell className="w-5 h-5 text-slate-500" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden">
                 <img src={`https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=0D8ABC&color=fff`} className="w-full h-full object-cover" width="40" height="40" fetchpriority="high" alt="User" />
            </div>
        </div>

        {/* Both Views: Logout Button */}
        <button onClick={() => logout()} className="w-11 h-11 flex items-center justify-center -mr-2 lg:mr-0 text-slate-500 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" aria-label="Log out">
            <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
