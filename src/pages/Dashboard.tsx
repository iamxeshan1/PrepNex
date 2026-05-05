import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { collection, query, where, getDocs, getDoc, orderBy, limit, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logActivity, ActivityAction } from '../services/activityLogger';
import { BarChart, Clock, Award, ChevronRight, BookOpen, User as UserIcon, Bell, Calendar, Phone, Mail, Save, AlertCircle, Crown, AlertTriangle, Star, CheckCircle, Send, MessageCircle, Zap, Timer, MapPin, Building, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Countdown } from '../components/Countdown';

export default function Dashboard() {
  const { profile } = useAuth();
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<{ id: string, name: string, accuracy: number, total: number, isWeak: boolean }[]>([]);
  const [purchasedExams, setPurchasedExams] = useState<{id: string, name: string}[]>([]);
  const [enrolledTests, setEnrolledTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile'>('overview');
  
  // Profile state for editing
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ].sort();

  // Review state
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Handle payment redirects
    const params = new URLSearchParams(window.location.search);
    const success = params.get('payment_success');
    const error = params.get('payment_error');
    const itemId = params.get('itemId');

    if (error) {
      const errorMsg = error.replace(/_/g, ' ').toUpperCase();
      setSaveMessage({ 
        type: 'error', 
        text: `PAYMENT FAILED: ${errorMsg}. Please try again or contact support if the amount was debited.` 
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (success === 'true') {
      const needsClientUpdate = params.get('needs_client_update');
      
      const processClientUpdate = async () => {
        setSaveMessage({ type: 'success', text: 'PAYMENT SUCCESSFUL! Processing your order...' });
        const amount = params.get('amount') || "0";
        const userName = profile?.displayName || profile?.name || profile?.email?.split('@')[0] || "User";

        if (needsClientUpdate === 'true' && profile?.userId && itemId) {
           console.log("Processing client-side fallback record...");
           try {
             if (itemId === "PREMIUM_PASS") {
                const expiryDate = new Date();
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                await updateDoc(doc(db, "users", profile.userId), {
                  isPremium: true,
                  subscriptionExpiry: expiryDate.toISOString()
                });
             } else {
               const liveTestDoc = await getDocs(query(collection(db, "liveTests"), where("__name__", "==", itemId)));
               if (!liveTestDoc.empty) {
                  const data = liveTestDoc.docs[0].data();
                  const enrolledUsers = data.enrolledUsers || [];
                  if (!enrolledUsers.includes(profile.userId)) {
                    await updateDoc(doc(db, "liveTests", itemId), { enrolledUsers: [...enrolledUsers, profile.userId] });
                  }
               } else {
                 const purchasedExams = profile.purchasedExams || [];
                 if (!purchasedExams.includes(itemId)) {
                   await updateDoc(doc(db, "users", profile.userId), { purchasedExams: [...purchasedExams, itemId] });
                 }
               }
             }
           } catch(e) {
             console.error("Client side purchase log update failed", e);
           }
        }
      };

      processClientUpdate().then(() => {
        setSaveMessage({ type: 'success', text: 'PAYMENT SUCCESSFUL! Your account is now active.' });
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }

    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setDistrict(profile.district || '');
      setState(profile.state || '');
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

        // Fetch Purchased Exam Names
        if (profile.purchasedExams?.length > 0) {
          const examsSnap = await getDocs(query(collection(db, 'exams'), where('__name__', 'in', profile.purchasedExams)));
          setPurchasedExams(examsSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
        }

        // Fetch Enrolled Live/Scheduled Tests
        const enrolledQuery = query(collection(db, 'tests'), where('enrolledUsers', 'array-contains', profile.userId));
        const enrolledSnap = await getDocs(enrolledQuery);
        const schedTests = enrolledSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(), 
          type: 'Live Hall',
          startTime: (doc.data() as any).scheduledStartTime 
        }));

        const enrolledLiveQuery = query(collection(db, 'liveTests'), where('enrolledUsers', 'array-contains', profile.userId));
        const enrolledLiveSnap = await getDocs(enrolledLiveQuery);
        const liveTests = enrolledLiveSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(), 
          type: 'Live Mock',
          startTime: (doc.data() as any).startTime 
        }));

        setEnrolledTests([...schedTests, ...liveTests].sort((a: any, b: any) => 
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ));

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
    
    // Basic validation
    if (!name.trim()) return setSaveMessage({ type: 'error', text: 'Name is required' });
    if (!phone.trim() || !/^\d{10}$/.test(phone)) return setSaveMessage({ type: 'error', text: 'Valid 10-digit phone required' });
    if (!address.trim()) return setSaveMessage({ type: 'error', text: 'Address is required' });
    if (!district.trim()) return setSaveMessage({ type: 'error', text: 'District is required' });
    if (!state) return setSaveMessage({ type: 'error', text: 'State is required' });

    setSavingProfile(true);
    setSaveMessage(null);
    try {
      await updateDoc(doc(db, 'users', profile.userId), {
        name,
        phone,
        address,
        district,
        state,
        updatedAt: new Date().toISOString()
      });
      await logActivity(profile.userId, ActivityAction.PROFILE_UPDATE, 'Updated profile details (name/phone/location).');
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error(error);
      setSaveMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.userId || !reviewContent.trim()) return;
    
    // Check for 30 day limit
    if (profile.lastReviewAt) {
      const lastReview = new Date(profile.lastReviewAt).getTime();
      const now = new Date().getTime();
      const diff = now - lastReview;
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      
      if (diff < thirtyDays) {
        setReviewMessage({ type: 'error', text: 'You can only submit one review per month.' });
        return;
      }
    }

    setSubmittingReview(true);
    setReviewMessage(null);
    try {
      await addDoc(collection(db, 'reviews'), {
        userId: profile.userId,
        userName: profile.name || 'Student',
        content: reviewContent,
        rating: reviewRating,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'users', profile.userId), { lastReviewAt: new Date().toISOString() });
      setReviewMessage({ type: 'success', text: 'Thank you! Your review has been submitted for approval.' });
      setReviewContent('');
    } catch (err) {
      setReviewMessage({ type: 'error', text: 'Failed to submit review.' });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div>
              <h1 className="text-3xl font-black text-primary tracking-tight">Dashboard</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center gap-2">
                <UserIcon className="w-3 h-3 text-secondary" /> {profile?.name} • Aspirant Path
              </p>
            </div>
            {profile?.isPremium ? (
              <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-2xl border border-purple-100 w-fit">
                <Crown className="w-4 h-4 text-purple-600 fill-purple-600" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-purple-900 uppercase tracking-widest leading-none">Premium Active</span>
                  {profile?.premiumExpiry && <span className="text-[8px] font-bold text-purple-400 uppercase mt-0.5 whitespace-nowrap">Expires: {new Date(profile.premiumExpiry).toLocaleDateString()}</span>}
                </div>
              </div>
            ) : (
              <Link to="/premium" className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-2xl hover:border-primary hover:shadow-lg hover:shadow-primary/5 transition-all group w-fit">
                <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                  <Zap className="w-3.5 h-3.5 fill-slate-400 group-hover:fill-primary" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 group-hover:text-primary uppercase tracking-widest leading-none block">Free Plan</span>
                  <span className="text-[8px] font-bold text-secondary uppercase mt-0.5">Upgrade to Pro →</span>
                </div>
              </Link>
            )}
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
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
        
        {/* Payment and Profile Status Messages */}
        <AnimatePresence>
          {saveMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-8 p-6 rounded-[2rem] border shadow-sm flex items-center justify-between gap-4 ${
                saveMessage.type === 'success' 
                  ? 'bg-green-50 border-green-100 text-green-800' 
                  : 'bg-red-50 border-red-100 text-red-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  saveMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {saveMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-tight text-sm">
                    {saveMessage.type === 'success' ? 'Success Notification' : 'System Alert'}
                  </h4>
                  <p className="text-xs font-bold opacity-80 mt-0.5">{saveMessage.text}</p>
                </div>
              </div>
              <button 
                onClick={() => setSaveMessage(null)}
                className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
                  <Link to="/agencies" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold transition-all">
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
                    <Link to="/agencies" className="text-xs font-black text-secondary uppercase tracking-widest hover:underline">Take New Test</Link>
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
                      <Link to="/agencies" className="bg-primary text-white px-8 py-4 rounded-2xl font-black tracking-widest uppercase text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
                        Browse Agencies
                      </Link>
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  {/* Enrollments Card */}
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-primary mb-6 uppercase tracking-tight">Active Hall Passes</h3>
                    {enrolledTests.length > 0 ? (
                      <div className="space-y-4">
                        {enrolledTests.map((test) => {
                          const now = new Date().getTime();
                          const start = new Date(test.startTime).getTime();
                          const diff = start - now;
                          const isLive = diff <= 0;
                          
                          return (
                            <Link 
                              key={test.id} 
                              to={`/test/${test.id}?isLive=true`}
                              className={`block p-4 rounded-2xl border transition-all ${isLive ? 'border-primary bg-primary/5 hover:bg-primary/10' : 'border-slate-100 bg-white hover:border-secondary'}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-[0.1em] ${test.type === 'Live Hall' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                  {test.type}
                                </span>
                                {isLive ? (
                                  <span className="flex items-center gap-1 text-[8px] font-black text-primary uppercase tracking-widest animate-pulse">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> LIVE NOW
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                     <Timer className="w-2.5 h-2.5 text-secondary" />
                                     <div className="text-[10px] font-black text-secondary">
                                       <Countdown targetDate={test.startTime} compact />
                                     </div>
                                  </div>
                                )}
                              </div>
                              <h4 className="text-xs font-extrabold text-primary truncate mb-1">{test.title}</h4>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                {new Date(test.startTime).toLocaleDateString()}
                              </p>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">No active enrollments</p>
                        <Link to="/" className="text-[10px] font-black text-primary hover:underline tracking-widest uppercase mt-4 inline-block">Join Live Mocks →</Link>
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
                    ) : purchasedExams.length > 0 ? (
                      <div className="space-y-3">
                        {purchasedExams.map((exam) => (
                          <Link key={exam.id} to={`/exam/${exam.id}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-secondary transition-all">
                            <div className="w-1.5 h-1.5 rounded-full bg-secondary group-hover:scale-150 transition-transform" />
                            <span className="text-[10px] font-black text-primary truncate tracking-widest uppercase">{exam.name}</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">No active premium packages</p>
                        <Link to="/premium" className="text-[10px] font-black text-secondary hover:underline tracking-widest uppercase mt-4 inline-block">Explore Plans →</Link>
                      </div>
                    )}
                  </div>

                  {/* Review Section */}
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <h3 className="text-lg font-black text-primary">Share Your Feedback</h3>
                    </div>
                    
                    {reviewMessage?.type === 'success' ? (
                      <div className="text-center py-4">
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="w-6 h-6 border-white" />
                        </div>
                        <p className="text-xs font-bold text-slate-600">{reviewMessage.text}</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        <div className="flex justify-center gap-2 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="focus:outline-none transition-transform active:scale-125"
                            >
                              <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                            </button>
                          ))}
                        </div>
                        <textarea 
                          placeholder="Tell us what you love about our platform..."
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 text-xs font-medium min-h-[100px] resize-none"
                          value={reviewContent}
                          onChange={(e) => setReviewContent(e.target.value)}
                          required
                        />
                        {reviewMessage?.type === 'error' && (
                          <p className="text-[10px] font-bold text-red-500 text-center">{reviewMessage.text}</p>
                        )}
                        <button 
                          type="submit"
                          disabled={submittingReview || !reviewContent.trim()}
                          className="w-full py-3 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/10"
                        >
                          {submittingReview ? 'Submitting...' : <><Send className="w-3 h-3" /> Submit Review</>}
                        </button>
                        <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-widest pt-2">Once per month submission</p>
                      </form>
                    )}
                  </div>
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

                <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none text-slate-700 font-medium"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="tel"
                          required
                          pattern="[0-9]{10}"
                          value={phone}
                          onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none text-slate-700 font-medium"
                          placeholder="10-digit mobile number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Full Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3 text-slate-400" size={18} />
                        <textarea
                          required
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          rows={2}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none text-slate-700 font-medium resize-none"
                          placeholder="House No, Locality, Area..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">District</label>
                        <div className="relative">
                          <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                            type="text"
                            required
                            value={district}
                            onChange={e => setDistrict(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none text-slate-700 font-medium"
                            placeholder="District"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">State</label>
                        <div className="relative">
                          <Map className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                          <select
                            required
                            value={state}
                            onChange={e => setState(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none text-slate-700 font-medium appearance-none"
                          >
                            <option value="">Select State</option>
                            {INDIAN_STATES.map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
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
