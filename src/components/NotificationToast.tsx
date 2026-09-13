import React from 'react';
import { Mail, X, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { EmailNotification } from '../types.js';

interface NotificationToastProps {
  email: EmailNotification | null;
  onClose: () => void;
  onOpenMailbox: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  email,
  onClose,
  onOpenMailbox
}) => {
  if (!email) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 animate-slideUp flex items-start gap-3">
      <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
        <Mail className="w-5 h-5 animate-pulse" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Real-Time Email Delivered
          </span>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-0.5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h4 className="text-xs font-bold text-white mt-1 truncate">
          {email.subject}
        </h4>
        <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
          To: {email.recipientEmail} ({email.senderName})
        </p>

        <div className="mt-2.5 flex items-center gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenMailbox();
            }}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
          >
            <span>Open Email Pass</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-400 text-[11px]"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
