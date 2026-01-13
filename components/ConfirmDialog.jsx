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
  type = 'danger' // 'danger' or 'warning' or 'info'
}) {

  const typeStyles = {
    danger: {
      icon: 'bg-red-100 text-red-600',
      button: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      icon: 'bg-yellow-100 text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      icon: 'bg-blue-100 text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700'
    }
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel || onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-full ${styles.icon} flex items-center justify-center mb-4`}>
            <AlertTriangle className="w-6 h-6" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>

          {/* Message */}
          <p className="text-gray-600 mb-6">{message}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition-colors ${styles.button}`}
            >
              {confirmText}
            </button>
            <button
              onClick={onCancel || onClose}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
