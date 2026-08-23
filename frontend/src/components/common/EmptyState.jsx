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
    <div className={`py-12 px-4 rounded-3xl bg-[#4A2A35] border border-[#703344] text-center shadow-lg flex flex-col items-center justify-center max-w-xl mx-auto ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-[#703344]/50 border border-[#A84A4D]/40 text-[#CB6B5A] flex items-center justify-center mb-4 shadow-sm">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-base sm:text-lg font-bold text-[#F6E8E2] mb-1.5">{title}</h3>
      {description && (
        <p className="text-xs sm:text-sm text-[#DDA081] max-w-sm leading-relaxed mb-6">
          {description}
        </p>
      )}
      {actionLabel && (
        actionLink ? (
          <Link to={actionLink}>
            <Button variant="primary" size="md">
              {actionLabel}
            </Button>
          </Link>
        ) : onAction ? (
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null
      )}
    </div>
  );
};
