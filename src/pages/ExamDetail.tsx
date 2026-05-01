import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getTestsByExamId, createSubscription, getResultsByTestId } from '../services/db';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChevronLeft, Lock, Play, Clock, FileText, CheckCircle2, ShoppingBag, Award, History } from 'lucide-react';

export default function ExamDetail() {
  const { examId } = useParams();
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!examId) return;
      const examSnap = await getDoc(doc(db, 'exams', examId));
      if (examSnap.exists()) {
        setExam({ id: examSnap.id, ...examSnap.data() });
      }
      const testsData = await getTestsByExamId(examId);
      setTests(testsData || []);
      
      // Fetch results for these tests if user is logged in
      if (user) {
        const resultsMap: Record<string, any[]> = {};
        for (const test of testsData || []) {
          const results = await getResultsByTestId(user.uid, test.id);
          resultsMap[test.id] = results || [];
        }
        setTestResults(resultsMap);
      }
      
      setLoading(false);
    };
    fetchData();
  }, [examId, user]);

  const hasAccess = (test: any) => {
    if (test.isFree) return true;
    if (profile?.isPremium) return true;
    if (profile?.purchasedExams?.includes(examId)) return true;
    if (profile?.freeExams?.includes(examId)) return true;
    return false;
  };

  const handlePurchase = async () => {
    if (!user) return navigate('/login');
    if (!examId || !exam) return;
    
    if (!exam.isPaid) {
      setPurchaseLoading(true);
      try {
        await createSubscription(user.uid, examId);
        window.location.reload();
      } catch (err) {
        console.error("Subscription error:", err);
        alert("Failed to activate free subscription.");
      } finally {
        setPurchaseLoading(false);
      }
      return;
    }

    setPurchaseLoading(true);
    try {
      // Create a controller to abort the fetch if it takes too long
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

      // 1. Create order on backend
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: exam.price || 0,
          currency: 'INR',
          receipt: `rcpt_${(examId || '').slice(0, 10)}`,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to create order on server.');
      }

      const order = await response.json();
      
      if (!order || !order.id) {
        throw new Error('Invalid order response from server.');
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: order.amount || (exam.price * 100),
        currency: order.currency || 'INR',
        name: "PrepNex",
        description: `Purchase ${exam.name}`,
        order_id: order.id,
        modal: {
          ondismiss: function() {
            setPurchaseLoading(false);
          }
        },
        handler: async (response: any) => {
          setPurchaseLoading(true); // Keep loading during verification
          try {
            if (!response.razorpay_order_id || !response.razorpay_payment_id) {
              alert('Payment was not completed correctly.');
              setPurchaseLoading(false);
              return;
            }
            // 3. Verify payment on backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.status === 'ok') {
              // 4. Update subscription in Firestore
              await createSubscription(user.uid, examId);
              alert('Payment successful! Your course is now unlocked.');
              window.location.reload();
            } else {
              alert('Payment verification failed. Please contact support if amount was deducted.');
              setPurchaseLoading(false);
            }
          } catch (err: any) {
             console.error("Verification error:", err);
             alert("Error during payment verification: " + (err.message || String(err)));
             setPurchaseLoading(false);
          }
        },
        prefill: {
          name: user.displayName || "",
          email: user.email || "",
        },
        theme: {
          color: "#002045",
        },
      };

      if (!(window as any).Razorpay) {
        throw new Error('Payment gateway (Razorpay) failed to load. Please refresh and try again.');
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error('Payment Error:', error);
      if (error.name === 'AbortError') {
        alert('Payment request timed out. Please check your internet connection and try again.');
      } else {
        alert(error.message || 'Failed to initiate payment. Please try again.');
      }
      setPurchaseLoading(false);
    } 
  };

  if (loading) return <Layout><div className="flex h-96 items-center justify-center">Loading...</div></Layout>;
  if (!exam) return <Layout><div className="flex h-96 items-center justify-center">Exam not found.</div></Layout>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/exams" className="inline-flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-primary mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Library
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-12">
            <header>
              <div className="flex items-center gap-3 text-xs font-bold text-secondary uppercase tracking-widest mb-4">
                <span>{exam.organization}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <span>{exam.category}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <span className={`px-2 py-0.5 rounded-md ${exam.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : exam.difficulty === 'Hard' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{exam.difficulty || 'Medium'}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight mb-6">{exam.name}</h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">{exam.description || 'Comprehensive test series designed to mimic the actual exam environment and pattern.'}</p>
            </header>

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
                            to={`/premium?examId=${examId}`}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-300 transition-all"
                          >
                            Unlock Exam
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
                    disabled={purchaseLoading}
                    onClick={handlePurchase}
                    className="w-full py-4 bg-secondary text-white rounded-2xl font-bold text-lg shadow-lg shadow-secondary/20 hover:bg-secondary/90 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" /> {purchaseLoading ? 'Processing...' : 'Buy Now'}
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
    </Layout>
  );
}
