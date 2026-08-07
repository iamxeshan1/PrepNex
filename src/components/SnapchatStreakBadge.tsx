import React from 'react';
import { Flame } from 'lucide-react';

interface SnapchatStreakBadgeProps {
  streakCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function SnapchatStreakBadge({ 
  streakCount = 14, 
  size = 'md',
  showLabel = true 
}: SnapchatStreakBadgeProps) {
  const count = Math.max(1, streakCount);

  // Size styling classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2'
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }[size];

  return (
    <span 
      className={`inline-flex items-center bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-black rounded-full shadow-md shadow-orange-500/20 border border-amber-300/40 select-none hover:scale-105 transition-transform cursor-pointer ${sizeClasses}`}
      title={`${count} Day Practice Streak 🔥`}
    >
      <Flame className={`${iconSizes} text-amber-200 fill-amber-200 animate-bounce`} />
      <span>{count}</span>
      {showLabel && <span className="opacity-90 font-extrabold uppercase tracking-tight text-[0.85em]">Streak</span>}
    </span>
  );
}
