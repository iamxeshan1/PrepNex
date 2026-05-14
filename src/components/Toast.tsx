import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-100',
    error: 'bg-rose-50 border-rose-100',
    info: 'bg-blue-50 border-blue-100'
  };

  const textColors = {
    success: 'text-emerald-800',
    error: 'text-rose-800',
    info: 'text-blue-800'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%', transition: { duration: 0.2 } }}
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[10001] min-w-[320px] max-w-[90vw] p-4 rounded-2xl border shadow-xl ${bgColors[type]} flex items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-3">
             <div className="shrink-0">{icons[type]}</div>
             <p className={`text-sm font-bold ${textColors[type]}`}>{message}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-black/5 rounded-full transition-colors text-slate-400"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
