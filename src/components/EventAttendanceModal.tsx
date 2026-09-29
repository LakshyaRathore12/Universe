import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Search,
  Check,
  QrCode,
  Download,
  HardDrive,
  Mail,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Calendar,
  MapPin,
  RefreshCw,
  AlertCircle,
  GraduationCap,
  Send,
  FileSpreadsheet,
  Lock,
  ShieldAlert,
  LayoutGrid,
  List,
  PhoneCall
} from 'lucide-react';
import { Club, EventAttendanceStats, ParticipationCertificate, Registration, UniversityEvent, User } from '../types.js';
import { exportCandidateRosterToDrive } from '../lib/googleDrive.js';
import { CertificateModal } from './CertificateModal.js';
import { isMasterUser, isUserAssignedLeaderForClub } from '../lib/permissions.js';

interface EventAttendanceModalProps {
  initialEvent: UniversityEvent;
  allEvents: UniversityEvent[];
  onClose: () => void;
  currentUser: User | null;
  clubs?: Club[];
  accessToken?: string | null;
  onOpenGoogleDrive?: () => void;
  onRefreshEvents?: () => void;
}

export const EventAttendanceModal: React.FC<EventAttendanceModalProps> = ({
  initialEvent,
  allEvents,
  onClose,
  currentUser,
  clubs = [],
  accessToken,
  onOpenGoogleDrive,
  onRefreshEvents
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEvent.id);
  const currentEvent = allEvents.find(e => e.id === selectedEventId) || initialEvent;

  const [attendees, setAttendees] = useState<(Registration & { certificate?: ParticipationCertificate | null })[]>([]);
  const [stats, setStats] = useState<EventAttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Action Input
  const [quickInput, setQuickInput] = useState('');
  const [quickActionMsg, setQuickActionMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'unmarked' | 'with_certificate'>('all');

  // Certificate Generation State
  const [generatingCerts, setGeneratingCerts] = useState(false);
  const [certSuccessMsg, setCertSuccessMsg] = useState<string | null>(null);
  const [activeCertificate, setActiveCertificate] = useState<ParticipationCertificate | null>(null);

  // Mail Attendance Certificates State
  const [mailingCertificates, setMailingCertificates] = useState(false);
  const [mailSuccessMsg, setMailSuccessMsg] = useState<string | null>(null);
  const [showMailConfirmModal, setShowMailConfirmModal] = useState(false);

  // Google Drive Export
  const [exportingDrive, setExportingDrive] = useState(false);
  const [driveExportSuccessUrl, setDriveExportSuccessUrl] = useState<string | null>(null);

  // View Mode: Cards View (responsive, no horizontal scroll needed) or Table View
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Security & Role Clearance:
  // "theirs attendance can only be done or taken by faculty and leader of specific club only"
  const isMaster = isMasterUser(currentUser);
  const isFaculty = isMaster || currentUser?.role === 'admin' || currentUser?.role === 'faculty' || currentUser?.role === 'master_admin';
  const currentClub = clubs.find(c => c.id === currentEvent.clubId);
  const isClubLeader = isMaster || (currentClub
    ? isUserAssignedLeaderForClub(currentUser, currentClub)
    : (currentUser?.role === 'club_organizer' && currentUser.clubId === currentEvent.clubId)
  );
  const canManageAttendance = isFaculty || isClubLeader;

  // Fetch Attendance Data for the selected event
  const fetchAttendanceData = async (eventId: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/events/${eventId}/attendance`);
      const data = await res.json();
      if (data.success) {
        setAttendees(data.registrations || []);
        setStats(data.stats);
      } else {
        setErrorMsg(data.message || 'Could not fetch event attendance');
      }
    } catch {
      setErrorMsg('Failed to communicate with attendance server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData(selectedEventId);
  }, [selectedEventId]);

  // Handle Individual Attendance Toggle
  const handleUpdateStatus = async (
    registrationId: string, 
    newStatus: 'present' | 'absent' | 'unmarked'
  ) => {
    if (!canManageAttendance) {
      alert('Access Denied: Under MITS regulations, attendance can only be taken by Faculty Coordinators or the Leader of this specific club.');
      return;
    }

    try {
      const res = await fetch(`/api/events/${selectedEventId}/attendance/${registrationId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify({
          attendanceStatus: newStatus,
          userRole: currentUser?.role,
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          eventId: selectedEventId,
          markedBy: currentUser ? `${currentUser.name} (${currentUser.role === 'faculty' ? 'Faculty Advisor' : 'Club Leader'})` : 'Faculty / Academic Officer'
        })
      });
      const data = await res.json();
      if (data.success) {
        const certRes = data.certificateResult;
        setAttendees(prev => prev.map(a => {
          if (a.id === registrationId) {
            return {
              ...a,
              attendanceStatus: newStatus,
              status: newStatus === 'present' ? 'checked_in' : 'confirmed',
              checkedInAt: newStatus === 'present' ? (a.checkedInAt || new Date().toISOString()) : undefined,
              attendanceMarkedAt: newStatus !== 'unmarked' ? new Date().toISOString() : undefined,
              certificate: certRes?.certificate || a.certificate,
              certificateId: certRes?.certificate?.id || a.certificateId,
              certificateIssuedAt: certRes?.certificate?.issuedAt || a.certificateIssuedAt,
              certificateEmailSent: certRes?.success ? true : a.certificateEmailSent,
              certificateUrl: certRes?.certificateUrl || a.certificateUrl
            };
          }
          return a;
        }));
        if (data.stats) setStats(data.stats);
        if (onRefreshEvents) onRefreshEvents();

        if (newStatus === 'present' && certRes?.success) {
          setCertSuccessMsg(`🎓 Marked PRESENT! Participation certificate (${certRes.certificate?.id}) has been generated and emailed to the student with a digital certificate link.`);
          setTimeout(() => setCertSuccessMsg(null), 7000);
        }
      } else {
        alert(data.message || 'Failed to update attendance status');
      }
    } catch {
      alert('Error connecting to server.');
    }
  };

  // Handle Quick Mark (Search ticket / roll / email)
  const handleQuickMark = async (targetStatus: 'present' | 'absent') => {
    if (!canManageAttendance) {
      setQuickActionMsg({ text: 'Access Denied: Only University Administrators and Faculty members can mark attendance.', success: false });
      return;
    }
    if (!quickInput.trim()) return;

    try {
      const res = await fetch(`/api/events/${selectedEventId}/attendance/quick-mark`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify({
          query: quickInput.trim(),
          status: targetStatus,
          userRole: currentUser?.role,
          userEmail: currentUser?.email,
          userId: currentUser?.id,
          markedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Door Scanner Desk'
        })
      });
      const data = await res.json();
      if (data.success) {
        setQuickActionMsg({ text: data.message, success: true });
        setQuickInput('');
        fetchAttendanceData(selectedEventId);
        if (onRefreshEvents) onRefreshEvents();
      } else {
        setQuickActionMsg({ text: data.message || 'Attendee not found for this event.', success: false });
      }
    } catch {
      setQuickActionMsg({ text: 'Error connecting to check-in service.', success: false });
    }
  };

  // Bulk Attendance Update
  const handleBulkAttendance = async (targetStatus: 'present' | 'absent' | 'unmarked') => {
    if (!canManageAttendance) {
      alert('Access Denied: Only University Administrators and Faculty members are authorized to mark bulk attendance.');
      return;
    }

    const confirmMsg = targetStatus === 'present'
      ? `Mark all candidates as PRESENT for "${currentEvent.title}"?`
      : targetStatus === 'absent'
      ? `Mark all candidates as ABSENT for "${currentEvent.title}"?`
      : `Reset attendance for all candidates to UNMARKED?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/events/${selectedEventId}/attendance/bulk`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify({
          status: targetStatus,
          userRole: currentUser?.role,
          userEmail: currentUser?.email,
          userId: currentUser?.id,
          markedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Bulk Attendance Manager'
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchAttendanceData(selectedEventId);
        if (onRefreshEvents) onRefreshEvents();
      } else {
        alert(data.message || 'Bulk attendance failed.');
      }
    } catch {
      alert('Network error while applying bulk attendance.');
    }
  };

  // Generate Participation Certificates for Present Candidates
  const handleGenerateCertificates = async (specificRegId?: string) => {
    if (!canManageAttendance) {
      alert('Access Denied: Only University Administrators and Faculty members are authorized to issue certificates based on attendance.');
      return;
    }

    setGeneratingCerts(true);
    setCertSuccessMsg(null);

    const bodyData: any = {
      sendEmail: true,
      userRole: currentUser?.role,
      userId: currentUser?.id,
      issuedBy: currentUser ? `${currentUser.name} & Faculty Council` : 'University Central Event Committee'
    };

    if (specificRegId) {
      bodyData.registrationIds = [specificRegId];
    }

    try {
      const res = await fetch(`/api/events/${selectedEventId}/certificates/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify({ ...bodyData, userEmail: currentUser?.email, userRole: currentUser?.role, userId: currentUser?.id })
      });
      const data = await res.json();

      if (data.success) {
        setCertSuccessMsg(`🎓 Success! ${data.message}`);
        // Refresh local attendee roster to display new certificates
        fetchAttendanceData(selectedEventId);
        if (onRefreshEvents) onRefreshEvents();
        // If single certificate generated, automatically open preview
        if (specificRegId && data.certificates && data.certificates.length > 0) {
          setActiveCertificate(data.certificates[0]);
        }
      } else {
        alert(data.message || 'Failed to generate certificates.');
      }
    } catch {
      alert('Error communicating with certificate generation engine.');
    } finally {
      setGeneratingCerts(false);
    }
  };

  // Mail Participation Certificates to All Present Candidates
  const handleMailAttendanceCertificates = async () => {
    if (!canManageAttendance) {
      alert('Access Denied: Only University Administrators and Faculty members are authorized to dispatch certificates based on attendance.');
      return;
    }

    const presentCandidates = attendees.filter(a => a.attendanceStatus === 'present' || a.status === 'checked_in');
    if (presentCandidates.length === 0) {
      alert('No attendees are marked as "Present". Please mark attendance for students before mailing certificates.');
      return;
    }

    setMailingCertificates(true);
    setMailSuccessMsg(null);

    try {
      const res = await fetch(`/api/events/${selectedEventId}/certificates/mail-attendance`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify({
          userRole: currentUser?.role,
          userEmail: currentUser?.email,
          userId: currentUser?.id,
          issuedBy: currentEvent.facultyCoordinator 
            ? `${currentEvent.facultyCoordinator} & ${currentEvent.clubName}`
            : currentUser ? `${currentUser.name} (${currentUser.role})` : 'University Academic Council'
        })
      });
      const data = await res.json();

      if (data.success) {
        setMailSuccessMsg(`✉️ ${data.message}`);
        fetchAttendanceData(selectedEventId);
        if (onRefreshEvents) onRefreshEvents();
        setTimeout(() => setMailSuccessMsg(null), 9000);
      } else {
        alert(data.message || 'Failed to email certificates.');
      }
    } catch {
      alert('Error communicating with certificate delivery server.');
    } finally {
      setMailingCertificates(false);
      setShowMailConfirmModal(false);
    }
  };

  // Download Comprehensive Official Attendance Report (Formatted for Faculty, Club Organizers, Admin)
  const handleDownloadAttendanceReport = () => {
    if (!canManageAttendance) {
      alert('Access Denied: Only University Administrators and Faculty members are authorized to download event attendance records.');
      return;
    }

    if (attendees.length === 0) {
      alert('No attendees registered for this event yet.');
      return;
    }

    const presentNum = attendees.filter(a => (a.attendanceStatus === 'present' || a.status === 'checked_in')).length;
    const absentNum = attendees.filter(a => a.attendanceStatus === 'absent').length;
    const unmarkedNum = attendees.length - presentNum - absentNum;
    const rate = attendees.length > 0 ? Math.round((presentNum / attendees.length) * 100) : 0;
    const coordinator = currentEvent.facultyCoordinator || 'Prof. Radhika Iyer (Academic Oversight)';
    const generatedOn = new Date().toLocaleString();

    const metadataHeader = [
      `"UNIVERSITY CENTRAL ATTENDANCE & PARTICIPATION REPORT"`,
      `"Institution:","Central University Event & Academic Portal"`,
      `"Event Title:","${currentEvent.title.replace(/"/g, '""')}"`,
      `"Hosting Body / Club:","${currentEvent.clubName.replace(/"/g, '""')}"`,
      `"Faculty Coordinator / Advisor:","${coordinator.replace(/"/g, '""')}"`,
      `"Category:","${currentEvent.category}"`,
      `"Event Date & Time:","${currentEvent.startDate} (${currentEvent.startTime} - ${currentEvent.endTime})"`,
      `"Campus Venue:","${currentEvent.venue.replace(/"/g, '""')}"`,
      `"Report Generated By:","${currentUser ? `${currentUser.name} (${currentUser.role.toUpperCase()})` : 'Administrative Officer'}"`,
      `"Generated Timestamp:","${generatedOn}"`,
      `"--- ATTENDANCE & PARTICIPATION METRICS ---"`,
      `"Total Registered Candidates:","${attendees.length}"`,
      `"Verified Present:","${presentNum}"`,
      `"Marked Absent:","${absentNum}"`,
      `"Unmarked / Pending:","${unmarkedNum}"`,
      `"Official Turnout Rate:","${rate}%"`,
      `"Certificates Dispatched:","${attendees.filter(a => Boolean(a.certificateId || a.certificate)).length}"`,
      `""` // Empty separator
    ];

    const tableHeaders = [
      'Sl. No',
      'Candidate Name',
      'Enrollment / Student ID',
      'Email Address',
      'Phone Number',
      'Department',
      'Academic Year',
      'Ticket Code',
      'Attendance Decision',
      'Check-in Timestamp',
      'Marked By',
      'Certificate ID',
      'Certificate Delivery Status',
      'Registration Timestamp'
    ];

    const dataRows = attendees.map((a, idx) => {
      const isPres = a.attendanceStatus === 'present' || a.status === 'checked_in';
      const isAbs = a.attendanceStatus === 'absent';
      const statusLabel = isPres ? 'PRESENT' : isAbs ? 'ABSENT' : 'UNMARKED';
      const certId = a.certificateId || (a.certificate ? a.certificate.id : 'N/A');
      const certStatus = isPres ? (certId !== 'N/A' ? 'Issued & Emailed' : 'Pending Issuance') : 'Ineligible';

      return [
        `"${idx + 1}"`,
        `"${(a.userName || '').replace(/"/g, '""')}"`,
        `"${a.studentId || ''}"`,
        `"${a.userEmail || ''}"`,
        `"${a.phone || ''}"`,
        `"${(a.department || '').replace(/"/g, '""')}"`,
        `"${a.year || ''}"`,
        `"${a.ticketCode || ''}"`,
        `"${statusLabel}"`,
        `"${a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : 'N/A'}"`,
        `"${(a.attendanceMarkedBy || 'Check-in Desk').replace(/"/g, '""')}"`,
        `"${certId}"`,
        `"${certStatus}"`,
        `"${new Date(a.registeredAt).toLocaleString()}"`
      ];
    });

    const csvContent = '\uFEFF' + [
      ...metadataHeader,
      tableHeaders.join(','),
      ...dataRows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = currentEvent.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    link.setAttribute('download', `Official_Attendance_Report_${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Roster to CSV
  const handleExportCSV = () => {
    if (!canManageAttendance) {
      alert('Access Denied: Only University Administrators and Faculty members are authorized to download event attendance records.');
      return;
    }

    if (attendees.length === 0) {
      alert('No attendees registered for this event yet.');
      return;
    }

    const headers = [
      'Candidate Name', 
      'Enrollment / Student ID', 
      'Email', 
      'Phone', 
      'Department', 
      'Ticket Code', 
      'Attendance Status', 
      'Door Check-In Time',
      'Certificate ID',
      'Registered At'
    ];

    const rows = attendees.map(a => [
      `"${a.userName || ''}"`,
      `"${a.studentId || ''}"`,
      `"${a.userEmail || ''}"`,
      `"${a.phone || ''}"`,
      `"${a.department || ''}"`,
      `"${a.ticketCode || ''}"`,
      `"${(a.attendanceStatus || 'unmarked').toUpperCase()}"`,
      `"${a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : 'N/A'}"`,
      `"${a.certificateId || (a.certificate ? a.certificate.id : 'None')}"`,
      `"${new Date(a.registeredAt).toLocaleString()}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_${currentEvent.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Roster to Google Drive
  const handleExportDrive = async () => {
    if (!accessToken) {
      if (onOpenGoogleDrive) onOpenGoogleDrive();
      return;
    }

    if (attendees.length === 0) {
      alert('No attendees registered for this event.');
      return;
    }

    setExportingDrive(true);
    setDriveExportSuccessUrl(null);

    try {
      const headers = [
        'Candidate Name', 
        'Enrollment / Student ID', 
        'Email', 
        'Phone', 
        'Department', 
        'Ticket Code', 
        'Attendance Status', 
        'Certificate ID'
      ];

      const rows = attendees.map(a => [
        `"${a.userName || ''}"`,
        `"${a.studentId || ''}"`,
        `"${a.userEmail || ''}"`,
        `"${a.phone || ''}"`,
        `"${a.department || ''}"`,
        `"${a.ticketCode || ''}"`,
        `"${(a.attendanceStatus || 'unmarked').toUpperCase()}"`,
        `"${a.certificateId || (a.certificate ? a.certificate.id : 'None')}"`
      ]);

      const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const res = await exportCandidateRosterToDrive(
        accessToken,
        currentEvent.title,
        currentEvent.clubName,
        csv
      );

      if (res.success && res.file?.webViewLink) {
        setDriveExportSuccessUrl(res.file.webViewLink);
      } else {
        alert(res.message || 'Could not export to Google Drive.');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving to Google Drive');
    } finally {
      setExportingDrive(false);
    }
  };

  // Filtering attendees
  const filteredAttendees = attendees.filter(att => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = att.userName?.toLowerCase().includes(q);
      const matchEmail = att.userEmail?.toLowerCase().includes(q);
      const matchStudentId = att.studentId?.toLowerCase().includes(q);
      const matchTicket = att.ticketCode?.toLowerCase().includes(q);
      const matchDept = att.department?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchStudentId && !matchTicket && !matchDept) {
        return false;
      }
    }

    // Status Filter
    const attStatus = att.attendanceStatus || (att.status === 'checked_in' ? 'present' : 'unmarked');
    if (statusFilter === 'present') return attStatus === 'present';
    if (statusFilter === 'absent') return attStatus === 'absent';
    if (statusFilter === 'unmarked') return attStatus === 'unmarked';
    if (statusFilter === 'with_certificate') return Boolean(att.certificateId || att.certificate);

    return true;
  });

  // Calculate uncertified present count
  const presentCount = attendees.filter(a => (a.attendanceStatus === 'present' || a.status === 'checked_in')).length;
  const presentWithoutCertCount = attendees.filter(a => 
    (a.attendanceStatus === 'present' || a.status === 'checked_in') && 
    !a.certificateId && 
    !a.certificate
  ).length;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
        <div className="relative w-full max-w-5xl h-[92vh] max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
          
          {/* Header Banner - Compact & Responsive */}
          <div className="bg-slate-900 dark:bg-slate-950 p-4 sm:p-5 text-white shrink-0 relative overflow-hidden border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" />
                    <span>Attendance & Certificate Desk</span>
                  </span>
                  <span className="text-xs font-semibold text-amber-300">
                    {currentEvent.clubName}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {currentEvent.category}
                  </span>
                </div>

                {/* Event Heading */}
                <h2 className="font-heading font-extrabold text-lg sm:text-xl text-white truncate" title={currentEvent.title}>
                  {currentEvent.title}
                </h2>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{currentEvent.startDate} • {currentEvent.startTime}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span className="truncate max-w-[200px]">{currentEvent.venue}</span>
                  </span>
                  {currentEvent.facultyCoordinator && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                      <GraduationCap className="w-3 h-3 text-amber-400" />
                      <span>Coord: {currentEvent.facultyCoordinator}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Event Switcher Dropdown & Close */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                {allEvents.length > 1 && (
                  <div className="relative">
                    <select
                      value={selectedEventId}
                      onChange={e => setSelectedEventId(e.target.value)}
                      className="appearance-none bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-2.5 py-1.5 pr-7 rounded-xl border border-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {allEvents.map(ev => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title.length > 28 ? `${ev.title.substring(0, 28)}...` : ev.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}

                <button
                  onClick={() => fetchAttendanceData(selectedEventId)}
                  title="Refresh attendance data"
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Single-Row KPI Stats Strip */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 pt-3 border-t border-slate-800/80 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                Registered: <strong className="text-white font-mono">{attendees.length}</strong>
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Present: <strong className="font-mono text-emerald-200">{presentCount}</strong></span>
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-800/50 flex items-center gap-1 font-semibold">
                <XCircle className="w-3 h-3 text-rose-400" />
                <span>Absent: <strong className="font-mono text-rose-200">{attendees.filter(a => a.attendanceStatus === 'absent').length}</strong></span>
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Unmarked: <strong className="font-mono text-slate-200">{attendees.filter(a => (!a.attendanceStatus || a.attendanceStatus === 'unmarked') && a.status !== 'checked_in').length}</strong></span>
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-800/50 font-semibold">
                Turnout: <strong className="font-mono text-amber-200">{attendees.length > 0 ? Math.round((presentCount / attendees.length) * 100) : 0}%</strong>
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 flex items-center gap-1 ml-auto">
                <Award className="w-3 h-3 text-indigo-400" />
                <span>Certificates: <strong className="font-mono text-indigo-200">{attendees.filter(a => Boolean(a.certificateId || a.certificate)).length}</strong></span>
              </span>
            </div>
          </div>

          {/* Quick Scanner & Door Verification Action Bar */}
          <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 shrink-0">
            {/* Clearance Alert if Unauthorized */}
            {!canManageAttendance && (
              <div className="mb-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Clearance Restricted:</strong> Under MITS regulations, attendance for this event can only be marked by Faculty Coordinators or the designated Leader of <strong>{currentEvent.clubName}</strong>.
                </span>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              {/* Quick Search & Instant Mark */}
              <div className="flex-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <QrCode className="w-3.5 h-3.5 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={quickInput}
                      disabled={!canManageAttendance}
                      onChange={e => setQuickInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleQuickMark('present');
                      }}
                      placeholder={canManageAttendance ? "Scan Ticket (TKT-...), Roll No (0901...), or Email..." : "Locked: Attendance reserved for Faculty & Club Leader..."}
                      className={`w-full pl-8.5 pr-3 py-1.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        canManageAttendance 
                          ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white' 
                          : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/40 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <button
                    onClick={() => handleQuickMark('present')}
                    disabled={!canManageAttendance}
                    className={`px-3 py-1.5 rounded-xl text-white font-bold text-xs flex items-center gap-1 transition-all ${
                      canManageAttendance ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 cursor-pointer shadow-xs' : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                    title="Mark Present"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Present</span>
                  </button>

                  <button
                    onClick={() => handleQuickMark('absent')}
                    disabled={!canManageAttendance}
                    className={`px-3 py-1.5 rounded-xl text-white font-bold text-xs flex items-center gap-1 transition-all ${
                      canManageAttendance ? 'bg-rose-600 hover:bg-rose-500 active:scale-95 cursor-pointer shadow-xs' : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                    title="Mark Absent"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Absent</span>
                  </button>
                </div>
              </div>

              {/* Bulk Certificates & Mail Trigger */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-bulk-generate-certificates"
                  onClick={() => handleGenerateCertificates()}
                  disabled={!canManageAttendance || generatingCerts || presentCount === 0}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Generate participation certificates for Present students"
                >
                  <Award className={`w-3.5 h-3.5 text-white ${generatingCerts ? 'animate-spin' : ''}`} />
                  <span>
                    {generatingCerts ? 'Generating...' : `Generate Certs (${presentWithoutCertCount > 0 ? `${presentWithoutCertCount} pending` : 'All issued'})`}
                  </span>
                </button>

                <button
                  id="btn-action-mail-certificates"
                  onClick={() => setShowMailConfirmModal(true)}
                  disabled={!canManageAttendance || mailingCertificates || presentCount === 0}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Email certificates to verified attendees"
                >
                  <Send className={`w-3.5 h-3.5 text-white ${mailingCertificates ? 'animate-bounce' : ''}`} />
                  <span>{mailingCertificates ? 'Mailing...' : `Mail Certs (${presentCount})`}</span>
                </button>
              </div>
            </div>

            {/* Notifications / Feedback Messages */}
            {quickActionMsg && (
              <div className={`mt-2 p-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                quickActionMsg.success ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
              }`}>
                <span>{quickActionMsg.text}</span>
                <button onClick={() => setQuickActionMsg(null)} className="text-xs opacity-75 hover:opacity-100 cursor-pointer">✕</button>
              </div>
            )}

            {mailSuccessMsg && (
              <div className="mt-2 p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  {mailSuccessMsg}
                </span>
                <button onClick={() => setMailSuccessMsg(null)} className="text-xs opacity-75 hover:opacity-100 cursor-pointer">✕</button>
              </div>
            )}

            {certSuccessMsg && (
              <div className="mt-2 p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  {certSuccessMsg}
                </span>
                <button onClick={() => setCertSuccessMsg(null)} className="text-xs opacity-75 hover:opacity-100 cursor-pointer">✕</button>
              </div>
            )}
          </div>

          {/* Table / Card Controls (Search, Filters, View Mode Toggle, Bulk Actions) */}
          <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
            
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All ({attendees.length})
              </button>

              <button
                onClick={() => setStatusFilter('present')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                  statusFilter === 'present' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Present ({presentCount})</span>
              </button>

              <button
                onClick={() => setStatusFilter('absent')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                  statusFilter === 'absent' ? 'bg-rose-600 text-white' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                }`}
              >
                <XCircle className="w-3 h-3" />
                <span>Absent ({attendees.filter(a => a.attendanceStatus === 'absent').length})</span>
              </button>

              <button
                onClick={() => setStatusFilter('unmarked')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  statusFilter === 'unmarked' ? 'bg-slate-700 dark:bg-slate-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Unmarked ({attendees.filter(a => (!a.attendanceStatus || a.attendanceStatus === 'unmarked') && a.status !== 'checked_in').length})
              </button>
            </div>

            {/* Search Input, Bulk Dropdown, & View Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter by name / roll..."
                  className="pl-8 pr-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs w-40 sm:w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                )}
              </div>

              {/* View Switcher: Candidate Cards (No Horizontal Scroll) vs Table */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('cards')}
                  title="Card View: Large attendance buttons, easy vertical scrolling, zero horizontal scrolling"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === 'cards' 
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cards View</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  title="Table View: Full spreadsheet grid"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === 'table' 
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table View</span>
                </button>
              </div>

              {/* Bulk Status Shortcuts */}
              {canManageAttendance && (
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onClick={() => handleBulkAttendance('present')}
                    className="px-2 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold text-[11px] cursor-pointer"
                  >
                    All Present
                  </button>
                  <button
                    onClick={() => handleBulkAttendance('absent')}
                    className="px-2 py-1 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold text-[11px] cursor-pointer"
                  >
                    All Absent
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* MAIN ATTENDEES SCROLLABLE CONTAINER */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 bg-slate-50/70 dark:bg-slate-950/40">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                <span>Loading attendee roster and attendance records...</span>
              </div>
            ) : filteredAttendees.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <div className="font-semibold text-slate-700 dark:text-slate-300">No candidates found matching criteria.</div>
                <div className="text-xs text-slate-400 mt-1">Try clearing filters or search queries.</div>
              </div>
            ) : viewMode === 'cards' ? (
              /* ========================================================================= */
              /* VIEW MODE 1: CANDIDATE CARDS (NO HORIZONTAL SCROLL - EFFORTLESS VERTICAL) */
              /* ========================================================================= */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredAttendees.map(att => {
                  const currentStatus = att.attendanceStatus || (att.status === 'checked_in' ? 'present' : 'unmarked');
                  const isPresent = currentStatus === 'present';
                  const isAbsent = currentStatus === 'absent';
                  const hasCert = Boolean(att.certificateId || att.certificate);

                  return (
                    <div
                      key={att.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                        isPresent
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                          : isAbsent
                          ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/80'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 shadow-xs'
                      }`}
                    >
                      {/* Top Row: Candidate Identity & Pass */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                              {att.userName}
                            </span>
                            {att.studentId && (
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 shrink-0">
                                {att.studentId}
                              </span>
                            )}
                          </div>
                          
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="text-indigo-600 dark:text-indigo-400 font-mono truncate">{att.userEmail}</span>
                            {att.phone && (
                              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-mono">
                                <PhoneCall className="w-3 h-3" />
                                <span>{att.phone}</span>
                              </span>
                            )}
                            {att.department && <span>• {att.department}</span>}
                            {att.year && <span>({att.year})</span>}
                          </div>
                        </div>

                        {/* Ticket Pass Pill */}
                        <div className="font-mono text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1">
                          <QrCode className="w-3 h-3 text-indigo-500" />
                          <span>{att.ticketCode}</span>
                        </div>
                      </div>

                      {/* Middle Row: Attendance Buttons - Direct, Large & High-Contrast */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(att.id, 'present')}
                            disabled={!canManageAttendance}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                                : canManageAttendance
                                ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            }`}
                            title="Mark Student Present"
                          >
                            <Check className="w-4 h-4" />
                            <span>Present</span>
                          </button>

                          <button
                            onClick={() => handleUpdateStatus(att.id, 'absent')}
                            disabled={!canManageAttendance}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isAbsent
                                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/30'
                                : canManageAttendance
                                ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            }`}
                            title="Mark Student Absent"
                          >
                            <X className="w-4 h-4" />
                            <span>Absent</span>
                          </button>

                          <button
                            onClick={() => handleUpdateStatus(att.id, 'unmarked')}
                            disabled={!canManageAttendance}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              currentStatus === 'unmarked'
                                ? 'bg-slate-700 text-white'
                                : canManageAttendance
                                ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            }`}
                            title="Reset to Unmarked"
                          >
                            <span>Unmark</span>
                          </button>
                        </div>

                        {/* Certificate status pill on Card */}
                        <div>
                          {isPresent ? (
                            hasCert ? (
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-bold text-[10px] flex items-center gap-1">
                                  <Award className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  <span>{att.certificateId || 'Cert Issued'}</span>
                                </span>
                                <a
                                  href={`/api/certificates/${att.certificateId || att.certificate?.id}/view`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                                >
                                  <span>View</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleGenerateCertificates(att.id)}
                                disabled={generatingCerts}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                              >
                                <Award className="w-3 h-3" />
                                <span>Issue Cert</span>
                              </button>
                            )
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              {isAbsent ? 'Ineligible (Absent)' : 'Requires Present'}
                            </span>
                          )}
                        </div>
                      </div>

                      {att.attendanceMarkedAt && (
                        <div className="text-[10px] text-slate-400 pt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Marked at {new Date(att.attendanceMarkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {att.attendanceMarkedBy ? `by ${att.attendanceMarkedBy}` : ''}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ========================================================================= */
              /* VIEW MODE 2: TABLE VIEW (WRAPPED WITH HORIZONTAL + VERTICAL SCROLL) */
              /* ========================================================================= */
              <div className="overflow-x-auto w-full border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 min-w-[780px]">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3">Student / Candidate</th>
                      <th className="px-4 py-3">Ticket Pass</th>
                      <th className="px-4 py-3">Attendance Decision</th>
                      <th className="px-4 py-3">Participation Certificate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAttendees.map(att => {
                      const currentStatus = att.attendanceStatus || (att.status === 'checked_in' ? 'present' : 'unmarked');
                      const hasCert = Boolean(att.certificateId || att.certificate);
                      const isPresent = currentStatus === 'present';

                      return (
                        <tr key={att.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Student Details */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">{att.userName}</span>
                              {att.studentId && (
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                  {att.studentId}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-2 font-mono">
                              <span>{att.userEmail}</span>
                              {att.phone && <span className="text-emerald-700 dark:text-emerald-400 font-medium">📞 {att.phone}</span>}
                              {att.department && <span className="text-slate-400">• {att.department}</span>}
                            </div>
                            {att.attendanceMarkedAt && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Marked at {new Date(att.attendanceMarkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {att.attendanceMarkedBy ? ` by ${att.attendanceMarkedBy}` : ''}
                              </div>
                            )}
                          </td>

                          {/* Ticket Code */}
                          <td className="px-4 py-3">
                            <div className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800 inline-block">
                              {att.ticketCode}
                            </div>
                          </td>

                          {/* Attendance Decision Buttons */}
                          <td className="px-4 py-3">
                            <div className={`inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 shadow-xs ${!canManageAttendance ? 'opacity-70' : ''}`}>
                              <button
                                onClick={() => handleUpdateStatus(att.id, 'present')}
                                disabled={!canManageAttendance}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                  currentStatus === 'present'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : canManageAttendance
                                    ? 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 hover:bg-white/50 dark:hover:bg-slate-700'
                                    : 'text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Present</span>
                              </button>

                              <button
                                onClick={() => handleUpdateStatus(att.id, 'absent')}
                                disabled={!canManageAttendance}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                  currentStatus === 'absent'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : canManageAttendance
                                    ? 'text-slate-600 dark:text-slate-300 hover:text-rose-700 hover:bg-white/50 dark:hover:bg-slate-700'
                                    : 'text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Absent</span>
                              </button>

                              <button
                                onClick={() => handleUpdateStatus(att.id, 'unmarked')}
                                disabled={!canManageAttendance}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                  currentStatus === 'unmarked'
                                    ? 'bg-slate-700 text-white'
                                    : canManageAttendance
                                    ? 'text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-white/50 dark:hover:bg-slate-700'
                                    : 'text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                Unmark
                              </button>
                            </div>
                          </td>

                          {/* Certificate Status */}
                          <td className="px-4 py-3">
                            {isPresent ? (
                              hasCert ? (
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-extrabold text-[11px] inline-flex items-center gap-1">
                                    <Award className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                    <span>{att.certificateId || att.certificate?.id}</span>
                                  </span>
                                  <a
                                    href={`/api/certificates/${att.certificateId || att.certificate?.id}/view`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>View</span>
                                  </a>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleGenerateCertificates(att.id)}
                                  disabled={generatingCerts}
                                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Issue Certificate</span>
                                </button>
                              )
                            ) : currentStatus === 'absent' ? (
                              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-100 dark:border-rose-900">
                                Ineligible (Absent)
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                Requires Present Status
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-download-official-attendance-report"
                onClick={handleDownloadAttendanceReport}
                disabled={!canManageAttendance}
                className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs ${
                  canManageAttendance
                    ? 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white border-slate-300 dark:border-slate-700 cursor-pointer'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                }`}
                title="Download Official Formatted Attendance CSV Report"
              >
                {canManageAttendance ? <Download className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-amber-600" />}
                <span>Download Report (CSV)</span>
              </button>

              <button
                id="btn-footer-mail-certificates"
                onClick={() => setShowMailConfirmModal(true)}
                disabled={!canManageAttendance || mailingCertificates || presentCount === 0}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="Mail certificates to Present attendees"
              >
                <Send className={`w-3.5 h-3.5 text-white ${mailingCertificates ? 'animate-bounce' : ''}`} />
                <span>{mailingCertificates ? 'Mailing...' : `Mail Certificates (${presentCount})`}</span>
              </button>

              <button
                onClick={handleExportDrive}
                disabled={!canManageAttendance || exportingDrive}
                className={`px-3 py-1.5 rounded-xl border font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs ${
                  canManageAttendance
                    ? 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 cursor-pointer'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                }`}
                title="Export attendance records to Google Drive"
              >
                <HardDrive className={`w-3.5 h-3.5 text-indigo-600 ${exportingDrive ? 'animate-spin' : ''}`} />
                <span>{exportingDrive ? 'Exporting...' : 'Export to Drive'}</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>
      </div>

      {/* Confirmation Modal to Mail Participation Certificates */}
      {showMailConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-white">Mail Participation Certificates</h3>
                  <p className="text-[11px] text-emerald-100">Automated student email dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setShowMailConfirmModal(false)}
                className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">Event Title:</span>
                  <span className="font-bold text-slate-900 text-right truncate max-w-[200px]">{currentEvent.title}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">Faculty Coordinator:</span>
                  <span className="font-bold text-amber-900">{currentEvent.facultyCoordinator || 'Prof. Radhika Iyer'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">Eligible Recipients:</span>
                  <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {presentCount} Attendee(s) Marked Present
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">Hosting Club:</span>
                  <span className="font-medium text-slate-800">{currentEvent.clubName}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>What each candidate receives:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1 text-slate-600">
                  <li>Instant email notification with customized university letterhead</li>
                  <li>Direct link to preview and download high-resolution Certificate of Participation</li>
                  <li>Cryptographic verification SHA-256 hash & QR code for campus credentials</li>
                  <li>Signed by Faculty Coordinator and Dean of Academic Affairs</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMailConfirmModal(false)}
                  disabled={mailingCertificates}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMailAttendanceCertificates}
                  disabled={mailingCertificates}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${mailingCertificates ? 'animate-bounce' : ''}`} />
                  <span>{mailingCertificates ? 'Mailing to All Present...' : 'Confirm & Mail All Certificates'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {activeCertificate && (
        <CertificateModal
          certificate={activeCertificate}
          onClose={() => setActiveCertificate(null)}
          currentUser={currentUser}
          accessToken={accessToken}
          onOpenGoogleDrive={onOpenGoogleDrive}
        />
      )}
    </>
  );
};
