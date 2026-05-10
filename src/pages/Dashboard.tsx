import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { DashboardTopHeader } from '../components/DashboardTopHeader';
import { Award, Zap, HelpCircle, BookOpenText, TrendingUp, CheckCircle2, Megaphone, Info, AlertTriangle, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../context/SettingsContext';
import { collection, getDocs, query, where, documentId, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeExams, setActiveExams] = useState<any[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<any[]>([]);
  const [discoverExams, setDiscoverExams] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [notices, setNotices] = useState<any[]>([]);
  const [paymentSuccessInfo, setPaymentSuccessInfo] = useState<{orderId: string, paymentId: string} | null>(null);

  const [subjectPerformance, setSubjectPerformance] = useState<any[]>([]);
  const [lowestSubject, setLowestSubject] = useState<any>(null);
  const [userProgress, setUserProgress] = useState({ mockTestsAttempted: 0, averageAccuracy: 0, studyHours: 0 });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment_success') === 'true') {
        const orderId = params.get('orderId') || '';
        const paymentId = params.get('paymentId') || '';
        const itemId = params.get('itemId') || '';
        const userId = params.get('userId') || '';
        const needsClientUpdate = params.get('needs_client_update') === 'true';

        setPaymentSuccessInfo({
            orderId,
            paymentId
        });
        
        // Client-side fallback sync if server failed to update DB
        if (needsClientUpdate && userId && itemId) {
           console.log("[Dashboard] Performing client-side sync fallback...");
           const performFallbackSync = async () => {
              try {
                const { doc, getDoc, updateDoc, setDoc, addDoc, collection } = await import('firebase/firestore');
                
                // 1. Update user profile
                const userRef = doc(db, "users", userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                  const userData = userSnap.data();
                  const currentPurchased = userData.purchasedExams || [];
                  if (!currentPurchased.includes(itemId)) {
                    await setDoc(userRef, { 
                      purchasedExams: [...currentPurchased, itemId],
                      // If it was a premium pass
                      ...(itemId === "PREMIUM_PASS" ? { 
                        isPremium: true, 
                        subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() 
                      } : {})
                    }, { merge: true });
                  }
                }

                // 2. Add subscription record
                const amount = parseFloat(params.get('amount') || '0');
                const userName = params.get('userName') || 'User';
                
                if (itemId === "PREMIUM_PASS") {
                   await addDoc(collection(db, "premium_subscriptions"), {
                      userId,
                      userName,
                      type: "Premium",
                      purchaseDate: new Date().toISOString(),
                      paymentId,
                      orderId,
                      paymentStatus: "completed",
                      amount
                   });
                } else {
                   await addDoc(collection(db, "subscriptions"), {
                      userId,
                      userName,
                      examId: itemId,
                      type: "Exam Purchase", // Generic title for fallback
                      purchaseDate: new Date().toISOString(),
                      paymentId,
                      orderId,
                      paymentStatus: "completed",
                      amount
                   });
                }
                console.log("[Dashboard] Client-side sync fallback complete.");
              } catch (err) {
                console.error("[Dashboard] Client-side sync fallback failed:", err);
              }
           };
           performFallbackSync();
        }

        // Scroll to top
        window.scrollTo(0, 0);
        
        // Clear URL params without reloading to keep the success state but clean the browser history
        if (window.history.replaceState) {
          const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.replaceState({ path: newUrl }, '', newUrl);
        }
    }
  }, [location, db]);

  useEffect(() => {
     const fetchDashboardData = async () => {
         if (!profile) return;
         try {
             const purchasedIds = profile.purchasedExams || [];
             
             // Fetch all data in parallel with error tolerance
             const [
               allExamsSnap,
               agenciesSnap,
               liveTestsSnap,
               noticesSnap,
               resultsSnap,
               subjectsSnap
             ] = await Promise.allSettled([
               getDocs(collection(db, 'exams')),
               getDocs(collection(db, 'agencies')),
               getDocs(collection(db, 'liveTests')),
               getDocs(query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(3))),
               getDocs(query(collection(db, 'results'), where('userId', '==', profile.userId))),
               getDocs(collection(db, 'subjects'))
             ]);
 
             const allExams = allExamsSnap.status === 'fulfilled' ? allExamsSnap.value.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) : [];
             const allAgencies = agenciesSnap.status === 'fulfilled' ? agenciesSnap.value.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) : [];
             const allLiveTests = liveTestsSnap.status === 'fulfilled' ? liveTestsSnap.value.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) : [];
             const currentNotices = noticesSnap.status === 'fulfilled' ? noticesSnap.value.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) : [];
             const currentResults = resultsSnap.status === 'fulfilled' ? resultsSnap.value.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) : [];
             const currentSubjects = subjectsSnap.status === 'fulfilled' ? subjectsSnap.value.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) : [];
 
             const examsWithAgencyLogos = allExams.map(exam => {
                 const agency = allAgencies.find(a => a.id === exam.agencyId);
                 return {
                     ...exam,
                     type: 'exam',
                     logoUrl: agency?.logoUrl || exam.logoUrl
                 };
             });
 
             const enrolledLiveTests = allLiveTests.filter(t => t.enrolledUsers?.includes(profile.userId) || purchasedIds.includes(t.id));
 
             const activeExamsAndTests = [
               ...examsWithAgencyLogos.filter(ex => purchasedIds.includes(ex.id)),
               ...enrolledLiveTests.map(t => ({
                  ...t,
                  type: 'live_test',
                  name: t.title, // Map title to name for consistency
                  category: 'Live Test'
               }))
             ];
 
             setActiveExams(activeExamsAndTests);
 
             // Sort approaching live tests, show only upcoming or currently active ones
             const now = new Date().getTime();
             const validLiveTests = allLiveTests.filter(t => new Date(t.endTime).getTime() > now);
             validLiveTests.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
             
             setUpcomingTests(validLiveTests.slice(0, 3));
 
             // Discover New
             const newExams = examsWithAgencyLogos.filter(ex => !purchasedIds.includes(ex.id)).slice(0, 3);
             setDiscoverExams(newExams);
 
             // Fetch latest announcements
             setNotices(currentNotices);
 
             // Subject Performance
             // Fetch subjects mapping to get proper names
             const subjectNames: Record<string, string> = {};
             currentSubjects.forEach(doc => {
                 subjectNames[doc.id] = doc.name;
             });
 
             if (currentResults.length > 0) {
                  const aggregatedStats: Record<string, { totalCorrect: number, totalMaxScore: number, totalScore: number }> = {};
                  let totalScoreAcrossTests = 0;
                  let totalMaxMarksAcrossTests = 0;
                  let testsAttempted = currentResults.length;
                  
                  currentResults.forEach(data => {
                      totalScoreAcrossTests += typeof data.score === 'number' ? data.score : 0;
                      totalMaxMarksAcrossTests += typeof data.maxMarks === 'number' ? data.maxMarks : 1;
                      
                      if (data.subjectStats) {
                          Object.entries(data.subjectStats).forEach(([subjectId, stats]: [string, any]) => {
                              if (!aggregatedStats[subjectId]) {
                                  aggregatedStats[subjectId] = { totalCorrect: 0, totalMaxScore: 0, totalScore: 0 };
                              }
                              aggregatedStats[subjectId].totalCorrect += stats.correct || 0;
                              aggregatedStats[subjectId].totalScore += stats.score || 0;
                              aggregatedStats[subjectId].totalMaxScore += stats.maxScore || 1; // avoid div by 0
                          });
                      }
                  });
                  
                  const avgAcc = totalMaxMarksAcrossTests > 0 ? Math.round(Math.max(0, (totalScoreAcrossTests / totalMaxMarksAcrossTests)) * 100) : 0;
                  
                  setUserProgress({
                      mockTestsAttempted: testsAttempted,
                      averageAccuracy: avgAcc,
                      studyHours: Math.round(testsAttempted * 0.5) // ~30 mins per test average
                  });
                  
                  const performanceArr: any[] = [];
                  Object.entries(aggregatedStats).forEach(([subjectId, stats]) => {
                       const accuracy = Math.round(Math.max(0, (stats.totalScore / Math.max(1, stats.totalMaxScore)) * 100));
                       const subjectName = subjectNames[subjectId] || subjectId;
                       // Ignore 'general' placeholder if we have others or map it to 'General'
                       performanceArr.push({
                           subjectId: subjectId,
                           subject: subjectId === 'general' ? 'General' : subjectName,
                           accuracy: accuracy,
                           status: accuracy >= 70 ? 'good' : 'bad'
                       });
                  });
 
                  if (performanceArr.length > 0) {
                      setSubjectPerformance(performanceArr.sort((a,b) => b.accuracy - a.accuracy).slice(0, 5));
                      const lowest = performanceArr.sort((a,b) => a.accuracy - b.accuracy)[0];
                      setLowestSubject(lowest);
                  } else {
                      setSubjectPerformance([]);
                      setLowestSubject(null);
                  }
             } else {
                 setSubjectPerformance([]);
             }
 
         } catch (error) {
             console.error("Error fetching dashboard data:", error);
         } finally {
             setLoadingData(false);
         }
      };
      fetchDashboardData();
   }, [profile]);


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
    if (settings?.doubtLink) {
      window.open(settings.doubtLink, '_blank');
    } else {
      alert("Doubt clearing link is not configured yet.");
    }
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
                  
                  {/* Payment Success Banner */}
                  <AnimatePresence>
                    {paymentSuccessInfo && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] p-6 md:p-8 relative overflow-hidden"
                      >
                         <button 
                           onClick={() => setPaymentSuccessInfo(null)}
                           className="absolute top-6 right-6 p-2 text-emerald-400 hover:text-emerald-600 transition-colors"
                         >
                           <X size={20} />
                         </button>
                         <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                               <CheckCircle2 size={32} />
                            </div>
                            <div className="text-center md:text-left">
                               <h2 className="text-xl font-black text-emerald-900 mb-1">Payment Successful!</h2>
                               <p className="text-sm text-emerald-700 font-medium">Your enrollment has been confirmed. You can now access your materials.</p>
                               {paymentSuccessInfo.paymentId && (
                                 <div className="mt-4 inline-flex flex-wrap items-center gap-3">
                                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full border border-emerald-100">
                                     Transaction ID: {paymentSuccessInfo.paymentId}
                                   </span>
                                   <p className="text-[9px] text-emerald-400 font-bold italic">Keep this for your records.</p>
                                 </div>
                               )}
                            </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Welcome Panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-[#0f172a] text-white p-6 md:p-10 rounded-[2rem] flex flex-col justify-center relative overflow-hidden">
                      <h1 className="text-2xl md:text-4xl font-black mb-3">Welcome back, {profile?.name || 'Aspirant'}!</h1>
                      <p className="text-slate-400 mb-6 md:mb-8 text-sm md:text-base max-w-lg">You're in the top 5% of aspirants this week. Keep up the momentum to secure your spot.</p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={() => navigate('/exams')} className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 justify-center hover:bg-teal-700 transition">
                           <Zap className="w-4 h-4" /> Resume Mock Test
                        </button>
                        <button onClick={() => navigate('/performance')} className="bg-white/10 text-white px-6 py-3 rounded-2xl font-bold justify-center hover:bg-white/20 transition">
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
                           <Link to="/live-tests" className="text-teal-600 text-[10px] font-black uppercase tracking-wider hover:underline">View All</Link>
                        </div>
                        {upcomingTests.length > 0 ? upcomingTests.map((t) => {
                            const now = new Date().getTime();
                            const testStart = new Date(t.startTime || t.scheduledStartTime).getTime();
                            const testEnd = new Date(t.endTime || new Date(testStart + (t.duration || 60) * 60000)).getTime();
                            const isTestActive = now >= testStart && now <= testEnd;
                            const isEnrolled = profile && t.enrolledUsers?.includes(profile.userId);
                            const timeLeftSec = Math.max(0, Math.floor((testStart - now) / 1000));
                            
                            return (
                           <div key={t.id} className="bg-white p-6 rounded-[2rem] border-2 border-teal-50 shadow-sm relative overflow-hidden">
                              <div className="flex justify-between items-start mb-4">
                                  {isTestActive ? (
                                      <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded tracking-wider uppercase flex items-center gap-1 shadow-sm">
                                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> LIVE NOW
                                      </span>
                                  ) : (
                                      <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded tracking-wider uppercase flex items-center gap-1 shadow-sm">
                                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> LIVE SOON
                                      </span>
                                  )}
                                  <div className="text-right">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isTestActive ? 'Ends In' : 'Starts In'}</p>
                                      <p className="text-lg font-black text-teal-700 font-mono tracking-tight">
                                          {isTestActive ? Math.floor(Math.max(0, testEnd - now) / 60000) + 'm left' : (
                                              timeLeftSec > 86400 
                                              ? `${Math.floor(timeLeftSec/86400)}d ${Math.floor((timeLeftSec%86400)/3600)}h` 
                                              : formatTime(timeLeftSec)
                                          )}
                                      </p>
                                  </div>
                              </div>
                              <h4 className="font-bold text-slate-800 text-base mb-1">{t.title}</h4>
                              <p className="text-sm text-slate-500 mb-6 line-clamp-1">{t.description || 'General Live Test'}</p>
                              
                              {isEnrolled ? (
                                  isTestActive ? (
                                      <button onClick={() => navigate(`/test/${t.id}`)} className="w-full bg-teal-700 text-white font-black py-3 text-sm rounded-2xl hover:bg-teal-800 transition-colors uppercase tracking-widest">
                                          Enter Test 
                                      </button>
                                  ) : (
                                      <button disabled className="w-full bg-slate-100 border-2 border-emerald-500 text-emerald-600 font-black py-3 text-[10px] rounded-2xl cursor-not-allowed text-center uppercase tracking-widest flex items-center justify-center gap-2">
                                          <CheckCircle2 className="w-4 h-4" /> Participation Confirmed
                                      </button>
                                  )
                              ) : (
                                  <button onClick={() => navigate(`/live-test/${t.id}`)} className="w-full border-2 border-teal-700 text-teal-700 font-black py-3 text-[10px] rounded-2xl hover:bg-teal-50 transition-colors uppercase tracking-widest">
                                      Details & Enroll
                                  </button>
                              )}
                           </div>
                        )}) : (
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 font-medium text-sm">
                               No upcoming live tests.
                            </div>
                        )}
                     </div>
                     <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center mb-2">
                           <h3 className="text-lg font-black text-[#0f172a]">Active Subscriptions</h3>
                           {activeExams.length > 4 && (
                               <Link to="/my-subscriptions" className="text-teal-600 text-[10px] font-black uppercase tracking-wider hover:underline flex items-center gap-1">
                                   View All ({activeExams.length})
                               </Link>
                           )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeExams.length > 0 ? activeExams.slice(0, 4).map((exam) => (
                                <div key={exam.id} className="bg-white p-5 rounded-3xl border border-slate-100 flex flex-col justify-between hover:border-teal-100 hover:shadow-sm transition group">
                                    <div className="flex items-start gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 overflow-hidden">
                                            {exam.logoUrl ? (
                                                <img src={exam.logoUrl} alt={exam.name || exam.title} className="w-full h-full object-contain bg-white border border-slate-100 rounded-xl" />
                                            ) : (
                                                <Award className="w-5 h-5 text-indigo-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 leading-tight mb-1 line-clamp-2 group-hover:text-teal-700 transition">{exam.name || exam.title}</h4>
                                            <p className="text-[10px] text-slate-500 font-medium">{exam.type === 'live_test' ? 'Live Test Access' : 'Subscription Active'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <span className="text-xs font-bold text-slate-700">One Time</span>
                                        <button onClick={() => navigate(exam.type === 'live_test' ? `/live-test/${exam.id}` : `/exam/${exam.id}`)} className="text-[10px] font-black text-teal-700 tracking-wider hover:text-teal-800">MANAGE</button>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 text-center flex flex-col items-center justify-center min-h-[140px]">
                                    <p className="text-slate-500 text-sm font-medium mb-4">No active subscriptions found.</p>
                                    <Link to="/exams" className="text-teal-600 bg-teal-50 px-4 py-2 rounded-xl text-xs font-bold hover:bg-teal-100 transition">Browse Exams</Link>
                                </div>
                            )}
                        </div>
                     </div>
                  </div>

                  {/* Announcements & Discover New */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
                          <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-[#0f172a] flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-indigo-600" /> Platform Announcements
                            </h3>
                            <button onClick={() => navigate('/announcements')} className="text-indigo-600 text-[10px] font-black uppercase tracking-wider hover:underline">View All Updates</button>
                          </div>
                          
                          <div className="space-y-4 flex-1">
                            {notices.length > 0 ? notices.map((notice) => (
                              <div key={notice.id} className="p-4 rounded-3xl border border-slate-50 bg-slate-50/30 group hover:bg-slate-50 transition-all flex items-start gap-4">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                   notice.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                   notice.type === 'update' ? 'bg-teal-100 text-teal-600' :
                                   'bg-indigo-100 text-indigo-600'
                                 }`}>
                                    {notice.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : 
                                     notice.type === 'update' ? <Zap className="w-5 h-5" /> : 
                                     <Info className="w-5 h-5" />}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 text-sm truncate">{notice.title}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-1">{notice.content}</p>
                                 </div>
                                 <div className="text-right shrink-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(notice.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                 </div>
                              </div>
                            )) : (
                              <div className="h-full flex flex-col items-center justify-center py-10 opacity-50">
                                 <Megaphone className="w-10 h-10 mb-3 text-slate-300" />
                                 <p className="text-sm font-medium text-slate-400">No announcements yet</p>
                              </div>
                            )}
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
                    {subjectPerformance.length > 0 ? (
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
                    ) : (
                        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
                            Take a mock test to unlock subject performance analysis.
                        </div>
                    )}
                  </div>

                  {/* Projected Score Improvement & Quick Access */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                    <div className="lg:col-span-2 bg-teal-50 p-6 md:p-8 rounded-[2rem] border border-teal-100 flex flex-col md:flex-row items-center justify-between gap-4">
                         <div>
                            <h3 className="font-black text-teal-900 mb-2">Projected Score Improvement</h3>
                            <p className="text-sm text-teal-700">Focusing on Quantitative Aptitude could add 45 points.</p>
                         </div>
                         <button 
                             onClick={() => lowestSubject && navigate(`/subject-tests/${lowestSubject.subjectId}`)}
                             disabled={!lowestSubject}
                             className="bg-teal-600 text-white font-black px-6 py-3 rounded-2xl w-full md:w-auto disabled:opacity-50 disabled:bg-slate-400"
                         >
                            {lowestSubject ? `Practice ${lowestSubject.subject}` : 'No Subject Found'}
                         </button>
                    </div>
                    <div className="flex flex-col gap-4">
                        <Link to="/study-material" className="bg-[#1e293b] text-white p-4 rounded-2xl font-bold text-center">Study Material</Link>
                        <Link to="/performance" className="bg-[#1e293b] text-white p-4 rounded-2xl font-bold text-center">Analysis</Link>
                        <button onClick={handleDoubtClick} className="bg-[#4a2406] text-white p-4 rounded-2xl font-bold text-center flex items-center justify-center gap-2">
                             <HelpCircle className="w-5 h-5"/> Doubt Hub
                        </button>
                        <Link to="/helpdesk" className="bg-[#0f172a] text-white p-4 rounded-2xl font-bold text-center flex items-center justify-center gap-2 transition hover:bg-black">
                             <MessageCircle className="w-5 h-5"/> Support Ticket
                        </Link>
                    </div>
                  </div>
                </motion.div>
                
                {/* Footer */}
                <footer className="mt-12 py-8 border-t border-slate-100/60 pb-4 lg:pb-0">
                  <p className="text-center text-xs text-slate-500 font-medium pb-4">
                    © {new Date().getFullYear()} PrepNext. Built for Excellence in Competitive Examinations.
                  </p>
                </footer>
          </main>
      </div>
    </div>
  );
}


