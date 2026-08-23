import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#281A21] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary: 'bg-[#A84A4D] hover:bg-[#CB6B5A] text-[#F6E8E2] shadow-sm hover:shadow-glow focus:ring-[#CB6B5A]',
    secondary: 'bg-[#4A2A35] hover:bg-[#703344] text-[#F6E8E2] border border-[#703344] focus:ring-[#A84A4D]',
    outline: 'bg-transparent hover:bg-[#4A2A35] text-[#DDA081] hover:text-[#F6E8E2] border border-[#703344] hover:border-[#CB6B5A] focus:ring-[#CB6B5A]',
    ghost: 'bg-transparent hover:bg-[#4A2A35] text-[#DDA081] hover:text-[#F6E8E2] focus:ring-[#703344]',
    danger: 'bg-[#A8383B] hover:bg-[#CB6B5A] text-[#F6E8E2] shadow-sm focus:ring-[#CB6B5A]',
    success: 'bg-[#4D6D53] hover:bg-[#5A7A60] text-[#F6E8E2] shadow-sm focus:ring-[#6B8E6B]',
    gradient: 'bg-gradient-to-r from-[#A84A4D] to-[#CB6B5A] hover:from-[#CB6B5A] hover:to-[#DDA081] text-[#F6E8E2] shadow-md hover:shadow-glow focus:ring-[#CB6B5A]'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
    xl: 'px-8 py-3.5 text-lg gap-3'
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      {children}
    </button>
  );
};
