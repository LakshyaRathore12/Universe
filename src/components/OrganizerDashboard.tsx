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
  Download,
  ShieldCheck,
  HardDrive,
  ExternalLink,
  Award,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Club, Registration, UniversityEvent, User } from '../types.js';
import { exportCandidateRosterToDrive } from '../lib/googleDrive.js';
import { EventAttendanceModal } from './EventAttendanceModal.js';
import { CompletedEventsAttendanceChart } from './CompletedEventsAttendanceChart.js';
import { isMasterUser, getAllowedClubsForUser, isUserAssignedLeaderForClub } from '../lib/permissions.js';

interface OrganizerDashboardProps {
  events: UniversityEvent[];
  currentUser: User | null;
  clubs?: Club[];
  onOpenScheduleEvent: () => void;
  onEditEvent: (event: UniversityEvent) => void;
  onOpenBroadcast: (event: UniversityEvent) => void;
  onCancelEvent: (eventId: string) => void;
  onOpenMailbox: () => void;
  onNavigateToAdmin?: () => void;
  onManageClubAdmins?: (club: Club) => void;
  accessToken?: string | null;
  onOpenGoogleDrive?: () => void;
  onRefreshData?: () => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  events,
  currentUser,
  clubs = [],
  onOpenScheduleEvent,
  onEditEvent,
  onOpenBroadcast,
  onCancelEvent,
  onOpenMailbox,
  onNavigateToAdmin,
  onManageClubAdmins,
  accessToken,
  onOpenGoogleDrive,
  onRefreshData
}) => {
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState<UniversityEvent | null>(null);
  const [attendees, setAttendees] = useState<Registration[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [ticketInput, setTicketInput] = useState('');
  const [checkinMsg, setCheckinMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [exportingDrive, setExportingDrive] = useState(false);
  const [driveExportSuccessUrl, setDriveExportSuccessUrl] = useState<string | null>(null);

  const handleToggleEventStatus = async (event: UniversityEvent) => {
    const newStatus = event.status === 'completed' ? 'upcoming' : 'completed';
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        event.status = newStatus;
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error('Failed to toggle event status', err);
    }
  };

  // Determine attendance marking & download clearance
  // Faculty, Master Control have global authority.
  // Club Leaders hold permissions strictly for the club where faculty assigned their email as President or Vice President.
  const isMaster = isMasterUser(currentUser);
  const isDean = currentUser?.role === 'admin' || isMaster;
  const isFaculty = currentUser?.role === 'faculty' || isDean;
  const isClubOrganizer = currentUser?.role === 'club_organizer';

  // Allowed clubs where user is President or Vice President
  const allowedClubs = getAllowedClubsForUser(currentUser, clubs);
  const allowedClubIds = new Set(allowedClubs.map(c => c.id));

  // Filter events strictly by user's assigned society:
  // Faculty/Admins see all events. Club leaders only see events of their faculty-assigned club.
  const hostedEvents = (isMaster || isDean || (isFaculty && !currentUser?.clubId))
    ? events
    : events.filter(e => allowedClubIds.has(e.clubId) || (currentUser?.clubId && e.clubId === currentUser.clubId));

  const canManageAttendance = isFaculty || isClubOrganizer;

  const totalSeatsOffered = hostedEvents.reduce((acc, e) => acc + e.capacity, 0);
  const totalRegistrations = hostedEvents.reduce((acc, e) => acc + e.registeredCount, 0);

  const handleFetchAttendees = async (event: UniversityEvent) => {
    setSelectedEventForAttendees(event);
    setLoadingAttendees(true);
    setCheckinMsg(null);
    setTicketInput('');
    try {
      const res = await fetch(`/api/registrations?eventId=${event.id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.registrations)) {
        setAttendees(data.registrations);
      } else {
        const fallbackRes = await fetch(`/api/events/${event.id}/attendees`);
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success) {
          setAttendees(fallbackData.attendees);
        }
      }
    } catch {
      console.error('Failed to load attendees');
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleManualCheckIn = async (ticketCodeToUse?: string) => {
    if (!selectedEventForAttendees) return;
    if (!canManageAttendance) {
      setCheckinMsg({ 
        text: 'Access Denied: Only University Administrators and Faculty members hold clearance to mark attendance.', 
        success: false 
      });
      return;
    }
    const code = ticketCodeToUse || ticketInput;
    if (!code.trim()) return;

    try {
      const res = await fetch(`/api/events/${selectedEventForAttendees.id}/checkin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify({ 
          ticketCode: code.trim(),
          userRole: currentUser?.role,
          userId: currentUser?.id
        })
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

  const handleExportAttendeesToDrive = async () => {
    if (!selectedEventForAttendees) return;
    if (!accessToken) {
      if (onOpenGoogleDrive) onOpenGoogleDrive();
      return;
    }
    if (attendees.length === 0) {
      alert('No attendees registered for this event yet.');
      return;
    }

    setExportingDrive(true);
    setDriveExportSuccessUrl(null);

    try {
      const headers = ['Candidate Name', 'Enrollment No', 'Email', 'Phone', 'Department', 'Ticket Code', 'Status', 'Registered At'];
      const rows = attendees.map(a => [
        `"${a.userName || ''}"`,
        `"${a.studentId || ''}"`,
        `"${a.userEmail || ''}"`,
        `"${a.phone || ''}"`,
        `"${a.department || ''}"`,
        `"${a.ticketCode || ''}"`,
        `"${a.status || ''}"`,
        `"${new Date(a.registeredAt).toLocaleString()}"`
      ]);
      const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const res = await exportCandidateRosterToDrive(
        accessToken,
        selectedEventForAttendees.title,
        selectedEventForAttendees.clubName,
        csv
      );

      if (res.success && res.file?.webViewLink) {
        setDriveExportSuccessUrl(res.file.webViewLink);
      } else {
        alert(res.message || 'Could not export attendees to Google Drive');
      }
    } catch (err: any) {
      alert(err.message || 'Error exporting to Google Drive');
    } finally {
      setExportingDrive(false);
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

          <div className="flex flex-wrap items-center gap-2">
            {onManageClubAdmins && (
              (() => {
                const myClub = allowedClubs.length > 0 
                  ? allowedClubs[0] 
                  : (clubs.find(c => c.id === currentUser?.clubId) || clubs[0]);
                if (!myClub) return null;
                return (
                  <button
                    id="btn-organizer-manage-admins"
                    onClick={() => onManageClubAdmins(myClub)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                    title="View and edit club administrators for your society"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Club Admins ({myClub.admins?.length || 1})</span>
                  </button>
                );
              })()
            )}

            {onNavigateToAdmin && (
              <button
                id="btn-nav-to-admin-roster"
                onClick={onNavigateToAdmin}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
              >
                <Users className="w-4 h-4" />
                <span>Admin Candidates Page</span>
              </button>
            )}

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

            {onOpenGoogleDrive && (
              <button
                id="btn-organizer-drive"
                onClick={onOpenGoogleDrive}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
                title="Browse campus slides, docs, and passes on Google Drive"
              >
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <span>Google Drive</span>
                {accessToken && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
              </button>
            )}
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

      {/* Completed Events Attendance Visualization (Recharts Bar Chart) */}
      <CompletedEventsAttendanceChart
        events={hostedEvents}
        currentUser={currentUser}
        clubs={clubs}
        onSelectEventForAttendance={(evt) => setSelectedEventForAttendees(evt)}
        onRefreshData={onRefreshData}
      />

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

        {/* Mobile View: Responsive Event Cards (Zero sideways scroll) */}
        <div className="md:hidden divide-y divide-slate-100">
          {hostedEvents.map((evt, eIdx) => (
            <div key={evt.id ? `mob-${evt.id}-${eIdx}` : `mob-evt-${eIdx}`} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                      {evt.category}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {evt.clubName}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 mt-1 line-clamp-2">
                    {evt.title}
                  </h3>
                </div>

                <div>
                  {evt.status === 'completed' ? (
                    <button
                      onClick={() => handleToggleEventStatus(evt)}
                      title="Click to revert status to upcoming"
                      className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Done</span>
                    </button>
                  ) : evt.status === 'cancelled' ? (
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700">
                      Cancelled
                    </span>
                  ) : (
                    <button
                      onClick={() => handleToggleEventStatus(evt)}
                      title="Click to mark event as completed"
                      className="px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Clock className="w-3 h-3 text-indigo-500" />
                      <span>Upcoming</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px]">Date & Time</span>
                  <span className="font-medium text-slate-800">{evt.startDate} • {evt.startTime}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Location</span>
                  <span className="font-medium text-slate-800 truncate block">{evt.venue}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-slate-500">Registrations: <strong className="text-slate-800">{evt.registeredCount} / {evt.capacity}</strong></span>
                  <div className="w-28 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full" 
                      style={{ width: `${Math.min(100, (evt.registeredCount / evt.capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons for Mobile */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => setSelectedEventForAttendees(evt)}
                  className="flex-1 py-2 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>Attendance & Certs</span>
                </button>

                <button
                  onClick={() => onOpenBroadcast(evt)}
                  className="py-2 px-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Broadcast</span>
                </button>

                <button
                  onClick={() => onEditEvent(evt)}
                  className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Edit Event"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onCancelEvent(evt.id)}
                  className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Cancel Event"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop / Tablet View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Event Details</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date & Venue</th>
                <th className="px-5 py-3.5">Registrations</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hostedEvents.map((evt, eIdx) => (
                <tr key={evt.id ? `${evt.id}-${eIdx}` : `evt-${eIdx}`} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900 text-sm">{evt.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{evt.clubName}</span>
                      {evt.facultyCoordinator && (
                        <span className="text-amber-900 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                          <span>Coord: {evt.facultyCoordinator}</span>
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700">
                      {evt.category}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {evt.status === 'completed' ? (
                      <button
                        onClick={() => handleToggleEventStatus(evt)}
                        title="Click to revert status to upcoming"
                        className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Completed</span>
                      </button>
                    ) : evt.status === 'cancelled' ? (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700">
                        Cancelled
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggleEventStatus(evt)}
                        title="Click to mark event as completed"
                        className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Clock className="w-3 h-3 text-indigo-500" />
                        <span>Upcoming</span>
                      </button>
                    )}
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
                        onClick={() => setSelectedEventForAttendees(evt)}
                        title="Attendance & Participation Certificates"
                        className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>Attendance & Certificates</span>
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

      {/* Dedicated Event Attendance & Certificate Management Modal */}
      {selectedEventForAttendees && (
        <EventAttendanceModal
          initialEvent={selectedEventForAttendees}
          allEvents={hostedEvents}
          onClose={() => setSelectedEventForAttendees(null)}
          currentUser={currentUser}
          clubs={clubs}
          accessToken={accessToken}
          onOpenGoogleDrive={onOpenGoogleDrive}
        />
      )}

    </div>
  );
};
