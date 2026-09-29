import React from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Award, 
  Download, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Sparkles,
  Share2,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { UniversityEvent, User } from '../types.js';
import { downloadIcsFile } from '../utils/calendar.js';

interface EventDetailModalProps {
  event: UniversityEvent | null;
  onClose: () => void;
  isRegistered: boolean;
  currentUser: User | null;
  onRegister: (event: UniversityEvent) => void;
  onViewTicket: () => void;
  onOpenMailbox: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  isRegistered,
  currentUser,
  onRegister,
  onViewTicket,
  onOpenMailbox
}) => {
  if (!event) return null;

  const isFull = event.registeredCount >= event.capacity;
  const isCancelled = event.status === 'cancelled';
  const seatsLeft = Math.max(0, event.capacity - event.registeredCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1">
          
          {/* Hero Banner */}
          <div className="relative h-64 sm:h-72 w-full bg-slate-900">
            <img 
              src={event.coverImage} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-600 text-white shadow-sm">
                  {event.category}
                </span>
                {event.certificatesProvided && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800/80 text-amber-300 backdrop-blur-md flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>Official Certificate</span>
                  </span>
                )}
                {isCancelled && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-600 text-white">
                    Event Cancelled
                  </span>
                )}
              </div>

              <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">
                {event.title}
              </h1>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-2">
                  <img 
                    src={event.clubLogo} 
                    alt={event.clubName}
                    className="w-7 h-7 rounded-full border border-white/80 object-cover shadow"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-slate-200">
                    Hosted by {event.clubName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6">
            
            {/* Quick Meta Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-indigo-600 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Date & Timing</div>
                  <div className="text-slate-600">{event.startDate}</div>
                  <div className="text-slate-500">{event.startTime} - {event.endTime}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-rose-600 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Campus Venue</div>
                  <div className="text-slate-700 font-medium">{event.venue}</div>
                  <div className="text-[11px] text-slate-500">{event.isOnline ? 'Online via Zoom' : 'On-Campus Facility'}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Users className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Seats & Registration</div>
                  <div className="text-slate-700 font-medium">
                    {event.registeredCount} / {event.capacity} Registered
                  </div>
                  <div className={`text-[11px] ${seatsLeft > 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-bold'}`}>
                    {seatsLeft > 0 ? `${seatsLeft} spots open` : 'Capacity Reached'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <GraduationCap className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Faculty Coordinator</div>
                  <div className="text-slate-800 font-semibold">{event.facultyCoordinator || 'Academic Advisor'}</div>
                  <div className="text-[11px] text-amber-700 font-medium">{event.facultyCoordinatorEmail || 'Faculty Oversight'}</div>
                </div>
              </div>
            </div>

            {/* Event Description */}
            <div>
              <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-800 mb-2">
                About the Event
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Agenda Timeline */}
            {event.agenda && event.agenda.length > 0 && (
              <div>
                <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Scheduled Agenda & Sessions</span>
                </h2>
                <div className="space-y-3 border-l-2 border-indigo-200 ml-2 pl-4">
                  {event.agenda.map((ag) => (
                    <div key={ag.id} className="relative group">
                      <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white" />
                      <div className="text-xs font-bold text-indigo-700">{ag.time}</div>
                      <div className="text-sm font-semibold text-slate-900 mt-0.5">{ag.title}</div>
                      {ag.speaker && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          Speaker: <span className="font-medium text-slate-700">{ag.speaker}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guest Speakers */}
            {event.speakers && event.speakers.length > 0 && (
              <div>
                <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-800 mb-3">
                  Distinguished Instructors & Speakers
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.speakers.map((sp, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-sm">
                      <img 
                        src={sp.avatar} 
                        alt={sp.name} 
                        className="w-12 h-12 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div>
                        <div className="font-bold text-sm text-slate-900">{sp.name}</div>
                        <div className="text-xs text-indigo-600 font-medium">{sp.role}</div>
                        <div className="text-[11px] text-slate-500">{sp.companyOrCollege}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prerequisites */}
            {event.prerequisites && event.prerequisites.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Important Prerequisites for Attendees</span>
                </div>
                <ul className="space-y-1 text-xs text-amber-900 list-disc list-inside">
                  {event.prerequisites.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {event.tags.map((t, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => downloadIcsFile(event)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              title="Add to Google/Outlook Calendar"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Add to Calendar (.ics)</span>
            </button>

            {isRegistered && (
              <button
                onClick={onOpenMailbox}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>View Email Pass</span>
              </button>
            )}
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            {isRegistered ? (
              <button
                onClick={onViewTicket}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>View Entry QR Pass</span>
              </button>
            ) : (
              <button
                disabled={isFull || isCancelled}
                onClick={() => onRegister(event)}
                className={`w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-white transition-all shadow-md ${
                  isCancelled
                    ? 'bg-slate-400 cursor-not-allowed'
                    : isFull
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-600/30'
                }`}
              >
                {isCancelled
                  ? 'Event Cancelled'
                  : isFull
                  ? 'Registration Full'
                  : 'RSVP & Receive Email Pass'}
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
