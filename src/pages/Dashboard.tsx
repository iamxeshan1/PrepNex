import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { DashboardTopHeader } from '../components/DashboardTopHeader';
import { Award, Zap, HelpCircle, BookOpenText, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { DOUBT_LINK } from '../constants';

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile } = useAuth();

  // Mock progress calculation
  const userProgress = {
      mockTestsAttempted: 15,
      averageAccuracy: 88,
      studyHours: 45,
  };
  
  // Calculate PrepScore out of 1000 based on progress
  const calculatePrepScore = () => {
       const baseScore = 400;
       const testBonus = userProgress.mockTestsAttempted * 10; // max 200
       const accuracyBonus = userProgress.averageAccuracy * 3; // max 300
       const studyBonus = userProgress.studyHours * 2; // max 100
       return Math.min(1000, baseScore + testBonus + accuracyBonus + studyBonus);
  };

  const prepScore = calculatePrepScore();
  
  // Estimate Global Rank based on PrepScore
  const calculateGlobalRank = (score: number) => {
      // Dummy logic: Lower rank is better. Higher score = lower rank.
      const maxUsers = 45200;
      const rank = Math.max(1, Math.floor(maxUsers - (score / 1000) * maxUsers));
      return rank;
  };

  const globalRank = calculateGlobalRank(prepScore);

  // Live Test countdown timer mock
  const [timeLeft, setTimeLeft] = useState(2535); // 00:42:15 in seconds
  
  useEffect(() => {
    const timer = setInterval(() => {
        setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDoubtClick = () => {
    window.open(DOUBT_LINK, '_blank');
  };

  return (
    <div className="flex bg-[#f8fafc] min-h-screen">
      {/* Mobile Hamburger Overlay */}
      <div className={`fixed inset-0 z-50 bg-black/50 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setIsSidebarOpen(false)}></div>
      
      {/* Sidebar - Desktop and Mobile */}
      <div className={`fixed lg:relative z-50 w-64 h-full bg-white border-r transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <DashboardSidebar />
      </div>
      
      <div className="flex-1 flex flex-col w-full overflow-hidden">
          <DashboardTopHeader user={profile} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="p-4 lg:p-8 overflow-y-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  {/* Welcome Panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-[#0f172a] text-white p-6 md:p-10 rounded-[2rem] flex flex-col justify-center relative overflow-hidden">
                      <h1 className="text-2xl md:text-4xl font-black mb-3">Welcome back, {profile?.name || 'Aspirant'}!</h1>
                      <p className="text-slate-400 mb-6 md:mb-8 text-sm md:text-base max-w-lg">You're in the top 5% of JKSSB aspirants this week. Keep up the momentum to secure your spot.</p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 justify-center">
                           <Zap className="w-4 h-4" /> Resume Mock Test
                        </button>
                        <button className="bg-white/10 text-white px-6 py-3 rounded-2xl font-bold justify-center">
                           View History
                        </button>
                      </div>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">PREPSCORE</p>
                                <h3 className="text-2xl font-black text-[#0f172a]">{prepScore}<span className="text-sm text-slate-400 ml-1">/1000</span></h3>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">GLOBAL RANK</p>
                                <h3 className="text-2xl font-black text-[#0f172a]">#{globalRank.toLocaleString()}<span className="text-sm text-slate-400 ml-1">/45.2k</span></h3>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                                <Award className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                  </div>
                  
                  {/* Live Tests & Subscriptions Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center mb-2">
                           <h3 className="text-lg font-black text-[#0f172a]">Upcoming Live Tests</h3>
                           <Link to="/exams" className="text-teal-600 text-[10px] font-black uppercase tracking-wider">View All</Link>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border-2 border-teal-50 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded tracking-wider uppercase flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> LIVE SOON
                                </span>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Starts In</p>
                                    <p className="text-lg font-black text-teal-700 font-mono tracking-tight">{formatTime(timeLeft)}</p>
                                </div>
                            </div>
                            <h4 className="font-bold text-slate-800 text-base mb-1">JKPSC KAS Prelims Mock #14</h4>
                            <p className="text-sm text-slate-500 mb-6">Syllabus: General Studies & CSAT Sectional</p>
                            <button className="w-full bg-teal-700 text-white font-bold py-3 text-sm rounded-2xl hover:bg-teal-800 transition-colors">
                                Join Test Room
                            </button>
                        </div>
                     </div>
                     <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center mb-2">
                           <h3 className="text-lg font-black text-[#0f172a]">Active Subscriptions</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-3xl border border-slate-100 flex flex-col justify-between">
                                <div className="flex items-start gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                        <Award className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 leading-tight mb-1">JKP SI Full Test Series</h4>
                                        <p className="text-[10px] text-slate-500 font-medium">Subscription Active</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <span className="text-xs font-bold text-red-600">Expires in 4 days</span>
                                    <Link to="/premium" className="text-[10px] font-black text-teal-700 tracking-wider">RENEW</Link>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-3xl border border-slate-100 flex flex-col justify-between">
                                <div className="flex items-start gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                                        <BookOpenText className="w-5 h-5 text-teal-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 leading-tight mb-1">JKSSB VLW Practice Kit</h4>
                                        <p className="text-[10px] text-slate-500 font-medium">Subscription Active</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <span className="text-xs font-bold text-slate-700">Expires in 28 days</span>
                                    <Link to="/premium" className="text-[10px] font-black text-teal-700 tracking-wider">MANAGE</Link>
                                </div>
                            </div>
                        </div>
                     </div>
                  </div>

                  {/* Resume Learning & Discover New */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                          <h3 className="text-lg font-black text-[#0f172a] mb-6">Resume Learning</h3>
                          <div className="bg-slate-50 p-4 md:p-6 rounded-3xl flex gap-4 md:gap-6 flex-col md:flex-row">
                            <div className="w-full md:w-40 h-24 bg-slate-200 rounded-2xl flex items-center justify-center">
                                <span className="text-slate-400 text-3xl font-black">▶</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800">Quantitative Aptitude: Level 3</h4>
                                <p className="text-xs text-slate-500 mb-4">Last activity: 2 hours ago • Section 3/5</p>
                                <div className="h-2 bg-slate-200 rounded-full w-full">
                                    <div className="h-full bg-teal-600 rounded-full w-[60%]"/>
                                </div>
                            </div>
                          </div>
                      </div>
                      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                          <h3 className="text-lg font-black text-[#0f172a] mb-6">Discover New</h3>
                          <div className="space-y-4">
                              <div className="p-4 border rounded-2xl flex items-center justify-between hover:bg-slate-50 cursor-pointer">
                                  <p className="text-sm font-bold text-slate-700">SSC CGL Tier II</p>
                                  <span className="text-xs text-slate-400">→</span>
                              </div>
                              <button className="w-full py-3 bg-teal-50 text-teal-700 font-bold rounded-2xl text-sm">Browse Categories</button>
                          </div>
                      </div>
                  </div>
                  
                  {/* Subject Performance Analysis */}
                  <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-[#0f172a] mb-6">Subject Performance Analysis</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="border rounded-2xl p-6">
                             <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-bold text-slate-500">History of J&K</p>
                                <span className="text-[10px] bg-teal-50 text-teal-700 font-black px-2 py-1 rounded-lg">TOP PERFORMER</span>
                             </div>
                             <div className="h-2 bg-slate-100 rounded-full w-full"><div className="h-full bg-teal-500 rounded-full w-[92%]"/></div>
                             <p className="text-xs font-black text-teal-600 mt-2">92% Accuracy</p>
                        </div>
                        <div className="border rounded-2xl p-6">
                             <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-bold text-slate-500">General Science</p>
                                <span className="text-[10px] bg-teal-50 text-teal-700 font-black px-2 py-1 rounded-lg">TOP PERFORMER</span>
                             </div>
                             <div className="h-2 bg-slate-100 rounded-full w-full"><div className="h-full bg-teal-500 rounded-full w-[88%]"/></div>
                             <p className="text-xs font-black text-teal-600 mt-2">88% Accuracy</p>
                        </div>
                    </div>
                  </div>

                  {/* Projected Score Improvement & Quick Access */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                    <div className="lg:col-span-2 bg-teal-50 p-6 md:p-8 rounded-[2rem] border border-teal-100 flex flex-col md:flex-row items-center justify-between gap-4">
                         <div>
                            <h3 className="font-black text-teal-900 mb-2">Projected Score Improvement</h3>
                            <p className="text-sm text-teal-700">Focusing on Quantitative Aptitude could add 45 points.</p>
                         </div>
                         <button className="bg-teal-600 text-white font-black px-6 py-3 rounded-2xl w-full md:w-auto">Start Practice</button>
                    </div>
                    <div className="flex flex-col gap-4">
                        <Link to="/study-material" className="bg-[#1e293b] text-white p-4 rounded-2xl font-bold text-center">Study Material</Link>
                        <Link to="/performance" className="bg-[#1e293b] text-white p-4 rounded-2xl font-bold text-center">Analysis</Link>
                        <button onClick={handleDoubtClick} className="bg-[#4a2406] text-white p-4 rounded-2xl font-bold text-center flex items-center justify-center gap-2">
                             <HelpCircle className="w-5 h-5"/> Doubt Hub
                        </button>
                    </div>
                  </div>
                </motion.div>
                
                {/* Footer */}
                <footer className="mt-12 py-8 border-t border-slate-100/60 pb-4 lg:pb-0">
                  <p className="text-center text-xs text-slate-500 font-medium pb-4">
                    © {new Date().getFullYear()} PrepNext. Built for Excellence in Regional Aspirations.
                  </p>
                </footer>
          </main>
      </div>
    </div>
  );
}


