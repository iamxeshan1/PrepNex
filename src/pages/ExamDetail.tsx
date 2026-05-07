import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getTestsByExamId, createSubscription, getResultsByTestId } from '../services/db';
import { doc, getDoc, getDocs, query, collection, documentId, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChevronLeft, Lock, Play, Clock, FileText, CheckCircle2, ShoppingBag, Award, History, Building2, Shield } from 'lucide-react';
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
    if (profile?.freeExams?.includes(examId)) {
      // Free mocks within a free exam are accessible after enrollment
      if (test.isFree) return true;
      // Paid mocks within a free exam are not accessible just by enrollment
      return false;
    }
    
    return false;
  };

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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
        <Link to="/exams" className="inline-flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-[#008770] mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Catalog
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Info - Left Column */}
          <div className="lg:col-span-2 space-y-12">
            <header>
              <div className="flex items-center gap-2 text-xs font-bold text-[#008770] bg-[#e6fcf9] px-3 py-1 rounded-full mb-6 w-fit">
                <Shield className="w-3.5 h-3.5" />
                <span>{agency?.name || exam.organization || 'OFFICIAL SERIES'}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 tracking-tighter mb-6">{exam.name}</h1>
              <p className="text-lg text-slate-600 leading-relaxed font-medium">{exam.description || 'Comprehensive test series designed by regional experts to mirror the latest exam pattern.'}</p>
            </header>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: 'TOTAL TESTS', value: `${exam.mockCount || 0} Mock Tests` },
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

            {/* Mock Tests Section */}
            <section>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-display font-black text-slate-900 tracking-tighter">Available Mock Tests</h2>
                <div className="flex bg-slate-100 p-1 rounded-full text-[12px] font-bold tracking-widest">
                   <button className="px-5 py-2 bg-white rounded-full text-[#0f172a] shadow-sm">All Tests</button>
                   <button className="px-5 py-2 text-slate-500 hover:text-slate-700">Sectional</button>
                </div>
              </div>

              <div className="space-y-4">
                {tests.map((test) => {
                  const unlocked = hasAccess(test);
                  return (
                    <div 
                      key={test.id}
                      className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between gap-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                           <h4 className="font-display font-bold text-[#0f172a] mb-1">{test.title}</h4>
                           <div className="flex items-center gap-4 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                              <span>{test.questionCount || 120} Questions</span>
                              <span>{test.duration || 120} Mins</span>
                              <span>{test.difficulty || 'Easy'}</span>
                           </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                         {test.isFree && !unlocked && <span className="text-[10px] font-black uppercase text-teal-600 bg-teal-50 px-2 py-1 rounded">Free</span>}
                         {!test.isFree && !unlocked && <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-1 rounded">Premium</span>}
                         
                         {unlocked ? (
                           <button onClick={() => navigate(`/test/${test.id}`)} className="px-6 py-3 bg-[#008770] text-white font-black rounded-lg text-sm hover:bg-[#006e5d] transition-all">Start</button>
                         ) : (
                           <button className="px-6 py-3 bg-slate-50 text-slate-500 font-bold rounded-lg text-sm border border-slate-200 flex items-center gap-2"><Lock className="w-3 h-3" /> Locked</button>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
             <div className="sticky top-24 space-y-8">
               {/* Premium Access Card */}
               <div className="bg-[#0f172a] rounded-3xl p-8 text-white">
                  <div className="flex items-center gap-2 text-[#f59e0b] text-[10px] font-black uppercase tracking-widest mb-4">
                     <Award className="w-4 h-4" />
                     <span>Premium Access</span>
                  </div>
                  <h3 className="text-2xl font-display font-black tracking-tight mb-4">Unlock Full Test Series</h3>
                  <p className="text-slate-400 text-sm font-medium mb-6">Get access to 35+ Full Length Mocks, Subject-wise tests, and Detailed Analytics for the {exam.name}.</p>
                   <div className="flex items-baseline gap-2 mb-6">
                     <span className="text-4xl font-black text-white">{exam.isPaid ? `₹${exam.price || '499'}` : 'FREE'}</span>
                     {exam.isPaid && <span className="text-slate-500 line-through">₹{Number(exam.price || 499) + 500}</span>}
                     {exam.isPaid && <span className="bg-[#10b981] text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">Off</span>}
                  </div>
                  <button onClick={handlePurchaseClick} className="w-full py-4 bg-[#008770] text-white font-black rounded-xl hover:bg-[#006e5d] transition-all flex items-center justify-center gap-2">{exam.isPaid ? 'Enroll Now' : 'Enroll Free'} <ChevronLeft className="w-4 h-4 rotate-180" /></button>
                  <p className="text-[10px] text-center text-slate-600 mt-4">Secure 256-bit SSL encrypted payment</p>
               </div>
               
               {/* Included Card */}
               <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-display font-black text-[#0f172a] mb-6">What's Included</h3>
                  <ul className="space-y-4">
                    {[
                      '45 Full Length Mock Tests',
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
