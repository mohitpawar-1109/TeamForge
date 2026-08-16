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
    <div className={`py-12 px-4 rounded-3xl bg-white border border-slate-200/80 text-center shadow-soft flex flex-col items-center justify-center max-w-xl mx-auto ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-brand-50/70 border border-brand-100/80 text-brand-600 flex items-center justify-center mb-4 shadow-xs">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">{title}</h3>
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed mb-6">
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
