import React from 'react';
import { useHotel } from '../context/HotelContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useHotel();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0">
      {toasts.map(toast => {
        let bgStyle = 'bg-slate-900 border-slate-700 text-white';
        let icon = <Info className="w-4 h-4 text-sky-400 shrink-0" />;

        if (toast.type === 'success') {
          bgStyle = 'bg-slate-900/95 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10';
          icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
        } else if (toast.type === 'error') {
          bgStyle = 'bg-slate-900/95 border-rose-500/40 text-rose-300 shadow-rose-500/10';
          icon = <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
        } else {
          bgStyle = 'bg-slate-900/95 border-amber-500/40 text-amber-300 shadow-amber-500/10';
          icon = <Info className="w-4 h-4 text-amber-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md transition-all text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200 ${bgStyle}`}
          >
            <div className="flex items-center gap-2.5">
              {icon}
              <span className="text-slate-100">{toast.message}</span>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
