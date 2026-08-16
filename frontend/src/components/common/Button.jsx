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
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#09090B] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm hover:shadow-glow focus:ring-indigo-500',
    secondary: 'bg-[#18181B] hover:bg-[#27272A] text-[#FAFAFA] border border-[#27272A] focus:ring-zinc-600',
    outline: 'bg-transparent hover:bg-[#18181B] text-zinc-300 hover:text-white border border-[#27272A] hover:border-zinc-700 focus:ring-indigo-500',
    ghost: 'bg-transparent hover:bg-[#18181B] text-zinc-400 hover:text-[#FAFAFA] focus:ring-zinc-700',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm focus:ring-rose-500',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm focus:ring-emerald-500',
    gradient: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-md hover:shadow-glow focus:ring-indigo-500'
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
