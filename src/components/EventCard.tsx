import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Award, 
  Clock, 
  ChevronRight, 
  CheckCircle,
  Download,
  Share2
} from 'lucide-react';
import { UniversityEvent } from '../types.js';
import { downloadIcsFile } from '../utils/calendar.js';

interface EventCardProps {
  event: UniversityEvent;
  isRegistered: boolean;
  onViewDetails: (event: UniversityEvent) => void;
  onRegister: (event: UniversityEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isRegistered,
  onViewDetails,
  onRegister
}) => {
  const isFull = event.registeredCount >= event.capacity;
  const isCancelled = event.status === 'cancelled';
  const seatsLeft = Math.max(0, event.capacity - event.registeredCount);
  const fillPercentage = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));

  // Category Color Map
  const categoryStyles: Record<string, { badge: string }> = {
    Workshop: { badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    Seminar: { badge: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
    Hackathon: { badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    'Guest Lecture': { badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    Cultural: { badge: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
    'Tech Talk': { badge: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' }
  };

  const currentStyle = categoryStyles[event.category] || { badge: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };

  return (
    <div 
      id={`event-card-${event.id}`}
      className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
    >
      <div>
        {/* Cover Image & Category Tag */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-100">
          <img 
            src={event.coverImage} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          
          <div className="absolute top-3 left-3 flex gap-2 items-center">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-md bg-white/90 shadow-sm ${currentStyle.badge}`}>
              {event.category}
            </span>
            {event.certificatesProvided && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/70 text-white backdrop-blur-md flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-300" />
                <span>Certificate</span>
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadIcsFile(event);
              }}
              title="Download Calendar (.ics) invite"
              className="p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Organizing Club Pill */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <img 
                src={event.clubLogo} 
                alt={event.clubName}
                className="w-6 h-6 rounded-full border border-white/80 object-cover shadow"
              />
              <span className="text-xs font-semibold drop-shadow-sm truncate max-w-[200px]">
                {event.clubName}
              </span>
            </div>
            {isCancelled && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white uppercase tracking-wider">
                Cancelled
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          <h3 
            onClick={() => onViewDetails(event)}
            className="font-heading font-bold text-base sm:text-lg text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1"
          >
            {event.title}
          </h3>
          
          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
            {event.tagline || event.description}
          </p>

          {/* Schedule & Venue Meta */}
          <div className="mt-4 space-y-2 text-xs text-slate-600 border-y border-slate-100 py-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="font-semibold text-slate-800">{event.startDate}</span>
              <span className="text-slate-400">•</span>
              <span className="flex items-center gap-1 text-slate-600">
                <Clock className="w-3 h-3 text-slate-400" />
                {event.startTime} - {event.endTime}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>

          {/* Seat Capacity Progress */}
          <div className="mt-3">
            <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{event.registeredCount} / {event.capacity} Registered</span>
              </span>
              <span className={isFull ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}>
                {isFull ? 'Full' : `${seatsLeft} seats left`}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isFull ? 'bg-rose-500' : fillPercentage > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-5 pt-0 flex gap-2">
        <button
          id={`btn-view-details-${event.id}`}
          onClick={() => onViewDetails(event)}
          className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-center"
        >
          View Agenda
        </button>

        {isRegistered ? (
          <button
            id={`btn-registered-${event.id}`}
            onClick={() => onViewDetails(event)}
            className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center gap-1"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Pass Booked</span>
          </button>
        ) : (
          <button
            id={`btn-register-${event.id}`}
            disabled={isFull || isCancelled}
            onClick={() => onRegister(event)}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl text-white transition-all shadow-sm ${
              isCancelled
                ? 'bg-slate-300 cursor-not-allowed'
                : isFull
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-600/20'
            }`}
          >
            {isCancelled ? 'Cancelled' : isFull ? 'Waitlist' : 'RSVP Pass'}
          </button>
        )}
      </div>
    </div>
  );
};
