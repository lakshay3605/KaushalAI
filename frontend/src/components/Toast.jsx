import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-600 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-300 bg-emerald-50 text-emerald-950',
    error: 'border-red-300 bg-red-50 text-red-950',
    info: 'border-blue-300 bg-blue-50 text-blue-950'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div className={`flex items-center gap-3 p-3.5 rounded-xl border shadow-lg max-w-md ${borders[toast.type || 'info']}`}>
        {icons[toast.type || 'info']}
        <div className="text-xs font-semibold leading-snug">
          {toast.message}
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-black/5 rounded text-slate-500 hover:text-slate-800 transition ml-2"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
