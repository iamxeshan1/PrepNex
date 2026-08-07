import React from 'react';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'sm',
  className = '',
  title = 'Pass Pro Verified Aspirant'
}) => {
  const sizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <svg 
      className={`inline-block shrink-0 select-none align-middle ${sizeClasses[size]} ${className}`} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      title={title}
    >
      {/* Mathematically Symmetrical Sharp-Pointed Edgy Rosette / Starburst */}
      <path 
        d="M12 1L14.2 3.8L17.5 2.5L18 6L21.5 6.5L20.2 9.8L23 12L20.2 14.2L21.5 17.5L18 18L17.5 21.5L14.2 20.2L12 23L9.8 20.2L6.5 21.5L6 18L2.5 17.5L3.8 14.2L1 12L3.8 9.8L2.5 6.5L6 6L6.5 2.5L9.8 3.8Z" 
        fill="#006e5d"
      />
      {/* Symmetrical white checkmark */}
      <path 
        d="M9.5 15.5l-3.5-3.5 1.41-1.41 2.09 2.08 6.09-6.08 1.41 1.41-7.5 7.5z" 
        fill="white"
      />
    </svg>
  );
};

export default VerifiedBadge;

