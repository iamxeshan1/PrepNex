import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit, updateDoc, arrayUnion } from 'firebase/firestore';
import { Calendar, Clock, ArrowLeft, ShieldCheck, Zap, Tag, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LiveTestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const { user, profile } = useAuth();
  
  const isEnrolled = test?.enrolledUsers?.includes(user?.uid) || profile?.isPremium;
  
  const getBasePrice = () => test?.price || 0;
  
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
    if (!user) {
      navigate('/login');
      return;
    }
    const finalPrice = getFinalPrice();
    if (finalPrice === 0) {
      try {
        setPurchaseLoading(true);
        await updateDoc(doc(db, 'liveTests', id!), {
          enrolledUsers: arrayUnion(user.uid)
        });
        alert('Enrolled successfully!');
        navigate('/dashboard');
      } catch (e) {
        alert('Enrollment failed');
      } finally {
        setPurchaseLoading(false);
      }
    } else {
      // For demo purposes, we will simulate a successful payment here.
      alert(`Simulating payment for ₹${finalPrice}. Payment gateway integration required for production.`);
      try {
        setPurchaseLoading(true);
        await updateDoc(doc(db, 'liveTests', id!), {
          enrolledUsers: arrayUnion(user.uid)
        });
        alert('Enrolled successfully!');
        navigate('/dashboard');
      } catch (e) {
        alert('Enrollment failed');
      } finally {
        setPurchaseLoading(false);
      }
    }
  };

  useEffect(() => {
    const fetchTest = async () => {
      if (!id) return;
      try {
        const snap = await getDoc(doc(db, 'liveTests', id));
        if (snap.exists()) {
          setTest({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchTest();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center font-bold text-primary animate-pulse">
          Loading Live Test Detals...
        </div>
      </Layout>
    );
  }

  if (!test) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-black text-secondary mb-4">Live Test Not Found</h1>
          <button onClick={() => navigate('/')} className="text-primary font-bold hover:underline">
            Go back home
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Zap className="w-6 h-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-secondary tracking-tight">
                {test.title}
              </h1>
            </div>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              {test.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">
                  <Calendar className="w-4 h-4" /> Start Time
                </div>
                <div className="text-lg font-bold text-secondary">
                  {new Date(test.startTime).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">
                  <Clock className="w-4 h-4" /> Duration
                </div>
                <div className="text-lg font-bold text-secondary">
                  {test.duration} Minutes ({test.totalMarks} Marks)
                </div>
              </div>
            </div>

            <div className="bg-[#064e40] rounded-3xl p-8 border border-[#001f19] text-center">
              {profile?.isPremium ? (
                <div className="mb-8">
                  <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">You are a Premium User!</h2>
                  <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                    Your Ultimate Pass is active. You don't have to enroll or pay for this live test separately. You have full access to all premium features.
                  </p>
                  <button 
                    onClick={() => navigate(`/test/${test.id}`)}
                    className="w-full md:w-auto px-12 py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Start Test Now
                  </button>
                </div>
              ) : isEnrolled ? (
                <div className="mb-8">
                  <ShieldCheck className="w-12 h-12 text-blue-400 mx-auto mb-4 opacity-50" />
                  <h2 className="text-2xl font-black text-white mb-2">You are Enrolled!</h2>
                  <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                    You have successfully enrolled in this live test. You can start the test when it begins.
                  </p>
                  <button 
                     onClick={() => navigate(`/test/${test.id}`)}
                     className="w-full md:w-auto px-12 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all"
                  >
                    Go to Test
                  </button>
                </div>
              ) : ((test.enrollmentEndTime && new Date() > new Date(test.enrollmentEndTime)) || new Date() > new Date(test.endTime)) ? (
                <div className="mb-8">
                  <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Enrollment Closed</h2>
                  <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                    The enrollment period or the test time has ended. You can no longer enroll in this test.
                  </p>
                </div>
              ) : (
                <>
                  <ShieldCheck className="w-12 h-12 text-blue-400 mx-auto mb-4 opacity-50" />
                  <h2 className="text-2xl font-black text-white mb-2">Enrollment Details</h2>
                  <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                    This is a premium live mock test. Enrollment requires payment.
                  </p>
                  
                  <div className="flex flex-col items-center gap-2 w-full max-w-sm mx-auto mb-6">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between w-full p-4 bg-emerald-900/30 border border-emerald-500/30 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <Tag className="w-5 h-5 text-emerald-400" />
                          <div className="text-left">
                            <p className="text-sm font-bold text-emerald-300 uppercase tracking-wide">{appliedCoupon.code}</p>
                            <p className="text-xs font-bold text-emerald-500">Saved ₹{getBasePrice() - getFinalPrice()}</p>
                          </div>
                        </div>
                        <button onClick={handleRemoveCoupon} className="p-2 text-emerald-400 hover:bg-emerald-900/50 rounded-xl transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex sm:flex-row flex-col items-stretch sm:items-center gap-2 w-full">
                        <input 
                          type="text" 
                          placeholder="Have a coupon code?" 
                          value={couponCode} 
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1 w-full sm:w-auto px-4 py-3 bg-[#001f19] border border-slate-700 rounded-xl outline-none focus:border-blue-500 font-bold tracking-widest text-sm text-white placeholder-slate-500 uppercase"
                        />
                        <button 
                          onClick={handleApplyCoupon}
                          disabled={!couponCode || couponLoading}
                          className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all disabled:opacity-50 text-sm whitespace-nowrap shrink-0"
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                    )}
                    {couponError && <p className="text-xs font-bold text-rose-400">{couponError}</p>}
                  </div>

                  <div className="text-3xl font-black text-white mb-2">
                    ₹{getFinalPrice()}
                  </div>
                  {appliedCoupon && (
                    <p className="text-sm font-bold text-slate-500 line-through mb-6">₹{getBasePrice()}</p>
                  )}
                  {!appliedCoupon && <div className="h-4 mb-6"></div>}

                  <button 
                    onClick={handlePurchase}
                    disabled={purchaseLoading}
                    className="w-full md:w-auto px-12 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all font-logo disabled:opacity-50"
                  >
                    {purchaseLoading ? 'Processing...' : (getFinalPrice() === 0 ? 'Enroll Now (Free)' : 'Proceed to Payment')}
                  </button>
                  {getFinalPrice() > 0 && (
                    <div className="mt-4 flex flex-col items-center gap-2">
                        <p className="text-[10px] text-center text-slate-500 uppercase tracking-widest font-black">Secure Payment Gateway By</p>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-3 opacity-60 hover:opacity-100 transition-opacity brightness-0 invert" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
