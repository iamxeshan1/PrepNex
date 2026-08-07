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
      {/* Mathematically Symmetrical Rosette / Scalloped Starburst */}
      <path 
        d="M12 2c-.6 0-1.1.4-1.3.9l-.7 1.5c-.2.4-.6.7-1 .8l-1.6.4c-.6.1-1 .6-1.1 1.2l-.2 1.6c-.1.5-.3.9-.7 1.2l-1.1 1.2c-.4.4-.5 1-.2 1.5l.8 1.4c.2.4.3 1 0 1.4l-.8 1.4c-.3.5-.2 1.1.2 1.5l1.1 1.2c.4.3.6.7.7 1.2l.2 1.6c.1.6.5 1.1 1.1 1.2l1.6.4c.4.1.8.4 1 .8l.7 1.5c.2.5.7.9 1.3.9s1.1-.4 1.3-.9l.7-1.5c.2-.4.6-.7 1-.8l1.6-.4c.6-.1 1-.6 1.1-1.2l.2-1.6c.1-.5.3-.9.7-1.2l1.1-1.2c.4-.4.5-1 .2-1.5l-.8-1.4c-.2-.4-.3-1 0-1.4l.8-1.4c.3-.5.2-1.1-.2-1.5l-1.1-1.2c-.4-.3-.6-.7-.7-1.2l-.2-1.6c-.1-.6-.5-1.1-1.1-1.2l-1.6-.4c-.4-.1-.8-.4-1-.8l-.7-1.5c-.2-.5-.7-.9-1.3-.9z" 
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

