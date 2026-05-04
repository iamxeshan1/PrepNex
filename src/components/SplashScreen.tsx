import React from 'react';
import { motion } from 'motion/react';

export const SplashScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[10000] bg-[#002045] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Decorative Circles */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.15 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute w-[800px] h-[800px] bg-white rounded-full blur-[120px]"
      />
      
      <div className="relative flex flex-col items-center">
        {/* Animated Logo Icon */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl mb-8 relative"
        >
          <span className="text-[#002045] text-5xl font-black italic font-logo">P</span>
          
          {/* Pulse Effect */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 border-4 border-white rounded-[2rem]"
          />
        </motion.div>

        {/* Brand Name */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-white text-6xl font-black font-logo tracking-tighter mb-3"
        >
          PrepNex
        </motion.h1>

        {/* Tagline */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col items-center"
        >
          <div className="h-[2px] w-12 bg-white/30 rounded-full mb-4" />
          <p className="text-white/80 font-bold uppercase tracking-[0.3em] text-xs">
            Practice. Improve. Succeed.
          </p>
        </motion.div>
      </div>

      {/* Loading Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-16 w-48 h-1 bg-white/10 rounded-full overflow-hidden"
      >
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-1/2 h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
        />
      </motion.div>
    </motion.div>
  );
};
