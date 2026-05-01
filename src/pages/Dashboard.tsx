import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logActivity, ActivityAction } from '../services/activityLogger';
import { BarChart, Clock, Award, ChevronRight, BookOpen, User as UserIcon, Bell, Calendar, Phone, Mail, Save, AlertCircle, Crown, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<{ id: string, name: string, accuracy: number, total: number, isWeak: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile'>('overview');
  
  // Profile state for editing
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhoneNumber(profile.phoneNumber || '');
      setDob(profile.dob || '');
    }
  }, [profile]);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.userId) return;
      try {
        // Fetch Subjects
        const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
        const subjectMap: Record<string, string> = {};
        subjectsSnapshot.forEach(doc => {
            subjectMap[doc.id] = doc.data().name;
        });

        // Fetch All Results for Progress Tracking
        const allResultsQuery = query(collection(db, 'results'), where('userId', '==', profile.userId), orderBy('date', 'desc'));
        const allResultsSnapshot = await getDocs(allResultsQuery);
        
        const allResults = allResultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentResults(allResults.slice(0, 5));

        // Aggregate Subject Performance
        const aggregatedSubjects: Record<string, { correct: number, total: number }> = {};
        allResults.forEach((result: any) => {
          if (result.subjectStats) {
            for (const [subjId, stats] of Object.entries<any>(result.subjectStats)) {
              if (subjId === 'general') continue;
              if (!aggregatedSubjects[subjId]) aggregatedSubjects[subjId] = { correct: 0, total: 0 };
              aggregatedSubjects[subjId].correct += stats.correct || 0;
              aggregatedSubjects[subjId].total += stats.total || 0;
            }
          }
        });

        const performanceArray = Object.entries(aggregatedSubjects).map(([id, stats]) => {
          const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
          return {
            id,
            name: subjectMap[id] || 'Unknown Subject',
            accuracy,
            total: stats.total,
            isWeak: accuracy < 50
          };
        }).sort((a, b) => a.accuracy - b.accuracy);

        setSubjectPerformance(performanceArray);

        // Notices
        const noticesQuery = query(
          collection(db, 'notices'),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const noticesSnapshot = await getDocs(noticesQuery);
        setNotices(noticesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.userId) return;
    setSavingProfile(true);
    setSaveMessage(null);
    try {
      await updateDoc(doc(db, 'users', profile.userId), {
        name,
        phoneNumber,
        dob,
        updatedAt: new Date().toISOString()
      });
      await logActivity(profile.userId, ActivityAction.PROFILE_UPDATE, 'Updated profile details (name/phone/dob).');
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error(error);
      setSaveMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tight">Dashboard</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center gap-2">
              <UserIcon className="w-3 h-3 text-secondary" /> {profile?.name} • Aspirant Path
            </p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-primary'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-primary'}`}
            >
              My Profile
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="space-y-12"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-20 h-20" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tests Attempted</p>
                  <h3 className="text-4xl font-black text-primary">{profile?.testsAttempted || 0}</h3>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '60%' }} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-secondary">
                    <BarChart className="w-20 h-20" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Average Score</p>
                  <h3 className="text-4xl font-black text-primary">{profile?.averageScore?.toFixed(1) || 0}<span className="text-lg">%</span></h3>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary rounded-full transition-all duration-1000" style={{ width: `${profile?.averageScore || 0}%` }} />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary to-primary/80 p-8 rounded-[2rem] shadow-xl shadow-primary/20 relative overflow-hidden text-white">
                  <Award className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 rotate-12" />
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Current Mastery</p>
                  <h3 className="text-3xl font-black mb-4">Prime Scholar</h3>
                  <Link to="/exams" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold transition-all">
                    Level Up <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                  {/* Subject Weakness Tracker */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                          <BarChart className="w-4 h-4" />
                        </div>
                        <h2 className="text-xl font-black text-primary tracking-tight">Subject Mastery</h2>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      {subjectPerformance.length > 0 ? (
                        <div className="space-y-4">
                          {subjectPerformance.map(subj => (
                            <div key={subj.id} className="group">
                              <div className="flex justify-between items-end mb-2">
                                <div>
                                  <h4 className="text-sm font-bold text-slate-800">{subj.name}</h4>
                                  {subj.isWeak && (
                                    <p className="text-[10px] uppercase font-black tracking-widest text-red-500 mt-1 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" /> Needs Improvement
                                    </p>
                                  )}
                                </div>
                                <span className={`text-xs font-black tracking-tighter ${subj.isWeak ? 'text-red-500' : 'text-primary'}`}>
                                  {Math.round(subj.accuracy)}%
                                </span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${subj.accuracy}%` }}
                                  className={`h-full rounded-full ${subj.isWeak ? 'bg-red-500' : 'bg-primary'}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">Take more tests to generate subject insights.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notices Section (Moved from Sidebar) */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-secondary/10 text-secondary rounded-lg">
                          <Bell className="w-4 h-4" />
                        </div>
                        <h2 className="text-xl font-black text-primary tracking-tight">Recent Notices</h2>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {loading ? (
                        [1, 2].map(i => <div key={i} className="h-24 bg-slate-100 rounded-3xl animate-pulse" />)
                      ) : notices.length > 0 ? (
                        notices.map((notice) => (
                          <div key={notice.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-lg hover:border-secondary/30 transition-all">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest mb-3 ${
                              notice.type === 'info' ? 'bg-blue-50 text-blue-600' :
                              notice.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                              'bg-green-50 text-green-600'
                            }`}>
                              {notice.type}
                            </span>
                            <h4 className="text-sm font-extrabold text-primary leading-tight mb-2">{notice.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-4">{notice.content}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-50 pt-3">
                              {new Date(notice.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full p-8 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-center">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">No new announcements at the moment.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-primary tracking-tight">Recent Activity</h2>
                    <Link to="/exams" className="text-xs font-black text-secondary uppercase tracking-widest hover:underline">Take New Test</Link>
                  </div>

                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2].map(i => <div key={i} className="h-24 bg-slate-100 rounded-[1.5rem] animate-pulse" />)}
                    </div>
                  ) : recentResults.length > 0 ? (
                    <div className="space-y-4">
                      {recentResults.map((res) => (
                        <Link 
                          key={res.id} 
                          to={`/result/${res.id}`}
                          className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[1.5rem] hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all group"
                        >
                          <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${res.score >= 50 ? 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white' : 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white'}`}>
                              <Award className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-primary group-hover:text-secondary transition-colors">Assessment #{res.id.slice(-4)}</h4>
                              <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(res.date).toLocaleDateString()}</span>
                                <span className={res.score >= 50 ? 'text-green-500' : 'text-orange-500'}>{res.score >= 50 ? 'Passed' : 'Needs Review'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-black text-primary">{res.score}%</div>
                            <div className="flex items-center gap-1 text-[8px] font-black text-slate-300 group-hover:text-secondary transition-colors uppercase tracking-[0.2em]">
                              ANALYZE
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-16 text-center">
                      <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="font-extrabold text-primary text-xl tracking-tight mb-2">Ready to start?</h3>
                      <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto mb-8">Attempt your first mock test to begin building your preparation profile.</p>
                      <Link to="/exams" className="bg-primary text-white px-8 py-4 rounded-2xl font-black tracking-widest uppercase text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
                        Browse Exams
                      </Link>
                    </div>
                  )}
                </div>

                  {/* Subscriptions Card */}
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-primary mb-6">Subscriptions</h3>
                    {profile?.isPremium ? (
                      <div className="p-4 bg-purple-50 rounded-[1rem] border border-purple-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/20 text-white shrink-0">
                          <Crown className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-purple-900 leading-tight">Global Premium Pass</p>
                          {profile?.premiumExpiry && <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mt-1">Valid till {new Date(profile.premiumExpiry).toLocaleDateString()}</p>}
                        </div>
                      </div>
                    ) : profile?.purchasedExams?.length > 0 ? (
                      <div className="space-y-3">
                        {profile.purchasedExams.map((examId: string) => (
                          <div key={examId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-secondary transition-all">
                            <div className="w-1.5 h-1.5 rounded-full bg-secondary group-hover:scale-150 transition-transform" />
                            <span className="text-[10px] font-black text-primary truncate tracking-widest uppercase">ID: {examId.slice(-8)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">No active premium packages</p>
                        <Link to="/premium" className="text-[10px] font-black text-secondary hover:underline tracking-widest uppercase mt-4 inline-block">Explore Plans →</Link>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto w-full"
            >
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                <div className="flex items-center gap-6 mb-10 pb-10 border-b border-slate-50">
                  <div className="w-24 h-24 bg-primary text-white rounded-[2rem] flex items-center justify-center text-3xl font-black shadow-xl shadow-primary/20">
                    {profile?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-primary tracking-tight">{profile?.name}</h3>
                    <p className="text-slate-400 font-medium text-sm flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" /> {profile?.email}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Display Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          required className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-primary"
                          value={name} onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          type="tel"
                          placeholder="+91 XXXXX XXXXX"
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-primary"
                          value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date of Birth</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          type="date"
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-primary"
                          value={dob} onChange={(e) => setDob(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {saveMessage && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      <AlertCircle className="w-5 h-5" />
                      <p className="text-xs font-bold uppercase tracking-widest">{saveMessage.text}</p>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={savingProfile}
                    className="w-full py-5 bg-primary text-white rounded-2xl font-black tracking-widest uppercase text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {savingProfile ? 'Updating...' : <><Save className="w-5 h-5" /> Save Changes</>}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
