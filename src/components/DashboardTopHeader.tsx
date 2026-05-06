import React from 'react';
import { Search, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardTopHeader = ({ user }: { user: any }) => {
  return (
    <header className="bg-white border-b border-slate-100 flex items-center justify-between px-8 py-5">
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text"
          placeholder="Search exams, topics..."
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:border-teal-500 transition-all"
        />
      </div>
      
      <div className="flex items-center gap-6">
        <nav className="flex items-center gap-6 text-sm font-black text-slate-500">
          <Link to="/exams" className="hover:text-teal-600 transition-colors">Exams</Link>
          <Link to="/dashboard" className="text-teal-700">My Library</Link>
          <Link to="/analysis" className="hover:text-teal-600 transition-colors">Analysis</Link>
          <Link to="/resources" className="hover:text-teal-600 transition-colors">Resources</Link>
        </nav>
        <button className="relative p-2 hover:bg-slate-50 rounded-full">
            <Bell className="w-5 h-5 text-slate-500" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden">
             <img src={`https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=0D8ABC&color=fff`} className="w-full h-full" alt="User" />
        </div>
      </div>
    </header>
  );
};
