import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: string;
  onEnd?: () => void;
  compact?: boolean;
}

export const Countdown: React.FC<CountdownProps> = ({ targetDate, onEnd, compact }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        onEnd?.();
        return null;
      }

      return {
        d: Math.floor(difference / (1000 * 60 * 60 * 24)),
        h: Math.floor((difference / (1000 * 60 * 60)) % 24),
        m: Math.floor((difference / 1000 / 60) % 60),
        s: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      const res = calculateTimeLeft();
      setTimeLeft(res);
      if (!res) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onEnd]);

  if (!timeLeft) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 tabular-nums">
        {timeLeft.d > 0 && <span>{timeLeft.d}d</span>}
        <span>{timeLeft.h.toString().padStart(2, '0')}:</span>
        <span>{timeLeft.m.toString().padStart(2, '0')}:</span>
        <span>{timeLeft.s.toString().padStart(2, '0')}</span>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {[
        { label: 'D', val: timeLeft.d },
        { label: 'H', val: timeLeft.h },
        { label: 'M', val: timeLeft.m },
        { label: 'S', val: timeLeft.s },
      ].map((item, i) => (
        <div key={i} className="flex flex-col items-center min-w-[32px] p-1.5 bg-slate-50 border border-slate-100 rounded-lg">
          <span className="text-[10px] font-black text-primary leading-none tabular-nums">{item.val.toString().padStart(2, '0')}</span>
          <span className="text-[6px] font-black text-slate-400 mt-0.5">{item.label}</span>
        </div>
      ))}
    </div>
  );
};
