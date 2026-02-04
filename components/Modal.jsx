'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ isOpen = true, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-[860px]',
    // Use min(...) to ensure modal never exceeds viewport width and avoid horizontal scroll
    wizard: 'max-w-[min(1100px,95vw)]',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-[16px] shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100`}
        style={{ overflowX: 'hidden' }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header (sticky) */}
        <div className="sticky top-0 bg-white z-20 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content (scrollable) */}
        <div className="overflow-y-auto max-h-[calc(90vh-64px)] p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent" style={{ overflowX: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
