import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Ticket, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    name: string;
    price: number;
    description?: string;
  };
  onSuccess?: () => void;
}

export default function CheckoutModal({ isOpen, onClose, item, onSuccess }: CheckoutModalProps) {
  const { user } = useAuth();
  const [hasCoupon, setHasCoupon] = useState<boolean | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [discount, setDiscount] = useState<{ type: 'percentage' | 'fixed', value: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const finalPrice = discount 
    ? (discount.type === 'percentage' 
        ? Math.max(0, item.price - (item.price * (discount.value / 100))) 
        : Math.max(0, item.price - discount.value))
    : item.price;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const response = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase() })
      });
      const data = await response.json();
      if (response.ok && data.valid) {
        setDiscount({ type: data.discountType, value: data.discountValue });
      } else {
        setCouponError(data.message || 'Invalid or expired coupon code');
        setDiscount(null);
      }
    } catch (err) {
      setCouponError('Network error. Try again.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handlePayment = async () => {
    if (!user) return;
    setIsProcessing(true);
    setPaymentError(null);

    try {
      // 1. Create Order
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalPrice,
          itemId: item.id,
          couponCode: discount ? couponCode.trim() : null
        })
      });

      if (!orderResponse.ok) {
        const errData = await orderResponse.json();
        throw new Error(errData.error || 'Order creation failed');
      }
      const order = await orderResponse.json();

      // 2. Fetch Razorpay Config
      const configResponse = await fetch('/api/payment-status');
      const config = await configResponse.json();

      if (!config.configured) throw new Error('Payment system is not properly configured by administrator.');

      const options = {
        key: config.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "PrepNex Edtech",
        description: `Enrollment for ${item.name}`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response,
                userId: user.uid,
                itemId: item.id
              })
            });

            if (verifyResponse.ok) {
              if (onSuccess) onSuccess();
              onClose();
            } else {
              setPaymentError('Payment verification failed. Please contact support.');
            }
          } catch (err) {
            setPaymentError('Verification error. Please contact support.');
          }
        },
        prefill: {
          name: user.displayName || '',
          email: user.email || ''
        },
        theme: {
          color: "#4f46e5"
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setPaymentError(resp.error.description);
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Payment Error:', err);
      setPaymentError(err.message || 'Payment initiation failed');
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Dynamically load Razorpay script if not present
    if (!(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
    // Reset state on open
    if (isOpen) {
      setHasCoupon(null);
      setCouponCode('');
      setDiscount(null);
      setCouponError(null);
      setPaymentError(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
        >
          {/* Header */}
          <div className="bg-indigo-600 p-6 text-white relative">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-1">Confirm Enrollment</h3>
            <p className="text-indigo-100 text-sm opacity-80 truncate">{item.name}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Price section */}
            <div className="flex justify-between items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Amount</p>
                {discount && (
                  <p className="text-sm text-slate-400 line-through">₹{item.price}</p>
                )}
                <p className="text-3xl font-black text-slate-900">₹{finalPrice}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wide">
                  <ShieldCheck size={12} />
                  Secure
                </span>
              </div>
            </div>

            {/* Coupon Flow */}
            {hasCoupon === null ? (
              <div className="space-y-4">
                <p className="text-center text-sm font-bold text-slate-600">Do you have a coupon code?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setHasCoupon(true)}
                    className="py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold border-2 border-transparent hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Ticket size={18} /> Yes
                  </button>
                  <button 
                    onClick={() => setHasCoupon(false)}
                    className="py-3 bg-slate-50 text-slate-600 rounded-xl font-bold border-2 border-transparent hover:border-slate-200 transition-all"
                  >
                    No
                  </button>
                </div>
              </div>
            ) : hasCoupon ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Ticket size={14} className="text-indigo-500" />
                    Enter Coupon Code
                  </label>
                  <button onClick={() => setHasCoupon(null)} className="text-[10px] font-bold text-indigo-500 hover:underline">Change</button>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="E.G. PREP20"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-3 outline-none font-bold text-slate-700 uppercase transition-all"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    disabled={!couponCode || isValidatingCoupon || discount !== null}
                    className="bg-slate-900 text-white px-5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {isValidatingCoupon ? <Loader2 className="animate-spin" size={18} /> : (discount ? 'Applied' : 'Apply')}
                  </button>
                </div>
                {couponError && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> {couponError}
                  </p>
                )}
                {discount && (
                  <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg">
                    <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Discount Applied!
                    </p>
                    <button onClick={() => { setDiscount(null); setCouponCode(''); }} className="text-[10px] font-bold text-red-400 hover:text-red-500">Remove</button>
                  </div>
                )}
              </div>
            ) : (
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 italic">Proceeding at standard price</p>
                    <button onClick={() => setHasCoupon(true)} className="text-xs font-black text-indigo-600 hover:underline flex items-center gap-1">
                        <Ticket size={14} /> Use Coupon
                    </button>
                </div>
            )}

            {paymentError && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex gap-3 text-red-600 text-xs font-medium">
                <AlertCircle className="shrink-0" size={16} />
                <p>{paymentError}</p>
              </div>
            )}

            {/* Action Group */}
            <div className="space-y-4 pt-2">
              <button 
                onClick={handlePayment}
                disabled={isProcessing || (hasCoupon === true && discount === null && couponCode.length > 0)}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    {finalPrice === 0 ? 'Activate Free' : 'Continue to Payment'}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-4">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-4 opacity-50 grayscale hover:grayscale-0 transition-all" />
                  <p className="text-[9px] text-center text-slate-400 font-black uppercase tracking-widest">
                    SSL Encrypted Safe Payment
                  </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
