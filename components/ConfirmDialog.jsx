'use client';

import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen = true,
  onClose,
  onCancel,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}) {
  const typeStyles = {
    danger: { icon: 'bg-red-50 text-red-600', button: 'bg-red-600 hover:bg-red-700' },
    warning: { icon: 'bg-amber-50 text-amber-600', button: 'bg-amber-600 hover:bg-amber-700' },
    info: { icon: 'bg-primary-50 text-primary-600', button: 'bg-primary-600 hover:bg-primary-700' }
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onCancel || onClose} />

      <div className="relative bg-white rounded-2xl shadow-float w-full max-w-sm animate-in">
        <div className="p-6">
          <div className={`w-10 h-10 rounded-xl ${styles.icon} flex items-center justify-center mb-4`}>
            <AlertTriangle className="w-5 h-5" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">{message}</p>

          <div className="flex gap-2.5">
            <button
              onClick={onCancel || onClose}
              className="flex-1 h-9 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 h-9 rounded-lg text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md ${styles.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
