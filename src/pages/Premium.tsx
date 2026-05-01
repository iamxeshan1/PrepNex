import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, collection, query, where, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { createSubscription, activatePremiumAccess } from '../services/db';
import { 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Layers, 
  Users,
  Star,
  ChevronRight,
  ChevronLeft,
  Crown,
  Lock,
  Tag,
  X
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Premium() {
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('examId');
  const [targetExam, setTargetExam] = useState<any>(null);
  const [premiumPrice, setPremiumPrice] = useState('999');
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPremiumPrice();
    if (examId) {
      fetchTargetExam();
    }
  }, [examId]);

  const fetchPremiumPrice = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'general'));
      if (snap.exists() && snap.data().premiumPrice) {
        setPremiumPrice(snap.data().premiumPrice);
      }
    } catch (err) {
      console.error("Error fetching premium settings:", err);
    }
  }

  const fetchTargetExam = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'exams', examId!));
      if (snap.exists()) {
        setTargetExam({ id: snap.id, ...snap.data() });
      }
    } catch (err) {
      console.error("Error fetching exam details:", err);
    } finally {
      setLoading(false);
    }
  };

  const getBasePrice = () => {
    return targetExam ? (targetExam.price || 499) : parseInt(premiumPrice);
  };

  const getFinalPrice = () => {
    const base = getBasePrice();
    if (!appliedCoupon) return base;
    if (appliedCoupon.discountType === 'fixed') {
      return Math.max(0, base - appliedCoupon.discountValue);
    } else {
      const discountAmount = (base * appliedCoupon.discountValue) / 100;
      return Math.max(0, base - discountAmount);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const codeUpper = couponCode.toUpperCase();
      const q = query(collection(db, 'coupons'), where('code', '==', codeUpper), where('isActive', '==', true), limit(1));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setCouponError('Invalid or expired coupon code.');
        setAppliedCoupon(null);
      } else {
        const couponData = snap.docs[0].data();
        setAppliedCoupon({ id: snap.docs[0].id, ...couponData });
      }
    } catch (err) {
      setCouponError('Error applying coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handlePurchase = async () => {
    if (!user) return navigate('/login');
    
    // Purchase specific exam
    if (targetExam) {
      if (!targetExam.isPaid || getFinalPrice() === 0) {
        setPurchaseLoading(true);
        try {
          await createSubscription(user.uid, targetExam.id, 0);
          alert('Successfully unlocked the exam!');
          navigate(`/exam/${targetExam.id}`);
        } catch (err) {
          console.error("Subscription error:", err);
          alert("Failed to activate subscription.");
        } finally {
          setPurchaseLoading(false);
        }
        return;
      }

      initiatePayment(getFinalPrice(), 'Exam Mode' + (appliedCoupon ? ` (Coupon: ${appliedCoupon.code})` : ''), async () => {
        await createSubscription(user.uid, targetExam.id, getFinalPrice());
        navigate(`/exam/${targetExam.id}`);
      }, `rcpt_exam_${targetExam.id.slice(0, 8)}`);

    } else {
      // Purchase global premium pass
      if (getFinalPrice() === 0) {
         setPurchaseLoading(true);
         try {
           await activatePremiumAccess(user.uid, 12, 0);
           alert('Successfully unlocked Premium Pass!');
           navigate('/dashboard');
         } catch (err) {
           alert('Failed to activate premium pass');
         } finally {
           setPurchaseLoading(false);
         }
         return;
      }

      initiatePayment(getFinalPrice(), 'Global Premium Pass' + (appliedCoupon ? ` (Coupon: ${appliedCoupon.code})` : ''), async () => {
        await activatePremiumAccess(user.uid, 12, getFinalPrice());
        navigate('/dashboard');
      }, `rcpt_premium_${user.uid.slice(0, 8)}`);
    }
  };

  const initiatePayment = async (amount: number, description: string, onSuccess: () => Promise<void>, receipt: string) => {
    setPurchaseLoading(true);
    try {
      // 1. Create order on backend
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          currency: 'INR',
          receipt: receipt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order on server.');
      }

      const order = await response.json();
      
      if (!order || !order.id) {
        throw new Error('Invalid order response from server.');
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: order.amount || (amount * 100),
        currency: order.currency || 'INR',
        name: "PrepNex",
        description: description,
        order_id: order.id,
        handler: async (response: any) => {
          if (!response.razorpay_order_id || !response.razorpay_payment_id) {
            alert('Payment was not completed correctly.');
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
            await onSuccess();
          } else {
            alert('Payment verification failed. Please contact support if amount was deducted.');
          }
        },
        prefill: {
          name: user?.displayName || "",
          email: user?.email || "",
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
      alert(error.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setPurchaseLoading(false);
    }
  };
  const benefits = [
    {
      icon: Layers,
      title: "Unlock All Exam Packages",
      description: "Gain full access to every premium mock test and past paper database on PrepNex.",
      color: "bg-blue-500"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Get deep insights into your performance with section-wise strengths and weaknesses.",
      color: "bg-green-500"
    },
    {
      icon: Zap,
      title: "Speed Booster Mock Tests",
      description: "Exclusive timed exercises designed to improve your speed and accuracy under pressure.",
      color: "bg-amber-500"
    },
    {
      icon: ShieldCheck,
      title: "Verified Answer Keys",
      description: "Expert-curated detailed solutions for every single question in the library.",
      color: "bg-purple-500"
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary/10 rounded-full blur-[100px]" />
          
          <div className="max-w-7xl mx-auto px-4 text-center">
            {targetExam && (
              <Link to={`/exam/${examId}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-primary font-bold text-xs uppercase tracking-widest mb-4 transition-colors">
                 <ChevronLeft className="w-4 h-4" /> Back to {targetExam.name}
              </Link>
            )}
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full border border-amber-100 text-amber-600 font-black text-[10px] uppercase tracking-widest mb-8"
            >
              <Crown className="w-3.5 h-3.5" /> Premium Membership
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black text-primary tracking-tight mb-8"
            >
              Master Your Exams with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient">
                Premium Access
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 font-medium"
            >
              {targetExam ? (
                <>You're just one step away from unlocking <strong>{targetExam.name}</strong>. Join 50,000+ students who trust PrepNex for their preparation.</>
              ) : (
                "Join 50,000+ students who use PrepNex Premium to clear their competitive exams with top rankings."
              )}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-6"
            >
              {targetExam ? (
                <div className="flex flex-col items-center gap-4">
                  {/* Coupon Section */}
                  <div className="flex flex-col items-center gap-2 w-full max-w-sm mb-6">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between w-full p-4 bg-green-50 border border-green-200 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <Tag className="w-5 h-5 text-green-600" />
                          <div className="text-left">
                            <p className="text-sm font-bold text-green-700 uppercase tracking-wide">{appliedCoupon.code}</p>
                            <p className="text-xs font-bold text-green-600">Saved ₹{getBasePrice() - getFinalPrice()}</p>
                          </div>
                        </div>
                        <button onClick={handleRemoveCoupon} className="p-2 text-green-600 hover:bg-green-100 rounded-xl transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <input 
                          type="text" 
                          placeholder="Have a coupon code?" 
                          value={couponCode} 
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold tracking-widest text-sm"
                        />
                        <button 
                          onClick={handleApplyCoupon}
                          disabled={!couponCode || couponLoading}
                          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 text-sm"
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                    )}
                    {couponError && <p className="text-xs font-bold text-red-500">{couponError}</p>}
                  </div>

                   <button
                    disabled={purchaseLoading}
                    onClick={handlePurchase}
                    className="inline-flex items-center justify-center gap-3 px-12 py-6 bg-primary text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {purchaseLoading ? 'Processing...' : `Unlock ${targetExam.name} for ₹${getFinalPrice()}`} <Zap className="w-5 h-5 fill-white" />
                  </button>
                  {appliedCoupon && <p className="text-xs font-bold text-slate-400 line-through">Original Price: ₹{getBasePrice()}</p>}
                  <Link to="/exams" className="text-secondary font-black text-xs uppercase tracking-widest hover:underline mt-4">Or explore other exams</Link>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  {/* Coupon Section */}
                  <div className="flex flex-col items-center gap-2 w-full max-w-sm mb-6">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between w-full p-4 bg-green-50 border border-green-200 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <Tag className="w-5 h-5 text-green-600" />
                          <div className="text-left">
                            <p className="text-sm font-bold text-green-700 uppercase tracking-wide">{appliedCoupon.code}</p>
                            <p className="text-xs font-bold text-green-600">Saved ₹{getBasePrice() - getFinalPrice()}</p>
                          </div>
                        </div>
                        <button onClick={handleRemoveCoupon} className="p-2 text-green-600 hover:bg-green-100 rounded-xl transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <input 
                          type="text" 
                          placeholder="Have a coupon code?" 
                          value={couponCode} 
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold tracking-widest text-sm"
                        />
                        <button 
                          onClick={handleApplyCoupon}
                          disabled={!couponCode || couponLoading}
                          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 text-sm"
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                    )}
                    {couponError && <p className="text-xs font-bold text-red-500">{couponError}</p>}
                  </div>

                  <button
                    disabled={purchaseLoading}
                    onClick={handlePurchase}
                    className="inline-flex items-center justify-center gap-3 px-12 py-6 bg-secondary text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-secondary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {purchaseLoading ? 'Processing...' : `Get Premium Pass for ₹${getFinalPrice()}`} <Crown className="w-6 h-6" />
                  </button>
                  {appliedCoupon && <p className="text-xs font-bold text-slate-400 line-through">Original Price: ₹{getBasePrice()}</p>}
                </div>
              )}
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6">
                Immediate access to all premium features
              </p>
            </motion.div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="bg-white py-32 rounded-[5rem] shadow-2xl shadow-primary/5 -mt-20 border-t border-slate-100 relative z-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-24">
              <h2 className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mb-4">Why Go Premium?</h2>
              <p className="text-4xl font-black text-primary tracking-tight">Features that drive results</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-xl hover:-translate-y-2 transition-all"
                >
                  <div className={`w-16 h-16 ${benefit.color} rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-${benefit.color.split('-')[1]}/20 group-hover:scale-110 transition-all`}>
                    <benefit.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-primary mb-4 leading-tight">{benefit.title}</h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials/Trust */}
        <section className="py-32">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-primary rounded-[4rem] p-12 md:p-24 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent" />
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-8">
                    Ready to take the <br /> 
                    <span className="text-secondary">Lead?</span>
                  </h2>
                  <div className="space-y-6 mb-12">
                    {[
                      "95% accuracy in mock environments",
                      "Personalized study path tracking",
                      "Priority support from experts",
                      "New tests added every week"
                    ].map((text, i) => (
                      <div key={i} className="flex items-center gap-4 text-white/80 font-bold">
                        <Star className="w-5 h-5 text-secondary fill-secondary" />
                        {text}
                      </div>
                    ))}
                  </div>
                  <button 
                    disabled={purchaseLoading}
                    onClick={handlePurchase}
                    className="px-12 py-6 bg-white text-primary rounded-[2rem] font-black text-lg hover:bg-secondary hover:text-white transition-all shadow-2xl disabled:opacity-50"
                  >
                    {purchaseLoading ? 'Processing...' : (targetExam ? `Unlock Now for ₹${targetExam.price || 499}` : `Get Premium Access for ₹${premiumPrice}`)}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="aspect-square bg-white/5 rounded-3xl p-8 flex flex-col justify-end">
                      <p className="text-4xl font-black text-white">50k+</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Active Students</p>
                    </div>
                    <div className="aspect-square bg-secondary/20 rounded-3xl p-8 flex flex-col justify-end">
                      <p className="text-4xl font-black text-white">4.9/5</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">App Rating</p>
                    </div>
                  </div>
                  <div className="pt-8 space-y-4">
                    <div className="aspect-square bg-white/10 rounded-3xl p-8 flex flex-col justify-end border border-white/10">
                      <p className="text-4xl font-black text-white">10M+</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Tests Taken</p>
                    </div>
                    <div className="aspect-square bg-primary/20 rounded-3xl p-8 flex flex-col justify-end border border-white/5">
                      <p className="text-4xl font-black text-white">100%</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Syllabus Covered</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
