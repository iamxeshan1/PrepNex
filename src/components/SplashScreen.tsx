import React from 'react';
import { motion } from 'motion/react';
import { Logo } from './Logo';

export const SplashScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[10000] bg-[#008770] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Decorative Circles */}
      
      
      <div className="relative flex flex-col items-center">
        

        {/* Brand Name */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-6 scale-150 brightness-0 invert"
        >
          <Logo className="text-4xl" />
        </motion.div>

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
