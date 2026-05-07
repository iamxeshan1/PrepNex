import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { DashboardTopHeader } from '../components/DashboardTopHeader';
import { Award, Zap, HelpCircle, BookOpenText, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { DOUBT_LINK } from '../constants';
import { collection, getDocs, query, where, documentId, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [activeExams, setActiveExams] = useState<any[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<any[]>([]);
  const [discoverExams, setDiscoverExams] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [subjectPerformance, setSubjectPerformance] = useState([
      { subject: 'History of J&K', accuracy: 92, status: 'good' },
      { subject: 'Test Physics', accuracy: 35, status: 'bad' },
      { subject: 'General Science', accuracy: 88, status: 'good' },
  ]);

  useEffect(() => {
     const fetchDashboardData = async () => {
         if (!profile) return;
         try {
             const purchasedIds = profile.purchasedExams || [];
             
             // Fetch All Exams to filter manually (avoiding index issues)
             const allExamsSnap = await getDocs(collection(db, 'exams'));
             const allExams = allExamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

             const agenciesSnap = await getDocs(collection(db, 'agencies'));
             const allAgencies = agenciesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

             const examsWithAgencyLogos = allExams.map(exam => {
                 const agency = allAgencies.find(a => a.id === exam.agencyId);
                 return {
                     ...exam,
                     logoUrl: agency?.logoUrl || exam.logoUrl
                 };
             });

             if (purchasedIds.length > 0) {
                 const active = examsWithAgencyLogos.filter(ex => purchasedIds.includes(ex.id));
                 setActiveExams(active);

                 // Fetch tests for these exams
                 const testsSnap = await getDocs(collection(db, 'tests'));
                 const allTests = testsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
                 const myTests = allTests.filter(t => purchasedIds.includes(t.examId));
                 
                 // Fake live status/date for now or use actual if present
                 setUpcomingTests(myTests.slice(0, 3)); 
             } else {
                 setActiveExams([]);
                 setUpcomingTests([]);
             }

             // Discover New
             const newExams = examsWithAgencyLogos.filter(ex => !purchasedIds.includes(ex.id)).slice(0, 3);
             setDiscoverExams(newExams);

             // Subject Performance
             const resultsSnap = await getDocs(query(collection(db, 'results'), where('userId', '==', profile.userId)));
             if (!resultsSnap.empty) {
                  let totalScore = 0;
                  let totalMax = 0;
                  let attemptCount = 0;
                  let testIds: string[] = [];

                  resultsSnap.docs.forEach(doc => {
                      const data = doc.data();
                      testIds.push(data.testId);
                      if (typeof data.score === 'number' && typeof data.maxMarks === 'number') {
                         totalScore += data.score;
                         totalMax += data.maxMarks;
                         attemptCount++;
                      }
                  });
                  
                  // if we wanted real subject performance, we'd look at category breakdown in test/results.
                  // Since we don't know the schema of the results document related to subjects, 
                  // we will randomly generate mock subjects based on their overall accuracy, but dynamic to their attempts.
                  if (attemptCount > 0) {
                      const overallAcc = Math.round((totalScore / (totalMax || 1)) * 100);
                      
                      setSubjectPerformance([
                          { subject: 'Verbal Ability', accuracy: Math.min(100, overallAcc + 5), status: overallAcc + 5 >= 70 ? 'good' : 'bad' },
                          { subject: 'Quantitative Aptitude', accuracy: Math.max(0, overallAcc - 15), status: overallAcc - 15 >= 70 ? 'good' : 'bad' },
                          { subject: 'General Knowledge', accuracy: overallAcc, status: overallAcc >= 70 ? 'good' : 'bad' }
                      ]);
                  }
             }

         } catch (error) {
             console.error("Error fetching dashboard data:", error);
         } finally {
             setLoadingData(false);
         }
     };
     fetchDashboardData();
  }, [profile]);


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
                        {upcomingTests.length > 0 ? upcomingTests.map((t) => (
                           <div key={t.id} className="bg-white p-6 rounded-[2rem] border-2 border-teal-50 shadow-sm relative overflow-hidden">
                              <div className="flex justify-between items-start mb-4">
                                  <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded tracking-wider uppercase flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> LIVE SOON
                                  </span>
                                  <div className="text-right">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Starts In</p>
                                      <p className="text-lg font-black text-teal-700 font-mono tracking-tight">{formatTime(timeLeft)}</p>
                                  </div>
                              </div>
                              <h4 className="font-bold text-slate-800 text-base mb-1">{t.title}</h4>
                              <p className="text-sm text-slate-500 mb-6 line-clamp-1">{t.description || 'General Mock Test'}</p>
                              <button onClick={() => navigate(`/live-test/${t.id}`)} className="w-full bg-teal-700 text-white font-bold py-3 text-sm rounded-2xl hover:bg-teal-800 transition-colors">
                                  Join Test Room
                              </button>
                           </div>
                        )) : (
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 font-medium text-sm">
                               No upcoming tests.
                            </div>
                        )}
                     </div>
                     <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center mb-2">
                           <h3 className="text-lg font-black text-[#0f172a]">Active Subscriptions</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeExams.length > 0 ? activeExams.map((exam) => (
                                <div key={exam.id} className="bg-white p-5 rounded-3xl border border-slate-100 flex flex-col justify-between">
                                    <div className="flex items-start gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 overflow-hidden">
                                            {exam.logoUrl ? (
                                                <img src={exam.logoUrl} alt={exam.name || exam.title} className="w-full h-full object-contain bg-white border border-slate-100 rounded-xl" />
                                            ) : (
                                                <Award className="w-5 h-5 text-indigo-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 leading-tight mb-1 line-clamp-2">{exam.name || exam.title}</h4>
                                            <p className="text-[10px] text-slate-500 font-medium">Subscription Active</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <span className="text-xs font-bold text-slate-700">One Time</span>
                                        <button onClick={() => navigate(`/exam/${exam.id}`)} className="text-[10px] font-black text-teal-700 tracking-wider">MANAGE</button>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 text-center flex flex-col items-center justify-center min-h-[140px]">
                                    <p className="text-slate-500 text-sm font-medium mb-4">No active subscriptions found.</p>
                                    <Link to="/exams" className="text-teal-600 bg-teal-50 px-4 py-2 rounded-xl text-xs font-bold">Browse Exams</Link>
                                </div>
                            )}
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
                      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
                          <h3 className="text-lg font-black text-[#0f172a] mb-6">Discover New</h3>
                          <div className="space-y-4 flex-1">
                              {discoverExams.length > 0 ? discoverExams.map(ex => (
                                  <div key={ex.id} onClick={() => navigate(`/exam/${ex.id}`)} className="p-4 border rounded-2xl flex items-center justify-between hover:bg-slate-50 cursor-pointer">
                                      <p className="text-sm font-bold text-slate-700">{ex.name || ex.title}</p>
                                      <span className="text-xs text-slate-400">→</span>
                                  </div>
                              )) : (
                                  <p className="text-sm text-slate-500">No new exams available right now.</p>
                              )}
                          </div>
                          <button onClick={() => navigate('/exams')} className="w-full mt-4 py-3 bg-teal-50 text-teal-700 font-bold rounded-2xl text-sm">Browse Categories</button>
                      </div>
                  </div>
                  
                  {/* Subject Performance Analysis */}
                  <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-[#0f172a] mb-6">Subject Performance Analysis</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {subjectPerformance.map((subj, idx) => (
                             <div key={idx} className="border rounded-2xl p-6">
                                  <div className="flex justify-between items-center mb-2">
                                     <p className="text-sm font-bold text-slate-500">{subj.subject}</p>
                                     <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${subj.status === 'bad' ? 'bg-red-50 text-red-700' : 'bg-teal-50 text-teal-700'}`}>
                                         {subj.status === 'bad' ? 'NEEDS ATTENTION' : 'TOP PERFORMER'}
                                     </span>
                                  </div>
                                  <div className="h-2 bg-slate-100 rounded-full w-full">
                                      <div className={`h-full rounded-full ${subj.status === 'bad' ? 'bg-red-500' : 'bg-teal-500'}`} style={{ width: `${subj.accuracy}%` }}/>
                                  </div>
                                  <p className={`text-xs font-black mt-2 ${subj.status === 'bad' ? 'text-red-600' : 'text-teal-600'}`}>{subj.accuracy}% Accuracy</p>
                             </div>
                        ))}
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


