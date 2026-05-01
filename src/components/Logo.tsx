import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <span className={`font-logo font-black tracking-tight leading-none ${className}`}>
      <span className="text-primary">Prep</span>
      <span className="text-secondary">Nex</span>
    </span>
  );
};
