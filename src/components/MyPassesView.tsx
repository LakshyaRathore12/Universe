import React, { useState, useEffect } from 'react';
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
  Compass,
  Bell,
  Zap,
  RefreshCw,
  AlertCircle,
  Award
} from 'lucide-react';
import { ParticipationCertificate, Registration, UniversityEvent, User } from '../types.js';
import { downloadIcsFile } from '../utils/calendar.js';
import { CertificateModal } from './CertificateModal.js';

interface MyPassesViewProps {
  registrations: (Registration & { event?: UniversityEvent; certificate?: ParticipationCertificate | null })[];
  onViewTicket: (reg: Registration, event: UniversityEvent) => void;
  onOpenMailbox: () => void;
  onCancelRegistration: (eventId: string) => void;
  onExploreEvents: () => void;
  onRefreshData?: () => void;
  currentUser?: User | null;
  accessToken?: string | null;
  onOpenGoogleDrive?: () => void;
}

export const MyPassesView: React.FC<MyPassesViewProps> = ({
  registrations,
  onViewTicket,
  onOpenMailbox,
  onCancelRegistration,
  onExploreEvents,
  onRefreshData,
  currentUser,
  accessToken,
  onOpenGoogleDrive
}) => {
  const activePasses = registrations.filter(r => r.status !== 'cancelled');
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [checkingReminders, setCheckingReminders] = useState(false);
  const [scanningStatusMessage, setScanningStatusMessage] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [viewCertificate, setViewCertificate] = useState<ParticipationCertificate | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const handleRequestPushPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setScanningStatusMessage('Web Push notifications are not supported in this iframe/browser.');
      return;
    }
    try {
      const res = await Notification.requestPermission();
      setPushPermission(res);
      if (res === 'granted') {
        new Notification('⏰ UniVerse Push Reminders Active', {
          body: 'You will receive native desktop notifications 1 hour before registered events start!',
          icon: '/favicon.ico'
        });
        setScanningStatusMessage('✅ Browser push notifications successfully enabled!');
      } else {
        setScanningStatusMessage('Push notifications permission was not granted.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setScanningStatusMessage(null), 5000);
    }
  };

  const handleCheckReminders = async () => {
    setCheckingReminders(true);
    try {
      const res = await fetch('/api/reminders/check', { method: 'POST' });
      const data = await res.json();
      setScanningStatusMessage(data.message || 'Scanned reminder status');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setScanningStatusMessage('Error checking reminders');
    } finally {
      setCheckingReminders(false);
      setTimeout(() => setScanningStatusMessage(null), 5000);
    }
  };

  const handleTriggerReminderNow = async (regId: string) => {
    setActiveActionId(regId);
    try {
      const res = await fetch(`/api/reminders/trigger-now/${regId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setScanningStatusMessage(data.message);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActiveActionId(null);
      setTimeout(() => setScanningStatusMessage(null), 5000);
    }
  };

  const handleSimulate1Hour = async (eventId: string) => {
    setActiveActionId(eventId);
    try {
      const res = await fetch(`/api/reminders/simulate-1hour/${eventId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setScanningStatusMessage(data.message);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActiveActionId(null);
      setTimeout(() => setScanningStatusMessage(null), 5000);
    }
  };

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
              Digital entrance passes with automated 1-hour email & push reminder verification
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

      {/* 1-Hour Reminder & Web Push Notification Hub Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-sm border border-purple-800/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" />
                1-Hour Automated Reminder Engine
              </span>
              {pushPermission === 'granted' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Browser Push Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                  Push Alerts Pending
                </span>
              )}
            </div>
            <h3 className="font-heading font-bold text-base text-white">
              Automated Pre-Event Notifications
            </h3>
            <p className="text-xs text-purple-200 leading-relaxed">
              The UniVerse background engine automatically monitors registered events and triggers an alert <strong>exactly 1 hour before scheduled start</strong> with venue details and quick entrance verification checklists.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {pushPermission !== 'granted' && (
              <button
                id="btn-enable-push"
                onClick={handleRequestPushPermission}
                className="px-3.5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Browser Push Alerts</span>
              </button>
            )}

            <button
              id="btn-scan-reminders"
              onClick={handleCheckReminders}
              disabled={checkingReminders}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingReminders ? 'animate-spin' : ''}`} />
              <span>{checkingReminders ? 'Scanning Engine...' : 'Scan & Run Reminder Check'}</span>
            </button>
          </div>
        </div>

        {scanningStatusMessage && (
          <div className="mt-3.5 pt-3 border-t border-purple-800/50 flex items-center gap-2 text-xs text-purple-100 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-purple-300 shrink-0" />
            <span>{scanningStatusMessage}</span>
          </div>
        )}
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
          {activePasses.map((reg, idx) => {
            const evt = reg.event;
            if (!evt) return null;

            const isActionBusy = activeActionId === reg.id || activeActionId === evt.id;

            return (
              <div 
                key={reg.id ? `${reg.id}-${idx}` : `pass-${idx}`}
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
                      <span className="text-emerald-700 text-[10px]">Dispatched to {reg.userEmail}</span>
                    </div>

                    {/* Attendance Status Pill */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-slate-500 font-medium">Attendance Status:</span>
                      {reg.attendanceStatus === 'present' || reg.status === 'checked_in' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Present (Verified)</span>
                        </span>
                      ) : reg.attendanceStatus === 'absent' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                          Marked Absent
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium text-[11px]">
                          Pending Verification
                        </span>
                      )}
                    </div>

                    {/* Participation Certificate Card if issued */}
                    {(reg.certificate || reg.certificateId) ? (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-extrabold flex items-center gap-1.5 text-amber-950">
                              <span>Official Participation Certificate</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900 border border-amber-400">
                                {reg.certificate?.id || reg.certificateId}
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-800">
                              Earned for verified attendance in {evt.title}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            if (reg.certificate) {
                              setViewCertificate(reg.certificate);
                            } else if (reg.certificateId) {
                              try {
                                const res = await fetch(`/api/certificates/${reg.certificateId}`);
                                const d = await res.json();
                                if (d.success) setViewCertificate(d.certificate);
                                else alert('Certificate details not found.');
                              } catch {
                                alert('Failed to fetch certificate.');
                              }
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/30 transition-all cursor-pointer active:scale-95"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>View Certificate</span>
                        </button>
                      </div>
                    ) : (reg.attendanceStatus === 'present' || reg.status === 'checked_in') ? (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
                        <Award className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Attendance verified! Event coordinator will issue your participation certificate shortly.</span>
                      </div>
                    ) : null}

                    {/* 1-Hour Pre-Event Reminder Box */}
                    <div className={`p-3 rounded-xl border text-xs transition-all ${
                      reg.reminderSent 
                        ? 'bg-purple-50/70 border-purple-200 text-purple-900' 
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Clock className={`w-3.5 h-3.5 ${reg.reminderSent ? 'text-purple-600' : 'text-slate-500'}`} />
                          <span>1-Hour Reminder Status</span>
                        </div>
                        {reg.reminderSent ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Dispatched
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                            Scheduled
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 mb-2.5">
                        {reg.reminderSent 
                          ? `1-hour alert sent via Email and Push Notification.` 
                          : `Triggers automatically 1 hour before ${evt.startTime}. You can also test-fire it now.`}
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTriggerReminderNow(reg.id)}
                          disabled={isActionBusy}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors shadow-xs disabled:opacity-60"
                        >
                          <Bell className="w-3 h-3" />
                          <span>{reg.reminderSent ? 'Re-send 1-Hour Alert' : 'Trigger 1-Hour Alert Now'}</span>
                        </button>

                        <button
                          onClick={() => handleSimulate1Hour(evt.id)}
                          disabled={isActionBusy}
                          title="Schedule this event start time to 55 minutes from right now"
                          className="py-1.5 px-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors disabled:opacity-60"
                        >
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>Set to 55m Away</span>
                        </button>
                      </div>
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

      {/* Participation Certificate Viewer Modal */}
      {viewCertificate && (
        <CertificateModal
          certificate={viewCertificate}
          onClose={() => setViewCertificate(null)}
          currentUser={currentUser}
          accessToken={accessToken}
          onOpenGoogleDrive={onOpenGoogleDrive}
        />
      )}

    </div>
  );
};

