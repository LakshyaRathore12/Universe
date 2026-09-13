export type UserRole = 'student' | 'club_organizer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  studentId?: string;
  department?: string;
  year?: string;
  clubId?: string; // If club organizer
  clubName?: string;
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
  facultyAdvisor: string;
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
  studentId?: string;
  department?: string;
  ticketCode: string;
  registeredAt: string;
  status: 'confirmed' | 'checked_in' | 'cancelled';
  qrCodeUrl?: string;
  emailSent: boolean;
  emailSentAt?: string;
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
  type: 'registration_confirmation' | 'schedule_change' | 'event_reminder' | 'organizer_announcement' | 'cancellation';
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
