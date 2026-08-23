import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl'
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className={`relative transform overflow-hidden rounded-3xl bg-[#111111] text-left shadow-2xl transition-all sm:my-8 w-full ${maxWidth} border border-[#242424]`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1F1F1F] px-6 py-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#F5F5F5]">{title}</h3>
              {subtitle && <p className="text-xs text-[#A1A1A1] mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-[#888888] hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 text-[#A1A1A1]">{children}</div>
        </div>
      </div>
    </div>
  );
};
