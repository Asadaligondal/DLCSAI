"use client";

import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ isOpen = true, onClose, title, children, size = 'md', noScroll = false }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-[860px]',
    wizard: 'max-w-[min(1100px,95vw)]',
    xl: 'max-w-6xl'
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100]" onClick={onClose} />

      <div
        className={`relative z-[110] bg-white rounded-2xl shadow-float w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col animate-in`}
        style={{ overflowX: 'hidden' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className={`flex-1 min-h-0 flex flex-col ${noScroll ? 'overflow-hidden' : 'overflow-y-auto p-6'}`} style={{ overflowX: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
