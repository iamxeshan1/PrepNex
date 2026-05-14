import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Logo } from '../components/Logo';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, collection, query, where, limit, setDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, CheckCircle2, ShieldCheck, Zap, BarChart3, Layers, 
  Users, Star, Crown, ChevronLeft, Ticket, AlertCircle, Loader2 
} from 'lucide-react';
import { motion } from 'motion/react';

export interface PremiumPlanDef {
  id: string;
  name: string;
  months: number;
  price: number;
  originalPrice: number;
  isPopular: boolean;
}

export default function Premium() {
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('examId');
  const [targetExam, setTargetExam] = useState<any>(null);
  
  const [plans, setPlans] = useState<PremiumPlanDef[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  
  const [premiumTitle, setPremiumTitle] = useState('Unlimited Access Pass');
  const [premiumSubtitle, setPremiumSubtitle] = useState('Select your duration');
  const [premiumFeatures, setPremiumFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  
  // Coupon State
  const [hasCoupon, setHasCoupon] = useState<boolean | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [discount, setDiscount] = useState<{ type: 'percentage' | 'fixed', value: number } | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPremiumSettings();
    if (examId) {
      fetchTargetExam();
    }
  }, [examId]);

  useEffect(() => {
    if (!(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const fetchPremiumSettings = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'general'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.premiumTitle) setPremiumTitle(data.premiumTitle);
        if (data.premiumSubtitle) setPremiumSubtitle(data.premiumSubtitle);
        if (data.premiumPlans && data.premiumPlans.length > 0) {
          setPlans(data.premiumPlans);
          const popular = data.premiumPlans.find((p: PremiumPlanDef) => p.isPopular);
          setSelectedPlanId(popular ? popular.id : data.premiumPlans[0].id);
        }
        if (data.premiumFeatures) {
          setPremiumFeatures(Array.isArray(data.premiumFeatures) ? data.premiumFeatures : data.premiumFeatures.split('\n'));
        }
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
        const data = snap.data();
        const isAdmin = profile?.role === 'admin' || profile?.email === 'iamxeshan1@gmail.com' || profile?.email === 'prepnextedtech@gmail.com';
        if (data.status === 'draft' && !isAdmin) {
          navigate('/dashboard');
          return;
        }
        setTargetExam({ id: snap.id, ...data });
      }
    } catch (err) {
      console.error("Error fetching exam details:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const basePrice = targetExam ? (targetExam.isPaid ? Number(targetExam.price || 499) : 0) : (selectedPlan ? selectedPlan.price : 499);
  
  const finalPrice = discount 
    ? (discount.type === 'percentage' 
        ? Math.max(0, basePrice - (basePrice * (discount.value / 100))) 
        : Math.max(0, basePrice - discount.value))
    : basePrice;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const normalizedCode = couponCode.trim().toUpperCase();
      const q = query(collection(db, 'coupons'), where('code', '==', normalizedCode), limit(1));
      const snap = await getDocs(q);

      if (snap.empty) {
        setCouponError('Invalid or expired coupon code');
        setDiscount(null);
        setIsValidatingCoupon(false);
        return;
      }

      const couponData = snap.docs[0].data();
      const isActive = couponData.isActive === true || couponData.isActive === "true";

      if (!isActive) {
        setCouponError('This coupon is expired or disabled');
        setDiscount(null);
        return;
      }

      if (couponData.discountType === 'fixed' && couponData.minAmount && basePrice < couponData.minAmount) {
         setCouponError(`This coupon requires a minimum purchase of ₹${couponData.minAmount}`);
         setDiscount(null);
         return;
      }

      setDiscount({ type: couponData.discountType, value: couponData.discountValue });
    } catch (err) {
      setCouponError('Network error. Try again.');
      setDiscount(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const processFreeEnrollment = async (itemId: string, itemTitle: string, itemMonths?: number) => {
    try {
      const userName = user!.displayName || user!.email?.split('@')[0] || "User";
      
      if (itemId === "PREMIUM_PASS") {
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + (itemMonths || 12));
        await setDoc(doc(db, "users", user!.uid), {
           isPremium: true,
           subscriptionExpiry: expiryDate.toISOString()
        }, { merge: true });

        await addDoc(collection(db, "premium_subscriptions"), {
           userId: user!.uid,
           userName: userName,
           type: "Premium",
           purchaseDate: new Date().toISOString(),
           expiryDate: expiryDate.toISOString(),
           paymentId: 'FREE',
           orderId: 'FREE_ORDER',
           paymentStatus: "completed",
           amount: 0
        });
      } else {
        const liveTestDoc = await getDoc(doc(db, "liveTests", itemId));
        if (liveTestDoc.exists()) {
          const enrolledUsers = liveTestDoc.data()?.enrolledUsers || [];
          if (!enrolledUsers.includes(user!.uid)) {
            await updateDoc(doc(db, "liveTests", itemId), { enrolledUsers: [...enrolledUsers, user!.uid] });
          }
        } else {
          const userDoc = await getDoc(doc(db, "users", user!.uid));
          const purchasedExams = userDoc.data()?.purchasedExams || [];
          if (!purchasedExams.includes(itemId)) {
            await setDoc(doc(db, "users", user!.uid), { purchasedExams: [...purchasedExams, itemId] }, { merge: true });
          }
        }

        await addDoc(collection(db, "subscriptions"), {
           userId: user!.uid,
           userName: userName,
           examId: itemId,
           type: itemTitle,
           purchaseDate: new Date().toISOString(),
           paymentId: 'FREE',
           orderId: 'FREE_ORDER',
           paymentStatus: "completed",
           amount: 0
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Free enrollment failed", err);
      setPaymentError(err.message || 'Free enrollment failed');
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setPurchaseLoading(true);
    setPaymentError(null);

    const itemId = targetExam ? targetExam.id : "PREMIUM_PASS";
    const itemTitle = targetExam ? targetExam.name : premiumTitle;
    const itemMonths = targetExam ? undefined : selectedPlan?.months;

    try {
      if (finalPrice <= 0) {
        await processFreeEnrollment(itemId, itemTitle, itemMonths);
        setPurchaseLoading(false);
        return;
      }

      // 1. Create Order
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalPrice,
          itemId: itemId,
          months: itemMonths,
          couponCode: discount ? couponCode.trim() : null,
          customPrice: targetExam ? undefined : selectedPlan?.price // optional, in case backend needs it to verify
        })
      });

      const responseText = await orderResponse.text();
      let order, errData: any = {};
      try {
        errData = JSON.parse(responseText);
        order = errData;
      } catch (e) {
        throw new Error(`Server returned invalid JSON. ${responseText.substring(0, 100)}`);
      }

      if (!orderResponse.ok) {
        throw new Error(errData.error || errData.message || 'Order creation failed');
      }

      // 2. Fetch Config
      const configResponse = await fetch('/api/payment-status');
      const configData = await configResponse.json();
      if (!configData.configured) throw new Error('Payment system is not configured');

      const options = {
        key: configData.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "PrepNext",
        description: `Enrollment for ${itemTitle}`,
        order_id: order.id,
        prefill: {
          name: user.displayName || '',
          email: user.email || ''
        },
        theme: { color: "#002f26" },
        modal: {
          ondismiss: () => setPurchaseLoading(false)
        },
        handler: async function (response: any) {
          try {
            setPurchaseLoading(true);
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user.uid,
                itemId: itemId,
                months: itemMonths,
                clientFallbackAmount: finalPrice,
                clientFallbackUserName: user.displayName || user.email?.split('@')[0] || "User"
              })
            });

            const verifyData = await verifyResponse.json();
            
            if (verifyResponse.ok) {
              let successUrl = `/dashboard?payment_success=true&itemId=${itemId}&userId=${user.uid}&paymentId=${response.razorpay_payment_id}&orderId=${response.razorpay_order_id}&needs_client_update=${verifyData.needsClientUpdate || false}`;
              if (itemMonths) successUrl += `&months=${itemMonths}`;
              if (verifyData.needsClientUpdate) {
                successUrl += `&amount=${verifyData.amount || finalPrice || 0}&userName=${encodeURIComponent(verifyData.userName || user.displayName || user.email?.split('@')[0] || 'User')}`;
              }
              window.location.href = successUrl;
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (err: any) {
            console.error('Verification Error:', err);
            setPaymentError(err.message || 'Payment was successful but profile update failed. Contact support.');
            setPurchaseLoading(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setPaymentError(resp.error.description);
        setPurchaseLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Payment Error:', err);
      setPaymentError(err.message || 'Payment initiation failed');
      setPurchaseLoading(false);
    }
  };

  const benefits = [
    { icon: Layers, title: "Unlock All Exam Packages", description: "Gain full access to every premium mock test and past paper database.", color: "bg-blue-500" },
    { icon: BarChart3, title: "Advanced Analytics", description: "Get deep insights into your performance with section-wise strengths and weaknesses.", color: "bg-green-500" },
    { icon: Zap, title: "Speed Booster Mock Tests", description: "Exclusive timed exercises designed to improve your speed and accuracy under pressure.", color: "bg-amber-500" },
    { icon: ShieldCheck, title: "Verified Answer Keys", description: "Expert-curated detailed solutions for every single question in the library.", color: "bg-purple-500" }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 font-sans text-[#001f19] pb-32">
        <section className="bg-[#002f26] text-white pt-24 pb-48 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
            {targetExam && (
              <Link to={`/exam/${examId}`} className="inline-flex items-center gap-2 text-white/70 hover:text-white font-bold text-xs uppercase tracking-widest mb-6 transition-colors">
                 <ChevronLeft className="w-4 h-4" /> Back to {targetExam.name}
              </Link>
            )}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-amber-500/30">
               <Crown className="w-3.5 h-3.5" /> Premium Plans
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight">
               Master Your Preparation <br /> With Unlimited Access
            </motion.h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto font-medium mb-12">
               {targetExam 
                 ? `Unlock everything for ${targetExam.name} and accelerate your rank.` 
                 : `Join thousands of top scorers. Choose the plan that best fits your timeline and get unlimited access to all tests.`}
            </p>
          </div>
          <div className="absolute inset-0 bg-[#002f26]/20 pointer-events-none mix-blend-overlay"></div>
        </section>

        <section className="max-w-5xl mx-auto px-4 -mt-32 relative z-20">
          <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
            
            {/* Left side: Plans */}
            <div className="flex-1 p-8 md:p-12 border-r border-slate-100">
              {targetExam ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                   <div className="w-20 h-20 bg-[#002f26]/10 rounded-[2rem] flex items-center justify-center text-slate-900 mb-6">
                      <Layers className="w-10 h-10" />
                   </div>
                   <h2 className="text-2xl font-black text-[#001f19] mb-2">{targetExam.name}</h2>
                   <p className="text-slate-500 font-medium mb-8">Single exam unlock</p>
                   <div className="text-5xl font-black text-slate-900 mb-2">₹{basePrice}</div>
                   {targetExam.price && targetExam.price > 0 && <div className="text-slate-400 line-through font-bold text-lg mb-8">₹{basePrice + 500}</div>}
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-black text-[#001f19] mb-6">Select your plan</h2>
                  <div className="space-y-4">
                    {plans.map(plan => (
                       <label key={plan.id} className={`cursor-pointer block relative rounded-2xl border-2 transition-all p-5 hover:border-[#006e5d]/50 ${selectedPlanId === plan.id ? 'border-[#006e5d] bg-[#006e5d]/5' : 'border-slate-100 bg-white'}`}>
                          <input type="radio" className="hidden" name="premium_plan" value={plan.id} checked={selectedPlanId === plan.id} onChange={() => setSelectedPlanId(plan.id)} />
                          {plan.isPopular && <div className="absolute -top-3 right-6 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">Popular</div>}
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedPlanId === plan.id ? 'border-[#006e5d]' : 'border-slate-300'}`}>
                                   {selectedPlanId === plan.id && <div className="w-3 h-3 bg-[#006e5d] rounded-full" />}
                                </div>
                                <div>
                                   <div className="text-lg font-black text-[#001f19]">{plan.name}</div>
                                   <div className="text-xs font-bold text-slate-500">{plan.months} Month{plan.months > 1 ? 's' : ''}</div>
                                </div>
                             </div>
                             <div className="text-right">
                                <div className="text-xl font-black text-slate-900">₹{plan.price}</div>
                                {plan.originalPrice > plan.price && <div className="text-xs font-bold text-slate-400 line-through">₹{plan.originalPrice}</div>}
                             </div>
                          </div>
                       </label>
                    ))}
                    {plans.length === 0 && <p className="text-slate-500 italic p-4 text-center">Loading plans...</p>}
                  </div>
                </>
              )}
            </div>
            
            {/* Right side: Payment / Coupon */}
            <div className="w-full md:w-[400px] bg-[#002f26] p-8 md:p-12 flex flex-col justify-between rounded-r-[2rem] md:rounded-r-[2rem] rounded-b-[2rem] md:rounded-l-none">
              <div>
                <h3 className="text-lg font-black text-white mb-6">Order Summary</h3>
                <div className="space-y-4 mb-6 text-sm font-semibold text-slate-300">
                  <div className="flex justify-between">
                    <span>Base Price</span>
                    <span>₹{basePrice}</span>
                  </div>
                  {discount && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`})</span>
                      <span>-₹{basePrice - finalPrice}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-700 pt-4 flex justify-between text-xl font-black text-white">
                    <span>Total</span>
                    <span>₹{finalPrice}</span>
                  </div>
                </div>

                {/* Coupon Section */}
                <div className="mb-8">
                  {hasCoupon === null ? (
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Have a coupon code?</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setHasCoupon(true)} className="py-2.5 bg-[#002f26] border border-slate-700 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors">Yes</button>
                        <button onClick={() => setHasCoupon(false)} className="py-2.5 bg-[#002f26] border border-slate-700 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors">No</button>
                      </div>
                    </div>
                  ) : hasCoupon ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Ticket size={14} /> Coupon Code</label>
                        <button onClick={() => { setHasCoupon(null); setDiscount(null); setCouponCode(''); }} className="text-[10px] font-bold text-emerald-400 hover:underline">Change</button>
                      </div>
                      <div className="flex gap-2">
                        <input type="text" placeholder="E.G. PREP20" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="flex-1 bg-[#002f26] border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 outline-none font-bold text-white uppercase" />
                        <button onClick={handleApplyCoupon} disabled={!couponCode || isValidatingCoupon || discount !== null} className="bg-emerald-500 text-white px-5 rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors disabled:opacity-50">
                          {isValidatingCoupon ? <Loader2 className="animate-spin" size={18} /> : (discount ? 'Applied' : 'Apply')}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1"><AlertCircle size={12} /> {couponError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-[#002f26] border border-slate-700 p-3 rounded-xl flex justify-between items-center">
                      <p className="text-[11px] font-semibold text-slate-400 italic">No coupon applied</p>
                      <button onClick={() => setHasCoupon(true)} className="text-[11px] font-bold text-emerald-400 hover:underline">Add Coupon</button>
                    </div>
                  )}
                </div>

                {paymentError && (
                  <div className="mb-6 p-3 bg-rose-900/30 border border-rose-500/30 rounded-lg flex items-start gap-2 text-rose-400 text-[11px] font-bold">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{paymentError}</span>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={handlePurchase}
                  disabled={purchaseLoading || plans.length === 0}
                  className="w-full py-4 bg-[#006e5d] text-white rounded-xl font-black text-lg shadow-lg shadow-[#002f26]/30 hover:bg-[#005a4d] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {purchaseLoading ? 'Processing...' : (finalPrice === 0 ? 'Activate Free' : `Pay ₹${finalPrice}`)}
                </button>
                <div className="mt-4 flex flex-col items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <div className="flex items-center justify-center gap-2">
                    <ShieldCheck size={14} /> Secure Payment Gateway By
                  </div>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-3 opacity-60 hover:opacity-100 transition-opacity brightness-0 invert" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-32 mt-12">
           <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Everything you need to succeed</h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {(premiumFeatures.length > 0 ? premiumFeatures : benefits.map(b => b.title)).map((featureTitle, idx) => {
                 const benefit = benefits[idx % benefits.length];
                 return (
                    <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                       <div className={`w-12 h-12 ${benefit.color} rounded-xl flex items-center justify-center text-white mb-6`}>
                          <benefit.icon className="w-6 h-6" />
                       </div>
                       <h3 className="text-lg font-black text-slate-900 mb-2 leading-tight">{featureTitle}</h3>
                       <p className="text-sm font-medium text-slate-500 leading-relaxed">
                          Premium feature included in your all-access pass. Get ahead of the competition.
                       </p>
                    </div>
                 );
              })}
           </div>
        </section>
      </div>
    </Layout>
  );
}
