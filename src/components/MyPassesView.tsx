import React from 'react';
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  Clock, 
  Download, 
  Mail, 
  CheckCircle2, 
  Trash2,
  ExternalLink,
  Compass
} from 'lucide-react';
import { Registration, UniversityEvent } from '../types.js';
import { downloadIcsFile } from '../utils/calendar.js';

interface MyPassesViewProps {
  registrations: (Registration & { event?: UniversityEvent })[];
  onViewTicket: (reg: Registration, event: UniversityEvent) => void;
  onOpenMailbox: () => void;
  onCancelRegistration: (eventId: string) => void;
  onExploreEvents: () => void;
}

export const MyPassesView: React.FC<MyPassesViewProps> = ({
  registrations,
  onViewTicket,
  onOpenMailbox,
  onCancelRegistration,
  onExploreEvents
}) => {
  const activePasses = registrations.filter(r => r.status !== 'cancelled');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900">
              My Event Passes & Registered Workshops
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Digital entrance passes with real-time email verification records
            </p>
          </div>
        </div>

        <button
          onClick={onOpenMailbox}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          <span>Check Campus Email Inbox</span>
        </button>
      </div>

      {activePasses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="font-heading font-bold text-lg text-slate-800">No active event passes booked</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You haven't registered for any workshops or seminars yet. Browse upcoming campus events and reserve your seat.
          </p>
          <button
            onClick={onExploreEvents}
            className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all inline-flex items-center gap-2 shadow-sm"
          >
            <Compass className="w-4 h-4" />
            <span>Discover Events & Workshops</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activePasses.map((reg) => {
            const evt = reg.event;
            if (!evt) return null;

            return (
              <div 
                key={reg.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar with Pass Code */}
                  <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase tracking-wider">
                        {evt.category}
                      </span>
                      <h4 className="font-heading font-bold text-base text-white mt-1 line-clamp-1">
                        {evt.title}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-mono">TICKET CODE</span>
                      <span className="font-mono font-extrabold text-sm text-emerald-400 tracking-wider">
                        {reg.ticketCode}
                      </span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Organized by:</span>
                      <strong className="text-slate-800">{evt.clubName}</strong>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Date & Time:</span>
                      <strong className="text-slate-800">{evt.startDate} • {evt.startTime}</strong>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Campus Venue:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[200px]">{evt.venue}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="text-slate-500">Attendee:</span>
                      <span className="font-medium text-slate-700">{reg.userName} ({reg.studentId || 'Student'})</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between text-[11px] text-emerald-800">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pass Confirmed</span>
                      </span>
                      <span className="text-emerald-700 text-[10px]">Email dispatched to {reg.userEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => downloadIcsFile(evt)}
                      title="Add to Calendar (.ics)"
                      className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onCancelRegistration(evt.id)}
                      title="Cancel Registration"
                      className="p-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onViewTicket(reg, evt)}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>View Entry QR Pass</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
