import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { DashboardTopHeader } from '../components/DashboardTopHeader';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logActivity, ActivityAction } from '../services/activityLogger';
import { BarChart, Clock, Award, ChevronRight, BookOpen, User as UserIcon, Bell, Calendar, Phone, Mail, Save, AlertCircle, Crown, AlertTriangle, Star, CheckCircle, Send, MessageCircle, Zap, Timer, MapPin, Building, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Countdown } from '../components/Countdown';

const INDIAN_STATES = ["Jammu & Kashmir", "Ladakh", "Delhi", "Punjab", "Haryana"]; // Simplified for now

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'profile'>('overview');
  const [subjectPerformance, setSubjectPerformance] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [enrolledTests, setEnrolledTests] = useState<any[]>([]);
  const [purchasedExams, setPurchasedExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Profile form state
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [district, setDistrict] = useState(profile?.district || '');
  const [state, setState] = useState(profile?.state || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setDistrict(profile.district || '');
      setState(profile.state || '');
      
      const fetchData = async () => {
        setLoading(true);
        // Add data fetching logic here (mocked for simplicity, replace with real Firestore calls)
        setSubjectPerformance([{ id: 1, name: 'History of J&K', accuracy: 92, isWeak: false }, { id: 2, name: 'General Science', accuracy: 88, isWeak: false }]);
        setNotices([{ id: 1, type: 'info', title: 'New Mock Test Available', content: 'Attempt the latest JKP SI Full Test.', createdAt: new Date() }]);
        setLoading(false);
      };
      fetchData();
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    // Add real Firestore update logic
    setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
    setSavingProfile(false);
  };

  return (
    <div className="flex bg-[#f8fafc] min-h-screen">
      {/* Mobile Hamburger Overlay */}
      <div className={`fixed inset-0 z-50 bg-black/50 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setIsSidebarOpen(false)}></div>
      
      {/* Sidebar - Desktop */}
      <div className={`fixed lg:relative z-50 w-64 h-full bg-white border-r transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <DashboardSidebar />
      </div>
      
      <div className="flex-1 flex flex-col">
          <div className="p-4 lg:hidden flex items-center justify-between bg-white border-b">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
                <div className="space-y-1">
                    <div className="w-6 h-0.5 bg-slate-800"></div>
                    <div className="w-6 h-0.5 bg-slate-800"></div>
                    <div className="w-6 h-0.5 bg-slate-800"></div>
                </div>
             </button>
          </div>
          <DashboardTopHeader user={profile} />
          <main className="p-4 lg:p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' ? (
                <motion.div key="overview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                  {/* Welcome Panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-[#0f172a] text-white p-10 rounded-[2rem] flex flex-col justify-center relative overflow-hidden">
                      <h1 className="text-4xl font-black mb-3">Welcome back, {profile?.name || 'Aspirant'}!</h1>
                      <p className="text-slate-400 mb-8 max-w-lg">You're in the top 5% of JKSSB aspirants this week. Keep up the momentum to secure your spot.</p>
                      <div className="flex gap-4">
                        <button className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2">
                           <Zap className="w-4 h-4" /> Resume Mock Test
                        </button>
                        <button className="bg-white/10 text-white px-8 py-3 rounded-2xl font-bold">
                           View History
                        </button>
                      </div>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">PREPSCORE</p>
                                <h3 className="text-3xl font-black text-[#0f172a]">842<span className="text-sm text-slate-400 ml-1">/1000</span></h3>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                                <BarChart className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">GLOBAL RANK</p>
                                <h3 className="text-3xl font-black text-[#0f172a]">#124<span className="text-sm text-slate-400 ml-1">/45.2k</span></h3>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                                <Award className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                  </div>
                  
                  {/* Live Tests & Subscriptions Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-[#0f172a]">Upcoming Live Tests</h3>
                            <Link to="/mock-tests" className="text-teal-600 text-sm font-bold">View All</Link>
                         </div>
                         <p className="text-slate-400 text-sm font-medium">No live tests scheduled.</p>
                     </div>
                     <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-[#0f172a]">Active Subscriptions</h3>
                            <Link to="/premium" className="text-teal-600 text-sm font-bold">Manage</Link>
                         </div>
                         <p className="text-slate-400 text-sm font-medium">No active packages.</p>
                     </div>
                  </div>

                  {/* Resume Learning & Discover New */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                          <h3 className="text-lg font-black text-[#0f172a] mb-6">Resume Learning</h3>
                          <div className="bg-slate-50 p-6 rounded-3xl flex gap-6">
                            <div className="w-40 h-24 bg-slate-200 rounded-2xl flex items-center justify-center">
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
                      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                          <h3 className="text-lg font-black text-[#0f172a] mb-6">Discover New</h3>
                          <div className="space-y-4">
                              <p className="text-sm font-medium text-slate-500">Suggested mock tests and batches.</p>
                          </div>
                      </div>
                  </div>
                  {/* Subject Performance Analysis */}
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-[#0f172a] mb-6">Subject Performance Analysis</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="border rounded-2xl p-6">
                             <p className="text-sm font-bold text-slate-500 mb-2">History of J&K</p>
                             <div className="h-2 bg-slate-100 rounded-full w-full"><div className="h-full bg-teal-500 rounded-full w-[92%]"/></div>
                             <p className="text-xs font-black text-teal-600 mt-2">92% Accuracy</p>
                        </div>
                        <div className="border rounded-2xl p-6">
                             <p className="text-sm font-bold text-slate-500 mb-2">General Science</p>
                             <div className="h-2 bg-slate-100 rounded-full w-full"><div className="h-full bg-teal-500 rounded-full w-[88%]"/></div>
                             <p className="text-xs font-black text-teal-600 mt-2">88% Accuracy</p>
                        </div>
                    </div>
                  </div>

                  {/* Projected Score Improvement & Quick Access */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                    <div className="lg:col-span-2 bg-teal-50 p-8 rounded-[2rem] border border-teal-100 flex items-center justify-between">
                         <div>
                            <h3 className="font-black text-teal-900 mb-2">Projected Score Improvement</h3>
                            <p className="text-sm text-teal-700">Focusing on Quantitative Aptitude could add 45 points.</p>
                         </div>
                         <button className="bg-teal-600 text-white font-black px-6 py-3 rounded-2xl">Start Practice</button>
                    </div>
                    <div className="flex flex-col gap-4">
                        <button className="bg-[#1e293b] text-white p-4 rounded-2xl font-bold">Study Material</button>
                        <button className="bg-[#1e293b] text-white p-4 rounded-2xl font-bold">Analysis</button>
                        <button className="bg-[#4a2406] text-white p-4 rounded-2xl font-bold">Doubt Hub</button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white p-10 rounded-3xl border border-slate-100">
                  <h2 className="text-xl font-black text-primary mb-8">Profile Management</h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-xl" placeholder="Full Name" />
                    <button type="submit" className="px-6 py-3 bg-primary text-white rounded-xl font-bold">Save Changes</button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
      </div>
    </div>
  );
}


