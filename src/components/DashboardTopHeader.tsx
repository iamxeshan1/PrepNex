import React from 'react';
import { Bell, LogOut, Menu, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SnapchatStreakBadge } from './SnapchatStreakBadge';

export const DashboardTopHeader = ({ user, onMenuClick }: { user: any, onMenuClick?: () => void }) => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="bg-white dark:bg-[#031d19] border-b border-slate-100 dark:border-emerald-950/50 flex items-center justify-between px-4 lg:px-8 py-4 lg:py-5 min-h-[64px] transition-colors duration-300">
      {/* Mobile View: Hamburger on Left */}
      <div className="flex items-center lg:hidden flex-1">
         <button onClick={onMenuClick} className="w-11 h-11 flex items-center justify-center -ml-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-emerald-950/20 transition-colors" aria-label="Toggle menu">
            <Menu className="w-6 h-6" />
         </button>
      </div>

      {/* Mobile View: Logo Centered and Bigger */}
      <div className="flex justify-center flex-1 lg:hidden">
        <span className="font-logo font-black text-3xl tracking-tight text-[#002f26] dark:text-emerald-450">PrepNext</span>
      </div>

      {/* Desktop Left (Empty space to push items to right on desktop) */}
      <div className="hidden lg:block flex-1"></div>
      
      {/* Right Side: Logout and Desktop Icons */}
      <div className="flex items-center justify-end gap-4 lg:gap-6 flex-1">
        {/* Desktop View: Streak, Bell, Profile */}
        <div className="flex items-center gap-3 lg:gap-5">
            <Link to="/profile" title="Your Practice Streak">
              <SnapchatStreakBadge streakCount={Number(user?.studyStreak || user?.streak || 14)} size="sm" showLabel={false} />
            </Link>
            <button className="hidden lg:block relative p-2 hover:bg-slate-50 dark:hover:bg-emerald-950/20 rounded-full" aria-label="Notifications">
                <Bell className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#006e5d] rounded-full border-2 border-white dark:border-[#031d19]"></span>
            </button>
            <Link to="/profile" className="hidden lg:block w-10 h-10 rounded-full border border-slate-200 dark:border-emerald-950/55 overflow-hidden bg-slate-50 hover:border-[#006e5d] transition-all cursor-pointer" title="View Profile">
                 <img src={user?.photoURL || user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name || user?.email || 'User'}&background=006e5d&color=fff`} className="w-full h-full object-cover" width="40" height="40" fetchPriority="high" alt="User" />
            </Link>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-emerald-950/50 text-slate-500 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-emerald-950/25 hover:text-[#006e5d] dark:hover:text-emerald-300 transition-all focus:outline-none cursor-pointer"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Both Views: Logout Button */}
        <button onClick={() => logout()} className="w-11 h-11 flex items-center justify-center -mr-2 lg:mr-0 text-slate-500 dark:text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors" aria-label="Log out">
            <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
