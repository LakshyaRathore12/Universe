import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Users, 
  Mail, 
  PlusCircle, 
  Edit, 
  Megaphone, 
  CheckCircle2, 
  XCircle, 
  Search,
  Check,
  Building,
  QrCode,
  Download
} from 'lucide-react';
import { Registration, UniversityEvent, User } from '../types.js';

interface OrganizerDashboardProps {
  events: UniversityEvent[];
  currentUser: User | null;
  onOpenScheduleEvent: () => void;
  onEditEvent: (event: UniversityEvent) => void;
  onOpenBroadcast: (event: UniversityEvent) => void;
  onCancelEvent: (eventId: string) => void;
  onOpenMailbox: () => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  events,
  currentUser,
  onOpenScheduleEvent,
  onEditEvent,
  onOpenBroadcast,
  onCancelEvent,
  onOpenMailbox
}) => {
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState<UniversityEvent | null>(null);
  const [attendees, setAttendees] = useState<Registration[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [ticketInput, setTicketInput] = useState('');
  const [checkinMsg, setCheckinMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Filter events hosted by current user's club or all if admin
  const hostedEvents = currentUser?.clubId 
    ? events.filter(e => e.clubId === currentUser.clubId)
    : events;

  const totalSeatsOffered = hostedEvents.reduce((acc, e) => acc + e.capacity, 0);
  const totalRegistrations = hostedEvents.reduce((acc, e) => acc + e.registeredCount, 0);

  const handleFetchAttendees = async (event: UniversityEvent) => {
    setSelectedEventForAttendees(event);
    setLoadingAttendees(true);
    setCheckinMsg(null);
    setTicketInput('');
    try {
      const res = await fetch(`/api/events/${event.id}/attendees`);
      const data = await res.json();
      if (data.success) {
        setAttendees(data.attendees);
      }
    } catch {
      console.error('Failed to load attendees');
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleManualCheckIn = async (ticketCodeToUse?: string) => {
    if (!selectedEventForAttendees) return;
    const code = ticketCodeToUse || ticketInput;
    if (!code.trim()) return;

    try {
      const res = await fetch(`/api/events/${selectedEventForAttendees.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode: code.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setCheckinMsg({ text: data.message, success: true });
        setTicketInput('');
        // Update local attendees list
        setAttendees(prev => prev.map(a => a.ticketCode === code.trim() ? { ...a, status: 'checked_in' } : a));
      } else {
        setCheckinMsg({ text: data.message || 'Check-in failed', success: false });
      }
    } catch {
      setCheckinMsg({ text: 'Error connecting to check-in service', success: false });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Club Organizer Console
              </span>
              {currentUser?.clubName && (
                <span className="text-xs font-semibold text-amber-300">
                  {currentUser.clubName}
                </span>
              )}
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white mt-2">
              Event Management & Attendee Hub
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Schedule workshops, manage campus venue bookings, and broadcast real-time updates to attendees.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenScheduleEvent}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-indigo-600/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Schedule New Event</span>
            </button>

            <button
              onClick={onOpenMailbox}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Mail className="w-4 h-4" />
              <span>Email Logs</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-400">Events Scheduled</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{hostedEvents.length}</div>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-400">Total Registrations</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-0.5">{totalRegistrations}</div>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-400">Total Seats Offered</div>
            <div className="text-xl sm:text-2xl font-bold text-indigo-400 mt-0.5">{totalSeatsOffered}</div>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-400">Attendance Fill Rate</div>
            <div className="text-xl sm:text-2xl font-bold text-amber-400 mt-0.5">
              {totalSeatsOffered > 0 ? Math.round((totalRegistrations / totalSeatsOffered) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Events Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-heading font-bold text-base text-slate-900">
            Hosted Events & Workshops
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Showing {hostedEvents.length} event(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Event Details</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Date & Venue</th>
                <th className="px-5 py-3.5">Registrations</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hostedEvents.map(evt => (
                <tr key={evt.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900 text-sm">{evt.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{evt.clubName}</div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700">
                      {evt.category}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-800">{evt.startDate} • {evt.startTime}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{evt.venue}</div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800">{evt.registeredCount} / {evt.capacity}</div>
                    <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full" 
                        style={{ width: `${Math.min(100, (evt.registeredCount / evt.capacity) * 100)}%` }}
                      />
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleFetchAttendees(evt)}
                        title="View registered attendees & Door check-in"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Attendees</span>
                      </button>

                      <button
                        onClick={() => onOpenBroadcast(evt)}
                        title="Send Real-time Email Announcement to Attendees"
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>Broadcast</span>
                      </button>

                      <button
                        onClick={() => onEditEvent(evt)}
                        title="Reschedule or Edit Event (Notifies attendees)"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onCancelEvent(evt.id)}
                        title="Cancel Event"
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendees & Door Check-In Drawer Modal */}
      {selectedEventForAttendees && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    Registration Roster & Door Check-In
                  </span>
                </div>
                <h3 className="font-heading font-bold text-lg text-white mt-1">
                  {selectedEventForAttendees.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEventForAttendees(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Check-In Action Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs">
              <div className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span>Door Ticket Scanner / Verification</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ticketInput}
                  onChange={e => setTicketInput(e.target.value)}
                  placeholder="Enter Ticket Code (e.g. TKT-2026-...)"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
                <button
                  onClick={() => handleManualCheckIn()}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors"
                >
                  Verify & Check-In
                </button>
              </div>

              {checkinMsg && (
                <div className={`mt-2 p-2 rounded-lg text-xs font-semibold ${
                  checkinMsg.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {checkinMsg.text}
                </div>
              )}
            </div>

            {/* Attendees List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 text-xs">
              {loadingAttendees ? (
                <div className="p-8 text-center text-slate-400">Loading attendee roster...</div>
              ) : attendees.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No students registered yet.</div>
              ) : (
                attendees.map(att => (
                  <div key={att.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{att.userName}</div>
                      <div className="text-slate-500">{att.userEmail} • {att.studentId || 'Student'}</div>
                      <div className="font-mono text-[11px] text-indigo-600 mt-0.5">Code: {att.ticketCode}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {att.status === 'checked_in' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Checked In</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleManualCheckIn(att.ticketCode)}
                          className="px-3 py-1 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-semibold text-[11px]"
                        >
                          Mark Present
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedEventForAttendees(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-semibold text-xs"
              >
                Close Roster
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
