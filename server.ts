import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_CLUBS, INITIAL_EVENTS, INITIAL_USERS, INITIAL_VENUES } from './src/data/mockInitialData.js';
import { Club, EmailNotification, InAppNotification, Registration, UniversityEvent, UniversityVenue, User } from './src/types.js';
import { generateBroadcastAnnouncementHtml, generateRegistrationEmailHtml, generateScheduleChangeEmailHtml } from './src/utils/emailTemplates.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database State (simulating MongoDB / MERN datastore)
let users: User[] = [...INITIAL_USERS];
let clubs: Club[] = [...INITIAL_CLUBS];
let events: UniversityEvent[] = [...INITIAL_EVENTS];
let venues: UniversityVenue[] = [...INITIAL_VENUES];
let registrations: Registration[] = [];
let emails: EmailNotification[] = [];
let inAppNotifications: InAppNotification[] = [];

// Seed initial registrations for demo Aarav Sharma
const aarav = users.find(u => u.email === 'aarav.sharma@campus.edu')!;
if (events[0]) {
  const tkt1 = 'TKT-2026-AI-8192';
  registrations.push({
    id: 'reg-demo-1',
    eventId: events[0].id,
    userId: aarav.id,
    userName: aarav.name,
    userEmail: aarav.email,
    studentId: aarav.studentId,
    department: aarav.department,
    ticketCode: tkt1,
    registeredAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'confirmed',
    emailSent: true,
    emailSentAt: new Date(Date.now() - 3600000 * 5).toISOString()
  });

  const mail1 = generateRegistrationEmailHtml({
    studentName: aarav.name,
    studentEmail: aarav.email,
    studentId: aarav.studentId,
    event: events[0],
    ticketCode: tkt1,
    registeredAt: new Date(Date.now() - 3600000 * 5).toISOString()
  });

  emails.push({
    id: 'mail-demo-1',
    recipientEmail: aarav.email,
    recipientName: aarav.name,
    senderName: events[0].clubName,
    senderEmail: events[0].contactEmail,
    subject: mail1.subject,
    htmlContent: mail1.html,
    plainText: mail1.text,
    type: 'registration_confirmation',
    eventId: events[0].id,
    eventTitle: events[0].title,
    ticketCode: tkt1,
    sentAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    read: false,
    deliveryStatus: 'delivered'
  });

  inAppNotifications.push({
    id: 'notif-demo-1',
    userId: aarav.id,
    title: 'Registration Confirmed!',
    message: `You are booked for ${events[0].title}. Check your inbox for your pass.`,
    type: 'success',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    read: false,
    eventId: events[0].id
  });
}

// SSE Clients for real-time push
const sseClients: Response[] = [];

function broadcastSSE(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const res = sseClients[i];
    try {
      res.write(payload);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

// Dispatch Email & Notification Helper
function dispatchEmailAndNotification(params: {
  recipientEmail: string;
  recipientName: string;
  userId?: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  htmlContent: string;
  plainText: string;
  type: EmailNotification['type'];
  eventId?: string;
  eventTitle?: string;
  ticketCode?: string;
  notificationTitle?: string;
  notificationMessage?: string;
}) {
  const emailId = `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newEmail: EmailNotification = {
    id: emailId,
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName,
    senderName: params.senderName,
    senderEmail: params.senderEmail,
    subject: params.subject,
    htmlContent: params.htmlContent,
    plainText: params.plainText,
    type: params.type,
    eventId: params.eventId,
    eventTitle: params.eventTitle,
    ticketCode: params.ticketCode,
    sentAt: new Date().toISOString(),
    read: false,
    deliveryStatus: 'delivered'
  };

  emails.unshift(newEmail);

  if (params.userId) {
    const notif: InAppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: params.userId,
      title: params.notificationTitle || params.subject,
      message: params.notificationMessage || `New email notification from ${params.senderName}`,
      type: params.type === 'cancellation' ? 'alert' : params.type === 'schedule_change' ? 'warning' : 'success',
      createdAt: new Date().toISOString(),
      read: false,
      eventId: params.eventId
    };
    inAppNotifications.unshift(notif);
  }

  // Real-time broadcast to connected SSE clients
  broadcastSSE('email_sent', { email: newEmail, recipientEmail: params.recipientEmail });
  return newEmail;
}

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

// SSE Stream for Real-time Notifications
app.get('/api/notifications/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('event: connected\ndata: {"status":"connected"}\n\n');
  sseClients.push(res);

  req.on('close', () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) sseClients.splice(index, 1);
  });
});

// Authentication Routes
app.get('/api/auth/users', (req: Request, res: Response) => {
  res.json({ success: true, users });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found with this email' });
  }
  res.json({ success: true, user });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, role, studentId, department, year, clubName, clubCategory, clubDescription } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ success: false, message: 'Name, email, and role are required' });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
  }

  let assignedClubId = undefined;
  let assignedClubName = undefined;

  // If registering as Club Organizer, create the club too!
  if (role === 'club_organizer') {
    const newClubId = `club-${Date.now()}`;
    const newClub: Club = {
      id: newClubId,
      name: clubName || `${name}'s Society`,
      category: clubCategory || 'Technical',
      description: clubDescription || 'Newly registered university student club.',
      logo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      bannerImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&auto=format&fit=crop&q=80',
      leadName: name,
      leadEmail: email,
      facultyAdvisor: 'Pending Department Review',
      memberCount: 15,
      eventsHosted: 0,
      foundedYear: new Date().getFullYear(),
      isVerified: true
    };
    clubs.push(newClub);
    assignedClubId = newClubId;
    assignedClubName = newClub.name;
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    role,
    avatar: `https://images.unsplash.com/photo-${role === 'club_organizer' ? '1534528741775-53994a69daeb' : '1535713875002-d1d0cf377fde'}?w=120&auto=format&fit=crop&q=80`,
    studentId: studentId || (role === 'student' ? `UNI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` : undefined),
    department: department || 'General Studies',
    year: year || '1st Year',
    clubId: assignedClubId,
    clubName: assignedClubName
  };

  users.push(newUser);
  res.json({ success: true, user: newUser });
});

// Clubs Routes
app.get('/api/clubs', (req: Request, res: Response) => {
  res.json({ success: true, clubs });
});

app.post('/api/clubs', (req: Request, res: Response) => {
  const { name, category, description, leadName, leadEmail, facultyAdvisor } = req.body;
  if (!name || !leadEmail) {
    return res.status(400).json({ success: false, message: 'Club name and lead email are required' });
  }

  const newClub: Club = {
    id: `club-${Date.now()}`,
    name,
    category: category || 'Technical',
    description: description || 'University student association.',
    logo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&auto=format&fit=crop&q=80',
    leadName: leadName || 'Student Convener',
    leadEmail,
    facultyAdvisor: facultyAdvisor || 'Campus Faculty Incharge',
    memberCount: 20,
    eventsHosted: 0,
    foundedYear: new Date().getFullYear(),
    isVerified: true
  };

  clubs.push(newClub);
  res.json({ success: true, club: newClub });
});

// Venues
app.get('/api/venues', (req: Request, res: Response) => {
  res.json({ success: true, venues });
});

// Events Routes
app.get('/api/events', (req: Request, res: Response) => {
  const { search, category, clubId, status } = req.query;
  let filtered = [...events];

  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    filtered = filtered.filter(e => 
      e.title.toLowerCase().includes(s) || 
      e.description.toLowerCase().includes(s) ||
      e.tags.some(t => t.toLowerCase().includes(s)) ||
      e.venue.toLowerCase().includes(s)
    );
  }

  if (category && typeof category === 'string' && category !== 'All') {
    filtered = filtered.filter(e => e.category.toLowerCase() === category.toLowerCase());
  }

  if (clubId && typeof clubId === 'string' && clubId !== 'all') {
    filtered = filtered.filter(e => e.clubId === clubId);
  }

  if (status && typeof status === 'string' && status !== 'all') {
    filtered = filtered.filter(e => e.status === status);
  }

  // Sort by start date ascending
  filtered.sort((a, b) => new Date(`${a.startDate}T${a.startTime}`).getTime() - new Date(`${b.startDate}T${b.startTime}`).getTime());

  res.json({ success: true, events: filtered });
});

app.get('/api/events/:id', (req: Request, res: Response) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  res.json({ success: true, event });
});

// Schedule / Host New Event
app.post('/api/events', (req: Request, res: Response) => {
  const {
    title, tagline, description, clubId, category,
    coverImage, startDate, startTime, endDate, endTime,
    venue, venueId, capacity, fee, tags, speakers, agenda,
    certificatesProvided, contactEmail
  } = req.body;

  if (!title || !startDate || !startTime || !venue) {
    return res.status(400).json({ success: false, message: 'Title, date, start time, and venue are required.' });
  }

  const club = clubs.find(c => c.id === clubId) || clubs[0];

  const newEvent: UniversityEvent = {
    id: `evt-${Date.now()}`,
    title,
    tagline: tagline || 'University Academic & Club Session',
    description: description || 'No detailed description provided.',
    clubId: club.id,
    clubName: club.name,
    clubLogo: club.logo,
    category: category || 'Workshop',
    coverImage: coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80',
    startDate,
    startTime,
    endDate: endDate || startDate,
    endTime: endTime || '17:00',
    venue,
    venueId,
    isOnline: venue.toLowerCase().includes('zoom') || venue.toLowerCase().includes('online'),
    capacity: Number(capacity) || 100,
    registeredCount: 0,
    registrationDeadline: startDate,
    fee: Number(fee) || 0,
    tags: tags && Array.isArray(tags) ? tags : ['Campus', category || 'Workshop'],
    speakers: speakers && Array.isArray(speakers) ? speakers : [],
    agenda: agenda && Array.isArray(agenda) ? agenda : [],
    certificatesProvided: !!certificatesProvided,
    status: 'upcoming',
    contactEmail: contactEmail || club.leadEmail,
    createdAt: new Date().toISOString()
  };

  events.push(newEvent);

  // Increment club events count
  club.eventsHosted += 1;

  // Broadcast real-time schedule update
  broadcastSSE('event_created', { event: newEvent });

  res.json({ success: true, event: newEvent });
});

// Edit / Reschedule Event (Triggers Automatic Real-Time Email to Attendees!)
app.put('/api/events/:id', (req: Request, res: Response) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  const oldDate = event.startDate;
  const oldTime = event.startTime;
  const oldVenue = event.venue;

  // Update properties
  Object.assign(event, req.body);

  const isRescheduled = (oldDate !== event.startDate || oldTime !== event.startTime || oldVenue !== event.venue);
  const changeNote = req.body.rescheduleReason || `Event venue or schedule changed to: ${event.startDate} at ${event.startTime}, Location: ${event.venue}`;

  // If rescheduled, automatically notify all registered attendees via real-time email!
  if (isRescheduled) {
    const eventRegs = registrations.filter(r => r.eventId === event.id && r.status === 'confirmed');
    eventRegs.forEach(reg => {
      const emailContent = generateScheduleChangeEmailHtml({
        studentName: reg.userName,
        studentEmail: reg.userEmail,
        event,
        changeNote
      });

      dispatchEmailAndNotification({
        recipientEmail: reg.userEmail,
        recipientName: reg.userName,
        userId: reg.userId,
        senderName: event.clubName,
        senderEmail: event.contactEmail,
        subject: emailContent.subject,
        htmlContent: emailContent.html,
        plainText: emailContent.text,
        type: 'schedule_change',
        eventId: event.id,
        eventTitle: event.title,
        notificationTitle: `Schedule Update: ${event.title}`,
        notificationMessage: changeNote
      });
    });
  }

  broadcastSSE('event_updated', { event, isRescheduled });
  res.json({ success: true, event, attendeesNotified: isRescheduled });
});

// Cancel Event
app.delete('/api/events/:id', (req: Request, res: Response) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  event.status = 'cancelled';

  // Notify registered attendees
  const eventRegs = registrations.filter(r => r.eventId === event.id && r.status === 'confirmed');
  eventRegs.forEach(reg => {
    dispatchEmailAndNotification({
      recipientEmail: reg.userEmail,
      recipientName: reg.userName,
      userId: reg.userId,
      senderName: event.clubName,
      senderEmail: event.contactEmail,
      subject: `[CANCELLED] ${event.title} has been cancelled`,
      htmlContent: `<p>Dear ${reg.userName},</p><p>We regret to inform you that <strong>${event.title}</strong> has been cancelled by ${event.clubName}. Any queries can be directed to ${event.contactEmail}.</p>`,
      plainText: `Dear ${reg.userName}, ${event.title} has been cancelled by ${event.clubName}.`,
      type: 'cancellation',
      eventId: event.id,
      eventTitle: event.title,
      notificationTitle: `Cancelled: ${event.title}`,
      notificationMessage: `Event cancelled by organizing club.`
    });
  });

  broadcastSSE('event_cancelled', { eventId: event.id });
  res.json({ success: true, message: 'Event cancelled and attendees notified' });
});

// RSVP / Event Registration (Creates Ticket + Sends Instant Real-Time Email)
app.post('/api/events/:id/register', (req: Request, res: Response) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  if (event.status === 'cancelled') {
    return res.status(400).json({ success: false, message: 'This event has been cancelled.' });
  }

  if (event.registeredCount >= event.capacity) {
    return res.status(400).json({ success: false, message: 'Event capacity is full!' });
  }

  const { userId, userName, userEmail, studentId, department } = req.body;
  if (!userEmail) {
    return res.status(400).json({ success: false, message: 'User email is required' });
  }

  // Check duplicate registration
  const existing = registrations.find(r => r.eventId === event.id && r.userEmail.toLowerCase() === userEmail.toLowerCase() && r.status === 'confirmed');
  if (existing) {
    return res.status(400).json({ success: false, message: 'You have already registered for this event! Your ticket is in your profile.' });
  }

  const cleanCategoryCode = event.category.substring(0, 2).toUpperCase();
  const randomPin = Math.floor(1000 + Math.random() * 9000);
  const ticketCode = `TKT-${new Date().getFullYear()}-${cleanCategoryCode}-${randomPin}`;

  const registration: Registration = {
    id: `reg-${Date.now()}`,
    eventId: event.id,
    userId: userId || 'guest-user',
    userName: userName || userEmail.split('@')[0],
    userEmail,
    studentId,
    department,
    ticketCode,
    registeredAt: new Date().toISOString(),
    status: 'confirmed',
    emailSent: true,
    emailSentAt: new Date().toISOString()
  };

  registrations.push(registration);
  event.registeredCount += 1;

  // Generate & Dispatch Real-Time Email
  const emailContent = generateRegistrationEmailHtml({
    studentName: registration.userName,
    studentEmail: registration.userEmail,
    studentId: registration.studentId,
    event,
    ticketCode,
    registeredAt: registration.registeredAt
  });

  const dispatchedEmail = dispatchEmailAndNotification({
    recipientEmail: registration.userEmail,
    recipientName: registration.userName,
    userId: registration.userId,
    senderName: event.clubName,
    senderEmail: event.contactEmail,
    subject: emailContent.subject,
    htmlContent: emailContent.html,
    plainText: emailContent.text,
    type: 'registration_confirmation',
    eventId: event.id,
    eventTitle: event.title,
    ticketCode,
    notificationTitle: `Ticket Confirmed: ${event.title}`,
    notificationMessage: `Your seat is confirmed with ticket ID ${ticketCode}. Confirmation email sent!`
  });

  // Real-time broadcast
  broadcastSSE('registration_created', {
    eventId: event.id,
    registeredCount: event.registeredCount,
    registration
  });

  res.json({
    success: true,
    message: 'Registration successful! Confirmation email has been sent to your university inbox.',
    registration,
    email: dispatchedEmail
  });
});

// Cancel Registration
app.delete('/api/events/:id/register', (req: Request, res: Response) => {
  const { userEmail } = req.body;
  const regIndex = registrations.findIndex(r => r.eventId === req.params.id && r.userEmail.toLowerCase() === (userEmail || '').toLowerCase() && r.status === 'confirmed');

  if (regIndex === -1) {
    return res.status(404).json({ success: false, message: 'Registration record not found' });
  }

  registrations[regIndex].status = 'cancelled';
  const event = events.find(e => e.id === req.params.id);
  if (event && event.registeredCount > 0) {
    event.registeredCount -= 1;
  }

  res.json({ success: true, message: 'Registration cancelled successfully.' });
});

// Get User Registrations
app.get('/api/registrations/user/:userId', (req: Request, res: Response) => {
  const userRegs = registrations.filter(r => r.userId === req.params.userId || r.userEmail === req.query.email);
  const detailedRegs = userRegs.map(reg => {
    const event = events.find(e => e.id === reg.eventId);
    return { ...reg, event };
  });
  res.json({ success: true, registrations: detailedRegs });
});

// Get Event Attendees (Organizer View)
app.get('/api/events/:id/attendees', (req: Request, res: Response) => {
  const eventRegs = registrations.filter(r => r.eventId === req.params.id);
  res.json({ success: true, attendees: eventRegs });
});

// Check-in Attendee by QR/Ticket Code
app.post('/api/events/:id/checkin', (req: Request, res: Response) => {
  const { ticketCode } = req.body;
  const reg = registrations.find(r => r.eventId === req.params.id && r.ticketCode.trim() === (ticketCode || '').trim());

  if (!reg) {
    return res.status(404).json({ success: false, message: 'Ticket code not recognized for this event.' });
  }

  if (reg.status === 'checked_in') {
    return res.status(400).json({ success: false, message: `Ticket ${ticketCode} already checked in!`, checkedInAt: reg.registeredAt });
  }

  reg.status = 'checked_in';
  res.json({ success: true, message: `Check-in confirmed for ${reg.userName}!`, attendee: reg });
});

// Broadcast Email to All Attendees
app.post('/api/events/:id/broadcast', (req: Request, res: Response) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  const { announcementTitle, announcementBody } = req.body;
  if (!announcementTitle || !announcementBody) {
    return res.status(400).json({ success: false, message: 'Announcement title and body are required' });
  }

  const attendees = registrations.filter(r => r.eventId === event.id && r.status === 'confirmed');
  if (attendees.length === 0) {
    return res.json({ success: true, message: 'No registered attendees to notify yet.', count: 0 });
  }

  attendees.forEach(att => {
    const emailData = generateBroadcastAnnouncementHtml({
      studentName: att.userName,
      studentEmail: att.userEmail,
      eventTitle: event.title,
      clubName: event.clubName,
      announcementTitle,
      announcementBody
    });

    dispatchEmailAndNotification({
      recipientEmail: att.userEmail,
      recipientName: att.userName,
      userId: att.userId,
      senderName: event.clubName,
      senderEmail: event.contactEmail,
      subject: emailData.subject,
      htmlContent: emailData.html,
      plainText: emailData.text,
      type: 'organizer_announcement',
      eventId: event.id,
      eventTitle: event.title,
      notificationTitle: `Announcement: ${announcementTitle}`,
      notificationMessage: `${event.clubName}: ${announcementTitle}`
    });
  });

  res.json({
    success: true,
    message: `Broadcast delivered in real-time to all ${attendees.length} registered attendee(s).`,
    recipientCount: attendees.length
  });
});

// Get User's Email Inbox / Sent Emails
app.get('/api/emails', (req: Request, res: Response) => {
  const { email } = req.query;
  let result = [...emails];
  if (email && typeof email === 'string') {
    result = result.filter(m => m.recipientEmail.toLowerCase() === email.toLowerCase());
  }
  res.json({ success: true, emails: result });
});

// Mark Email as Read
app.post('/api/emails/:id/read', (req: Request, res: Response) => {
  const mail = emails.find(e => e.id === req.params.id);
  if (mail) mail.read = true;
  res.json({ success: true });
});

// In-App Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  const { userId } = req.query;
  let userNotifs = [...inAppNotifications];
  if (userId && typeof userId === 'string') {
    userNotifs = userNotifs.filter(n => n.userId === userId);
  }
  res.json({ success: true, notifications: userNotifs });
});

app.post('/api/notifications/mark-read', (req: Request, res: Response) => {
  const { userId } = req.body;
  inAppNotifications.forEach(n => {
    if (!userId || n.userId === userId) n.read = true;
  });
  res.json({ success: true });
});

// Platform Stats
app.get('/api/stats', (req: Request, res: Response) => {
  const totalEvents = events.length;
  const activeWorkshops = events.filter(e => e.category === 'Workshop').length;
  const activeSeminars = events.filter(e => e.category === 'Seminar').length;
  const totalRegistrations = registrations.filter(r => r.status !== 'cancelled').length;
  const totalClubs = clubs.length;
  const emailsDispatched = emails.length;

  res.json({
    success: true,
    stats: {
      totalEvents,
      activeWorkshops,
      activeSeminars,
      totalRegistrations,
      totalClubs,
      emailsDispatched
    }
  });
});

// Download Codebase ZIP Archives (Separated & Full)
app.get('/api/download-zip', (req: Request, res: Response) => {
  const zipPath = path.join(process.cwd(), 'public', 'universe-event-management.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'universe-event-management.zip');
  } else {
    res.status(404).json({ success: false, message: 'Archive file is not available' });
  }
});

app.get('/api/download/frontend', (req: Request, res: Response) => {
  const zipPath = path.join(process.cwd(), 'public', 'frontend.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'universe-frontend.zip');
  } else {
    res.status(404).json({ success: false, message: 'Frontend archive is not available' });
  }
});

app.get('/api/download/backend', (req: Request, res: Response) => {
  const zipPath = path.join(process.cwd(), 'public', 'backend.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'universe-backend.zip');
  } else {
    res.status(404).json({ success: false, message: 'Backend archive is not available' });
  }
});

app.get('/api/download/database', (req: Request, res: Response) => {
  const zipPath = path.join(process.cwd(), 'public', 'database.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'universe-database.zip');
  } else {
    res.status(404).json({ success: false, message: 'Database archive is not available' });
  }
});

app.get('/api/download/all', (req: Request, res: Response) => {
  const zipPath = path.join(process.cwd(), 'public', 'universe-event-management.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'universe-event-management-complete.zip');
  } else {
    res.status(404).json({ success: false, message: 'Complete archive is not available' });
  }
});

// ----------------------------------------------------
// VITE DEV / PRODUCTION MIDDLEWARE
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UniVerse Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
