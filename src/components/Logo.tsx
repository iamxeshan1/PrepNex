import React from 'react';
import { Zap } from 'lucide-react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  variant?: 'default' | 'white';
}

export const Logo: React.FC<LogoProps> = ({ className = "", iconOnly = false, variant = 'default' }) => {
  const isWhite = variant === 'white';
  
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className={`${isWhite ? 'bg-white' : 'bg-primary'} p-1.5 rounded-xl shadow-lg ${isWhite ? 'shadow-white/10' : 'shadow-primary/20'} flex items-center justify-center shrink-0`}>
        <Zap className={`w-[0.8em] h-[0.8em] ${isWhite ? 'text-primary fill-primary' : 'text-white fill-white'}`} />
      </span>
      {!iconOnly && (
        <span className="font-logo font-black tracking-tight leading-none flex items-center">
          <span className={isWhite ? 'text-white' : 'text-primary'}>Prep</span>
          <span className="text-secondary pl-0.5">Next</span>
        </span>
      )}
    </span>
  );
};
