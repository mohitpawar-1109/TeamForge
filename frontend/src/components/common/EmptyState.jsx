import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionLink,
  onAction,
  className = ''
}) => {
  return (
    <div className={`py-14 px-6 rounded-3xl bg-[#111111] border border-[#242424] text-center shadow-soft flex flex-col items-center justify-center max-w-xl mx-auto ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-[#161616] border border-[#242424] text-[#A1A1A1] flex items-center justify-center mb-4 shadow-sm">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base sm:text-lg font-bold text-[#F5F5F5] mb-1.5">{title}</h3>
      {description && (
        <p className="text-xs sm:text-sm text-[#888888] max-w-md leading-relaxed mb-6">
          {description}
        </p>
      )}
      {actionLabel && (
        actionLink ? (
          <Link to={actionLink}>
            <Button variant="white" size="md">
              {actionLabel}
            </Button>
          </Link>
        ) : onAction ? (
          <Button variant="white" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null
      )}
    </div>
  );
};
