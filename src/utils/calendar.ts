import { UniversityEvent } from '../types.js';

export function generateIcsContent(event: UniversityEvent): string {
  // Format date to ICS format (YYYYMMDDTHHmmss)
  const cleanDate = event.startDate.replace(/-/g, '');
  const cleanStartTime = event.startTime.replace(':', '') + '00';
  const cleanEndDate = event.endDate.replace(/-/g, '');
  const cleanEndTime = event.endTime.replace(':', '') + '00';

  const dtStart = `${cleanDate}T${cleanStartTime}`;
  const dtEnd = `${cleanEndDate}T${cleanEndTime}`;

  const cleanDescription = event.description.replace(/\n/g, '\\n').replace(/,/g, '\\,');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UniVerse University Event Management//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@campus.edu`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${event.venue}`,
    `ORGANIZER;CN=${event.clubName}:mailto:${event.contactEmail}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export function downloadIcsFile(event: UniversityEvent) {
  const ics = generateIcsContent(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
