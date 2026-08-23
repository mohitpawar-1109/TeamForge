import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const variants = {
    default: 'bg-[#161616] text-[#A1A1A1] border-[#242424]',
    brand: 'bg-[#E50914]/15 text-[#E50914] border-[#E50914]/40',
    red: 'bg-[#E50914] text-white border-transparent shadow-[0_0_10px_rgba(229,9,20,0.4)]',
    white: 'bg-white text-black border-transparent font-bold',
    success: 'bg-[#20D47A]/15 text-[#20D47A] border-[#20D47A]/40',
    warning: 'bg-[#F2B705]/15 text-[#F2B705] border-[#F2B705]/40',
    danger: 'bg-[#E50914]/20 text-[#FF1F2D] border-[#E50914]/40',
    purple: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/40',
    blue: 'bg-[#2AA8FF]/15 text-[#2AA8FF] border-[#2AA8FF]/40',
    neutral: 'bg-[#111111] text-[#888888] border-[#242424]',
    terracotta: 'bg-[#E50914]/20 text-[#E50914] border-[#E50914]/40',
    coral: 'bg-[#E50914]/20 text-[#E50914] border-[#E50914]/40',
    peach: 'bg-[#161616] text-[#A1A1A1] border-[#242424]'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] font-mono font-medium',
    md: 'px-2.5 py-0.5 text-xs font-mono font-medium',
    lg: 'px-3 py-1 text-xs font-mono font-semibold'
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}>
      {children}
    </span>
  );
};
