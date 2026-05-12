import React from 'react';
import toast from 'react-hot-toast';

export const CustomAlert = ({ message, t }: { message: string, t: any }) => (
  <div className="bg-white rounded-2xl shadow-xl min-w-[320px] max-w-sm overflow-hidden ring-1 ring-slate-900/5 origin-bottom relative animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out-0 fade-in-0 duration-200">
    <div className="p-6">
        <h3 className="font-bold text-slate-900 text-lg mb-2">Notification</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
    </div>
    <div className="flex border-t border-slate-100 bg-slate-50">
        <button 
            onClick={() => toast.dismiss(t.id)} 
            className="flex-1 px-4 py-3.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
            Okay
        </button>
    </div>
  </div>
);

export const CustomConfirm = ({ message, t, onConfirm }: { message: string, t: any, onConfirm: () => void }) => (
  <div className="bg-white rounded-2xl shadow-xl min-w-[320px] max-w-sm overflow-hidden ring-1 ring-slate-900/5 origin-bottom relative animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out-0 fade-in-0 duration-200">
    <div className="p-6">
        <h3 className="font-bold text-slate-900 text-lg mb-2">Please Confirm</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
    </div>
    <div className="flex border-t border-slate-100 bg-slate-50/50">
        <button 
            onClick={() => toast.dismiss(t.id)} 
            className="flex-1 px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
        >
            Cancel
        </button>
        <button 
            onClick={() => {
                toast.dismiss(t.id);
                onConfirm();
            }} 
            className="flex-1 px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-100 transition-colors border-l border-slate-100"
        >
            Yes, Proceed
        </button>
    </div>
  </div>
);

export const uiConfirm = (message: string, onConfirm: () => void) => {
  toast.custom((t) => <CustomConfirm message={message} t={t} onConfirm={onConfirm} />, {
    duration: Infinity,
    position: 'top-center',
  });
};

export const uiAlert = (message: string) => {
  toast.custom((t) => <CustomAlert message={message} t={t} />, {
    duration: Infinity,
    position: 'top-center',
  });
};
