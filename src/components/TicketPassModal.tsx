import React, { useState } from 'react';
import { X, QrCode, Download, Mail, CheckCircle2, Calendar, MapPin, Printer, HardDrive, ExternalLink, Bell, Clock } from 'lucide-react';
import { Registration, UniversityEvent } from '../types.js';
import { downloadIcsFile } from '../utils/calendar.js';
import { saveTicketPassToDrive } from '../lib/googleDrive.js';

interface TicketPassModalProps {
  registration: Registration | null;
  event: UniversityEvent | null;
  onClose: () => void;
  onOpenMailbox: () => void;
  accessToken?: string | null;
  onOpenGoogleDrive?: () => void;
  onReminderTriggered?: () => void;
}

export const TicketPassModal: React.FC<TicketPassModalProps> = ({
  registration,
  event,
  onClose,
  onOpenMailbox,
  accessToken,
  onOpenGoogleDrive,
  onReminderTriggered
}) => {
  const [savingToDrive, setSavingToDrive] = useState(false);
  const [driveSavedLink, setDriveSavedLink] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [triggeringReminder, setTriggeringReminder] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);

  if (!registration || !event) return null;

  const handleTriggerReminderNow = async () => {
    setTriggeringReminder(true);
    setReminderMessage(null);
    try {
      const res = await fetch(`/api/reminders/trigger-now/${registration.id}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setReminderMessage('⏰ 1-Hour reminder dispatched! Check your Campus Mailbox & Notifications.');
        if (onReminderTriggered) onReminderTriggered();
      } else {
        setReminderMessage(data.message || 'Failed to dispatch reminder');
      }
    } catch (err: any) {
      setReminderMessage('Error contacting reminder service');
    } finally {
      setTriggeringReminder(false);
    }
  };

  const handleSaveToGoogleDrive = async () => {
    if (!accessToken) {
      if (onOpenGoogleDrive) onOpenGoogleDrive();
      return;
    }

    setSavingToDrive(true);
    setDriveError(null);
    try {
      const res = await saveTicketPassToDrive(
        accessToken,
        event.title,
        registration.ticketCode,
        registration.userName,
        {
          venue: event.venue,
          dateTime: event.startDate,
          studentId: registration.studentId,
          department: registration.department
        }
      );

      if (res.success && res.file?.webViewLink) {
        setDriveSavedLink(res.file.webViewLink);
      } else {
        setDriveError(res.message || 'Could not save pass to Google Drive');
      }
    } catch (err: any) {
      setDriveError(err.message || 'Failed to save to Drive');
    } finally {
      setSavingToDrive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl" />
          
          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mb-2">
            Verified University Pass
          </span>
          <h2 className="font-heading font-extrabold text-xl text-white">UniVerse Entry Pass</h2>
          <p className="text-xs text-slate-300 mt-0.5">{event.clubName}</p>
        </div>

        {/* Ticket Body */}
        <div className="p-6">
          
          {/* Event info */}
          <div className="text-center pb-5 border-b border-dashed border-slate-200">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase tracking-wider">
              {event.category}
            </span>
            <h3 className="font-heading font-bold text-lg text-slate-900 mt-2 line-clamp-2">
              {event.title}
            </h3>
            
            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>{event.startDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span className="truncate max-w-[140px]">{event.venue}</span>
              </div>
            </div>
          </div>

          {/* Attendee Details & QR Section */}
          <div className="py-5">
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Attendee Name</span>
                <span className="font-bold text-slate-800">{registration.userName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Student / Reg ID</span>
                <span className="font-bold text-slate-800">{registration.studentId || 'STUDENT-UNI'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Department</span>
                <span className="font-semibold text-slate-700 truncate block">{registration.department || 'Undergraduate'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Pass Status</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{registration.status === 'checked_in' ? 'Checked-In' : 'Confirmed'}</span>
                </span>
              </div>
            </div>

            {/* Simulated High-Res QR Ticket Code */}
            <div className="bg-slate-50 border-2 border-dashed border-indigo-200 rounded-2xl p-4 text-center">
              <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl shadow-inner flex items-center justify-center border border-slate-200">
                {/* SVG QR Code Simulation */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                  <rect width="100" height="100" fill="white" />
                  {/* Position squares */}
                  <rect x="10" y="10" width="22" height="22" fill="#0f172a" />
                  <rect x="14" y="14" width="14" height="14" fill="white" />
                  <rect x="17" y="17" width="8" height="8" fill="#0f172a" />

                  <rect x="68" y="10" width="22" height="22" fill="#0f172a" />
                  <rect x="72" y="14" width="14" height="14" fill="white" />
                  <rect x="75" y="17" width="8" height="8" fill="#0f172a" />

                  <rect x="10" y="68" width="22" height="22" fill="#0f172a" />
                  <rect x="14" y="72" width="14" height="14" fill="white" />
                  <rect x="17" y="75" width="8" height="8" fill="#0f172a" />

                  {/* Pattern dots */}
                  <rect x="38" y="15" width="6" height="6" fill="#0f172a" />
                  <rect x="48" y="15" width="6" height="6" fill="#0f172a" />
                  <rect x="38" y="25" width="6" height="6" fill="#0f172a" />
                  <rect x="52" y="35" width="6" height="6" fill="#0f172a" />
                  <rect x="25" y="45" width="6" height="6" fill="#0f172a" />
                  <rect x="40" y="45" width="6" height="6" fill="#0f172a" />
                  <rect x="60" y="45" width="6" height="6" fill="#0f172a" />
                  <rect x="75" y="45" width="6" height="6" fill="#0f172a" />
                  <rect x="45" y="60" width="6" height="6" fill="#0f172a" />
                  <rect x="60" y="60" width="6" height="6" fill="#0f172a" />
                  <rect x="40" y="75" width="6" height="6" fill="#0f172a" />
                  <rect x="55" y="75" width="6" height="6" fill="#0f172a" />
                  <rect x="75" y="75" width="6" height="6" fill="#0f172a" />
                </svg>
              </div>

              <div className="font-mono text-sm font-bold text-slate-800 tracking-wider mt-2">
                {registration.ticketCode}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Scan or present at entrance desk for verification
              </p>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              id="btn-save-pass-drive"
              onClick={handleSaveToGoogleDrive}
              disabled={savingToDrive}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-60"
            >
              <HardDrive className={`w-4 h-4 ${savingToDrive ? 'animate-spin' : ''}`} />
              <span>{savingToDrive ? 'Saving Pass to Google Drive...' : 'Save Pass to Google Drive'}</span>
            </button>

            {driveSavedLink && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">Saved to your Google Drive!</span>
                </div>
                <a
                  href={driveSavedLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shrink-0"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {driveError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700">
                {driveError}
              </div>
            )}

            <button
              onClick={() => downloadIcsFile(event)}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Save Event to Calendar (.ics)</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenMailbox();
              }}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center gap-2 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Open Delivered Ticket in Campus Mailbox</span>
            </button>

            {/* 1-Hour Push & Email Reminder Control */}
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-purple-900">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>1-Hour Event Reminder System</span>
                </div>
                {registration.reminderSent ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    ✅ Sent
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">
                    ⏰ Scheduled
                  </span>
                )}
              </div>

              <p className="text-[11px] text-purple-700 mb-2 leading-relaxed">
                {registration.reminderSent
                  ? `1-hour pre-event reminder was sent via Email & In-App Notification.`
                  : `Automated trigger fires 1 hour before start time (${event.startTime}). You can also test-dispatch it now.`}
              </p>

              <button
                onClick={handleTriggerReminderNow}
                disabled={triggeringReminder}
                className="w-full py-2 px-3 text-[11px] font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-60"
              >
                <Bell className={`w-3.5 h-3.5 ${triggeringReminder ? 'animate-bounce' : ''}`} />
                <span>{triggeringReminder ? 'Triggering 1-Hour Reminder...' : registration.reminderSent ? 'Send Another 1-Hour Reminder' : 'Trigger 1-Hour Reminder Now'}</span>
              </button>

              {reminderMessage && (
                <div className="mt-2 p-2 rounded-lg bg-white border border-purple-200 text-[11px] font-medium text-purple-900">
                  {reminderMessage}
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="bg-slate-50 p-3 text-center border-t border-slate-100 text-[11px] text-slate-500">
          Dean of Student Affairs • University Event Verification System
        </div>

      </div>
    </div>
  );
};
