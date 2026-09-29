import React from 'react';
import { Clock, X, Ticket, Mail, MapPin } from 'lucide-react';

export interface ReminderAlertData {
  eventTitle: string;
  startTime: string;
  venue: string;
  ticketCode: string;
  minutesLeft: number;
  eventId: string;
}

interface ReminderToastProps {
  alert: ReminderAlertData | null;
  onClose: () => void;
  onOpenTicket: () => void;
  onOpenMailbox: () => void;
}

export const ReminderToast: React.FC<ReminderToastProps> = ({
  alert,
  onClose,
  onOpenTicket,
  onOpenMailbox
}) => {
  if (!alert) return null;

  return (
    <div className="fixed top-5 right-5 z-50 max-w-md w-full bg-slate-950 text-white p-4 rounded-2xl shadow-2xl border-2 border-purple-500/80 animate-slideDown">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-purple-600 text-white shrink-0 mt-0.5 shadow-md">
          <Clock className="w-5 h-5 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              1-Hour Event Reminder
            </span>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h4 className="text-sm font-bold text-white mt-1 truncate">
            {alert.eventTitle}
          </h4>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
            <span className="text-purple-300 font-semibold">
              Starts at {alert.startTime} (~{alert.minutesLeft}m away)
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-3 h-3 text-purple-400" />
              {alert.venue}
            </span>
          </div>

          <div className="mt-1 text-[11px] text-slate-400">
            Digital Pass: <strong className="font-mono text-emerald-400">{alert.ticketCode}</strong>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenTicket();
              }}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Show QR Pass</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenMailbox();
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-purple-300" />
              <span>Read Reminder Email</span>
            </button>

            <button
              onClick={onClose}
              className="px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400 text-xs transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
