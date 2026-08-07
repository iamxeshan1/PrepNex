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
      {/* Instagram Rosette / Scalloped Starburst Shape */}
      <path 
        d="M22.5 12.5c0-1.58-.8-2.97-2-3.79.44-1.52.09-3.23-1-4.32-1.09-1.09-2.8-1.44-4.32-1C14.37 2.2 12.98 1.4 11.4 1.4c-1.58 0-2.97.8-3.79 2-1.52-.44-3.23-.09-4.32 1-1.09 1.09-1.44 2.8-1 4.32C1.2 9.53.4 10.92.4 12.5c0 1.58.8 2.97 2 3.79-.44 1.52-.09 3.23 1 4.32 1.09 1.09 2.8 1.44 4.32 1 1.08 1.2 2.47 2 4.05 2 1.58 0 2.97-.8 3.79-2 1.52.44 3.23.09 4.32-1 1.09-1.09 1.44-2.8 1-4.32 1.2-1.08 2-2.47 2-4.05z" 
        fill="#006e5d"
      />
      {/* White Checkmark */}
      <path 
        d="M9.8 17.3l-4.2-4.2 1.4-1.4 2.8 2.8 8.2-8.2 1.4 1.4-9.6 9.6z" 
        fill="white"
      />
    </svg>
  );
};

export default VerifiedBadge;

