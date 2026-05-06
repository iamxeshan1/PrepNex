import React from 'react';
import { Search, Bell, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardTopHeader = ({ user }: { user: any }) => {
  return (
    <header className="bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-8 py-5">
      <div className="flex items-center">
        <span className="font-logo font-black text-xl tracking-tight text-[#0f172a] lg:hidden">Prep<span className="text-teal-600">Next</span></span>
      </div>
      
      <div className="flex items-center gap-4 lg:gap-6">
        <button className="p-2 text-slate-500 hover:text-red-500">
            <LogOut className="w-5 h-5" />
        </button>
        
        {/* Desktop View: Keep Bell and Profile */}
        <div className="hidden lg:flex items-center gap-6">
            <button className="relative p-2 hover:bg-slate-50 rounded-full">
                <Bell className="w-5 h-5 text-slate-500" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden">
                 <img src={`https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=0D8ABC&color=fff`} className="w-full h-full" alt="User" />
            </div>
        </div>
      </div>
    </header>
  );
};
