import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Users, 
  Award,
  Filter
} from 'lucide-react';
import { UniversityEvent } from '../types.js';

interface CalendarViewProps {
  events: UniversityEvent[];
  onSelectEvent: (event: UniversityEvent) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onSelectEvent
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month calculation
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  // Filter events
  const filteredEvents = selectedCategory === 'all' 
    ? events 
    : events.filter(e => e.category.toLowerCase() === selectedCategory.toLowerCase());

  // Helper to get events on a specific day of the month
  const getEventsForDay = (day: number) => {
    const formattedDay = String(day).padStart(2, '0');
    const formattedMonth = String(month + 1).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    return filteredEvents.filter(e => e.startDate === dateStr);
  };

  return (
    <div className="space-y-6">
      
      {/* Calendar Header Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900">
                Campus Master Schedule
              </h2>
              <p className="text-xs text-slate-500">
                Track all university workshops, academic seminars, and club venues
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-none hover:shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-heading font-bold text-sm px-3 text-slate-800 min-w-[140px] text-center">
              {monthName}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-none hover:shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="workshop">Workshops</option>
            <option value="seminar">Seminars</option>
            <option value="hackathon">Hackathons</option>
            <option value="cultural">Cultural Fests</option>
          </select>
        </div>
      </div>

      {/* Monthly Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 py-3">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
          {blankDays.map((_, i) => (
            <div key={`blank-${i}`} className="min-h-28 sm:min-h-32 bg-slate-50/50 p-2" />
          ))}

          {daysArray.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = 
              new Date().getDate() === day && 
              new Date().getMonth() === month && 
              new Date().getFullYear() === year;

            return (
              <div 
                key={`day-${day}`}
                className={`min-h-28 sm:min-h-32 p-1.5 sm:p-2 transition-colors ${
                  isToday ? 'bg-indigo-50/40' : 'bg-white hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700'
                  }`}>
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1 rounded">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Event Chips for this day */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(evt => (
                    <div
                      key={evt.id}
                      onClick={() => onSelectEvent(evt)}
                      className={`p-1 sm:p-1.5 rounded-lg text-[10px] sm:text-[11px] font-semibold cursor-pointer truncate transition-all ${
                        evt.category === 'Workshop'
                          ? 'bg-amber-100/80 text-amber-900 border border-amber-200 hover:bg-amber-200'
                          : evt.category === 'Seminar'
                          ? 'bg-indigo-100/80 text-indigo-900 border border-indigo-200 hover:bg-indigo-200'
                          : evt.category === 'Hackathon'
                          ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-200 hover:bg-emerald-200'
                          : 'bg-purple-100/80 text-purple-900 border border-purple-200 hover:bg-purple-200'
                      }`}
                      title={`${evt.title} (${evt.startTime} @ ${evt.venue})`}
                    >
                      <span className="hidden sm:inline font-mono mr-1">{evt.startTime}</span>
                      <span>{evt.title}</span>
                    </div>
                  ))}

                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-slate-400 font-semibold text-center">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chronological List of Upcoming Events */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-heading font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>Detailed Agenda & Scheduled Sessions</span>
        </h3>

        <div className="divide-y divide-slate-100">
          {filteredEvents.map(evt => (
            <div 
              key={evt.id}
              onClick={() => onSelectEvent(evt)}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl px-2.5 transition-colors cursor-pointer"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-12 text-center shrink-0">
                  <div className="text-[11px] uppercase font-bold text-indigo-600">
                    {new Date(evt.startDate).toLocaleDateString([], { month: 'short' })}
                  </div>
                  <div className="text-lg font-extrabold text-slate-800 leading-tight">
                    {new Date(evt.startDate).getDate()}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {evt.category}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {evt.clubName}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors mt-0.5">
                    {evt.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {evt.startTime} - {evt.endTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      {evt.venue}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pl-14 sm:pl-0">
                <div className="text-right text-xs">
                  <span className="text-slate-500">{evt.registeredCount} / {evt.capacity}</span>
                  <span className="block text-[10px] text-emerald-600 font-semibold">
                    {evt.capacity - evt.registeredCount} spots open
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectEvent(evt); }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  View Details &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
