import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the customized install prompt
      setTimeout(() => setShowPrompt(true), 10000); // Show after 10s of browsing
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed top-24 right-4 md:right-8 z-50 max-w-sm pointer-events-none"
      >
        <div className="bg-primary/95 backdrop-blur-md text-white p-6 rounded-3xl shadow-2xl border border-white/10 pointer-events-auto relative overflow-hidden group">
          {/* Background Highlight */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
          
          <button 
            onClick={() => setShowPrompt(false)}
            className="absolute top-4 right-4 p-1 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl shadow-inner">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight leading-none mb-1">Install PrepNex</h3>
              <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Get the Native App experience</p>
            </div>
          </div>

          <p className="text-sm font-medium text-white/80 leading-relaxed mb-6">
            Install our app on your device for faster access and offline practice.
          </p>

          <button
            onClick={handleInstall}
            className="w-full py-4 bg-white text-primary rounded-2xl font-black shadow-xl hover:bg-slate-50 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Install Now
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
