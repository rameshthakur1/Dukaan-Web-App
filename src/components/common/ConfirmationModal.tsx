import React from 'react';
import { AlertTriangle, Edit3, CheckCircle2, X } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  actionType?: 'EDIT' | 'DELETE' | 'GENERAL';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  actionType = 'DELETE',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDelete = actionType === 'DELETE';
  const defaultConfirmText = isDelete ? 'Yes, Confirm Delete' : 'Yes, Save Changes';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon & Title Header */}
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-2xl flex-shrink-0 ${
              isDelete
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
            }`}
          >
            {isDelete ? (
              <AlertTriangle className="h-6 w-6 text-red-400" />
            ) : (
              <Edit3 className="h-6 w-6 text-blue-400" />
            )}
          </div>
          <div className="space-y-1 pr-6">
            <h3 className="text-lg font-black text-white">{title}</h3>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-bold text-amber-300">
              💬 Confirmation Required
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
          <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-900">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
            <span>This verification protects system data from accidental modifications.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition active:scale-95"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className={`px-5 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-lg flex items-center gap-2 transition active:scale-95 ${
              isDelete
                ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
            }`}
          >
            {confirmText || defaultConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
