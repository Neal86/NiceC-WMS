import React from 'react';
import { X } from 'lucide-react';

interface FormModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit?: () => void;
  children: React.ReactNode;
  width?: string;
  submitLabel?: string;
  loading?: boolean;
}

export default function FormModal({ open, title, onClose, onSubmit, children, width = '480px', submitLabel = '保存', loading }: FormModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-h-[85vh] flex flex-col" style={{ width }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 text-xs text-slate-700">{children}</div>
        {onSubmit && (
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-200">
            <button onClick={onClose} className="px-4 py-1.5 text-xs border border-slate-300 rounded hover:bg-slate-50 cursor-pointer">取消</button>
            <button onClick={onSubmit} disabled={loading} className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 cursor-pointer">
              {loading ? '处理中...' : submitLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
