import React, { useEffect, useState } from 'react';
import { api, ApiNotification } from '../services/api';
import { AlertCircle, AlertTriangle, Info, X, WifiOff } from 'lucide-react';

export const ApiNotificationToast: React.FC = () => {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);

  useEffect(() => {
    const unsubscribe = api.subscribe((notification) => {
      setNotifications((prev) => [...prev, notification]);

      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 6000);
    });

    return () => unsubscribe();
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border text-sm backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
            n.type === 'error'
              ? 'bg-rose-950/90 border-rose-700/60 text-rose-100 shadow-rose-950/50'
              : n.type === 'warning'
              ? 'bg-amber-950/90 border-amber-700/60 text-amber-100 shadow-amber-950/50'
              : 'bg-sky-950/90 border-sky-700/60 text-sky-100 shadow-sky-950/50'
          }`}
          dir="rtl"
        >
          <div className="p-2 rounded-lg bg-black/30 shrink-0 mt-0.5">
            {n.type === 'error' ? (
              <WifiOff className="w-5 h-5 text-rose-400" />
            ) : n.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <Info className="w-5 h-5 text-sky-400" />
            )}
          </div>
          <div className="flex-1 pr-1">
            <div className="font-bold text-sm tracking-wide mb-0.5">
              {n.type === 'error' ? 'تنبيه اتصال بالخادم' : n.type === 'warning' ? 'تنبيه' : 'معلومة'}
            </div>
            <div className="text-xs leading-relaxed opacity-90">{n.message}</div>
            {n.details && (
              <div className="mt-1 text-[11px] font-mono opacity-60 text-rose-300/80 dir-ltr text-right">
                {n.details}
              </div>
            )}
          </div>
          <button
            onClick={() => removeNotification(n.id)}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
            aria-label="إغلاق التنبيه"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
