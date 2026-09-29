import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  Search, 
  Download, 
  Phone, 
  Mail, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Filter, 
  PlusCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Calendar, 
  MapPin, 
  Building, 
  ShieldCheck, 
  Tag, 
  Sparkles,
  PhoneCall,
  GraduationCap,
  Megaphone,
  X,
  ExternalLink,
  HardDrive,
  Award,
  BookOpen,
  FileSpreadsheet,
  Lock,
  ShieldAlert,
  LayoutGrid,
  List
} from 'lucide-react';
import { Club, ParticipationCertificate, Registration, UniversityEvent, User } from '../types.js';
import { exportCandidateRosterToDrive } from '../lib/googleDrive.js';
import { EventAttendanceModal } from './EventAttendanceModal.js';
import { CertificateModal } from './CertificateModal.js';
import { isMasterUser, isUserAssignedLeaderForClub } from '../lib/permissions.js';

interface AdminRegistrationsViewProps {
  currentUser: User | null;
  events: UniversityEvent[];
  clubs: Club[];
  onOpenScheduleEvent?: () => void;
  onOpenMailbox?: () => void;
  onSwitchUser?: (user: User) => void;
  availableUsers?: User[];
  onManageClubAdmins?: (club: Club) => void;
  accessToken?: string | null;
  onOpenGoogleDrive?: () => void;
}

export const AdminRegistrationsView: React.FC<AdminRegistrationsViewProps> = ({
  currentUser,
  events,
  clubs,
  onOpenScheduleEvent,
  onOpenMailbox,
  onSwitchUser,
  availableUsers = [],
  onManageClubAdmins,
  accessToken,
  onOpenGoogleDrive
}) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [exportingDrive, setExportingDrive] = useState(false);
  const [driveExportResult, setDriveExportResult] = useState<{ url: string; name: string } | null>(null);

  // Quick Door Scanner / Check-in State
  const [quickCheckinCode, setQuickCheckinCode] = useState('');
  const [checkinAlert, setCheckinAlert] = useState<{ message: string; success: boolean } | null>(null);

  // Selected Candidate Modal
  const [selectedCandidate, setSelectedCandidate] = useState<Registration | null>(null);

  // Dedicated Attendance & Certificate Modals
  const [attendanceModalEvent, setAttendanceModalEvent] = useState<UniversityEvent | null>(null);
  const [viewCertificate, setViewCertificate] = useState<ParticipationCertificate | null>(null);

  // Manual On-Spot Registration Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    eventId: '',
    studentId: '',
    userName: '',
    userEmail: '',
    phone: '',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    notes: 'On-Spot Desk Registration'
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // View Mode: Cards View (responsive, effortless scroll, no sideways scroll) vs Table
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'cards';
    return 'table';
  });

  // Determine active club context and attendance authority
  // "theirs attendance can only be done or taken by faculty and leader of specific club only"
  const isMaster = isMasterUser(currentUser);
  const isClubOrganizer = currentUser?.role === 'club_organizer';
  const isDeanAdmin = currentUser?.role === 'admin' || isMaster;
  const isFaculty = currentUser?.role === 'faculty' || isMaster;
  const canManageAttendance = isMaster || currentUser?.role === 'admin' || currentUser?.role === 'faculty' || currentUser?.role === 'club_organizer';
  
  // Specific clearance check for individual candidate's event
  const canMarkCandidateAttendance = (cand: Registration) => {
    if (isMaster || currentUser?.role === 'admin' || currentUser?.role === 'faculty') return true;
    if (cand.event?.clubId) {
      const hostingClub = clubs.find(c => c.id === cand.event?.clubId);
      if (hostingClub && isUserAssignedLeaderForClub(currentUser, hostingClub)) return true;
    }
    if (currentUser?.role === 'club_organizer') {
      return !cand.event?.clubId || cand.event.clubId === currentUser.clubId;
    }
    return false;
  };

  const userClub = clubs.find(c => c.id === currentUser?.clubId) || clubs[0];

  // Fetch all registrations from backend
  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      // Scoping query: if user is club organizer, pass clubId
      const url = currentUser?.clubId 
        ? `/api/registrations?clubId=${currentUser.clubId}`
        : `/api/registrations`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.registrations)) {
        const uniqueRegs: Registration[] = [];
        const seenRegIds = new Set<string>();
        for (const r of data.registrations) {
          if (!seenRegIds.has(r.id)) {
            seenRegIds.add(r.id);
            uniqueRegs.push(r);
          }
        }
        setRegistrations(uniqueRegs);
      }
    } catch (err) {
      console.error('Failed to load candidate registrations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [currentUser?.clubId]);

  // Set default event in manual form when events load
  useEffect(() => {
    if (events.length > 0 && !manualForm.eventId) {
      const defaultEvt = isClubOrganizer && currentUser?.clubId
        ? events.find(e => e.clubId === currentUser.clubId) || events[0]
        : events[0];
      if (defaultEvt) {
        setManualForm(prev => ({ ...prev, eventId: defaultEvt.id }));
      }
    }
  }, [events, currentUser, isClubOrganizer]);

  // Copy helper
  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Toggle check-in status
  const handleToggleCheckIn = async (reg: Registration) => {
    if (!canManageAttendance) {
      alert('Access Denied: Only University Administrators and Faculty members are authorized to mark event attendance.');
      return;
    }
    const nextStatus = reg.status === 'checked_in' ? 'confirmed' : 'checked_in';
    try {
      const res = await fetch(`/api/registrations/${reg.id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify({ 
          status: nextStatus,
          userRole: currentUser?.role,
          userId: currentUser?.id,
          markedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Central Admin Desk'
        })
      });
      const data = await res.json();
      if (data.success) {
        setRegistrations(prev => prev.map(r => r.id === reg.id ? { 
          ...r, 
          status: nextStatus, 
          checkedInAt: nextStatus === 'checked_in' ? new Date().toISOString() : undefined 
        } : r));
        setCheckinAlert({
          message: nextStatus === 'checked_in' 
            ? `✓ Check-in confirmed for ${reg.userName} (${reg.studentId})!`
            : `Status reverted to Confirmed for ${reg.userName}.`,
          success: true
        });
        setTimeout(() => setCheckinAlert(null), 4000);
      } else {
        alert(data.message || 'Failed to update candidate check-in.');
      }
    } catch {
      setCheckinAlert({ message: 'Failed to update candidate check-in.', success: false });
    }
  };

  // Mark specific attendance status (present / absent / unmarked)
  const handleUpdateAttendance = async (candidate: Registration, targetStatus: 'present' | 'absent' | 'unmarked') => {
    if (!canManageAttendance) {
      alert('Access Denied: Only University Administrators and Faculty members are authorized to mark event attendance.');
      return;
    }
    try {
      const res = await fetch(`/api/events/${candidate.eventId}/attendance/${candidate.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify({
          attendanceStatus: targetStatus,
          userRole: currentUser?.role,
          userId: currentUser?.id,
          markedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Central Admin Desk'
        })
      });
      const data = await res.json();
      if (data.success) {
        setRegistrations(prev => prev.map(r => r.id === candidate.id ? { 
          ...r, 
          attendanceStatus: targetStatus,
          status: targetStatus === 'present' ? 'checked_in' : 'confirmed',
          checkedInAt: targetStatus === 'present' ? (r.checkedInAt || new Date().toISOString()) : undefined,
          attendanceMarkedAt: targetStatus !== 'unmarked' ? new Date().toISOString() : undefined
        } : r));
        setCheckinAlert({
          message: `✓ Attendance updated: ${candidate.userName} marked as ${targetStatus.toUpperCase()}`,
          success: true
        });
        setTimeout(() => setCheckinAlert(null), 3000);
      } else {
        alert(data.message || 'Failed to update attendance');
      }
    } catch {
      alert('Error communicating with attendance server.');
    }
  };

  // Generate participation certificate for single candidate
  const handleGenerateCertificateForCandidate = async (candidate: Registration) => {
    if (!canManageAttendance) {
      alert('Access Denied: Only University Administrators and Faculty members are authorized to issue certificates.');
      return;
    }
    try {
      const res = await fetch(`/api/events/${candidate.eventId}/certificates/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify({
          registrationIds: [candidate.id],
          sendEmail: true,
          userRole: currentUser?.role,
          userId: currentUser?.id,
          issuedBy: currentUser ? `${currentUser.name} (Academic Council)` : 'Academic Affairs'
        })
      });
      const data = await res.json();
      if (data.success && data.certificates && data.certificates.length > 0) {
        const cert = data.certificates[0];
        setRegistrations(prev => prev.map(r => r.id === candidate.id ? {
          ...r,
          certificateId: cert.id,
          certificate: cert
        } : r));
        setViewCertificate(cert);
      } else {
        alert(data.message || 'Failed to generate certificate.');
      }
    } catch {
      alert('Error communicating with certificate engine.');
    }
  };

  // Quick ticket / enrollment check-in from top bar
  const handleQuickCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageAttendance) {
      setCheckinAlert({
        message: 'Access Denied: Only University Administrators and Faculty members are authorized to verify and check-in attendees.',
        success: false
      });
      return;
    }
    if (!quickCheckinCode.trim()) return;

    const query = quickCheckinCode.trim().toUpperCase();
    const candidate = registrations.find(r => 
      r.ticketCode.toUpperCase() === query || 
      (r.studentId && r.studentId.toUpperCase() === query)
    );

    if (!candidate) {
      setCheckinAlert({
        message: `No candidate found matching Code or Enrollment No: "${query}".`,
        success: false
      });
      return;
    }

    if (candidate.status === 'checked_in') {
      setCheckinAlert({
        message: `ℹ Candidate ${candidate.userName} (${candidate.studentId}) is ALREADY Checked In!`,
        success: true
      });
      setQuickCheckinCode('');
      return;
    }

    await handleToggleCheckIn(candidate);
    setQuickCheckinCode('');
  };

  // Delete registration
  const handleDeleteRegistration = async (reg: Registration) => {
    if (!confirm(`Are you sure you want to remove registration for ${reg.userName} (${reg.studentId})?`)) return;

    try {
      const res = await fetch(`/api/registrations/${reg.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setRegistrations(prev => prev.filter(r => r.id !== reg.id));
        if (selectedCandidate?.id === reg.id) setSelectedCandidate(null);
      }
    } catch {
      alert('Error deleting registration record');
    }
  };

  // Submit manual registration
  const handleManualRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.studentId.trim() || !manualForm.userName.trim() || !manualForm.userEmail.trim()) {
      setManualError('Please fill in Enrollment Number, Full Name, and University Email.');
      return;
    }

    setManualSubmitting(true);
    setManualError(null);

    try {
      const res = await fetch('/api/registrations/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualForm)
      });
      const data = await res.json();
      if (data.success && data.registration) {
        setRegistrations(prev => [data.registration, ...prev]);
        setShowManualModal(false);
        setManualForm({
          eventId: events[0]?.id || '',
          studentId: '',
          userName: '',
          userEmail: '',
          phone: '',
          department: 'Computer Science & Engineering',
          year: '3rd Year',
          notes: 'On-Spot Desk Registration'
        });
        setCheckinAlert({
          message: `✓ Candidate ${data.registration.userName} successfully registered! Pass: ${data.registration.ticketCode}`,
          success: true
        });
      } else {
        setManualError(data.message || 'Failed to register candidate.');
      }
    } catch {
      setManualError('Network error while registering candidate.');
    } finally {
      setManualSubmitting(false);
    }
  };

  // Download Comprehensive Official Attendance Report (Formatted for Faculty & Admin)
  const handleDownloadAttendanceReport = () => {
    if (!canManageAttendance) {
      alert('Access Denied: Only University Administrators and Faculty members are authorized to download event attendance records.');
      return;
    }

    if (filteredCandidates.length === 0) {
      alert('No candidate attendance records match current filters to export.');
      return;
    }

    const presentCount = filteredCandidates.filter(c => c.attendanceStatus === 'present' || c.status === 'checked_in').length;
    const absentCount = filteredCandidates.filter(c => c.attendanceStatus === 'absent').length;
    const unmarkedCount = filteredCandidates.length - presentCount - absentCount;
    const turnoutRate = filteredCandidates.length > 0 ? Math.round((presentCount / filteredCandidates.length) * 100) : 0;
    const dateStr = new Date().toISOString().split('T')[0];
    const generatedOn = new Date().toLocaleString();

    // Determine active event and faculty coordinator
    const currentSelectedEvent = selectedEventId !== 'all' ? events.find(e => e.id === selectedEventId) : null;
    const facultyCoord = currentSelectedEvent?.facultyCoordinator || (currentUser?.role === 'faculty' ? currentUser.name : userClub?.facultyAdvisor) || 'Prof. Radhika Iyer (Central Academic Council)';

    const metadataHeader = [
      `"CENTRAL UNIVERSITY EVENT ATTENDANCE & ACADEMIC AUDIT REPORT"`,
      `"Report Scope:","${currentSelectedEvent ? currentSelectedEvent.title : (userClub?.name ? `Club Roster: ${userClub.name}` : 'All University Events')}"`,
      `"Faculty Coordinator / Academic Advisor:","${facultyCoord}"`,
      `"Report Downloaded By:","${currentUser ? `${currentUser.name} [${currentUser.role.toUpperCase()}]` : 'University Administrator'}"`,
      `"Generated Timestamp:","${generatedOn}"`,
      `"Attendance Summary:","Total: ${filteredCandidates.length} | Present: ${presentCount} | Absent: ${absentCount} | Unmarked: ${unmarkedCount} | Attendance Rate: ${turnoutRate}%"`,
      `""` // Blank separator
    ];

    const tableHeaders = [
      'Sl No.',
      'Enrollment Number',
      'Candidate Name',
      'Email Address',
      'Phone Number',
      'Department',
      'Academic Year',
      'Event Title',
      'Faculty Coordinator',
      'Hosting Club',
      'Ticket Code',
      'Attendance Decision',
      'Check-in Timestamp',
      'Verified By',
      'Certificate ID',
      'Certificate Delivery Status',
      'Registration Date'
    ];

    const rows = filteredCandidates.map((c, idx) => {
      const isPres = c.attendanceStatus === 'present' || c.status === 'checked_in';
      const isAbs = c.attendanceStatus === 'absent';
      const statusLabel = isPres ? 'PRESENT' : isAbs ? 'ABSENT' : 'UNMARKED';
      const certId = c.certificateId || (c.certificate ? c.certificate.id : 'N/A');
      const certStatus = isPres ? (certId !== 'N/A' ? 'Issued & Delivered' : 'Pending Delivery') : 'Ineligible';

      return [
        `"${idx + 1}"`,
        `"${c.studentId || ''}"`,
        `"${(c.userName || '').replace(/"/g, '""')}"`,
        `"${c.userEmail || ''}"`,
        `"${c.phone || ''}"`,
        `"${(c.department || '').replace(/"/g, '""')}"`,
        `"${c.year || ''}"`,
        `"${(c.event?.title || '').replace(/"/g, '""')}"`,
        `"${(c.event?.facultyCoordinator || facultyCoord).replace(/"/g, '""')}"`,
        `"${(c.event?.clubName || userClub?.name || '').replace(/"/g, '""')}"`,
        `"${c.ticketCode || ''}"`,
        `"${statusLabel}"`,
        `"${c.checkedInAt ? new Date(c.checkedInAt).toLocaleString() : 'N/A'}"`,
        `"${(c.attendanceMarkedBy || (isPres ? 'Verified at Desk' : 'N/A')).replace(/"/g, '""')}"`,
        `"${certId}"`,
        `"${certStatus}"`,
        `"${new Date(c.registeredAt).toLocaleString()}"`
      ];
    });

    const csvContent = '\uFEFF' + [
      ...metadataHeader,
      tableHeaders.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const scopeTag = currentSelectedEvent ? currentSelectedEvent.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20) : (userClub?.name?.replace(/\s+/g, '_').substring(0, 20) || 'Campus');
    link.setAttribute('download', `Official_Attendance_Report_${scopeTag}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to CSV Functionality
  const handleExportCSV = () => {
    if (filteredCandidates.length === 0) {
      alert('No candidate records available to export.');
      return;
    }

    const headers = [
      'Enrollment Number',
      'Candidate Name',
      'Email Address',
      'Phone Number',
      'Department',
      'Academic Year',
      'Event Title',
      'Club Name',
      'Ticket Code',
      'Registration Status',
      'Registration Date',
      'Checked-In Timestamp',
      'Notes'
    ];

    const rows = filteredCandidates.map(c => [
      `"${c.studentId || ''}"`,
      `"${c.userName || ''}"`,
      `"${c.userEmail || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.department || ''}"`,
      `"${c.year || ''}"`,
      `"${(c.event?.title || '').replace(/"/g, '""')}"`,
      `"${(c.event?.clubName || '').replace(/"/g, '""')}"`,
      `"${c.ticketCode || ''}"`,
      `"${c.status || ''}"`,
      `"${new Date(c.registeredAt).toLocaleString()}"`,
      `"${c.checkedInAt ? new Date(c.checkedInAt).toLocaleString() : 'N/A'}"`,
      `"${c.notes || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    const clubTag = userClub?.name ? userClub.name.replace(/\s+/g, '_').substring(0, 20) : 'Campus';
    link.setAttribute('download', `Candidates_Roster_${clubTag}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export directly to Google Drive
  const handleExportToDrive = async () => {
    if (!accessToken) {
      if (onOpenGoogleDrive) onOpenGoogleDrive();
      return;
    }

    if (filteredCandidates.length === 0) {
      alert('No candidates available in current view to export.');
      return;
    }

    setExportingDrive(true);
    setDriveExportResult(null);

    try {
      const headers = [
        'Enrollment Number',
        'Candidate Name',
        'Email Address',
        'Phone Number',
        'Department',
        'Academic Year',
        'Event Title',
        'Club Name',
        'Ticket Code',
        'Registration Status',
        'Registration Date',
        'Checked-In Timestamp',
        'Notes'
      ];

      const rows = filteredCandidates.map(c => [
        `"${c.studentId || ''}"`,
        `"${c.userName || ''}"`,
        `"${c.userEmail || ''}"`,
        `"${c.phone || ''}"`,
        `"${c.department || ''}"`,
        `"${c.year || ''}"`,
        `"${(c.event?.title || '').replace(/"/g, '""')}"`,
        `"${(c.event?.clubName || '').replace(/"/g, '""')}"`,
        `"${c.ticketCode || ''}"`,
        `"${c.status || ''}"`,
        `"${new Date(c.registeredAt).toLocaleString()}"`,
        `"${c.checkedInAt ? new Date(c.checkedInAt).toLocaleString() : 'N/A'}"`,
        `"${c.notes || ''}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const activeEvent = events.find(e => e.id === selectedEventId);
      const title = activeEvent ? activeEvent.title : (userClub?.name ? `${userClub.name} Candidates` : 'UniVerse Candidates Roster');

      const res = await exportCandidateRosterToDrive(accessToken, title, userClub?.name || 'UniVerse', csvContent);
      if (res.success && res.file?.webViewLink) {
        setDriveExportResult({ url: res.file.webViewLink, name: res.file.name });
      } else {
        alert(res.message || 'Failed to export to Google Drive');
      }
    } catch (err: any) {
      alert(err.message || 'Error exporting to Google Drive');
    } finally {
      setExportingDrive(false);
    }
  };

  // Filter candidates based on controls
  const filteredCandidates = useMemo(() => {
    return registrations.filter(candidate => {
      // Event filter
      if (selectedEventId !== 'all' && candidate.eventId !== selectedEventId) {
        return false;
      }

      // Status & Attendance filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'present') {
          if (candidate.attendanceStatus !== 'present' && candidate.status !== 'checked_in') return false;
        } else if (selectedStatus === 'absent') {
          if (candidate.attendanceStatus !== 'absent') return false;
        } else if (selectedStatus === 'unmarked') {
          if ((candidate.attendanceStatus && candidate.attendanceStatus !== 'unmarked') || candidate.status === 'checked_in') return false;
        } else if (selectedStatus === 'with_certificate') {
          if (!candidate.certificateId && !candidate.certificate) return false;
        } else if (candidate.status !== selectedStatus) {
          return false;
        }
      }

      // Department filter
      if (selectedDept !== 'all' && (candidate.department || '').toLowerCase() !== selectedDept.toLowerCase()) {
        return false;
      }

      // Year filter
      if (selectedYear !== 'all' && (candidate.year || '').toLowerCase() !== selectedYear.toLowerCase()) {
        return false;
      }

      // Search query (matches Enrollment No, Name, Email, Phone, Ticket)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = candidate.userName.toLowerCase().includes(q);
        const matchEmail = candidate.userEmail.toLowerCase().includes(q);
        const matchEnrollment = candidate.studentId ? candidate.studentId.toLowerCase().includes(q) : false;
        const matchPhone = candidate.phone ? candidate.phone.toLowerCase().includes(q) : false;
        const matchTicket = candidate.ticketCode.toLowerCase().includes(q);
        const matchDept = candidate.department ? candidate.department.toLowerCase().includes(q) : false;

        return matchName || matchEmail || matchEnrollment || matchPhone || matchTicket || matchDept;
      }

      return true;
    });
  }, [registrations, selectedEventId, selectedStatus, selectedDept, selectedYear, searchQuery]);

  // Aggregate Stats
  const totalRegistered = filteredCandidates.length;
  const totalCheckedIn = filteredCandidates.filter(c => c.status === 'checked_in').length;
  const totalPending = filteredCandidates.filter(c => c.status === 'confirmed').length;
  const attendanceRate = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0;
  const uniqueEventsCount = new Set(filteredCandidates.map(c => c.eventId)).size;

  // List of unique departments for filter dropdown
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    registrations.forEach(r => {
      if (r.department) set.add(r.department);
    });
    return Array.from(set);
  }, [registrations]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Header Card */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Club Administration Portal</span>
              </span>

              {isClubOrganizer && userClub && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{userClub.name}</span>
                </span>
              )}

              {isDeanAdmin && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  Dean / Central Academic Council
                </span>
              )}

              {isFaculty && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Faculty Academic Oversight • {currentUser?.designation || currentUser?.department || 'Faculty Advisor'}</span>
                </span>
              )}
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Candidate Registrations Directory</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Official administrative roster of all students registered for MITS club events and workshops. Inspect enrollment numbers, verify student presence, and issue participation records under institutional governance.
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-admin-attendance-desk"
              onClick={() => {
                const targetEv = events.find(e => e.id === selectedEventId) || events[0];
                if (targetEv) setAttendanceModalEvent(targetEv);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-amber-500/25 active:scale-95 cursor-pointer"
              title="Open Attendance Marking & Participation Certificate Desk"
            >
              <Award className="w-4 h-4 text-white" />
              <span>Attendance & Certificates Desk</span>
            </button>

            {onManageClubAdmins && userClub && (
              <button
                id="btn-manage-club-admins"
                onClick={() => onManageClubAdmins(userClub)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all border border-slate-700 shadow-sm active:scale-95"
                title="View, edit, or appoint club administrators"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Manage Club Admins ({userClub.admins?.length || 1})</span>
              </button>
            )}

            <button
              id="btn-download-attendance-report"
              onClick={handleDownloadAttendanceReport}
              disabled={!canManageAttendance}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 ${
                canManageAttendance
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-60 cursor-not-allowed'
              }`}
              title={canManageAttendance ? "Download formatted Official Attendance & Verification Report with metrics" : "Restricted: Only University Administrators and Faculty are authorized to download attendance reports"}
            >
              {canManageAttendance ? <FileSpreadsheet className="w-4 h-4 text-white" /> : <Lock className="w-4 h-4 text-amber-400" />}
              <span>Download Attendance Report</span>
              {!canManageAttendance && (
                <span className="text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded border border-slate-700 font-normal">
                  Faculty/Admin Only
                </span>
              )}
            </button>

            <button
              id="btn-export-candidates-csv"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95"
              title="Download full candidate list in CSV format"
            >
              <Download className="w-4 h-4 text-slate-700" />
              <span>Export CSV</span>
            </button>

            <button
              id="btn-export-candidates-drive"
              onClick={handleExportToDrive}
              disabled={exportingDrive}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all border border-slate-700 shadow-sm active:scale-95 disabled:opacity-50"
              title="Export filtered roster directly to Google Drive"
            >
              <HardDrive className={`w-4 h-4 text-indigo-400 ${exportingDrive ? 'animate-spin' : ''}`} />
              <span>{exportingDrive ? 'Exporting...' : 'Export to Drive'}</span>
            </button>

            <button
              id="btn-manual-add-candidate"
              onClick={() => setShowManualModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>On-Spot Registration</span>
            </button>
          </div>
        </div>

        {/* Quick Door Scanner / Verification Strip */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <form onSubmit={handleQuickCheckin} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <QrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
              <input
                id="input-quick-door-checkin"
                type="text"
                value={quickCheckinCode}
                disabled={!canManageAttendance}
                onChange={e => setQuickCheckinCode(e.target.value)}
                placeholder={canManageAttendance ? "Scan or Enter Ticket Code (e.g. TKT-2026-...) or Enrollment No. (e.g. UNI-2023-CS089)" : "Locked: Only Faculty and Administrators can scan & mark attendance..."}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  canManageAttendance
                    ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-400'
                    : 'bg-slate-900 border-slate-800 text-slate-500 placeholder-slate-600 cursor-not-allowed'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={!canManageAttendance}
              className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                canManageAttendance
                  ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-emerald-600/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-60 cursor-not-allowed'
              }`}
              title={canManageAttendance ? "Verify & Check-In" : "Restricted: Only University Administrators and Faculty can mark attendance"}
            >
              <UserCheck className="w-4 h-4" />
              <span>Verify & Check-In</span>
            </button>
          </form>

          {checkinAlert && (
            <div className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-fadeIn ${
              checkinAlert.success 
                ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-800' 
                : 'bg-rose-950/80 text-rose-200 border border-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                {checkinAlert.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{checkinAlert.message}</span>
              </div>
              <button onClick={() => setCheckinAlert(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          {driveExportResult && (
            <div className="mt-3 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 bg-emerald-950/90 text-emerald-200 border border-emerald-700 animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Successfully uploaded <strong>{driveExportResult.name}</strong> to your Google Drive!</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={driveExportResult.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 text-[11px] shadow-sm"
                >
                  <span>Open in Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setDriveExportResult(null)}
                  className="text-emerald-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Candidates</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalRegistered}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
            <span>Across {uniqueEventsCount} event{uniqueEventsCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Checked-In / Present</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{totalCheckedIn}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>{attendanceRate}% Gate Turnout Rate</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Arrival</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">{totalPending}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Confirmed seats booked
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Direct Contacts</span>
            <Phone className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-violet-700">
            {filteredCandidates.filter(c => c.phone).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Verified Phone & Email contacts
          </div>
        </div>

      </div>

      {/* Filter and Search Controls Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-candidate-search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Candidate Name, Enrollment No, Email, Phone, Ticket..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Refresh */}
          <button
            onClick={fetchRegistrations}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            title="Refresh Candidate Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Sync Live</span>
          </button>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          
          {/* Event Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
              Filter by Event
            </label>
            <select
              id="select-filter-event"
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Events ({events.length})</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.title.length > 40 ? ev.title.substring(0, 40) + '...' : ev.title} ({ev.registeredCount}/{ev.capacity})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
              Attendance Status
            </label>
            <select
              id="select-filter-status"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses & Attendance</option>
              <option value="present">✓ Present (Verified Attendance)</option>
              <option value="absent">✗ Absent (Not Attended)</option>
              <option value="unmarked">⌛ Unmarked</option>
              <option value="with_certificate">🎓 With Participation Certificate</option>
              <option value="confirmed">Confirmed Pass</option>
              <option value="checked_in">Checked In</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
              Student Department
            </label>
            <select
              id="select-filter-dept"
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Departments</option>
              {departmentsList.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Academic Year Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
              Academic Year
            </label>
            <select
              id="select-filter-year"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Academic Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

        </div>

      </div>

      {/* Main Candidate Table & Cards Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base">
              Registered Candidates Roster
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* View Mode Toggle: Table View vs Cards View */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Full Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Cards View: Direct attendance buttons with zero sideways scrolling"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards View</span>
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'cards' ? (
          /* ========================================================================= */
          /* CARDS VIEW: ZERO HORIZONTAL SCROLL - EFFORTLESS VERTICAL SCROLLING        */
          /* ========================================================================= */
          <div className="p-4 sm:p-5 bg-slate-50/60 max-h-[70vh] overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                <span>Loading candidate registry...</span>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No registered candidates match your filters.</p>
                <p className="text-xs text-slate-400 mt-1">Try clearing search terms or adding candidates on-spot.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredCandidates.map((candidate, idx) => {
                  const currentAttendance = candidate.attendanceStatus || (candidate.status === 'checked_in' ? 'present' : 'unmarked');
                  const isPresent = currentAttendance === 'present';
                  const isAbsent = currentAttendance === 'absent';
                  const isCheckedIn = candidate.status === 'checked_in' || isPresent;
                  const hasCertificate = Boolean(candidate.certificateId || candidate.certificate);
                  const isAuthorized = canMarkCandidateAttendance(candidate);

                  return (
                    <div
                      key={candidate.id ? `${candidate.id}-${idx}` : `candidate-${idx}`}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isPresent
                          ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
                          : isAbsent
                          ? 'bg-rose-50/50 border-rose-300'
                          : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      {/* Candidate Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span 
                              onClick={() => setSelectedCandidate(candidate)}
                              className="font-bold text-slate-900 hover:text-indigo-600 text-sm truncate cursor-pointer"
                            >
                              {candidate.userName}
                            </span>
                            {candidate.studentId && (
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 shrink-0">
                                {candidate.studentId}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono">
                            <span className="text-indigo-600 truncate">{candidate.userEmail}</span>
                            {candidate.phone && <span className="text-emerald-700">📞 {candidate.phone}</span>}
                            {candidate.department && <span>• {candidate.department}</span>}
                            {candidate.year && <span>({candidate.year})</span>}
                          </div>
                        </div>

                        {/* Ticket Code Badge */}
                        <div className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1">
                          <QrCode className="w-3 h-3 text-indigo-500" />
                          <span>{candidate.ticketCode}</span>
                        </div>
                      </div>

                      {/* Event Venue */}
                      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800 truncate" title={candidate.event?.title}>
                          {candidate.event?.title || 'Campus Event'}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          <span>{candidate.event?.venue || 'Campus Venue'}</span>
                        </span>
                      </div>

                      {/* Direct Attendance Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateAttendance(candidate, 'present')}
                            disabled={!isAuthorized}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/20'
                                : isAuthorized
                                ? 'bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                            title="Mark candidate Present"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </button>

                          <button
                            onClick={() => handleUpdateAttendance(candidate, 'absent')}
                            disabled={!isAuthorized}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isAbsent
                                ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-500/20'
                                : isAuthorized
                                ? 'bg-slate-100 hover:bg-rose-100 hover:text-rose-800 text-slate-700'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                            title="Mark candidate Absent"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </button>

                          <button
                            onClick={() => handleUpdateAttendance(candidate, 'unmarked')}
                            disabled={!isAuthorized}
                            className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                              currentAttendance === 'unmarked'
                                ? 'bg-slate-700 text-white'
                                : isAuthorized
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                            title="Reset to Unmarked"
                          >
                            Reset
                          </button>
                        </div>

                        {/* Certificate and Quick Actions */}
                        <div className="flex items-center gap-2">
                          {isPresent && (
                            hasCertificate ? (
                              <button
                                onClick={() => {
                                  if (candidate.certificate) {
                                    setViewCertificate(candidate.certificate);
                                  } else if (candidate.certificateId) {
                                    fetch(`/api/certificates/${candidate.certificateId}`)
                                      .then(r => r.json())
                                      .then(d => { if (d.success) setViewCertificate(d.certificate); });
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Award className="w-3 h-3 text-amber-600" />
                                <span>View Cert</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleGenerateCertificateForCandidate(candidate)}
                                disabled={!isAuthorized}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                              >
                                <Award className="w-3 h-3" />
                                <span>Issue Cert</span>
                              </button>
                            )
                          )}

                          <button
                            onClick={() => setSelectedCandidate(candidate)}
                            title="Inspect Pass"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteRegistration(candidate)}
                            title="Remove Registration"
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* TABLE VIEW: ATTENDANCE STATUS IS PROMINENT (COLUMN 2)                     */
          /* ========================================================================= */
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto overscroll-contain">
            <table className="w-full text-left border-collapse text-xs min-w-[760px]">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                  <th className="px-4 py-3.5">Candidate / Enrollment</th>
                  <th className="px-4 py-3.5">Attendance Decision</th>
                  <th className="px-4 py-3.5">Ticket Pass</th>
                  <th className="px-4 py-3.5">Event & Venue</th>
                  <th className="px-4 py-3.5">Certificate</th>
                  <th className="px-4 py-3.5">Contact Details</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      <span>Loading candidate registry...</span>
                    </td>
                  </tr>
                ) : filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No registered candidates match your filters.</p>
                      <p className="text-xs text-slate-400 mt-1">Try clearing search terms or adding candidates on-spot.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((candidate, idx) => {
                    const currentAttendance = candidate.attendanceStatus || (candidate.status === 'checked_in' ? 'present' : 'unmarked');
                    const isPresent = currentAttendance === 'present';
                    const isAbsent = currentAttendance === 'absent';
                    const isCheckedIn = candidate.status === 'checked_in' || isPresent;
                    const hasCertificate = Boolean(candidate.certificateId || candidate.certificate);
                    const isAuthorized = canMarkCandidateAttendance(candidate);

                    return (
                      <tr 
                        key={candidate.id ? `${candidate.id}-${idx}` : `candidate-${idx}`}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isPresent ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        {/* Candidate / Enrollment */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {candidate.userName.charAt(0)}
                            </div>
                            <div>
                              <div 
                                onClick={() => setSelectedCandidate(candidate)}
                                className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                              >
                                {candidate.userName}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] border border-slate-200">
                                  {candidate.studentId || 'N/A'}
                                </span>
                                {candidate.studentId && (
                                  <button
                                    onClick={() => handleCopy(candidate.studentId!, `sid-${candidate.id}`)}
                                    title="Copy Enrollment"
                                    className="text-slate-400 hover:text-slate-700 p-0.5"
                                  >
                                    {copiedField === `sid-${candidate.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Attendance Status (Present / Absent / Unmarked) - COLUMN 2 */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className={`inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 shadow-2xs ${!isAuthorized ? 'opacity-70' : ''}`}>
                            <button
                              onClick={() => handleUpdateAttendance(candidate, 'present')}
                              disabled={!isAuthorized}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                currentAttendance === 'present'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : isAuthorized ? 'text-slate-600 hover:text-emerald-700 hover:bg-white/50' : 'text-slate-400 cursor-not-allowed'
                              }`}
                              title={isAuthorized ? "Mark candidate as Present" : "Clearance Restricted: Only Faculty or Club Leader"}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Present</span>
                            </button>

                            <button
                              onClick={() => handleUpdateAttendance(candidate, 'absent')}
                              disabled={!isAuthorized}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                currentAttendance === 'absent'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : isAuthorized ? 'text-slate-600 hover:text-rose-700 hover:bg-white/50' : 'text-slate-400 cursor-not-allowed'
                              }`}
                              title={isAuthorized ? "Mark candidate as Absent" : "Clearance Restricted: Only Faculty or Club Leader"}
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Absent</span>
                            </button>

                            <button
                              onClick={() => handleUpdateAttendance(candidate, 'unmarked')}
                              disabled={!isAuthorized}
                              className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                currentAttendance === 'unmarked'
                                  ? 'bg-slate-700 text-white shadow-xs'
                                  : isAuthorized ? 'text-slate-400 hover:text-slate-700 hover:bg-white/50' : 'text-slate-400 cursor-not-allowed'
                              }`}
                              title={isAuthorized ? "Reset attendance to Unmarked" : "Clearance Restricted: Only Faculty or Club Leader"}
                            >
                              Reset
                            </button>
                          </div>
                        </td>

                        {/* Ticket Code */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1 font-mono text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg font-semibold">
                            <QrCode className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>{candidate.ticketCode}</span>
                          </div>
                        </td>

                        {/* Event & Venue */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900 truncate max-w-[180px]" title={candidate.event?.title}>
                            {candidate.event?.title || 'Campus Event'}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 truncate max-w-[180px]">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>{candidate.event?.venue || 'Campus Venue'}</span>
                          </div>
                        </td>

                        {/* Participation Certificate */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {currentAttendance === 'present' ? (
                            hasCertificate ? (
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] flex items-center gap-1">
                                  <Award className="w-3 h-3 text-amber-600" />
                                  <span>{candidate.certificateId || candidate.certificate?.id}</span>
                                </span>
                                <button
                                  onClick={() => {
                                    if (candidate.certificate) {
                                      setViewCertificate(candidate.certificate);
                                    } else if (candidate.certificateId) {
                                      fetch(`/api/certificates/${candidate.certificateId}`)
                                        .then(r => r.json())
                                        .then(d => {
                                          if (d.success) setViewCertificate(d.certificate);
                                        });
                                    }
                                  }}
                                  className="px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-colors cursor-pointer"
                                  title="View & Print Certificate"
                                >
                                  View
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleGenerateCertificateForCandidate(candidate)}
                                disabled={!isAuthorized}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-all ${
                                  isAuthorized 
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer' 
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                }`}
                                title={isAuthorized ? "Generate Official Participation Certificate" : "Restricted: Only Faculty or Club Leader"}
                              >
                                <Award className="w-3 h-3" />
                                <span>Issue Cert</span>
                              </button>
                            )
                          ) : currentAttendance === 'absent' ? (
                            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                              Ineligible (Absent)
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              Requires Present
                            </span>
                          )}
                        </td>

                        {/* Contact & Dept */}
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-[11px] text-slate-700 truncate max-w-[150px]">{candidate.userEmail}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {candidate.department || 'Engineering'} {candidate.year ? `• ${candidate.year}` : ''}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Check-in Button */}
                            <button
                              onClick={() => handleToggleCheckIn(candidate)}
                              disabled={!isAuthorized}
                              title={!isAuthorized ? 'Restricted: Only Faculty and Club Leaders can mark attendance / check-in' : isCheckedIn ? 'Undo check-in' : 'Verify & Mark candidate present'}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                                !isAuthorized
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60 cursor-not-allowed'
                                  : isCheckedIn
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 cursor-pointer'
                              }`}
                            >
                              {isCheckedIn ? (
                                <span>Undo</span>
                              ) : (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Check-In</span>
                                </>
                              )}
                            </button>

                            {/* Inspect Pass */}
                            <button
                              onClick={() => setSelectedCandidate(candidate)}
                              title="Inspect digital entry ticket & pass details"
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Registration */}
                            <button
                              onClick={() => handleDeleteRegistration(candidate)}
                              title="Remove registration"
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{filteredCandidates.length}</strong> of <strong className="text-slate-800">{registrations.length}</strong> registered students
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportCSV}
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Spreadsheet</span>
            </button>
          </div>
        </div>

      </div>

      {/* Candidate Digital Pass & Details Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Verified Candidate Pass
                </span>
                <h3 className="font-heading font-bold text-xl text-white mt-1">
                  {selectedCandidate.userName}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Enrollment No: {selectedCandidate.studentId || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* QR Pass Body */}
            <div className="p-6 space-y-5">
              
              {/* QR Code & Status */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <img
                  src={selectedCandidate.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedCandidate.ticketCode)}`}
                  alt="Entry Ticket QR"
                  className="w-40 h-40 rounded-xl bg-white p-2 shadow-sm border border-slate-200"
                />
                <div className="mt-3 font-mono font-bold text-sm text-slate-900 tracking-wider">
                  {selectedCandidate.ticketCode}
                </div>
                
                <div className="mt-2">
                  {selectedCandidate.status === 'checked_in' ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Checked-In at Gate</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>Registration Confirmed</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Candidate Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Contact</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{selectedCandidate.phone || 'N/A'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</div>
                  <div className="font-medium text-slate-800 mt-0.5 truncate" title={selectedCandidate.userEmail}>
                    {selectedCandidate.userEmail}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</div>
                  <div className="font-medium text-slate-800 mt-0.5">
                    {selectedCandidate.department || 'Engineering'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Year</div>
                  <div className="font-medium text-slate-800 mt-0.5">
                    {selectedCandidate.year || '3rd Year'}
                  </div>
                </div>

              </div>

              {/* Event Info */}
              {selectedCandidate.event && (
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/70 text-xs">
                  <div className="font-bold text-indigo-950">{selectedCandidate.event.title}</div>
                  <div className="text-slate-600 mt-1 flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-indigo-600" />
                      <span>{selectedCandidate.event.startDate} • {selectedCandidate.event.startTime}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-600" />
                      <span>{selectedCandidate.event.venue}</span>
                    </span>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => handleToggleCheckIn(selectedCandidate)}
                disabled={!canManageAttendance}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
                  !canManageAttendance
                    ? 'bg-slate-200 text-slate-400 border border-slate-300 opacity-60 cursor-not-allowed'
                    : selectedCandidate.status === 'checked_in'
                    ? 'bg-slate-200 text-slate-800 hover:bg-slate-300 cursor-pointer'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/30 cursor-pointer'
                }`}
                title={canManageAttendance ? (selectedCandidate.status === 'checked_in' ? 'Undo Check-In' : 'Mark Checked-In') : 'Restricted: Only University Administrators and Faculty can mark attendance'}
              >
                <Check className="w-4 h-4" />
                <span>{selectedCandidate.status === 'checked_in' ? 'Undo Check-In' : 'Mark Checked-In'}</span>
              </button>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold text-xs hover:bg-slate-900 transition-colors"
              >
                Close Pass
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Manual On-Spot Registration Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Club Desk Administration
                </span>
                <h3 className="font-heading font-bold text-xl text-white mt-1">
                  On-Spot Candidate Registration
                </h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleManualRegisterSubmit} className="p-6 space-y-4 text-xs">
              
              {manualError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                  {manualError}
                </div>
              )}

              {/* Event Select */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Event <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={manualForm.eventId}
                  onChange={e => setManualForm({ ...manualForm, eventId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.startDate} • {ev.venue})
                    </option>
                  ))}
                </select>
              </div>

              {/* Enrollment Number & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Enrollment No. / Student ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UNI-2024-CS089"
                    value={manualForm.studentId}
                    onChange={e => setManualForm({ ...manualForm, studentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={manualForm.phone}
                    onChange={e => setManualForm({ ...manualForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={manualForm.userName}
                    onChange={e => setManualForm({ ...manualForm, userName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    MITS Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. 0901cs231055@mitsgwl.ac.in"
                    value={manualForm.userEmail}
                    onChange={e => setManualForm({ ...manualForm, userEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Department & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={manualForm.department}
                    onChange={e => setManualForm({ ...manualForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Data Science & AI">Data Science & AI</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
                  <select
                    value={manualForm.year}
                    onChange={e => setManualForm({ ...manualForm, year: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Administrative Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Verified university ID card at entry gate"
                  value={manualForm.notes}
                  onChange={e => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
                >
                  {manualSubmitting ? 'Registering...' : 'Confirm Registration & Dispatch Pass'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Dedicated Event Attendance & Certificate Modal */}
      {attendanceModalEvent && (
        <EventAttendanceModal
          initialEvent={attendanceModalEvent}
          allEvents={events}
          onClose={() => {
            setAttendanceModalEvent(null);
            fetchRegistrations();
          }}
          currentUser={currentUser}
          accessToken={accessToken}
          onOpenGoogleDrive={onOpenGoogleDrive}
          onRefreshEvents={fetchRegistrations}
        />
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
