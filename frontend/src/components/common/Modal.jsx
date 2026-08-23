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
        className="fixed inset-0 bg-[#281A21]/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className={`relative transform overflow-hidden rounded-3xl bg-[#4A2A35] text-left shadow-2xl transition-all sm:my-8 w-full ${maxWidth} border border-[#703344]`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#703344] px-6 py-4">
            <div>
              <h3 className="text-lg font-bold text-[#F6E8E2]">{title}</h3>
              {subtitle && <p className="text-xs text-[#DDA081] mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-[#DDA081] hover:bg-[#703344] hover:text-[#F6E8E2] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 text-[#DDA081]">{children}</div>
        </div>
      </div>
    </div>
  );
};
