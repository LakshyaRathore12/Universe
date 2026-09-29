export type UserRole = 'student' | 'faculty' | 'club_organizer' | 'admin' | 'master_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  isMasterControl?: boolean;
  studentId?: string;
  facultyId?: string;
  designation?: string; // e.g. 'Professor', 'Associate Professor', 'Assistant Professor', 'Faculty Advisor', 'Head of Department'
  phone?: string;
  department?: string;
  year?: string;
  clubId?: string; // If club organizer
  clubName?: string;
}

export interface ClubMember {
  id: string;
  clubId: string;
  userId: string;
  userName: string;
  userEmail: string;
  studentId?: string;
  phone?: string;
  department?: string;
  year?: string;
  role: 'leader' | 'co_leader' | 'member';
  roleTitle?: string; // e.g. "Club President", "Technical Convener", "Core Member"
  status: 'active' | 'pending'; // Pending requests can only be approved by Faculty
  requestedAt?: string;
  joinedAt?: string; // Exact timestamp when member joined
  approvedBy?: string; // Faculty member name
  approvedAt?: string;
}

export interface ClubAdminInfo {
  id: string;
  name: string;
  email: string;
  enrollmentNo: string;
  phone: string;
  year: string; // e.g., '1st Year', '2nd Year', '3rd Year', '4th Year'
  department?: string;
  roleTitle?: string; // e.g. 'President / Convener', 'Vice Lead', 'Technical Head'
  addedAt?: string;
  addedBy?: string;
}

export interface Club {
  id: string;
  name: string;
  category: 'Technical' | 'Cultural' | 'Literary' | 'Sports' | 'Social' | 'Academic';
  description: string;
  logo: string;
  bannerImage: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  leadEnrollmentNo?: string;
  leadYear?: string;
  admins: ClubAdminInfo[];
  members?: ClubMember[];
  facultyAdvisor: string;
  facultyAdvisorEmail?: string;
  memberCount: number;
  eventsHosted: number;
  foundedYear: number;
  isVerified: boolean;
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
    website?: string;
    discord?: string;
  };
}

export type EventCategory = 
  | 'Workshop' 
  | 'Seminar' 
  | 'Hackathon' 
  | 'Guest Lecture' 
  | 'Cultural' 
  | 'Tech Talk' 
  | 'Competition' 
  | 'Webinar';

export interface AgendaItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  speaker?: string;
}

export interface UniversityVenue {
  id: string;
  name: string;
  building: string;
  capacity: number;
  facilities: string[];
}

export interface UniversityEvent {
  id: string;
  title: string;
  tagline: string;
  description: string;
  clubId: string;
  clubName: string;
  clubLogo: string;
  category: EventCategory;
  coverImage: string;
  startDate: string; // ISO or YYYY-MM-DD
  startTime: string; // HH:MM
  endDate: string;
  endTime: string;
  venue: string; // e.g. "Main Auditorium, Block C"
  venueId?: string;
  isOnline: boolean;
  meetingLink?: string;
  capacity: number;
  registeredCount: number;
  registrationDeadline: string;
  fee: number; // 0 for free
  tags: string[];
  speakers: {
    name: string;
    role: string;
    companyOrCollege: string;
    avatar: string;
  }[];
  agenda: AgendaItem[];
  prerequisites?: string[];
  certificatesProvided: boolean;
  facultyCoordinator?: string; // Faculty Coordinator / Academic Advisor name
  facultyCoordinatorEmail?: string;
  facultyCoordinatorDept?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  contactEmail: string;
  createdAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  studentId?: string; // Enrollment / Roll Number
  phone?: string;     // Phone Number (e.g. +91 98765 43210)
  department?: string;
  year?: string;
  ticketCode: string;
  registeredAt: string;
  status: 'confirmed' | 'checked_in' | 'cancelled';
  checkedInAt?: string;
  qrCodeUrl?: string;
  emailSent: boolean;
  emailSentAt?: string;
  reminderSent?: boolean;
  reminderSentAt?: string;
  notes?: string;
  event?: UniversityEvent;
  // Attendance & Participation Certificate Fields
  attendanceStatus?: 'present' | 'absent' | 'unmarked';
  attendanceMarkedAt?: string;
  attendanceMarkedBy?: string;
  certificateId?: string;
  certificateIssuedAt?: string;
  certificateEmailSent?: boolean;
  certificateEmailSentAt?: string;
  certificateUrl?: string;
}

export interface ParticipationCertificate {
  id: string; // e.g. CERT-2026-CS-8921
  registrationId: string;
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  clubId: string;
  clubName: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  studentId: string;
  department: string;
  year?: string;
  issuedAt: string;
  issuedBy: string;
  signatories: {
    name: string;
    title: string;
    organization: string;
  }[];
  verificationHash: string;
  qrCodeUrl: string;
}

export interface EventAttendanceStats {
  eventId: string;
  totalRegistered: number;
  presentCount: number;
  absentCount: number;
  unmarkedCount: number;
  attendanceRate: number; // percentage
  certificatesIssuedCount: number;
}

export interface EmailNotification {
  id: string;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  htmlContent: string;
  plainText: string;
  type: 'registration_confirmation' | 'schedule_change' | 'event_reminder' | 'organizer_announcement' | 'cancellation' | 'participation_certificate';
  eventId?: string;
  eventTitle?: string;
  ticketCode?: string;
  sentAt: string;
  read: boolean;
  deliveryStatus: 'delivered' | 'bounced' | 'opened';
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'alert';
  link?: string;
  createdAt: string;
  read: boolean;
  eventId?: string;
}

export interface EventFilter {
  search: string;
  category: string;
  clubId: string;
  dateRange: 'all' | 'today' | 'this_week' | 'this_month' | 'past';
  status: 'all' | 'upcoming' | 'ongoing' | 'completed';
}
