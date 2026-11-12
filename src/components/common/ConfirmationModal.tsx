import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  let icon = <AlertTriangle className="w-6 h-6 text-amber-600" />;
  let btnClass = 'bg-amber-600 hover:bg-amber-700 text-white';

  if (variant === 'danger') {
    icon = <AlertCircle className="w-6 h-6 text-red-600" />;
    btnClass = 'bg-red-600 hover:bg-red-700 text-white';
  } else if (variant === 'info') {
    icon = <Info className="w-6 h-6 text-blue-600" />;
    btnClass = 'bg-blue-600 hover:bg-blue-700 text-white';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-50 ${btnClass}`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
