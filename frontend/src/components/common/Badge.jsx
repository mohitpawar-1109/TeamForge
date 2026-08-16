import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const variants = {
    default: 'bg-[#18181B] text-zinc-300 border-[#27272A]',
    brand: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30',
    success: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
    danger: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
    purple: 'bg-purple-950/60 text-purple-300 border-purple-500/30',
    cyan: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1 text-sm font-semibold'
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}>
      {children}
    </span>
  );
};
