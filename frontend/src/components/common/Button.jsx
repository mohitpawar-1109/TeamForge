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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer';

  const variants = {
    primary: 'bg-[#E50914] hover:bg-[#FF1F2D] text-white font-semibold shadow-[0_0_18px_rgba(229,9,20,0.45)] hover:shadow-[0_0_24px_rgba(229,9,20,0.65)]',
    white: 'bg-white hover:bg-neutral-200 text-black font-bold shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]',
    secondary: 'bg-[#161616] hover:bg-[#222222] text-[#F5F5F5] border border-[#242424] hover:border-[#333333]',
    outline: 'bg-transparent hover:bg-[#161616] text-[#A1A1A1] hover:text-white border border-[#242424] hover:border-[#333333]',
    ghost: 'bg-transparent hover:bg-[#161616] text-[#A1A1A1] hover:text-white',
    danger: 'bg-[#E50914] hover:bg-[#FF1F2D] text-white font-semibold shadow-[0_0_15px_rgba(229,9,20,0.4)]',
    success: 'bg-[#20D47A] hover:bg-[#28E585] text-black font-bold shadow-[0_0_15px_rgba(32,212,122,0.3)]',
    gradient: 'bg-[#E50914] hover:bg-[#FF1F2D] text-white font-semibold shadow-[0_0_20px_rgba(229,9,20,0.45)]'
  };

  const sizes = {
    sm: 'px-3 py-1 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2',
    lg: 'px-6 py-2.5 text-sm sm:text-base gap-2.5',
    xl: 'px-8 py-3 text-base gap-3'
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      ) : null}
      {children}
    </button>
  );
};
