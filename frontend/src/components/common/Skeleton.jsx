import React from 'react';

export const Skeleton = ({
  className = '',
  variant = 'rectangular', // 'text' | 'circular' | 'rectangular'
  width,
  height
}) => {
  const variantStyles = {
    text: 'h-4 rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-2xl'
  };

  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      aria-hidden="true"
      style={style}
      className={`skeleton-shimmer ${variantStyles[variant] || variantStyles.rectangular} ${className}`}
    />
  );
};

export const CardSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-4"
      >
        <div className="flex items-center justify-between">
          <Skeleton variant="rectangular" className="w-24 h-6 rounded-lg" />
          <Skeleton variant="rectangular" className="w-16 h-6 rounded-lg" />
        </div>
        <Skeleton variant="text" className="w-3/4 h-5" />
        <div className="space-y-2">
          <Skeleton variant="text" className="w-full h-3.5" />
          <Skeleton variant="text" className="w-5/6 h-3.5" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton variant="rectangular" className="w-14 h-5 rounded-md" />
          <Skeleton variant="rectangular" className="w-16 h-5 rounded-md" />
          <Skeleton variant="rectangular" className="w-12 h-5 rounded-md" />
        </div>
        <div className="pt-4 border-t border-[#27272A] flex items-center justify-between">
          <Skeleton variant="text" className="w-28 h-4" />
          <Skeleton variant="rectangular" className="w-20 h-7 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);
