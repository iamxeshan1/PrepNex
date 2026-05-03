import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getTestsByExamId, createSubscription, getResultsByTestId } from '../services/db';
import { doc, getDoc, getDocs, query, collection, documentId, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChevronLeft, Lock, Play, Clock, FileText, CheckCircle2, ShoppingBag, Award, History, Building2 } from 'lucide-react';
import CheckoutModal from '../components/CheckoutModal';

export default function ExamDetail() {
  const { examId } = useParams();
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [agency, setAgency] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any[]>>({});
  const [razorpayKeyId, setRazorpayKeyId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!examId) return;
      const examSnap = await getDoc(doc(db, 'exams', examId));
      if (examSnap.exists()) {
        const examData = examSnap.data();
        const isAdmin = profile?.role === 'admin' || profile?.email === 'iamxeshan1@gmail.com' || profile?.email === 'prepnexedtech@gmail.com';
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
      const testsData = await getTestsByExamId(examId);
      const isAdmin = profile?.role === 'admin' || profile?.email === 'iamxeshan1@gmail.com' || profile?.email === 'prepnexedtech@gmail.com';
      const visibleTests = (testsData || []).filter((t: any) => t.status !== 'draft' || isAdmin);
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
    if (test.isFree) return true;
    if (profile?.isPremium) return true;
    if (exam?.isPaid && profile?.purchasedExams?.includes(examId)) return true;
    if (exam?.isPaid && profile?.freeExams?.includes(examId)) return true;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={agency?.id ? `/agency/${agency.id}` : "/agencies"} className="inline-flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-primary mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to {agency?.name || 'Agencies'}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-12">
            <header>
              <div className="flex items-center gap-3 text-xs font-bold text-secondary uppercase tracking-widest mb-4">
                {agency?.logoUrl ? (
                  <img src={agency.logoUrl} alt={agency.name} className="w-6 h-6 object-contain rounded" />
                ) : (
                  <Building2 className="w-4 h-4" />
                )}
                <span>{agency?.name || exam.organization}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <span>{exam.category}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <span className={`px-2 py-0.5 rounded-md ${exam.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : exam.difficulty === 'Hard' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{exam.difficulty || 'Medium'}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight mb-6">{exam.name}</h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">{exam.description || 'Comprehensive test series designed to mimic the actual exam environment and pattern.'}</p>
            </header>

            {/* Exam Highlights Section */}
            {exam.type !== 'competitive' && (exam.totalPosts || (exam.postDistribution && exam.postDistribution.length > 0)) && (
              <section className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 mb-8">
                <h2 className="text-2xl font-bold text-primary mb-6">Exam Highlights</h2>
                
                {exam.totalPosts && (
                  <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
                    <span className="text-primary font-black">Total Posts Advertised</span>
                    <span className="text-3xl font-black text-secondary">{exam.totalPosts}</span>
                  </div>
                )}

                {exam.postDistribution && exam.postDistribution.length > 0 && (
                  <div className="space-y-4">
                     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Category-wise Distribution</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {exam.postDistribution.map((pd: any, idx: number) => (
                           <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                              <span className="text-primary font-black text-sm">{pd.category}</span>
                              <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-black">{pd.count} Posts</span>
                           </div>
                        ))}
                     </div>
                  </div>
                )}
              </section>
            )}

            {/* Subject Weightage Section */}
            {exam.subjectsWeightage && exam.subjectsWeightage.length > 0 && (
              <section className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 mb-8">
                <h2 className="text-2xl font-bold text-primary mb-6">Marks Distribution</h2>
                
                <div className="space-y-4">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {exam.subjectsWeightage.map((sw: any, idx: number) => (
                         <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <span className="text-primary font-black text-sm">{sw.subject}</span>
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-black">{sw.marks} Marks</span>
                         </div>
                      ))}
                   </div>
                </div>
              </section>
            )}

            <section>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-primary">Mock Tests ({tests.length})</h2>
                {!(profile?.purchasedExams?.includes(examId) || profile?.freeExams?.includes(examId)) && exam.isPaid && (
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Subscription Required for Premium Mocks
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {tests.map((test) => {
                  const unlocked = hasAccess(test);
                  const results = testResults[test.id] || [];
                  const latestResult = results[0]; // Ordered by date desc
                  const bestScore = results.length > 0 ? Math.max(...results.map(r => r.score)) : null;

                  return (
                    <div 
                      key={test.id}
                      className={`p-6 bg-white border rounded-[2rem] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${unlocked ? 'border-slate-100 hover:border-primary shadow-sm' : 'border-slate-50 bg-slate-50/50 grayscale'}`}
                    >
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${unlocked ? 'bg-primary/5 text-primary' : 'bg-slate-200 text-slate-400'}`}>
                          {unlocked ? <FileText className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                             <h4 className="font-bold text-primary">{test.title}</h4>
                             {test.status === 'draft' && (
                               <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                 Draft
                               </span>
                             )}
                             {results.length > 0 && (
                               <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                 {results.length} Attempt{results.length > 1 ? 's' : ''}
                               </span>
                             )}
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1 text-xs text-slate-400 font-medium"><Clock className="w-3 h-3" /> {test.duration} mins</span>
                            <span className="flex items-center gap-1 text-xs text-slate-400 font-medium"><Award className="w-3 h-3" /> {test.totalMarks} Marks</span>
                            {bestScore !== null && (
                              <span className="flex items-center gap-1 text-xs text-green-600 font-bold"><History className="w-3 h-3" /> Best: {bestScore}%</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {results.length > 0 && (
                          <Link 
                            to={`/result/${latestResult.id}`}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                          >
                            Last Result
                          </Link>
                        )}
                        {unlocked ? (
                          <Link 
                            to={`/test/${test.id}`}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-md whitespace-nowrap"
                          >
                            <Play className="w-4 h-4 fill-white" /> {results.length > 0 ? 'Retake Mock' : 'Start Mock'}
                          </Link>
                        ) : (
                          <Link 
                            to={exam?.isPaid ? `/premium?examId=${examId}` : '/premium'}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-300 transition-all"
                          >
                            {exam?.isPaid ? 'Unlock Exam' : 'Get Premium Pass'}
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:block">
            <div className={`sticky top-24 p-8 rounded-[2rem] border-2 shadow-xl shadow-primary/5 flex flex-col justify-between ${(profile?.purchasedExams?.includes(examId) || profile?.freeExams?.includes(examId)) ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'}`}>
              <div>
                <h3 className="text-xl font-bold text-primary mb-2">Package Details</h3>
                <div className="space-y-4 my-8">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-slate-600">Full Syllabus Coverage</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-slate-600">Detailed Explanations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-slate-600">Performance Analytics</span>
                  </div>
                </div>
              </div>

              {(profile?.purchasedExams?.includes(examId) || profile?.freeExams?.includes(examId)) ? (
                <div className="text-center py-4">
                  <span className="text-green-700 font-bold flex items-center justify-center gap-2">
                    <Award className="w-5 h-5" /> {profile?.freeExams?.includes(examId) ? 'Premium Access Privileged' : 'Unlimited Access Granted'}
                  </span>
                </div>
              ) : (
                <div className="space-y-6 pt-6 border-t border-slate-50">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-400">TOTAL PRICE</span>
                    <span className="text-3xl font-extrabold text-primary">₹{exam.price || 'Free'}</span>
                  </div>
                  <button 
                    onClick={handlePurchaseClick}
                    className="w-full py-4 bg-secondary text-white rounded-2xl font-bold text-lg shadow-lg shadow-secondary/20 hover:bg-secondary/90 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" /> Buy Now
                  </button>
                  <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                    One-time payment • Valid for 1 Year
                  </p>
                </div>
              )}
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
          price: exam.price || 0,
          description: exam.description
        }}
        onSuccess={() => {
          alert('Enrollment successful!');
          window.location.reload();
        }}
      />
    </Layout>
  );
}
