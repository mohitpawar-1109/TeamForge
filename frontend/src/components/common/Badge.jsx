import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const variants = {
    default: 'bg-[#4A2A35] text-[#DDA081] border-[#703344]',
    brand: 'bg-[#703344] text-[#F6E8E2] border-[#A84A4D]/50',
    terracotta: 'bg-[#A84A4D]/25 text-[#F6E8E2] border-[#A84A4D]',
    coral: 'bg-[#CB6B5A]/20 text-[#CB6B5A] border-[#CB6B5A]/40',
    peach: 'bg-[#4A2A35] text-[#DDA081] border-[#703344]',
    success: 'bg-[#5B8A68]/20 text-[#86B190] border-[#5B8A68]/40',
    warning: 'bg-[#D99443]/20 text-[#E5B079] border-[#D99443]/40',
    danger: 'bg-[#C04A4D]/20 text-[#E07D82] border-[#C04A4D]/40',
    purple: 'bg-[#703344]/40 text-[#DDA081] border-[#703344]',
    cyan: 'bg-[#4A2A35] text-[#DDA081] border-[#703344]'
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
