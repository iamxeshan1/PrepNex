import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, X, CheckCircle2, Clock, ShieldCheck, Zap } from 'lucide-react';

interface PremiumGrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (months: number) => void;
  userName: string;
  loading?: boolean;
}

const PLANS = [
  { months: 1, name: '1 Month', price: '₹499', description: 'Monthly subscription' },
  { months: 3, name: '3 Months', price: '₹1299', description: 'Quarterly subscription' },
  { months: 6, name: '6 Months', price: '₹2299', description: 'Semi-annual subscription' },
  { months: 12, name: '1 Year', price: '₹3999', description: 'Annual subscription (Best Value)' },
  { months: 0, name: 'Lifetime', price: 'FREE', description: 'Permanent access' },
];

export default function PremiumGrantModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  loading = false
}: PremiumGrantModalProps) {
  const [selectedMonths, setSelectedMonths] = useState(1);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[#002f26]/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-[#002f26] p-8 text-white relative shrink-0">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-4 mb-2">
               <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center">
                  <Crown size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-bold">Grant Premium Access</h3>
                  <p className="text-teal-100/60 text-xs font-medium">Authorizing Ultimate Pass for {userName}</p>
               </div>
            </div>
          </div>

          <div className="p-8 overflow-y-auto">
            <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
               <Clock size={16} className="text-[#006e5d]" /> Select Membership Duration
            </h4>
            
            <div className="space-y-3 mb-8">
               {PLANS.map((plan) => (
                 <label 
                   key={plan.months}
                   className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                     selectedMonths === plan.months 
                      ? 'border-[#006e5d] bg-[#006e5d]/5' 
                      : 'border-slate-50 hover:border-slate-200 bg-slate-50/50'
                   }`}
                 >
                    <div className="flex items-center gap-4">
                       <input 
                         type="radio" 
                         name="plan"
                         className="hidden"
                         checked={selectedMonths === plan.months}
                         onChange={() => setSelectedMonths(plan.months)}
                       />
                       <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                         selectedMonths === plan.months ? 'border-[#006e5d]' : 'border-slate-300'
                       }`}>
                          {selectedMonths === plan.months && <div className="w-3 h-3 bg-[#006e5d] rounded-full" />}
                       </div>
                       <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{plan.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold italic uppercase">{plan.description}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-[#006e5d]">{plan.price}</p>
                    </div>
                 </label>
               ))}
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-4 mb-8">
                 <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                 <p className="text-xs text-amber-800 font-medium leading-relaxed">
                   Granting premium access will allow this user to access all paid exams and mock tests without any additional cost. This action will be logged in the system.
                 </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-4 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-700 font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Discard
              </button>
              <button
                onClick={() => onConfirm(selectedMonths)}
                disabled={loading}
                className="flex-1 px-4 py-4 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-colors shadow-lg shadow-[#006e5d]/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : (
                  <>
                    <ShieldCheck size={16} /> Authorize Access
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
