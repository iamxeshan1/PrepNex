import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Logo } from '../components/Logo';
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
import CheckoutModal from '../components/CheckoutModal';

export default function Premium() {
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('examId');
  const [targetExam, setTargetExam] = useState<any>(null);
  const [premiumPrice, setPremiumPrice] = useState('599');
  const [premiumOriginalPrice, setPremiumOriginalPrice] = useState('1499');
  const [premiumTitle, setPremiumTitle] = useState('Unlimited 1-Year Pass');
  const [premiumSubtitle, setPremiumSubtitle] = useState('Special Launch Offer • 60% OFF');
  const [premiumValidity, setPremiumValidity] = useState('365 Days');
  const [premiumFeatures, setPremiumFeatures] = useState<string[]>([]);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPremiumPrice();
    if (examId) {
      fetchTargetExam();
    }
  }, [examId]);

  const fetchRazorpayConfig = async () => {
    try {
      const res = await fetch('/api/payment-status');
      const data = await res.json();
      if (data.configured && data.keyId) {
        setRazorpayKeyId(data.keyId);
      }
    } catch (err) {
      console.error("Error fetching payment config:", err);
    }
  };

  const fetchPremiumPrice = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'general'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.premiumPrice) setPremiumPrice(data.premiumPrice);
        if (data.premiumOriginalPrice) setPremiumOriginalPrice(data.premiumOriginalPrice);
        if (data.premiumTitle) setPremiumTitle(data.premiumTitle);
        if (data.premiumSubtitle) setPremiumSubtitle(data.premiumSubtitle);
        if (data.premiumValidity) setPremiumValidity(data.premiumValidity);
        if (data.premiumFeatures) {
          setPremiumFeatures(data.premiumFeatures.split('\n'));
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

  const handlePurchase = () => {
    if (!user) return navigate('/login');
    setIsCheckoutOpen(true);
  };
  const benefits = [
    {
      icon: Layers,
      title: "Unlock All Exam Packages",
      description: "Gain full access to every premium mock test and past paper database.",
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
                <>You're just one step away from unlocking <strong>{targetExam.name}</strong>. Join 50,000+ students who trust <Logo className="text-xl inline-flex" /> for their preparation.</>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span>Join 50,000+ students who use</span>
                  <Logo className="text-xl" />
                  <span>Premium to clear their competitive exams with top rankings.</span>
                </div>
              )}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handlePurchase}
                  className="inline-flex items-center justify-center gap-3 px-12 py-6 bg-primary text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                >
                  {targetExam ? `Unlock ${targetExam.name} Now` : `Get ${premiumTitle} Access`} <Zap className="w-5 h-5 fill-white" />
                </button>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-lg font-black text-slate-400 line-through">₹{targetExam ? targetExam.price : premiumOriginalPrice}</span>
                  <span className="text-3xl font-black text-slate-900">₹{targetExam ? targetExam.price : premiumPrice}</span>
                </div>
                <Link to="/exams" className="text-secondary font-black text-xs uppercase tracking-widest hover:underline mt-4">Or explore other exams</Link>
              </div>
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
              {(premiumFeatures.length > 0 ? premiumFeatures : benefits.map(b => b.title)).map((featureTitle, idx) => {
                const benefit = benefits[idx % benefits.length];
                return (
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
                    <h3 className="text-xl font-black text-primary mb-4 leading-tight">{featureTitle}</h3>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">
                      {premiumFeatures.length > 0 ? "Premium feature included in your all-access pass." : benefit.description}
                    </p>
                  </motion.div>
                );
              })}
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
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        item={{
          id: targetExam ? targetExam.id : "PREMIUM_PASS",
          name: targetExam ? targetExam.name : premiumTitle,
          price: targetExam ? (targetExam.price || 499) : parseInt(premiumPrice),
        }}
        onSuccess={() => {
          alert('Purchase successful!');
          navigate('/dashboard');
        }}
      />
    </Layout>
  );
}
