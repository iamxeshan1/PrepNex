import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getTestsByExamId, createSubscription, getResultsByTestId } from '../services/db';
import { doc, getDoc, getDocs, query, collection, documentId, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChevronLeft, Lock, Play, Clock, FileText, CheckCircle2, ShoppingBag, Award, History, Building2, Shield, Crown } from 'lucide-react';
import CheckoutModal from '../components/CheckoutModal';

export default function ExamDetail() {
  const { examId } = useParams();
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [agency, setAgency] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any[]>>({});
  const [razorpayKeyId, setRazorpayKeyId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!examId) return;
      const [examSnap, subjectsSnap] = await Promise.all([
        getDoc(doc(db, 'exams', examId)),
        getDocs(collection(db, 'subjects'))
      ]);
      
      if (examSnap.exists()) {
        const examData = examSnap.data();
        const isAdmin = profile?.role === 'admin' || profile?.email === 'iamxeshan1@gmail.com' || profile?.email === 'prepnextedtech@gmail.com';
        if (examData.status === 'draft' && !isAdmin) {
          navigate('/dashboard');
          return;
        }
        setExam({ id: examSnap.id, ...examData });
        
        if (examData.agencyId) {
           const agencySnap = await getDoc(doc(db, 'agencies', examData.agencyId));
           if (agencySnap.exists()) {
             setAgency({ id: agencySnap.id, ...agencySnap.data() });
           }
        }
      }
      
      setSubjects(subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const testsData = await getTestsByExamId(examId);
      const visibleTests = testsData || [];
      setTests(visibleTests);
      
      // Fetch results for these tests if user is logged in
      if (user) {
        const resultsMap: Record<string, any[]> = {};
        for (const test of visibleTests) {
          const results = await getResultsByTestId(user.uid, test.id);
          resultsMap[test.id] = results || [];
        }
        setTestResults(resultsMap);
      }
      
      // Fetch Razorpay config
      try {
        const res = await fetch('/api/payment-status');
        const data = await res.json();
        if (data.configured && data.keyId) {
          setRazorpayKeyId(data.keyId);
        }
      } catch (err) {
        console.error("Error fetching payment config:", err);
      }
      
      setLoading(false);
    };
    fetchData();
  }, [examId, user]);

  const hasAccess = (test: any) => {
    const isAdmin = profile?.role === 'admin' || profile?.email === 'iamxeshan1@gmail.com' || profile?.email === 'prepnextedtech@gmail.com';
    if (test.status === 'draft' && !isAdmin) return false;

    // Premium users get access to everything.
    if (profile?.isPremium) return true;

    // Paid Exam Logic
    if (exam?.isPaid) {
      // Must have purchased the exam to access any mocks
      return profile?.purchasedExams?.includes(examId);
    }

    // Free Exam Logic
    // User must be enrolled in the free exam
    if (profile?.purchasedExams?.includes(examId) || profile?.freeExams?.includes(examId)) {
      // If it's a free exam and user is enrolled, all free mocks inside are accessible.
      if (!exam?.isPaid) {
         if (test.isFree) return true;
         // Note: If exam is free but mock is premium, they need premium pass, which is handled above.
         return false;
      }
    }
    
    return false;
  };

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const isEnrolledInExam = profile?.isPremium || profile?.purchasedExams?.includes(examId) || profile?.freeExams?.includes(examId);

  const handlePurchaseClick = () => {
    if (!user) return navigate('/login');
    if (!examId || !exam) return;
    setIsCheckoutOpen(true);
  };

  if (loading) return <Layout><div className="flex h-96 items-center justify-center">Loading...</div></Layout>;
  if (!exam) return <Layout><div className="flex h-96 items-center justify-center">Exam not found.</div></Layout>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/exams" className="inline-flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-900 mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Catalog
        </Link>
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Info - Left Column */}
          <div className="lg:col-span-2 space-y-12">
            <header>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 bg-[#e6fcf9] px-3 py-1 rounded-full mb-6 w-fit">
                <Shield className="w-3.5 h-3.5" />
                <span>{agency?.name || exam.organization || 'OFFICIAL SERIES'}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 tracking-tighter mb-6">{exam.name}</h1>
              <p className="text-lg text-slate-600 leading-relaxed font-medium">{exam.description || 'Comprehensive test series designed by regional experts to mirror the latest exam pattern.'}</p>
            </header>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: 'TOTAL TESTS', value: `${tests.length > 0 ? tests.length : (exam.mockCount || 0)} Mock Tests` },
                 { label: 'DURATION', value: `${exam.duration || 0} Minutes` },
                 { label: 'ENROLLED', value: `${exam.enrollCount || '0'} Students` },
                 { label: 'LANGUAGE', value: exam.language || 'English / Urdu' }
               ].map((stat, i) => (
                 <div key={i} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">{stat.label}</p>
                    <p className="text-sm font-black text-slate-900">{stat.value}</p>
                 </div>
               ))}
            </div>

            </div>

           {/* Mock Tests Section - Bottom Left */}
           <div className="lg:col-span-2 lg:col-start-1 order-3 lg:order-none mb-12">
             {/* Mock Tests Section */}
            <section>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-display font-black text-slate-900 tracking-tighter">Available Mock Tests</h2>
                <div className="flex bg-slate-100 p-1 rounded-full text-[12px] font-bold tracking-widest">
                   <button className="px-5 py-2 bg-white rounded-full text-slate-900 shadow-sm">All Tests</button>
                   <button className="hidden sm:block px-5 py-2 text-slate-500 hover:text-slate-700">Sectional</button>
                </div>
              </div>

              <div className="space-y-4">
                {tests.map((test) => {
                  const unlocked = hasAccess(test);
                  return (
                    <div 
                      key={test.id}
                      className="p-5 sm:p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all hover:border-teal-100"
                    >
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                           <h4 className="font-display font-bold text-slate-900 mb-1 leading-tight line-clamp-2">{test.title}</h4>
                           <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-2 sm:mt-0">
                               <span>{test.questionCount || 120} Qs</span>
                               <span className="hidden sm:inline">•</span>
                               <span>{test.duration || 120} Mins</span>
                               <span className="hidden sm:inline">•</span>
                               <span>{test.difficulty || 'Easy'}</span>
                            </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between sm:justify-end items-center gap-3 w-full sm:w-auto border-t border-slate-50 sm:border-t-0 pt-4 sm:pt-0 shrink-0">
                          <div className="flex items-center gap-2">
                             {test.isFree && !unlocked && <span className="text-[10px] font-black uppercase text-teal-600 bg-teal-50 px-2.5 py-1.5 rounded-lg">Free</span>}
                             {!test.isFree && !unlocked && <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg">Premium</span>}
                          </div>
                          {unlocked ? (
                            <button onClick={() => navigate(`/test/${test.id}`)} className="px-5 py-2.5 sm:px-6 sm:py-3 bg-[#064e40] text-white font-black rounded-xl text-sm hover:bg-[#006e5d] transition-all whitespace-nowrap">Start</button>
                          ) : (
                            <button className="px-5 py-2.5 sm:px-6 sm:py-3 bg-slate-50 text-slate-500 font-bold rounded-xl text-sm border border-slate-200 flex items-center justify-center w-full sm:w-auto gap-2 whitespace-nowrap"><Lock className="w-4 h-4" /> Locked</button>
                          )}
                       </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 lg:row-span-2 order-2 lg:order-none">
             <div className="sticky top-24 space-y-8">
               {/* Premium Access Card */}
               <div className="bg-[#064e40] rounded-3xl p-8 text-white">
                  <div className="flex items-center gap-2 text-[#f59e0b] text-[10px] font-black uppercase tracking-widest mb-4">
                     <Award className="w-4 h-4" />
                     <span>Premium Access</span>
                  </div>
                  <h3 className="text-2xl font-display font-black tracking-tight mb-4">Unlock Full Test Series</h3>
                  <p className="text-slate-400 text-sm font-medium mb-6">Get access to Full Length Mocks, Subject-wise tests, and Detailed Analytics for the {exam.name}.</p>
                   <div className="flex items-baseline gap-2 mb-6">
                     <span className="text-4xl font-black text-white">{exam.isPaid ? `₹${exam.price || '499'}` : 'FREE'}</span>
                     {exam.isPaid && <span className="text-slate-500 line-through">₹{Number(exam.price || 499) + 500}</span>}
                     {exam.isPaid && <span className="bg-[#10b981] text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">Off</span>}
                  </div>
                  {isEnrolledInExam ? (
                    <button disabled className="w-full py-4 bg-[#001f19] text-white font-black rounded-xl flex items-center justify-center gap-2 opacity-80 cursor-not-allowed">
                        <CheckCircle2 className="w-4 h-4" /> Enrolled
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <button onClick={handlePurchaseClick} className="w-full py-4 bg-teal-600 text-white font-black rounded-xl hover:bg-teal-700 transition-all flex items-center justify-center gap-2">{exam.isPaid ? 'Enroll Now' : 'Enroll Free'} <ChevronLeft className="w-4 h-4 rotate-180" /></button>
                      <button onClick={() => navigate('/premium')} className="w-full py-4 bg-amber-500/10 text-amber-500 border-2 border-amber-500/20 font-black rounded-xl hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all flex items-center justify-center gap-2 group">
                         Unlock ALL Exams with Premium
                         <Crown className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  )}
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <p className="text-[10px] text-center text-slate-500">Secure 256-bit SSL encrypted payment by</p>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-3 opacity-60 hover:opacity-100 transition-opacity brightness-0 invert" />
                  </div>
               </div>
               
               {/* Included Card */}
               <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-display font-black text-slate-900 mb-6">What's Included</h3>
                  <ul className="space-y-4">
                    {[
                      'Full Length Mock Tests',
                      'Performance Analysis',
                      'Solved Previous Year Papers',
                      'Sectional Practice Sets'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                        <CheckCircle2 className="w-5 h-5 text-teal-600" /> {item}
                      </li>
                    ))}
                  </ul>
               </div>


          </div>
        </div>
      </div>
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        item={{
          id: exam.id,
          name: exam.name,
          price: exam.isPaid ? (Number(exam.price) || 499) : 0,
          description: exam.description
        }}
        onSuccess={() => {
          alert('Enrollment successful!');
          window.location.reload();
        }}
      />
      </div>
    </Layout>
  );
}
