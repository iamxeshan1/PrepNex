import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  variant?: 'default' | 'white';
}

export const Logo: React.FC<LogoProps> = ({ className = "", iconOnly = false, variant = 'default' }) => {
  const isWhite = variant === 'white';
  
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {!iconOnly && (
        <span className="font-logo font-black tracking-tight leading-none flex items-center">
          <span className={isWhite ? 'text-white' : 'text-primary'}>Prep</span>
          <span className="text-secondary pl-0.5">Next</span>
        </span>
      )}
    </span>
  );
};
