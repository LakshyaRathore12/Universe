import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_CLUBS, INITIAL_EVENTS, INITIAL_REGISTRATIONS, INITIAL_USERS, INITIAL_VENUES } from './src/data/mockInitialData.js';
import { Club, ClubAdminInfo, EmailNotification, InAppNotification, ParticipationCertificate, EventAttendanceStats, Registration, UniversityEvent, UniversityVenue, User } from './src/types.js';
import { generateBroadcastAnnouncementHtml, generateCertificateEmailHtml, generateEventReminderEmailHtml, generateRegistrationEmailHtml, generateScheduleChangeEmailHtml } from './src/utils/emailTemplates.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database State (simulating MongoDB / MERN datastore)
let users: User[] = [...INITIAL_USERS];
let clubs: Club[] = [...INITIAL_CLUBS];
let events: UniversityEvent[] = [...INITIAL_EVENTS];
let venues: UniversityVenue[] = [...INITIAL_VENUES];
let registrations: Registration[] = [...INITIAL_REGISTRATIONS];
let certificates: ParticipationCertificate[] = [];
let emails: EmailNotification[] = [];
let inAppNotifications: InAppNotification[] = [];

// Seed initial club participants and members with joining timestamps and pending requests
clubs.forEach(c => {
  if (!c.members || c.members.length === 0) {
    c.members = [
      {
        id: `mem-${c.id}-1`,
        clubId: c.id,
        userId: 'user-student-1',
        userName: 'Aarav Sharma',
        userEmail: 'aarav.sharma@mitsgwl.ac.in',
        studentId: '0901CS221089',
        department: 'Computer Science & Engineering',
        year: '3rd Year',
        role: c.id === 'club-coding' ? 'leader' : 'member',
        roleTitle: c.id === 'club-coding' ? 'Club President' : 'Active Member',
        status: 'active',
        joinedAt: new Date(Date.now() - 86400000 * 25).toISOString(),
        approvedBy: 'Prof. Radhika Iyer (Faculty Advisor)',
        approvedAt: new Date(Date.now() - 86400000 * 25).toISOString()
      },
      {
        id: `mem-${c.id}-2`,
        clubId: c.id,
        userId: 'user-student-2',
        userName: 'Sneha Patel',
        userEmail: 'sneha.patel@mitsgwl.ac.in',
        studentId: '0901EC231044',
        department: 'Electronics & Communication',
        year: '2nd Year',
        role: 'member',
        roleTitle: 'Core Technical Member',
        status: 'active',
        joinedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
        approvedBy: 'Prof. Radhika Iyer (Faculty Advisor)',
        approvedAt: new Date(Date.now() - 86400000 * 12).toISOString()
      },
      {
        id: `mem-${c.id}-3`,
        clubId: c.id,
        userId: 'usr-pending-1',
        userName: 'Karthik Iyer',
        userEmail: 'karthik.iyer@mitsgwl.ac.in',
        studentId: '0901CS231055',
        department: 'Computer Science & Engineering',
        year: '2nd Year',
        role: 'member',
        roleTitle: 'Applicant',
        status: 'pending', // Pending faculty acceptance
        requestedAt: new Date(Date.now() - 3600000 * 5).toISOString()
      }
    ];
  }
});

// Seed an event starting in ~55 minutes to showcase the 1-hour automated reminder
const upcomingDate = new Date(Date.now() + 55 * 60 * 1000);
const padZero = (n: number) => String(n).padStart(2, '0');
const upcomingDateStr = `${upcomingDate.getFullYear()}-${padZero(upcomingDate.getMonth() + 1)}-${padZero(upcomingDate.getDate())}`;
const upcomingTimeStr = `${padZero(upcomingDate.getHours())}:${padZero(upcomingDate.getMinutes())}`;
const endDateObj = new Date(upcomingDate.getTime() + 2 * 3600 * 1000);
const endTimeStr = `${padZero(endDateObj.getHours())}:${padZero(endDateObj.getMinutes())}`;

const upcomingReminderEvent: UniversityEvent = {
  id: 'evt-starting-soon',
  title: 'MITS Hands-on React 19 & Web Architecture Masterclass',
  tagline: 'Starting in 1 hour! Practical code lab at Madhav IT Park Supercomputer Lab.',
  description: 'Fast-track masterclass scheduled to start in 1 hour. MITS students will profile React render passes, test React Server Components, and benchmark sub-millisecond hydration. Laptops required.',
  clubId: 'club-iste',
  clubName: 'ISTE Students\' Chapter MITS',
  clubLogo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80',
  category: 'Workshop',
  coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1000&auto=format&fit=crop&q=80',
  startDate: upcomingDateStr,
  startTime: upcomingTimeStr,
  endDate: upcomingDateStr,
  endTime: endTimeStr,
  venue: 'Madhav IT Park Supercomputer Lab 402',
  venueId: 'venue-2',
  isOnline: false,
  capacity: 75,
  registeredCount: 1,
  registrationDeadline: upcomingDateStr,
  fee: 0,
  tags: ['React', 'MITS Gwalior', 'Performance', '1-Hour Alert'],
  speakers: [
    {
      name: 'Devansh Sharma',
      role: 'Lead Architect & Tech Convener',
      companyOrCollege: 'ISTE MITS Chapter',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80'
    }
  ],
  agenda: [
    { id: 'ag-1', time: upcomingTimeStr, title: 'Opening & Setup Verification' },
    { id: 'ag-2', time: `${padZero(upcomingDate.getHours())}:30`, title: 'React Compiler Deep Dive' }
  ],
  certificatesProvided: true,
  facultyCoordinator: 'Prof. Radhika Iyer',
  facultyCoordinatorEmail: 'radhika.iyer@mitsgwalior.in',
  facultyCoordinatorDept: 'Department of Computer Science & Engineering',
  status: 'upcoming',
  contactEmail: 'iste@mitsgwl.ac.in',
  createdAt: new Date().toISOString()
};
events.unshift(upcomingReminderEvent);

// Seed initial registrations for demo Aarav Sharma
const aarav = users.find(u => u.email === 'aarav.sharma@mitsgwl.ac.in')!;
if (aarav) {
  if (!registrations.some(r => r.id === 'reg-demo-soon-1')) {
    registrations.push({
      id: 'reg-demo-soon-1',
      eventId: 'evt-starting-soon',
      userId: aarav.id,
      userName: aarav.name,
      userEmail: aarav.email,
      studentId: aarav.studentId,
      department: aarav.department,
      year: aarav.year,
      ticketCode: 'MITS-2026-WO-9012',
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
        `MITS-EVENT-PASS:MITS-2026-WO-9012:evt-starting-soon:${aarav.email}`
      )}`,
      registeredAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'confirmed',
      emailSent: true,
      emailSentAt: new Date(Date.now() - 3600000).toISOString(),
      reminderSent: false
    });
  }
}
if (events[0] && aarav) {
  const tkt1 = 'MITS-2026-HK-8192';
  let reg1 = registrations.find(r => r.id === 'reg-demo-1');
  if (!reg1) {
    reg1 = {
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
    };
    registrations.push(reg1);
  }

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

// Ensure every registration has an initial attendanceStatus
registrations.forEach(r => {
  if (!r.attendanceStatus) {
    r.attendanceStatus = r.status === 'checked_in' ? 'present' : 'unmarked';
  }
});

// Seed an initial verified attendance and certificate for student Aarav Sharma on an event
if (events[0] && aarav) {
  const reg1 = registrations.find(r => r.id === 'reg-demo-1');
  if (reg1) {
    reg1.attendanceStatus = 'present';
    reg1.status = 'checked_in';
    reg1.checkedInAt = new Date(Date.now() - 3600000 * 3).toISOString();
    reg1.attendanceMarkedBy = 'Prof. Radhika Iyer (Faculty Advisor)';
    reg1.certificateId = 'CERT-2026-AI-8192';
    reg1.certificateIssuedAt = new Date(Date.now() - 3600000 * 2).toISOString();

    const seedCert: ParticipationCertificate = {
      id: 'CERT-2026-AI-8192',
      registrationId: reg1.id,
      eventId: events[0].id,
      eventTitle: events[0].title,
      eventCategory: events[0].category,
      eventDate: events[0].startDate,
      eventTime: `${events[0].startTime} - ${events[0].endTime}`,
      eventVenue: events[0].venue,
      clubId: events[0].clubId,
      clubName: events[0].clubName,
      userId: aarav.id,
      studentName: aarav.name,
      studentEmail: aarav.email,
      studentId: aarav.studentId || 'UNI-2023-CS089',
      department: aarav.department || 'Computer Science & Engineering',
      year: aarav.year || '3rd Year',
      issuedAt: reg1.certificateIssuedAt,
      issuedBy: 'Devansh Sharma (ISTE MITS Lead) & Faculty Council',
      signatories: [
        { name: 'Prof. Radhika Iyer', title: 'Faculty Advisor', organization: 'Department of CSE, MITS Gwalior' },
        { name: 'Devansh Sharma', title: 'Chapter President', organization: 'ISTE Students\' Chapter MITS' },
        { name: 'Dr. Anandita Sen', title: 'Dean of Academic Affairs', organization: 'MITS Academic Senate' }
      ],
      verificationHash: 'SHA256-MITS-8A9F43B21E0994-GWL',
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent('MITS-CERT:CERT-MITS-2026-CC-8192:aarav.sharma@mitsgwl.ac.in')}`
    };
    certificates.push(seedCert);
  }
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

// Helper to parse event start timestamp
function getEventStartTimestamp(event: UniversityEvent): number | null {
  try {
    if (!event.startDate) return null;
    let dateStr = event.startDate;
    if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }
    const timeStr = event.startTime || '09:00';
    const [hh, mm] = timeStr.split(':').map(n => parseInt(n, 10));
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day, isNaN(hh) ? 9 : hh, isNaN(mm) ? 0 : mm, 0);
      return d.getTime();
    }
    const fallback = new Date(`${dateStr} ${timeStr}`);
    if (!isNaN(fallback.getTime())) return fallback.getTime();
    return null;
  } catch {
    return null;
  }
}

// ----------------------------------------------------
// AUTOMATED 1-HOUR EVENT REMINDER ENGINE
// Regularly scans all confirmed registrations and sends
// Email and Push Notification when an event is starting
// in approximately 1 hour (0 to 65 minutes ahead)
// ----------------------------------------------------
function checkAndTriggerEventReminders() {
  const now = Date.now();
  let dispatchedCount = 0;
  const dispatchedDetails: Array<{ registrationId: string; userEmail: string; eventTitle: string; minutesLeft: number }> = [];

  for (const reg of registrations) {
    if (reg.status !== 'confirmed') continue;
    if (reg.reminderSent) continue;

    const event = events.find(e => e.id === reg.eventId);
    if (!event || event.status === 'cancelled') continue;

    const startTs = getEventStartTimestamp(event);
    if (!startTs) continue;

    const diffMs = startTs - now;
    const diffMinutes = diffMs / (60 * 1000);

    // Trigger when event starts within 65 minutes (and in the future, diffMinutes > 0)
    if (diffMinutes > 0 && diffMinutes <= 65) {
      reg.reminderSent = true;
      reg.reminderSentAt = new Date().toISOString();

      const roundedMins = Math.max(1, Math.round(diffMinutes));
      const reminderEmail = generateEventReminderEmailHtml({
        studentName: reg.userName,
        studentEmail: reg.userEmail,
        studentId: reg.studentId,
        event,
        ticketCode: reg.ticketCode,
        minutesLeft: roundedMins
      });

      const emailObj = dispatchEmailAndNotification({
        recipientEmail: reg.userEmail,
        recipientName: reg.userName,
        userId: reg.userId,
        senderName: event.clubName,
        senderEmail: event.contactEmail,
        subject: reminderEmail.subject,
        htmlContent: reminderEmail.html,
        plainText: reminderEmail.text,
        type: 'event_reminder',
        eventId: event.id,
        eventTitle: event.title,
        ticketCode: reg.ticketCode,
        notificationTitle: `⏰ Event Starting in 1 Hour: ${event.title}`,
        notificationMessage: `Your booked event "${event.title}" starts at ${event.startTime} in ${event.venue}. Bring your student ID and entrance pass!`
      });

      // Broadcast dedicated SSE event for immediate browser push notification
      broadcastSSE('reminder_triggered', {
        type: 'event_reminder',
        registrationId: reg.id,
        userId: reg.userId,
        userEmail: reg.userEmail,
        userName: reg.userName,
        eventId: event.id,
        eventTitle: event.title,
        venue: event.venue,
        startTime: event.startTime,
        ticketCode: reg.ticketCode,
        minutesLeft: roundedMins,
        email: emailObj
      });

      dispatchedCount++;
      dispatchedDetails.push({
        registrationId: reg.id,
        userEmail: reg.userEmail,
        eventTitle: event.title,
        minutesLeft: roundedMins
      });
    }
  }

  return { dispatchedCount, dispatchedDetails };
}

// Background Cron-style runner checking for 1-hour reminders every 30 seconds
setInterval(() => {
  try {
    checkAndTriggerEventReminders();
  } catch (err) {
    console.error('Error running automated reminder check:', err);
  }
}, 30000);

// Run initial check 2 seconds after server boot
setTimeout(() => {
  try {
    checkAndTriggerEventReminders();
  } catch (err) {
    console.error('Error running initial reminder check:', err);
  }
}, 2000);

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

// ----------------------------------------------------
// REMINDER SYSTEM API ENDPOINTS
// ----------------------------------------------------

// Check Reminder Status for user or all registrations
app.get('/api/reminders/status', (req: Request, res: Response) => {
  const { email, userId } = req.query;
  const userRegs = registrations.filter(r => 
    r.status === 'confirmed' && 
    (!email || r.userEmail.toLowerCase() === (email as string).toLowerCase()) &&
    (!userId || r.userId === userId)
  );

  const now = Date.now();
  const statusList = userRegs.map(reg => {
    const event = events.find(e => e.id === reg.eventId);
    const startTs = event ? getEventStartTimestamp(event) : null;
    const diffMs = startTs ? startTs - now : null;
    const diffMinutes = diffMs !== null ? Math.round(diffMs / 60000) : null;
    const isDueWithin1Hour = diffMinutes !== null && diffMinutes > 0 && diffMinutes <= 65;
    
    return {
      registrationId: reg.id,
      ticketCode: reg.ticketCode,
      eventId: reg.eventId,
      eventTitle: event?.title || 'Unknown Event',
      eventVenue: event?.venue,
      startDate: event?.startDate,
      startTime: event?.startTime,
      diffMinutes,
      isDueWithin1Hour,
      reminderSent: !!reg.reminderSent,
      reminderSentAt: reg.reminderSentAt
    };
  });

  res.json({ success: true, count: statusList.length, reminders: statusList });
});

// Manually trigger a scan of all registered events and send any due reminders
app.post('/api/reminders/check', (req: Request, res: Response) => {
  const result = checkAndTriggerEventReminders();
  res.json({
    success: true,
    message: result.dispatchedCount > 0 
      ? `Dispatched ${result.dispatchedCount} 1-hour reminders successfully!` 
      : 'All 1-hour reminders are currently up to date.',
    ...result
  });
});

// Explicitly test/trigger the 1-hour reminder for a specific registration immediately
app.post('/api/reminders/trigger-now/:registrationId', (req: Request, res: Response) => {
  const reg = registrations.find(r => r.id === req.params.registrationId);
  if (!reg) return res.status(404).json({ success: false, message: 'Registration record not found' });
  
  const event = events.find(e => e.id === reg.eventId);
  if (!event) return res.status(404).json({ success: false, message: 'Associated event not found' });

  reg.reminderSent = true;
  reg.reminderSentAt = new Date().toISOString();

  const startTs = getEventStartTimestamp(event);
  const diffMs = startTs ? startTs - Date.now() : 60 * 60 * 1000;
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  const reminderEmail = generateEventReminderEmailHtml({
    studentName: reg.userName,
    studentEmail: reg.userEmail,
    studentId: reg.studentId,
    event,
    ticketCode: reg.ticketCode,
    minutesLeft: diffMinutes > 0 && diffMinutes <= 120 ? diffMinutes : 60
  });

  const emailObj = dispatchEmailAndNotification({
    recipientEmail: reg.userEmail,
    recipientName: reg.userName,
    userId: reg.userId,
    senderName: event.clubName,
    senderEmail: event.contactEmail,
    subject: reminderEmail.subject,
    htmlContent: reminderEmail.html,
    plainText: reminderEmail.text,
    type: 'event_reminder',
    eventId: event.id,
    eventTitle: event.title,
    ticketCode: reg.ticketCode,
    notificationTitle: `⏰ Event Starting in 1 Hour: ${event.title}`,
    notificationMessage: `Your booked event "${event.title}" starts soon at ${event.venue}. Have your digital pass ready!`
  });

  // Broadcast dedicated SSE event for immediate browser push notification
  broadcastSSE('reminder_triggered', {
    type: 'event_reminder',
    registrationId: reg.id,
    userId: reg.userId,
    userEmail: reg.userEmail,
    userName: reg.userName,
    eventId: event.id,
    eventTitle: event.title,
    venue: event.venue,
    startTime: event.startTime,
    ticketCode: reg.ticketCode,
    minutesLeft: diffMinutes > 0 && diffMinutes <= 120 ? diffMinutes : 60,
    email: emailObj
  });

  res.json({
    success: true,
    message: `1-Hour Reminder successfully dispatched to ${reg.userEmail} via Email & Push Notification!`,
    registration: reg,
    email: emailObj
  });
});

// Adjust event time to 55 minutes from now and run reminder check
app.post('/api/reminders/simulate-1hour/:eventId', (req: Request, res: Response) => {
  const event = events.find(e => e.id === req.params.eventId);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  // Schedule event start 55 minutes from right now
  const oneHourFromNow = new Date(Date.now() + 55 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = oneHourFromNow.getFullYear();
  const mm = pad(oneHourFromNow.getMonth() + 1);
  const dd = pad(oneHourFromNow.getDate());
  const hh = pad(oneHourFromNow.getHours());
  const min = pad(oneHourFromNow.getMinutes());

  event.startDate = `${yyyy}-${mm}-${dd}`;
  event.startTime = `${hh}:${min}`;
  
  // Reset reminderSent on event registrations so the worker can fire it
  registrations.filter(r => r.eventId === event.id).forEach(r => {
    r.reminderSent = false;
    delete r.reminderSentAt;
  });

  // Run the automated trigger
  const { dispatchedCount, dispatchedDetails } = checkAndTriggerEventReminders();
  broadcastSSE('event_updated', { event });

  res.json({
    success: true,
    message: `Event "${event.title}" scheduled to start at ${event.startTime} (in ~55 mins). Automated 1-hour reminder triggered!`,
    event,
    dispatchedCount,
    dispatchedDetails
  });
});

// Authentication Routes
app.get('/api/auth/users', (req: Request, res: Response) => {
  res.json({ success: true, users });
});

// Google Authentication Route
app.post('/api/auth/google', (req: Request, res: Response) => {
  const { email, name, photoURL, uid } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Google account email is required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Check if designated Master Control account
  if (isMasterEmail(cleanEmail)) {
    let masterUser = users.find(u => isMasterEmail(u.email) || (u.studentId && isMasterEmail(u.studentId)));
    if (!masterUser) {
      const isLakshya1 = cleanEmail.includes('65') || cleanEmail.includes('1065');
      masterUser = {
        id: `usr-master-${Date.now()}`,
        name: isLakshya1 ? 'Lakshya Rathore' : 'Lakshya Sharma',
        email: isLakshya1 ? '25mc1la65@mitsgwl.ac.in' : '25mc1la66@mitsgwl.ac.in',
        role: 'student',
        studentId: isLakshya1 ? 'BTMC25O1065' : 'BTMC25O1066',
        designation: 'Student',
        department: 'Mathematics and computing',
        year: '2nd Year',
        phone: isLakshya1 ? '+91 98930 11001' : '+91 98930 11002',
        avatar: photoURL || (isLakshya1 
          ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80')
      };
      users.push(masterUser);
    }
    return res.json({ success: true, user: masterUser });
  }

  // 2. Check if existing user with matching email
  const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    if (photoURL && !existing.avatar) {
      existing.avatar = photoURL;
    }
    return res.json({ success: true, user: existing });
  }

  // 3. New Google user registration
  const isFacultyDomain = cleanEmail.endsWith('@mitsgwalior.in');
  const role = isFacultyDomain ? 'faculty' : 'student';

  const newUser: User = {
    id: `usr-google-${Date.now()}`,
    name: name || cleanEmail.split('@')[0],
    email: cleanEmail,
    role,
    studentId: !isFacultyDomain ? cleanEmail.split('@')[0].toUpperCase().slice(0, 12) : undefined,
    facultyId: isFacultyDomain ? `FAC-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
    designation: isFacultyDomain ? 'Faculty Advisor' : 'Student',
    department: isFacultyDomain ? 'Computer Science & Engineering' : 'MITS Gwalior',
    year: !isFacultyDomain ? '2nd Year' : undefined,
    avatar: photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`
  };

  users.push(newUser);
  return res.json({ success: true, user: newUser });
});

// Master Control Clearance Helpers
// Master accounts:
// - Lakshya Rathore (25mc1la65@mitsgwl.ac.in, Enrollment: BTMC25O1065, Mathematics and computing 2nd Year)
// - Lakshya Sharma (25mc1la66@mitsgwl.ac.in, Enrollment: BTMC25O1066, Mathematics and computing 2nd Year)
const isMasterEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    clean === '25mc1la65@mitsgwl.ac.in' ||
    clean === '25mc1la65@mits.gwl.ac.in' ||
    clean === '25mc1la66@mitsgwl.ac.in' ||
    clean === 'btmc25o1065' ||
    clean === 'btmc25o1066' ||
    clean === '25mc1la65' ||
    clean === '25mc1la66'
  );
};

const isMasterReq = (req: Request): boolean => {
  const role = (req.headers['x-user-role'] as string) || req.body?.userRole || (req.query?.role as string) || '';
  const email = (req.headers['x-user-email'] as string) || req.body?.userEmail || (req.query?.userEmail as string) || '';
  if (role === 'master_admin') return true;
  return isMasterEmail(email);
};

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, identifier, role } = req.body;
  const query = (identifier || email || '').trim().toLowerCase();
  if (!query) {
    return res.status(400).json({ success: false, message: 'Please provide MITS email, Enrollment Number, or Faculty ID' });
  }

  // Master Control Instant Access Check - Normal student login with full system controls
  if (isMasterEmail(query) || role === 'master_admin') {
    let masterUser = users.find(u => isMasterEmail(u.email) || (u.studentId && isMasterEmail(u.studentId)));
    if (query) {
      const match = users.find(u => u.email.toLowerCase() === query || (u.studentId && u.studentId.toLowerCase() === query));
      if (match) masterUser = match;
    }
    if (!masterUser) {
      const isLakshya1 = query.includes('65') || query.includes('1065');
      masterUser = {
        id: `usr-master-${Date.now()}`,
        name: isLakshya1 ? 'Lakshya Rathore' : 'Lakshya Sharma',
        email: isLakshya1 ? '25mc1la65@mitsgwl.ac.in' : '25mc1la66@mitsgwl.ac.in',
        role: 'student',
        studentId: isLakshya1 ? 'BTMC25O1065' : 'BTMC25O1066',
        designation: 'Student',
        department: 'Mathematics and computing',
        year: '2nd Year',
        phone: isLakshya1 ? '+91 98930 11001' : '+91 98930 11002',
        avatar: isLakshya1 
          ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'
      };
      users.push(masterUser);
    }
    return res.json({ success: true, user: masterUser });
  }

  // Enforce institutional domain rules when an email address is provided:
  // Faculty & Dean (admin) must use @mitsgwalior.in
  // Students must use @mitsgwl.ac.in
  // Club Organizers can use @mitsgwl.ac.in or @mitsgwalior.in
  if (query.includes('@')) {
    const isFacultyOrDeanDomain = query.endsWith('@mitsgwalior.in');
    const isStudentDomain = query.endsWith('@mitsgwl.ac.in');

    if (!isFacultyOrDeanDomain && !isStudentDomain) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email domain: Official MITS emails must end with @mitsgwalior.in (for Faculty & Dean) or @mitsgwl.ac.in (for Students).' 
      });
    }

    if (role === 'faculty' || role === 'admin') {
      if (!isFacultyOrDeanDomain) {
        return res.status(400).json({
          success: false,
          message: 'Domain Mismatch: Faculty and Dean/Administrator accounts must use the official @mitsgwalior.in domain.'
        });
      }
    } else if (role === 'student') {
      if (!isStudentDomain) {
        return res.status(400).json({
          success: false,
          message: 'Domain Mismatch: Student accounts must use the official institutional @mitsgwl.ac.in domain.'
        });
      }
    }
  }

  let user = users.find(u => 
    u.email.toLowerCase() === query || 
    (u.studentId && u.studentId.toLowerCase() === query) ||
    (u.facultyId && u.facultyId.toLowerCase() === query)
  );

  // If role filter requested and not found with exact match, try finding by matching role and query
  if (!user && role) {
    user = users.find(u => u.role === role && (u.email.toLowerCase().includes(query) || u.name.toLowerCase().includes(query)));
  }

  if (!user) {
    const requiredDomain = (role === 'faculty' || role === 'admin') ? '@mitsgwalior.in' : '@mitsgwl.ac.in';
    return res.status(404).json({ success: false, message: `No ${role || 'MITS'} account found matching "${query}". Ensure your email ends with ${requiredDomain}.` });
  }
  res.json({ success: true, user });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, role, studentId, facultyId, designation, department, year, phone, clubName, clubCategory, clubDescription } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ success: false, message: 'Name, email, and role are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  
  // Master Control Registration Bypass
  if (isMasterEmail(cleanEmail) || role === 'master_admin') {
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) return res.json({ success: true, user: existing });
    const newMaster: User = {
      id: `usr-master-${Date.now()}`,
      name: name || (cleanEmail === '25mc1la65@mits.gwl.ac.in' ? 'Master Control (25MC1LA65)' : 'Master Control (25MC1LA66)'),
      email: cleanEmail,
      role: 'master_admin',
      isMasterControl: true,
      studentId: studentId || cleanEmail.split('@')[0].toUpperCase(),
      designation: designation || 'Supreme Master Administrator',
      department: department || 'MITS Central Administration & Master Senate',
      phone: phone || '+91 98930 11001',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
    };
    users.push(newMaster);
    return res.json({ success: true, user: newMaster });
  }

  // Enforce institutional domain rules:
  // Faculty & Dean (admin) must use @mitsgwalior.in
  // Students must use @mitsgwl.ac.in
  // Club Organizers can use @mitsgwl.ac.in or @mitsgwalior.in
  if (role === 'faculty' || role === 'admin') {
    if (!cleanEmail.endsWith('@mitsgwalior.in')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Domain restriction: Faculty and Dean/Administrator registration requires an official @mitsgwalior.in institutional email address.' 
      });
    }
  } else if (role === 'student') {
    if (!cleanEmail.endsWith('@mitsgwl.ac.in')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Domain restriction: Student registration is strictly restricted to official MITS Gwalior institutional email addresses (@mitsgwl.ac.in).' 
      });
    }
  } else if (role === 'club_organizer') {
    if (!cleanEmail.endsWith('@mitsgwl.ac.in') && !cleanEmail.endsWith('@mitsgwalior.in')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Domain restriction: Club Organizer registration requires an institutional email ending with @mitsgwl.ac.in or @mitsgwalior.in.' 
      });
    }
  }

  const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered with MITS. Please login.' });
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
      leadPhone: phone || '+91 98000 00000',
      leadEnrollmentNo: studentId || `UNI-${new Date().getFullYear()}-ORG01`,
      leadYear: year || '3rd Year',
      admins: [
        {
          id: `adm-${Date.now()}`,
          name: name,
          email: email,
          enrollmentNo: studentId || `UNI-${new Date().getFullYear()}-ORG01`,
          phone: phone || '+91 98000 00000',
          year: year || '3rd Year',
          department: department || 'General Engineering',
          roleTitle: 'Club Convener & Lead Admin'
        }
      ],
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

  const avatar = role === 'faculty' 
    ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
    : role === 'club_organizer'
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    role,
    avatar,
    studentId: role === 'student' ? (studentId || `UNI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`) : undefined,
    facultyId: role === 'faculty' ? (facultyId || `FAC-${department ? department.substring(0, 3).toUpperCase() : 'GEN'}-${Math.floor(100 + Math.random() * 900)}`) : undefined,
    designation: role === 'faculty' ? (designation || 'Professor & Faculty Advisor') : undefined,
    phone: phone || undefined,
    department: department || 'General Studies',
    year: role === 'student' ? (year || '1st Year') : undefined,
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
  const { 
    name, 
    category, 
    description, 
    leadName, 
    leadEmail, 
    leadPhone, 
    leadEnrollmentNo, 
    leadYear, 
    admins, 
    facultyAdvisor,
    logo,
    bannerImage
  } = req.body;

  if (!name || !category) {
    return res.status(400).json({ success: false, message: 'Club name and category are required' });
  }

  // Resolve admins array with email, enrollmentNo, phone, year
  let resolvedAdmins: ClubAdminInfo[] = [];
  if (Array.isArray(admins) && admins.length > 0) {
    resolvedAdmins = admins.map((adm, idx) => ({
      id: adm.id || `adm-${Date.now()}-${idx}`,
      name: (adm.name || 'Club Admin').trim(),
      email: (adm.email || '').trim().toLowerCase(),
      enrollmentNo: (adm.enrollmentNo || `UNI-2024-${Math.floor(1000 + Math.random() * 9000)}`).trim(),
      phone: (adm.phone || '+91 98000 00000').trim(),
      year: adm.year || '3rd Year',
      department: (adm.department || 'Academic Department').trim(),
      roleTitle: (adm.roleTitle || (idx === 0 ? 'Lead Organizer' : 'Co-Admin')).trim(),
      addedAt: new Date().toISOString()
    }));
  } else if (leadEmail) {
    resolvedAdmins = [{
      id: `adm-${Date.now()}-0`,
      name: (leadName || 'Club Admin').trim(),
      email: (leadEmail || '').trim().toLowerCase(),
      enrollmentNo: (leadEnrollmentNo || `UNI-2024-${Math.floor(1000 + Math.random() * 9000)}`).trim(),
      phone: (leadPhone || '+91 98000 00000').trim(),
      year: leadYear || '3rd Year',
      department: 'Academic Department',
      roleTitle: 'President & Lead Admin',
      addedAt: new Date().toISOString()
    }];
  } else {
    return res.status(400).json({ success: false, message: 'At least one club administrator with email, enrollment number, phone, and year is required' });
  }

  // Validate required fields for every admin
  for (let i = 0; i < resolvedAdmins.length; i++) {
    const a = resolvedAdmins[i];
    if (!a.email || !a.enrollmentNo || !a.phone || !a.year) {
      return res.status(400).json({
        success: false,
        message: `Admin #${i + 1} (${a.name}) requires Email, Enrollment No., Phone No., and Academic Year.`
      });
    }
  }

  const primaryAdmin = resolvedAdmins[0];
  const newClubId = `club-${Date.now()}`;

  const newClub: Club = {
    id: newClubId,
    name: name.trim(),
    category: category || 'Technical',
    description: description || 'University student society fostering campus learning and events.',
    logo: logo || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    bannerImage: bannerImage || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&auto=format&fit=crop&q=80',
    leadName: primaryAdmin.name,
    leadEmail: primaryAdmin.email,
    leadPhone: primaryAdmin.phone,
    leadEnrollmentNo: primaryAdmin.enrollmentNo,
    leadYear: primaryAdmin.year,
    admins: resolvedAdmins,
    facultyAdvisor: facultyAdvisor || 'Campus Faculty Incharge',
    memberCount: 20,
    eventsHosted: 0,
    foundedYear: new Date().getFullYear(),
    isVerified: true
  };

  clubs.unshift(newClub);

  // Sync users: for each admin, create or link a user account
  for (const adm of resolvedAdmins) {
    const existingUser = users.find(u => u.email.toLowerCase() === adm.email.toLowerCase());
    if (existingUser) {
      existingUser.role = 'club_organizer';
      existingUser.clubId = newClubId;
      existingUser.clubName = newClub.name;
      existingUser.phone = adm.phone;
      existingUser.studentId = adm.enrollmentNo;
      existingUser.year = adm.year;
    } else {
      users.push({
        id: `user-admin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `${adm.name} (${newClub.name})`,
        email: adm.email,
        role: 'club_organizer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        studentId: adm.enrollmentNo,
        phone: adm.phone,
        department: adm.department,
        year: adm.year,
        clubId: newClubId,
        clubName: newClub.name
      });
    }
  }

  broadcastSSE('club_added', newClub);
  res.status(201).json({ success: true, club: newClub, message: 'Club registered successfully with designated administrators' });
});

// Update Club Admins Endpoint (Editable by other admins present)
app.put('/api/clubs/:id/admins', (req: Request, res: Response) => {
  const { id } = req.params;
  const { admins, updatedBy } = req.body;

  const club = clubs.find(c => c.id === id);
  if (!club) {
    return res.status(404).json({ success: false, message: 'Club not found' });
  }

  if (!Array.isArray(admins) || admins.length === 0) {
    return res.status(400).json({ success: false, message: 'A club must have at least one designated administrator' });
  }

  // Validate all admins have required fields
  for (let i = 0; i < admins.length; i++) {
    const a = admins[i];
    if (!a.name || !a.email || !a.enrollmentNo || !a.phone || !a.year) {
      return res.status(400).json({
        success: false,
        message: `Admin #${i + 1} (${a.name || 'unnamed'}) is missing required fields (Name, Email, Enrollment No., Phone, or Academic Year).`
      });
    }
  }

  // Update club admins
  club.admins = admins.map((adm, idx) => ({
    id: adm.id || `adm-${Date.now()}-${idx}`,
    name: adm.name.trim(),
    email: adm.email.trim().toLowerCase(),
    enrollmentNo: adm.enrollmentNo.trim(),
    phone: adm.phone.trim(),
    year: adm.year,
    department: adm.department?.trim() || 'Academic Department',
    roleTitle: adm.roleTitle?.trim() || (idx === 0 ? 'President & Lead Admin' : 'Co-Admin'),
    addedAt: adm.addedAt || new Date().toISOString(),
    addedBy: updatedBy || 'Current Club Administrator'
  }));

  // Update primary lead representation
  if (club.admins[0]) {
    club.leadName = club.admins[0].name;
    club.leadEmail = club.admins[0].email;
    club.leadPhone = club.admins[0].phone;
    club.leadEnrollmentNo = club.admins[0].enrollmentNo;
    club.leadYear = club.admins[0].year;
  }

  // Sync users
  for (const adm of club.admins) {
    const existing = users.find(u => u.email.toLowerCase() === adm.email.toLowerCase());
    if (existing) {
      existing.role = 'club_organizer';
      existing.clubId = club.id;
      existing.clubName = club.name;
      existing.studentId = adm.enrollmentNo;
      existing.phone = adm.phone;
      existing.year = adm.year;
    } else {
      users.push({
        id: `user-admin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `${adm.name} (${club.name})`,
        email: adm.email,
        role: 'club_organizer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        studentId: adm.enrollmentNo,
        phone: adm.phone,
        department: adm.department,
        year: adm.year,
        clubId: club.id,
        clubName: club.name
      });
    }
  }

  broadcastSSE('club_updated', club);
  res.json({ success: true, club, message: 'Club administrators updated successfully' });
});

// Update general club details
app.put('/api/clubs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const club = clubs.find(c => c.id === id);
  if (!club) {
    return res.status(404).json({ success: false, message: 'Club not found' });
  }

  Object.assign(club, req.body);
  broadcastSSE('club_updated', club);
  res.json({ success: true, club, message: 'Club details updated' });
});

// ----------------------------------------------------
// CLUB PARTICIPANTS & MEMBERSHIP MANAGEMENT
// ----------------------------------------------------

// Get Club Members and Pending Join Requests
app.get('/api/clubs/:id/members', (req: Request, res: Response) => {
  const club = clubs.find(c => c.id === req.params.id);
  if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
  res.json({
    success: true,
    clubName: club.name,
    members: club.members || []
  });
});

// Submit Join Request or Nominate Member (Enters Pending Status until Faculty accepts)
app.post('/api/clubs/:id/join-request', (req: Request, res: Response) => {
  const club = clubs.find(c => c.id === req.params.id);
  if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

  const { userName, userEmail, studentId, department, year, requestedBy } = req.body;
  if (!userName || !userEmail) {
    return res.status(400).json({ success: false, message: 'Candidate name and MITS email are required.' });
  }

  if (!club.members) club.members = [];

  // Check if already in club
  const cleanEmail = userEmail.trim().toLowerCase();
  const existing = club.members.find(m => m.userEmail.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ 
      success: false, 
      message: existing.status === 'active' 
        ? 'User is already an active member of this club.' 
        : 'A join request is already pending Faculty review.' 
    });
  }

  const newMember = {
    id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    clubId: club.id,
    userId: `usr-${Date.now()}`,
    userName: userName.trim(),
    userEmail: cleanEmail,
    studentId: studentId ? studentId.trim().toUpperCase() : '0901CS231000',
    department: department || 'Engineering',
    year: year || '2nd Year',
    role: 'member' as const,
    roleTitle: 'Core Member',
    status: 'pending' as const, // Under MITS rules, strictly pending until Faculty accepts
    requestedAt: new Date().toISOString()
  };

  club.members.push(newMember);
  broadcastSSE('club_member_requested', { clubId: club.id, member: newMember });

  // Send notification to Faculty Advisor
  inAppNotifications.unshift({
    id: `notif-${Date.now()}`,
    userId: 'user-faculty-1',
    title: `New Club Join Request: ${club.name}`,
    message: `${userName} (${cleanEmail}) applied to join ${club.name}. Faculty approval required.`,
    type: 'info',
    createdAt: new Date().toISOString(),
    read: false
  });

  res.status(201).json({
    success: true,
    message: `Join request submitted for ${userName}. Awaiting MITS Faculty acceptance.`,
    club,
    member: newMember
  });
});

// Accept Member Request - ONLY Faculty can accept request
app.put('/api/clubs/:id/members/:memberId/accept', (req: Request, res: Response) => {
  const club = clubs.find(c => c.id === req.params.id);
  if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

  const role = (req.headers['x-user-role'] as string) || req.body?.userRole || '';
  const userEmail = (req.headers['x-user-email'] as string) || req.body?.userEmail || '';
  const facultyUser = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
  const isFaculty = isMasterReq(req) || role === 'faculty' || role === 'admin' || role === 'master_admin' || (facultyUser && (facultyUser.role === 'faculty' || facultyUser.role === 'admin' || facultyUser.role === 'master_admin'));

  if (!isFaculty) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: As per MITS regulations, only Faculty Coordinators or Master Control can accept club join requests.'
    });
  }

  if (!club.members) club.members = [];
  const member = club.members.find(m => m.id === req.params.memberId);
  if (!member) return res.status(404).json({ success: false, message: 'Participant record not found.' });

  const nowIso = new Date().toISOString();
  member.status = 'active';
  member.joinedAt = nowIso;
  member.approvedBy = req.body?.facultyName || facultyUser?.name || 'MITS Faculty Coordinator';
  member.approvedAt = nowIso;

  club.memberCount = club.members.filter(m => m.status === 'active').length;

  broadcastSSE('club_member_approved', { clubId: club.id, member });
  res.json({
    success: true,
    message: `✓ Accepted ${member.userName} into ${club.name}. Official joining timestamp recorded.`,
    club,
    member
  });
});

// Update Member Role - Faculty can make Club Leaders (leaders can organize events/workshops)
app.put('/api/clubs/:id/members/:memberId/role', (req: Request, res: Response) => {
  const club = clubs.find(c => c.id === req.params.id);
  if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

  const role = (req.headers['x-user-role'] as string) || req.body?.userRole || '';
  const userEmail = (req.headers['x-user-email'] as string) || req.body?.userEmail || '';
  const facultyUser = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
  const isFaculty = isMasterReq(req) || role === 'faculty' || role === 'admin' || role === 'master_admin' || (facultyUser && (facultyUser.role === 'faculty' || facultyUser.role === 'admin' || facultyUser.role === 'master_admin'));

  if (!isFaculty) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only MITS Faculty or Master Control can appoint or promote Club Leaders.'
    });
  }

  if (!club.members) club.members = [];
  const member = club.members.find(m => m.id === req.params.memberId);
  if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });

  const newRole = req.body.role as 'leader' | 'co_leader' | 'member';
  member.role = newRole;
  member.roleTitle = req.body.roleTitle || (newRole === 'leader' ? 'Club President & Lead' : newRole === 'co_leader' ? 'Co-Leader' : 'Core Member');

  // If made Club Leader, sync user privileges so they can host and organise events
  const targetUser = users.find(u => u.email.toLowerCase() === member.userEmail.toLowerCase());
  if (targetUser) {
    if (newRole === 'leader' || newRole === 'co_leader') {
      targetUser.role = 'club_organizer';
      targetUser.clubId = club.id;
      targetUser.clubName = club.name;
    }
  }

  // Update club admins array
  if (newRole === 'leader' && !club.admins.some(a => a.email.toLowerCase() === member.userEmail.toLowerCase())) {
    club.admins.unshift({
      id: `adm-${Date.now()}`,
      name: member.userName,
      email: member.userEmail,
      enrollmentNo: member.studentId || '0901CS...',
      phone: member.phone || '+91 98000 00000',
      year: member.year || '3rd Year',
      department: member.department,
      roleTitle: 'Club President & Lead'
    });
    club.leadName = member.userName;
    club.leadEmail = member.userEmail;
  }

  broadcastSSE('club_updated', club);
  res.json({
    success: true,
    message: `✓ Role updated: ${member.userName} is now ${newRole === 'leader' ? 'Club Leader (authorized to organise events)' : newRole}.`,
    club,
    member
  });
});

// Edit Member Details - Faculty can edit member information (name, studentId, dept, year, phone, role)
app.put('/api/clubs/:id/members/:memberId', (req: Request, res: Response) => {
  const club = clubs.find(c => c.id === req.params.id);
  if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

  const role = (req.headers['x-user-role'] as string) || req.body?.userRole || '';
  const userEmail = (req.headers['x-user-email'] as string) || req.body?.userEmail || '';
  const facultyUser = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
  const isFaculty = isMasterReq(req) || role === 'faculty' || role === 'admin' || role === 'master_admin' || (facultyUser && (facultyUser.role === 'faculty' || facultyUser.role === 'admin' || facultyUser.role === 'master_admin'));

  if (!isFaculty) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only MITS Faculty or Master Control can edit participant details.'
    });
  }

  if (!club.members) club.members = [];
  const member = club.members.find(m => m.id === req.params.memberId);
  if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });

  const { userName, studentId, department, year, phone, role: newRole, roleTitle } = req.body;
  if (userName) member.userName = userName.trim();
  if (studentId) member.studentId = studentId.trim();
  if (department) member.department = department.trim();
  if (year) member.year = year.trim();
  if (phone) member.phone = phone.trim();
  if (newRole && ['leader', 'co_leader', 'member'].includes(newRole)) {
    member.role = newRole;
    if (newRole === 'leader') {
      const targetUser = users.find(u => u.email.toLowerCase() === member.userEmail.toLowerCase());
      if (targetUser) {
        targetUser.role = 'club_organizer';
        targetUser.clubId = club.id;
        targetUser.clubName = club.name;
      }
    }
  }
  if (roleTitle) member.roleTitle = roleTitle.trim();

  broadcastSSE('club_updated', club);
  res.json({
    success: true,
    message: `✓ Updated participant details for ${member.userName}.`,
    club,
    member
  });
});

// Remove Member - Faculty can remove person of specific choice of their own club
app.delete('/api/clubs/:id/members/:memberId', (req: Request, res: Response) => {
  const club = clubs.find(c => c.id === req.params.id);
  if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

  const role = (req.headers['x-user-role'] as string) || req.body?.userRole || (req.query?.role as string) || '';
  const userEmail = (req.headers['x-user-email'] as string) || req.body?.userEmail || (req.query?.userEmail as string) || '';
  const facultyUser = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
  const isFaculty = isMasterReq(req) || role === 'faculty' || role === 'admin' || role === 'master_admin' || (facultyUser && (facultyUser.role === 'faculty' || facultyUser.role === 'admin' || facultyUser.role === 'master_admin'));

  if (!isFaculty) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only MITS Faculty or Master Control can remove participants from their club.'
    });
  }

  if (!club.members) club.members = [];
  const idx = club.members.findIndex(m => m.id === req.params.memberId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Member not found.' });

  const [removed] = club.members.splice(idx, 1);
  club.memberCount = club.members.filter(m => m.status === 'active').length;

  broadcastSSE('club_updated', club);
  res.json({
    success: true,
    message: `✓ Removed ${removed.userName} from ${club.name}.`,
    club
  });
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
    certificatesProvided, contactEmail,
    facultyCoordinator, facultyCoordinatorEmail, facultyCoordinatorDept
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
    facultyCoordinator: facultyCoordinator || club.facultyAdvisor || 'Prof. Radhika Iyer',
    facultyCoordinatorEmail: facultyCoordinatorEmail || undefined,
    facultyCoordinatorDept: facultyCoordinatorDept || undefined,
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

  const { userId, userName, userEmail, studentId, phone, department, year } = req.body;
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
    studentId: studentId || `UNI-2026-CS${randomPin}`,
    phone: phone || '+91 98765 43210',
    department: department || 'Engineering',
    year: year || '3rd Year',
    ticketCode,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      `UNIVERSE-EVENT-PASS:${ticketCode}:${event.id}:${userEmail}`
    )}`,
    registeredAt: new Date().toISOString(),
    status: 'confirmed',
    emailSent: true,
    emailSentAt: new Date().toISOString(),
    reminderSent: false
  };

  registrations.push(registration);
  event.registeredCount += 1;

  // Check if event is starting within 1 hour to trigger reminder immediately
  setTimeout(() => {
    try {
      checkAndTriggerEventReminders();
    } catch (e) {
      console.error(e);
    }
  }, 300);

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
    const cert = certificates.find(c => c.registrationId === reg.id || (reg.certificateId && c.id === reg.certificateId));
    return { ...reg, event, certificate: cert || null };
  });
  res.json({ success: true, registrations: detailedRegs });
});

// Admin & Club Organizer: Get all registered candidates with detailed filters
app.get('/api/registrations', (req: Request, res: Response) => {
  const { clubId, eventId, status, department, search, attendanceStatus } = req.query;

  let filtered = [...registrations];

  // Filter by Event
  if (eventId && typeof eventId === 'string' && eventId !== 'all') {
    filtered = filtered.filter(r => r.eventId === eventId);
  }

  // Filter by Club
  if (clubId && typeof clubId === 'string' && clubId !== 'all') {
    filtered = filtered.filter(r => {
      const ev = events.find(e => e.id === r.eventId);
      return ev && ev.clubId === clubId;
    });
  }

  // Filter by Status
  if (status && typeof status === 'string' && status !== 'all') {
    filtered = filtered.filter(r => r.status === status);
  }

  // Filter by Attendance Status
  if (attendanceStatus && typeof attendanceStatus === 'string' && attendanceStatus !== 'all') {
    filtered = filtered.filter(r => (r.attendanceStatus || 'unmarked') === attendanceStatus);
  }

  // Filter by Department
  if (department && typeof department === 'string' && department !== 'all') {
    filtered = filtered.filter(r => (r.department || '').toLowerCase() === department.toLowerCase());
  }

  // Real-time Search by Name, Enrollment No, Email, Phone, TicketCode
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(r => 
      r.userName.toLowerCase().includes(q) ||
      r.userEmail.toLowerCase().includes(q) ||
      (r.studentId && r.studentId.toLowerCase().includes(q)) ||
      (r.phone && r.phone.toLowerCase().includes(q)) ||
      r.ticketCode.toLowerCase().includes(q) ||
      (r.department && r.department.toLowerCase().includes(q))
    );
  }

  // Hydrate with corresponding event data and certificate
  const hydrated = filtered.map(reg => {
    const event = events.find(e => e.id === reg.eventId);
    const cert = certificates.find(c => c.registrationId === reg.id || (reg.certificateId && c.id === reg.certificateId));
    return {
      ...reg,
      event,
      certificate: cert || null
    };
  });

  // Sort by registeredAt descending
  hydrated.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

  res.json({
    success: true,
    count: hydrated.length,
    registrations: hydrated
  });
});

// Manual On-Spot Candidate Registration by Club Admin
app.post('/api/registrations/manual', (req: Request, res: Response) => {
  const { eventId, studentId, userName, userEmail, phone, department, year, notes } = req.body;

  if (!eventId || !userName || !userEmail || !studentId) {
    return res.status(400).json({
      success: false,
      message: 'Event ID, Student Enrollment No, Name, and Email are required.'
    });
  }

  const event = events.find(e => e.id === eventId);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Selected event not found.' });
  }

  const randNum = Math.floor(1000 + Math.random() * 9000);
  const ticketCode = `TKT-${new Date().getFullYear()}-${event.category.substring(0, 2).toUpperCase()}-${randNum}`;

  const newRegistration: Registration = {
    id: `reg-manual-${Date.now()}`,
    eventId: event.id,
    userId: `usr-onspot-${Date.now()}`,
    userName: userName.trim(),
    userEmail: userEmail.trim().toLowerCase(),
    studentId: studentId.trim().toUpperCase(),
    phone: phone ? phone.trim() : '+91 98765 43210',
    department: department ? department.trim() : 'Engineering',
    year: year || '3rd Year',
    ticketCode,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      `UNIVERSE-EVENT-PASS:${ticketCode}:${event.id}:${userEmail}`
    )}`,
    registeredAt: new Date().toISOString(),
    status: 'confirmed',
    emailSent: true,
    emailSentAt: new Date().toISOString(),
    notes: notes || 'Admin On-Spot Desk Registration',
    event
  };

  registrations.unshift(newRegistration);
  event.registeredCount += 1;

  // Real-time email dispatch
  const emailContent = generateRegistrationEmailHtml({
    studentName: newRegistration.userName,
    studentEmail: newRegistration.userEmail,
    studentId: newRegistration.studentId,
    event,
    ticketCode,
    registeredAt: newRegistration.registeredAt
  });

  const dispatchedEmail = dispatchEmailAndNotification({
    recipientEmail: newRegistration.userEmail,
    recipientName: newRegistration.userName,
    userId: newRegistration.userId,
    senderName: event.clubName,
    senderEmail: event.contactEmail,
    subject: emailContent.subject,
    htmlContent: emailContent.html,
    plainText: emailContent.text,
    type: 'registration_confirmation',
    eventId: event.id,
    eventTitle: event.title,
    ticketCode,
    notificationTitle: `Pass Confirmed: ${event.title}`,
    notificationMessage: `Your seat has been reserved by ${event.clubName}. Ticket ID: ${ticketCode}`
  });

  broadcastSSE('registration_created', {
    eventId: event.id,
    registeredCount: event.registeredCount,
    registration: newRegistration
  });

  res.status(201).json({
    success: true,
    message: `Candidate ${userName} registered successfully with pass ${ticketCode}!`,
    registration: newRegistration,
    email: dispatchedEmail
  });
});

// Update candidate check-in or status
app.put('/api/registrations/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  // Authorization check: Only Admin and Faculty can mark attendance / check-in candidates
  if (status === 'checked_in' || status === 'confirmed') {
    if (!isAttendanceAuthorized(req)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only University Administrators and Faculty members are authorized to mark event attendance.'
      });
    }
  }

  const reg = registrations.find(r => r.id === id || r.ticketCode === id);
  if (!reg) {
    return res.status(404).json({ success: false, message: 'Candidate registration not found.' });
  }

  reg.status = status;
  if (status === 'checked_in') {
    reg.checkedInAt = new Date().toISOString();
    reg.attendanceStatus = 'present';
    reg.attendanceMarkedAt = new Date().toISOString();
    reg.attendanceMarkedBy = req.body?.markedBy || 'Central Desk';
    triggerCertificateEmailForPresentStudent(reg.id, reg.eventId, {
      markedBy: req.body?.markedBy || 'Central Desk',
      req
    });
  } else if (status === 'confirmed') {
    reg.checkedInAt = undefined;
    if (reg.attendanceStatus === 'present') {
      reg.attendanceStatus = 'unmarked';
      reg.attendanceMarkedAt = undefined;
    }
  }

  const event = events.find(e => e.id === reg.eventId);

  broadcastSSE('registration_updated', { registration: reg, event });
  res.json({
    success: true,
    message: `Status updated to ${status} for ${reg.userName}`,
    registration: { ...reg, event }
  });
});

// Delete or cancel registration by ID
app.delete('/api/registrations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = registrations.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Registration not found.' });
  }

  const [removed] = registrations.splice(index, 1);
  const event = events.find(e => e.id === removed.eventId);
  if (event && event.registeredCount > 0 && removed.status !== 'cancelled') {
    event.registeredCount -= 1;
  }

  broadcastSSE('event_updated', { event });
  res.json({ success: true, message: `Registration for ${removed.userName} removed successfully.` });
});

// Get Event Attendees (Organizer View)
app.get('/api/events/:id/attendees', (req: Request, res: Response) => {
  const eventRegs = registrations.filter(r => r.eventId === req.params.id);
  res.json({ success: true, attendees: eventRegs });
});

// Check-in Attendee by QR/Ticket Code
app.post('/api/events/:id/checkin', (req: Request, res: Response) => {
  if (!isAttendanceAuthorized(req)) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only University Administrators and Faculty members are authorized to mark candidate attendance.'
    });
  }

  const { ticketCode } = req.body;
  const reg = registrations.find(r => r.eventId === req.params.id && r.ticketCode.trim() === (ticketCode || '').trim());

  if (!reg) {
    return res.status(404).json({ success: false, message: 'Ticket code not recognized for this event.' });
  }

  if (reg.status === 'checked_in') {
    return res.status(400).json({ success: false, message: `Ticket ${ticketCode} already checked in!`, checkedInAt: reg.registeredAt });
  }

  reg.status = 'checked_in';
  reg.attendanceStatus = 'present';
  reg.checkedInAt = new Date().toISOString();
  reg.attendanceMarkedAt = new Date().toISOString();

  // Automatically trigger certificate creation and email with digital certificate link
  const certificateResult = triggerCertificateEmailForPresentStudent(reg.id, reg.eventId, {
    markedBy: 'QR Scanner Station',
    req
  });

  res.json({
    success: true,
    message: `Check-in confirmed for ${reg.userName}! Digital certificate email dispatched.`,
    attendee: reg,
    certificateResult
  });
});

// Helper: Calculate event attendance statistics
function calculateEventAttendanceStats(eventId: string): EventAttendanceStats {
  const eventRegs = registrations.filter(r => r.eventId === eventId && r.status !== 'cancelled');
  const total = eventRegs.length;
  const presentCount = eventRegs.filter(r => r.attendanceStatus === 'present' || r.status === 'checked_in').length;
  const absentCount = eventRegs.filter(r => r.attendanceStatus === 'absent').length;
  const unmarkedCount = eventRegs.filter(r => (!r.attendanceStatus || r.attendanceStatus === 'unmarked') && r.status !== 'checked_in').length;
  const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;
  const certsCount = certificates.filter(c => c.eventId === eventId).length;

  return {
    eventId,
    totalRegistered: total,
    presentCount,
    absentCount,
    unmarkedCount,
    attendanceRate,
    certificatesIssuedCount: certsCount
  };
}

/**
 * Automatically triggers an email containing a link to a digital participation certificate
 * whenever an organizer marks a student as 'present' in the attendance tracker.
 *
 * @param registrationId The registration record ID of the student
 * @param eventId The event ID
 * @param options Contextual options including organizer info and Express request
 */
function triggerCertificateEmailForPresentStudent(
  registrationId: string,
  eventId: string,
  options: {
    markedBy?: string;
    req?: Request;
    issuedBy?: string;
  } = {}
) {
  const reg = registrations.find(r => r.id === registrationId && r.eventId === eventId);
  if (!reg) {
    return { success: false, message: `Registration record ${registrationId} not found.` };
  }

  const event = events.find(e => e.id === eventId);
  if (!event) {
    return { success: false, message: `Event ${eventId} not found.` };
  }

  // Ensure student has valid presence criteria
  if (reg.attendanceStatus !== 'present' && reg.status !== 'checked_in') {
    return { success: false, message: `Candidate ${reg.userName} is not marked as present.` };
  }

  const nowIso = new Date().toISOString();
  const yearStr = event.startDate ? event.startDate.substring(0, 4) : '2026';
  const catCode = (event.category || 'EV').substring(0, 2).toUpperCase();

  // 1. Retrieve existing certificate or provision a new verifiable certificate
  let cert = certificates.find(c => c.registrationId === reg.id || (reg.certificateId && c.id === reg.certificateId));
  let isNewlyCreated = false;

  if (!cert) {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const certId = `CERT-${yearStr}-${catCode}-${randNum}`;
    const verificationHash = `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${certId}`;

    cert = {
      id: certId,
      registrationId: reg.id,
      eventId: event.id,
      eventTitle: event.title,
      eventCategory: event.category,
      eventDate: event.startDate,
      eventTime: `${event.startTime} - ${event.endTime}`,
      eventVenue: event.venue,
      clubId: event.clubId,
      clubName: event.clubName,
      userId: reg.userId,
      studentName: reg.userName,
      studentEmail: reg.userEmail,
      studentId: reg.studentId || 'UNI-ENROLL-PENDING',
      department: reg.department || 'University Student',
      year: reg.year || 'Academic Year 2025-26',
      issuedAt: nowIso,
      issuedBy: options.issuedBy || options.markedBy || 'University Event Committee',
      signatories: [
        { name: event.speakers[0]?.name || 'Dr. Academic Director', title: 'Keynote Speaker / Lead', organization: event.clubName },
        { name: (event.contactEmail || 'desk@campus.edu').split('@')[0].toUpperCase(), title: 'Club Convener', organization: event.clubName },
        { name: 'Dr. Anand Ramanathan', title: 'Dean of Student Affairs', organization: 'Central Academic Council' }
      ],
      verificationHash,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
        `UNIVERSE-VERIFIED-CERTIFICATE:${certId}:${event.id}:${reg.userEmail}`
      )}`
    };

    certificates.unshift(cert);
    reg.certificateId = cert.id;
    reg.certificateIssuedAt = cert.issuedAt;
    isNewlyCreated = true;
  }

  // 2. Build direct URL for the digital participation certificate
  let baseUrl = '';
  if (options.req) {
    const proto = (options.req.headers['x-forwarded-proto'] as string) || options.req.protocol || 'http';
    const host = options.req.get('host') || 'localhost:3000';
    baseUrl = `${proto}://${host}`;
  }

  const certificateUrl = baseUrl ? `${baseUrl}/api/certificates/${cert.id}/view` : `/api/certificates/${cert.id}/view`;
  reg.certificateUrl = certificateUrl;

  // 3. Generate and dispatch the official certificate email with link
  const certEmail = generateCertificateEmailHtml({
    studentName: reg.userName,
    studentEmail: reg.userEmail,
    studentId: reg.studentId,
    department: reg.department,
    event,
    certificateId: cert.id,
    issuedAt: cert.issuedAt,
    certificateUrl
  });

  const emailObj = dispatchEmailAndNotification({
    recipientEmail: reg.userEmail,
    recipientName: reg.userName,
    userId: reg.userId,
    senderName: `${event.clubName} • Certificate Cell`,
    senderEmail: event.contactEmail || 'certificates@campus.edu',
    subject: certEmail.subject,
    htmlContent: certEmail.html,
    plainText: certEmail.text,
    type: 'participation_certificate',
    eventId: event.id,
    eventTitle: event.title,
    ticketCode: reg.ticketCode,
    notificationTitle: `🎓 Participation Certificate: ${event.title}`,
    notificationMessage: `Verified present! Your digital participation certificate (${cert.id}) has been issued with download link.`
  });

  reg.certificateEmailSent = true;
  reg.certificateEmailSentAt = nowIso;

  // 4. Real-time broadcast for live browser sync
  broadcastSSE('certificate_issued', {
    eventId: event.id,
    registrationId: reg.id,
    certificateId: cert.id,
    certificate: cert,
    certificateUrl,
    studentName: reg.userName,
    studentEmail: reg.userEmail,
    isNewlyCreated,
    email: emailObj
  });

  return {
    success: true,
    certificate: cert,
    email: emailObj,
    certificateUrl,
    isNewlyCreated,
    message: `Digital participation certificate email automatically sent to ${reg.userEmail} with certificate link.`
  };
}

// ----------------------------------------------------
// ATTENDANCE MANAGEMENT APIS FOR SPECIFIC EVENT
// ----------------------------------------------------

// Get Attendance & Registered Candidates for a Specific Event
app.get('/api/events/:id/attendance', (req: Request, res: Response) => {
  const eventId = req.params.id;
  const event = events.find(e => e.id === eventId);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found.' });
  }

  const eventRegs = registrations
    .filter(r => r.eventId === eventId)
    .map(reg => {
      const cert = certificates.find(c => c.registrationId === reg.id || (reg.certificateId && c.id === reg.certificateId));
      return {
        ...reg,
        certificate: cert || null
      };
    });

  const stats = calculateEventAttendanceStats(eventId);

  res.json({
    success: true,
    event,
    registrations: eventRegs,
    stats
  });
});

// Get Attendance Analytics Across Completed Events (or filtered by status / club)
app.get('/api/analytics/attendance', (req: Request, res: Response) => {
  const { clubId, status } = req.query;

  let targetEvents = [...events];
  if (clubId && typeof clubId === 'string' && clubId !== 'all') {
    targetEvents = targetEvents.filter(e => e.clubId === clubId);
  }
  if (status && typeof status === 'string' && status !== 'all') {
    targetEvents = targetEvents.filter(e => e.status === status);
  }

  const items = targetEvents.map(event => {
    const stats = calculateEventAttendanceStats(event.id);
    return {
      eventId: event.id,
      title: event.title,
      clubId: event.clubId,
      clubName: event.clubName,
      category: event.category,
      startDate: event.startDate,
      startTime: event.startTime,
      venue: event.venue,
      status: event.status,
      present: stats.presentCount,
      absent: stats.absentCount,
      unmarked: stats.unmarkedCount,
      totalRegistered: stats.totalRegistered,
      attendanceRate: stats.attendanceRate,
      certificatesIssued: stats.certificatesIssuedCount,
      capacity: event.capacity
    };
  });

  res.json({
    success: true,
    count: items.length,
    analytics: items
  });
});

// Helper: Verify if user role is authorized to mark or download attendance
// "theirs attendance can only be done or taken by faculty and leader of specific club only"
function isAttendanceAuthorized(req: Request, eventId?: string): boolean {
  // Master Control has supreme authority over all events and clubs
  if (isMasterReq(req)) return true;

  const role = (req.headers['x-user-role'] as string) || req.body?.userRole || req.body?.role || (req.query?.role as string) || (req.query?.userRole as string) || '';
  const userId = (req.headers['x-user-id'] as string) || req.body?.userId || (req.query?.userId as string) || '';
  const userEmail = (req.headers['x-user-email'] as string) || req.body?.userEmail || (req.query?.userEmail as string) || '';

  let user = users.find(u => u.id === userId || (userEmail && u.email.toLowerCase() === userEmail.toLowerCase()));
  if (!user && role) {
    user = { role, email: userEmail, id: userId } as any;
  }

  if (!user) return false;

  // 1. Faculty and Deans can always mark attendance
  if (user.role === 'admin' || user.role === 'faculty') {
    return true;
  }

  // 2. Club leader can mark attendance ONLY for their specific club
  if (user.role === 'club_organizer') {
    const targetEventId = eventId || req.params?.id || req.body?.eventId;
    if (!targetEventId) return true; // Generic check
    const ev = events.find(e => e.id === targetEventId);
    if (!ev) return true;
    const club = clubs.find(c => c.id === ev.clubId);
    if (!club) return false;

    const emailMatch = user.email ? user.email.toLowerCase() : '';
    const isLeaderOfThisClub = user.clubId === ev.clubId || 
      (club.leadEmail && club.leadEmail.toLowerCase() === emailMatch) ||
      club.admins.some(a => a.email.toLowerCase() === emailMatch) ||
      (club.members && club.members.some(m => m.userEmail.toLowerCase() === emailMatch && (m.role === 'leader' || m.role === 'co_leader')));

    return !!isLeaderOfThisClub;
  }

  // Regular students cannot take attendance
  return false;
}

// Mark / Update Individual Candidate Attendance (present, absent, unmarked)
app.put('/api/events/:id/attendance/:registrationId', (req: Request, res: Response) => {
  // Authorization check: Only Admin and Faculty can mark attendance
  if (!isAttendanceAuthorized(req)) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only University Administrators and Faculty members are authorized to mark event attendance.'
    });
  }

  const { id: eventId, registrationId } = req.params;
  const { attendanceStatus, markedBy } = req.body;

  if (!['present', 'absent', 'unmarked'].includes(attendanceStatus)) {
    return res.status(400).json({ success: false, message: 'attendanceStatus must be "present", "absent", or "unmarked".' });
  }

  const reg = registrations.find(r => r.id === registrationId && r.eventId === eventId);
  if (!reg) {
    return res.status(404).json({ success: false, message: 'Candidate registration record not found for this event.' });
  }

  reg.attendanceStatus = attendanceStatus;
  reg.attendanceMarkedBy = markedBy || 'Club Organizer Desk';

  let certificateResult: any = null;

  if (attendanceStatus === 'present') {
    reg.status = 'checked_in';
    if (!reg.checkedInAt) reg.checkedInAt = new Date().toISOString();
    reg.attendanceMarkedAt = new Date().toISOString();

    // AUTOMATIC TRIGGER: Whenever student is marked as 'present', dispatch email with digital certificate link
    certificateResult = triggerCertificateEmailForPresentStudent(registrationId, eventId, {
      markedBy: markedBy || 'Club Organizer Desk',
      req
    });
  } else if (attendanceStatus === 'absent') {
    reg.status = 'confirmed';
    reg.checkedInAt = undefined;
    reg.attendanceMarkedAt = new Date().toISOString();
  } else {
    reg.status = 'confirmed';
    reg.checkedInAt = undefined;
    reg.attendanceMarkedAt = undefined;
  }

  const event = events.find(e => e.id === eventId);
  const stats = calculateEventAttendanceStats(eventId);

  broadcastSSE('attendance_updated', {
    eventId,
    registrationId: reg.id,
    attendanceStatus: reg.attendanceStatus,
    stats,
    registration: reg,
    certificateResult
  });

  res.json({
    success: true,
    message: attendanceStatus === 'present'
      ? `Marked ${reg.userName} as PRESENT! Digital certificate email with verification link has been triggered.`
      : `Marked ${reg.userName} as ${attendanceStatus.toUpperCase()}!`,
    registration: reg,
    stats,
    certificateResult
  });
});

// Trigger or Resend Digital Participation Certificate Email for a Specific Candidate
app.post('/api/events/:id/attendance/:registrationId/trigger-certificate-email', (req: Request, res: Response) => {
  const { id: eventId, registrationId } = req.params;
  const { markedBy, issuedBy } = req.body;

  const result = triggerCertificateEmailForPresentStudent(registrationId, eventId, {
    markedBy: markedBy || 'Club Organizer',
    issuedBy,
    req
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// Bulk Attendance Operations (Mark All Present, Mark All Absent, Reset)
app.post('/api/events/:id/attendance/bulk', (req: Request, res: Response) => {
  if (!isAttendanceAuthorized(req)) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only University Administrators and Faculty members are authorized to mark event attendance.'
    });
  }

  const eventId = req.params.id;
  const { status: targetStatus, registrationIds, markedBy } = req.body;

  if (!['present', 'absent', 'unmarked'].includes(targetStatus)) {
    return res.status(400).json({ success: false, message: 'Status must be "present", "absent", or "unmarked".' });
  }

  const event = events.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

  let updatedCount = 0;
  const certificateResults: any[] = [];
  const now = new Date().toISOString();

  registrations.forEach(reg => {
    if (reg.eventId !== eventId) return;
    if (reg.status === 'cancelled') return;
    if (registrationIds && Array.isArray(registrationIds) && !registrationIds.includes(reg.id)) return;

    reg.attendanceStatus = targetStatus;
    reg.attendanceMarkedBy = markedBy || 'Club Organizer';

    if (targetStatus === 'present') {
      reg.status = 'checked_in';
      if (!reg.checkedInAt) reg.checkedInAt = now;
      reg.attendanceMarkedAt = now;

      // AUTOMATIC TRIGGER: Send certificate email with link for present student
      const certRes = triggerCertificateEmailForPresentStudent(reg.id, eventId, {
        markedBy: markedBy || 'Bulk Attendance Desk',
        req
      });
      if (certRes.success) {
        certificateResults.push(certRes);
      }
    } else if (targetStatus === 'absent') {
      reg.status = 'confirmed';
      reg.checkedInAt = undefined;
      reg.attendanceMarkedAt = now;
    } else {
      reg.status = 'confirmed';
      reg.checkedInAt = undefined;
      reg.attendanceMarkedAt = undefined;
    }
    updatedCount++;
  });

  const stats = calculateEventAttendanceStats(eventId);

  broadcastSSE('attendance_bulk_updated', {
    eventId,
    targetStatus,
    updatedCount,
    certificatesCount: certificateResults.length,
    stats
  });

  res.json({
    success: true,
    message: targetStatus === 'present'
      ? `Successfully marked ${updatedCount} candidates as PRESENT! Dispatched ${certificateResults.length} digital certificate emails with links.`
      : `Successfully marked ${updatedCount} candidates as ${targetStatus.toUpperCase()}!`,
    updatedCount,
    certificatesDispatchedCount: certificateResults.length,
    stats
  });
});

// Quick Mark Attendance by Ticket Code, Student ID, or Email
app.post('/api/events/:id/attendance/quick-mark', (req: Request, res: Response) => {
  if (!isAttendanceAuthorized(req)) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only University Administrators and Faculty members are authorized to mark event attendance.'
    });
  }

  const eventId = req.params.id;
  const { query, status: targetStatus = 'present', markedBy } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ success: false, message: 'Search query (ticket code, enrollment ID, or email) is required.' });
  }

  const q = query.trim().toLowerCase();
  const reg = registrations.find(r => 
    r.eventId === eventId && (
      r.ticketCode.toLowerCase() === q ||
      (r.studentId && r.studentId.toLowerCase() === q) ||
      r.userEmail.toLowerCase() === q ||
      r.userName.toLowerCase().includes(q)
    )
  );

  if (!reg) {
    return res.status(404).json({
      success: false,
      message: `No registration found matching "${query}" for this event.`
    });
  }

  const newStatus = (targetStatus === 'absent' ? 'absent' : 'present');
  reg.attendanceStatus = newStatus;
  reg.attendanceMarkedBy = markedBy || 'Gate Scanner Desk';

  let certificateResult: any = null;

  if (newStatus === 'present') {
    reg.status = 'checked_in';
    reg.checkedInAt = new Date().toISOString();
    reg.attendanceMarkedAt = new Date().toISOString();

    // AUTOMATIC TRIGGER: Send certificate email with link for present student
    certificateResult = triggerCertificateEmailForPresentStudent(reg.id, eventId, {
      markedBy: markedBy || 'Gate Scanner Desk',
      req
    });
  } else {
    reg.status = 'confirmed';
    reg.checkedInAt = undefined;
    reg.attendanceMarkedAt = new Date().toISOString();
  }

  const stats = calculateEventAttendanceStats(eventId);

  broadcastSSE('attendance_updated', {
    eventId,
    registrationId: reg.id,
    attendanceStatus: reg.attendanceStatus,
    stats,
    registration: reg,
    certificateResult
  });

  res.json({
    success: true,
    message: newStatus === 'present'
      ? `✓ Attendance recorded: ${reg.userName} (${reg.studentId || reg.ticketCode}) marked PRESENT! Digital certificate email dispatched.`
      : `✓ Attendance recorded: ${reg.userName} (${reg.studentId || reg.ticketCode}) marked ${newStatus.toUpperCase()}!`,
    registration: reg,
    stats,
    certificateResult
  });
});

// ----------------------------------------------------
// PARTICIPATION CERTIFICATE GENERATION & MANAGEMENT
// ----------------------------------------------------

// Generate Participation Certificates for Present Attendees
app.post('/api/events/:id/certificates/generate', (req: Request, res: Response) => {
  if (!isAttendanceAuthorized(req)) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only University Administrators and Faculty members are authorized to issue certificates.'
    });
  }

  const eventId = req.params.id;
  const { registrationIds, sendEmail = true, issuedBy = 'University Event Committee' } = req.body;

  const event = events.find(e => e.id === eventId);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found.' });
  }

  // Filter eligible registrations for this event
  let candidates = registrations.filter(r => r.eventId === eventId && r.status !== 'cancelled');
  if (registrationIds && Array.isArray(registrationIds) && registrationIds.length > 0) {
    candidates = candidates.filter(r => registrationIds.includes(r.id));
  }

  // CRITICAL RULE: Certificates can ONLY be generated for attendees who are PRESENT!
  const presentCandidates = candidates.filter(r => r.attendanceStatus === 'present' || r.status === 'checked_in');
  const nonPresentCount = candidates.length - presentCandidates.length;

  if (presentCandidates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No present attendees found to generate certificates. Please mark candidates as "Present" in the attendance roster first!',
      skippedCount: nonPresentCount
    });
  }

  const generatedCertificates: ParticipationCertificate[] = [];
  const nowIso = new Date().toISOString();
  const yearStr = event.startDate.substring(0, 4) || '2026';
  const catCode = (event.category.substring(0, 2)).toUpperCase();

  presentCandidates.forEach(reg => {
    // Check if certificate already generated
    let existingCert = certificates.find(c => c.registrationId === reg.id || (reg.certificateId && c.id === reg.certificateId));

    if (!existingCert) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const certId = `CERT-${yearStr}-${catCode}-${randNum}`;
      const verificationHash = `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${certId}`;

      const newCert: ParticipationCertificate = {
        id: certId,
        registrationId: reg.id,
        eventId: event.id,
        eventTitle: event.title,
        eventCategory: event.category,
        eventDate: event.startDate,
        eventTime: `${event.startTime} - ${event.endTime}`,
        eventVenue: event.venue,
        clubId: event.clubId,
        clubName: event.clubName,
        userId: reg.userId,
        studentName: reg.userName,
        studentEmail: reg.userEmail,
        studentId: reg.studentId || 'UNI-ENROLL-PENDING',
        department: reg.department || 'University Student',
        year: reg.year || 'Academic Year 2025-26',
        issuedAt: nowIso,
        issuedBy,
        signatories: [
          { name: event.speakers[0]?.name || 'Dr. Academic Director', title: 'Keynote Speaker / Lead', organization: event.clubName },
          { name: event.contactEmail.split('@')[0].toUpperCase(), title: 'Club Convener', organization: event.clubName },
          { name: 'Dr. Anand Ramanathan', title: 'Dean of Student Affairs', organization: 'Central Academic Council' }
        ],
        verificationHash,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
          `UNIVERSE-VERIFIED-CERTIFICATE:${certId}:${event.id}:${reg.userEmail}`
        )}`
      };

      certificates.unshift(newCert);
      existingCert = newCert;

      reg.certificateId = newCert.id;
      reg.certificateIssuedAt = newCert.issuedAt;

      // Dispatch Email & In-App Notification if enabled
      if (sendEmail) {
        const certEmail = generateCertificateEmailHtml({
          studentName: reg.userName,
          studentEmail: reg.userEmail,
          studentId: reg.studentId,
          department: reg.department,
          event,
          certificateId: newCert.id,
          issuedAt: newCert.issuedAt
        });

        dispatchEmailAndNotification({
          recipientEmail: reg.userEmail,
          recipientName: reg.userName,
          userId: reg.userId,
          senderName: `${event.clubName} • Certificate Cell`,
          senderEmail: event.contactEmail,
          subject: certEmail.subject,
          htmlContent: certEmail.html,
          plainText: certEmail.text,
          type: 'participation_certificate',
          eventId: event.id,
          eventTitle: event.title,
          ticketCode: reg.ticketCode,
          notificationTitle: `🎓 Certificate Issued: ${event.title}`,
          notificationMessage: `Congratulations! Your official Certificate of Participation (${newCert.id}) has been issued and is ready to download.`
        });
      }
    }

    generatedCertificates.push(existingCert);
  });

  const stats = calculateEventAttendanceStats(eventId);

  broadcastSSE('certificates_generated', {
    eventId,
    certificatesCount: generatedCertificates.length,
    certificates: generatedCertificates,
    stats
  });

  res.json({
    success: true,
    message: `Successfully generated ${generatedCertificates.length} Participation Certificates for verified attendees!`,
    certificatesCount: generatedCertificates.length,
    certificates: generatedCertificates,
    skippedNonPresentCount: nonPresentCount,
    stats
  });
});

// Dedicated Endpoint: Mail Participation Certificates to All Present Attendees
app.post('/api/events/:id/certificates/mail-attendance', (req: Request, res: Response) => {
  if (!isAttendanceAuthorized(req)) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only University Administrators and Faculty members are authorized to dispatch certificates based on attendance.'
    });
  }

  const eventId = req.params.id;
  const event = events.find(e => e.id === eventId);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event record not found.' });
  }

  // Filter attendees marked Present (checked-in)
  const eligibleRegs = registrations.filter(r => 
    r.eventId === eventId && 
    (r.attendanceStatus === 'present' || r.status === 'checked_in') &&
    r.status !== 'cancelled'
  );

  if (eligibleRegs.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No attendees marked "Present" found for this event. Please mark student attendance before dispatching certificates.'
    });
  }

  let baseUrl = '';
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const host = req.get('host') || 'localhost:3000';
  baseUrl = `${proto}://${host}`;

  let emailedCount = 0;
  let newlyCreatedCount = 0;
  const processedCerts: ParticipationCertificate[] = [];

  eligibleRegs.forEach(reg => {
    let cert = certificates.find(c => c.registrationId === reg.id || (reg.certificateId && c.id === reg.certificateId));
    
    if (!cert) {
      newlyCreatedCount++;
      const nowIso = new Date().toISOString();
      const yearStr = event.startDate.substring(0, 4) || '2026';
      const catCode = (event.category.substring(0, 2)).toUpperCase();
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const certId = `CERT-${yearStr}-${catCode}-${randNum}`;
      const verificationHash = `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${certId}`;

      const signatories = [];
      if (event.facultyCoordinator) {
        signatories.push({
          name: event.facultyCoordinator,
          title: 'Faculty Coordinator & Academic Advisor',
          organization: event.facultyCoordinatorDept || 'University Academic Council'
        });
      }
      if (event.speakers && event.speakers[0]) {
        signatories.push({
          name: event.speakers[0].name,
          title: event.speakers[0].role || 'Lead Keynote Speaker',
          organization: event.speakers[0].companyOrCollege || event.clubName
        });
      } else {
        signatories.push({
          name: event.clubName,
          title: 'Organizing Convener',
          organization: 'UniVerse Student Chapter'
        });
      }
      signatories.push({
        name: 'Dr. Anandita Sen',
        title: 'Dean of Student & Academic Affairs',
        organization: 'Central Academic Council'
      });

      cert = {
        id: certId,
        registrationId: reg.id,
        eventId: event.id,
        eventTitle: event.title,
        eventCategory: event.category,
        eventDate: event.startDate,
        eventTime: `${event.startTime} - ${event.endTime}`,
        eventVenue: event.venue,
        clubId: event.clubId,
        clubName: event.clubName,
        userId: reg.userId,
        studentName: reg.userName,
        studentEmail: reg.userEmail,
        studentId: reg.studentId || 'UNI-ENROLL-PENDING',
        department: reg.department || 'University Student',
        year: reg.year || 'Academic Year 2025-26',
        issuedAt: nowIso,
        issuedBy: event.facultyCoordinator ? `${event.facultyCoordinator} & ${event.clubName}` : 'Central Academic Council',
        signatories,
        verificationHash,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
          `UNIVERSE-VERIFIED-CERTIFICATE:${certId}:${event.id}:${reg.userEmail}`
        )}`
      };

      certificates.unshift(cert);
      reg.certificateId = cert.id;
      reg.certificateIssuedAt = cert.issuedAt;
    }

    const certificateUrl = `${baseUrl}/api/certificates/${cert.id}/view`;
    const certEmail = generateCertificateEmailHtml({
      studentName: reg.userName,
      studentEmail: reg.userEmail,
      studentId: reg.studentId,
      department: reg.department,
      event,
      certificateId: cert.id,
      issuedAt: cert.issuedAt,
      certificateUrl
    });

    dispatchEmailAndNotification({
      recipientEmail: reg.userEmail,
      recipientName: reg.userName,
      userId: reg.userId,
      senderName: `${event.clubName} • Certificate Desk`,
      senderEmail: event.contactEmail,
      subject: certEmail.subject,
      htmlContent: certEmail.html,
      plainText: certEmail.text,
      type: 'participation_certificate',
      eventId: event.id,
      eventTitle: event.title,
      ticketCode: reg.ticketCode,
      notificationTitle: `🎓 Participation Certificate Delivered: ${event.title}`,
      notificationMessage: `Congratulations ${reg.userName}! Your official verified Certificate of Participation (${cert.id}) for "${event.title}" has been dispatched to your email.`
    });

    processedCerts.push(cert);
    emailedCount++;
  });

  const stats = calculateEventAttendanceStats(eventId);

  broadcastSSE('certificates_generated', {
    eventId,
    certificatesCount: emailedCount,
    certificates: processedCerts,
    stats
  });

  res.json({
    success: true,
    message: `Successfully emailed official participation certificates to all ${emailedCount} attendee(s) marked Present!`,
    emailedCount,
    newlyCreatedCount,
    certificates: processedCerts,
    stats
  });
});

// Download Official Formatted Event Attendance Report (Restricted to Admin & Faculty only)
app.get('/api/events/:id/attendance/download-report', (req: Request, res: Response) => {
  if (!isAttendanceAuthorized(req)) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only University Administrators and Faculty members are authorized to download event attendance records.'
    });
  }

  const eventId = req.params.id;
  const event = events.find(e => e.id === eventId);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event record not found.' });
  }

  const eventRegs = registrations.filter(r => r.eventId === eventId);
  const presentCount = eventRegs.filter(r => r.attendanceStatus === 'present' || r.status === 'checked_in').length;
  const absentCount = eventRegs.filter(r => r.attendanceStatus === 'absent').length;
  const unmarkedCount = eventRegs.length - presentCount - absentCount;
  const turnoutRate = eventRegs.length > 0 ? Math.round((presentCount / eventRegs.length) * 100) : 0;
  const generatedOn = new Date().toLocaleString();

  const lines = [
    `"CENTRAL UNIVERSITY EVENT ATTENDANCE & PARTICIPATION REPORT"`,
    `"Institution:","Central University Event & Academic Portal"`,
    `"Event Title:","${event.title.replace(/"/g, '""')}"`,
    `"Hosting Club:","${event.clubName.replace(/"/g, '""')}"`,
    `"Faculty Coordinator:","${(event.facultyCoordinator || 'Prof. Radhika Iyer').replace(/"/g, '""')}"`,
    `"Generated At:","${generatedOn}"`,
    `"Authorized Role:","${(req.headers['x-user-role'] || 'Admin/Faculty').toString().toUpperCase()}"`,
    `"Attendance Summary:","Total: ${eventRegs.length} | Present: ${presentCount} | Absent: ${absentCount} | Unmarked: ${unmarkedCount} | Turnout Rate: ${turnoutRate}%"`,
    `""`,
    `"Sl No","Enrollment ID","Candidate Name","Email","Phone","Department","Ticket Code","Attendance Status","Check-in Time","Certificate ID"`
  ];

  eventRegs.forEach((r, idx) => {
    const isPres = r.attendanceStatus === 'present' || r.status === 'checked_in';
    const statusLabel = isPres ? 'PRESENT' : r.attendanceStatus === 'absent' ? 'ABSENT' : 'UNMARKED';
    lines.push([
      `"${idx + 1}"`,
      `"${r.studentId || ''}"`,
      `"${(r.userName || '').replace(/"/g, '""')}"`,
      `"${r.userEmail || ''}"`,
      `"${r.phone || ''}"`,
      `"${(r.department || '').replace(/"/g, '""')}"`,
      `"${r.ticketCode || ''}"`,
      `"${statusLabel}"`,
      `"${r.checkedInAt ? new Date(r.checkedInAt).toLocaleString() : 'N/A'}"`,
      `"${r.certificateId || 'N/A'}"`
    ].join(','));
  });

  const csvContent = '\uFEFF' + lines.join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="Official_Attendance_${event.id}.csv"`);
  res.send(csvContent);
});

// Get all certificates for a specific event
app.get('/api/events/:id/certificates', (req: Request, res: Response) => {
  const eventId = req.params.id;
  const eventCerts = certificates.filter(c => c.eventId === eventId);
  res.json({
    success: true,
    count: eventCerts.length,
    certificates: eventCerts
  });
});

// Render Standalone Verifiable Digital Participation Certificate HTML Page
app.get('/api/certificates/:certificateId/view', (req: Request, res: Response) => {
  const { certificateId } = req.params;
  const cert = certificates.find(c => c.id.toUpperCase() === certificateId.toUpperCase());

  if (!cert) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate Not Found - UniVerse</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 60px 20px; background: #0f172a; color: #f8fafc;">
          <div style="max-width: 480px; margin: 0 auto; background: #1e293b; padding: 36px; border-radius: 16px; border: 1px solid #334155;">
            <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
            <h1 style="color: #f87171; margin-top: 0; font-size: 22px;">Certificate Not Found</h1>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">The requested certificate reference <code>${certificateId}</code> was not found or has been revoked.</p>
            <a href="/" style="display: inline-block; margin-top: 16px; background: #4f46e5; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px;">← Return to UniVerse Campus Portal</a>
          </div>
        </body>
      </html>
    `);
  }

  const formattedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Participation Certificate - ${cert.studentName} | ${cert.eventTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap');
    
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 30px 16px;
      background: #090d16;
      color: #1e293b;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .toolbar {
      max-width: 880px;
      width: 100%;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .toolbar a, .toolbar button {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      padding: 9px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    }
    .toolbar a:hover, .toolbar button:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .toolbar .btn-primary {
      background: #4f46e5;
      border-color: #6366f1;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
    }
    .toolbar .btn-primary:hover {
      background: #4338ca;
    }
    .cert-frame {
      max-width: 880px;
      width: 100%;
      background: #ffffff;
      border-radius: 18px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
      padding: 24px;
      position: relative;
    }
    .cert-inner-border {
      border: 3px double #d97706;
      padding: 36px 40px;
      border-radius: 12px;
      position: relative;
      background: radial-gradient(circle at 50% 30%, #ffffff 0%, #fafafa 100%);
    }
    .header-seal {
      text-align: center;
      margin-bottom: 8px;
    }
    .uni-emblem {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4338ca 0%, #312e81 100%);
      color: #f59e0b;
      font-size: 26px;
      box-shadow: 0 4px 12px rgba(67, 56, 202, 0.35);
      border: 3px solid #fbbf24;
      margin-bottom: 8px;
    }
    .uni-title {
      font-family: 'Cinzel', serif;
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 0.12em;
      color: #312e81;
      text-transform: uppercase;
      margin: 0;
    }
    .uni-sub {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 4px;
    }
    .cert-heading {
      text-align: center;
      margin: 22px 0 16px 0;
    }
    .cert-title {
      font-family: 'Cinzel', serif;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 0.06em;
      color: #1e1b4b;
      text-transform: uppercase;
      margin: 0;
    }
    .cert-subtitle {
      font-size: 12px;
      color: #92400e;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 6px;
    }
    .presented-text {
      text-align: center;
      font-size: 14px;
      color: #475569;
      margin: 20px 0 6px 0;
      font-style: italic;
    }
    .student-wrapper {
      text-align: center;
    }
    .student-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 34px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      display: inline-block;
      padding-bottom: 6px;
      margin: 0 auto 8px auto;
    }
    .student-meta {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
    .achievement-text {
      text-align: center;
      font-size: 14px;
      line-height: 1.7;
      color: #334155;
      max-width: 650px;
      margin: 22px auto;
    }
    .event-highlight {
      font-weight: 700;
      color: #1e1b4b;
    }
    .signatures-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #f1f5f9;
      text-align: center;
    }
    .sig-line {
      width: 140px;
      height: 1px;
      background: #cbd5e1;
      margin: 0 auto 8px auto;
    }
    .sig-name {
      font-family: 'Playfair Display', serif;
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }
    .sig-title {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .cert-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px dashed #e2e8f0;
      font-size: 11px;
      color: #64748b;
      flex-wrap: wrap;
      gap: 12px;
    }
    .qr-badge {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .qr-badge img {
      width: 52px;
      height: 52px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      padding: 2px;
    }
    .cert-code {
      font-family: monospace;
      font-weight: 700;
      color: #4338ca;
      font-size: 12px;
    }
    @media print {
      body { background: transparent; padding: 0; }
      .toolbar { display: none; }
      .cert-frame { box-shadow: none; border: none; padding: 0; }
    }
    @media (max-width: 640px) {
      .cert-inner-border { padding: 20px 16px; }
      .cert-title { font-size: 20px; }
      .student-name { font-size: 24px; }
      .signatures-grid { grid-template-columns: 1fr; gap: 20px; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <a href="/" title="Open Campus Portal">← UniVerse Campus Portal</a>
    <div style="display: flex; gap: 10px;">
      <button onclick="window.print()" class="btn-primary" title="Print Certificate">🖨️ Print / Save PDF</button>
      <button onclick="navigator.clipboard.writeText(window.location.href); alert('Certificate link copied to clipboard!');">🔗 Copy Link</button>
    </div>
  </div>

  <div class="cert-frame">
    <div class="cert-inner-border">
      <div class="header-seal">
        <div class="uni-emblem">🏛️</div>
        <h2 class="uni-title">Central University Collegiate Council</h2>
        <div class="uni-sub">Office of Academic Accreditation & Student Welfare</div>
      </div>

      <div class="cert-heading">
        <h1 class="cert-title">Certificate of Participation</h1>
        <div class="cert-subtitle">Official Recognition of Verified Attendance</div>
      </div>

      <div class="presented-text">This is proudly presented to</div>
      <div class="student-wrapper">
        <div class="student-name">${cert.studentName}</div>
        <div class="student-meta">Enrollment ID: <strong>${cert.studentId}</strong> • Dept: <strong>${cert.department}</strong> • ${cert.year || '2025-26'}</div>
      </div>

      <div class="achievement-text">
        In recognition of their active participation and attendance in the university event
        <span class="event-highlight">"${cert.eventTitle}"</span> organized by
        <span class="event-highlight">${cert.clubName}</span> on
        <strong>${cert.eventDate}</strong> at <strong>${cert.eventVenue}</strong>.
      </div>

      <div class="signatures-grid">
        <div>
          <div class="sig-line"></div>
          <div class="sig-name">${cert.signatories[0]?.name || 'Dr. Academic Director'}</div>
          <div class="sig-title">${cert.signatories[0]?.title || 'Keynote Lead'}, ${cert.clubName}</div>
        </div>
        <div>
          <div class="sig-line"></div>
          <div class="sig-name">${cert.signatories[1]?.name || 'Club Convener'}</div>
          <div class="sig-title">${cert.signatories[1]?.title || 'Organizer Head'}, ${cert.clubName}</div>
        </div>
        <div>
          <div class="sig-line"></div>
          <div class="sig-name">${cert.signatories[2]?.name || 'Dr. Anand Ramanathan'}</div>
          <div class="sig-title">${cert.signatories[2]?.title || 'Dean of Student Affairs'}</div>
        </div>
      </div>

      <div class="cert-footer">
        <div class="qr-badge">
          <img src="${cert.qrCodeUrl}" alt="Verification QR" />
          <div>
            <div>Certificate ID: <span class="cert-code">${cert.id}</span></div>
            <div>Verification: <span style="font-family: monospace; font-size: 10px;">${cert.verificationHash.substring(0, 20)}...</span></div>
          </div>
        </div>
        <div style="text-align: right;">
          <div>Issued on <strong>${formattedDate}</strong></div>
          <div style="font-size: 10px; color: #16a34a; font-weight: 600;">✓ Attendance Verified & Cryptographically Signed</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  res.send(html);
});

// Get Certificate by Certificate ID
app.get('/api/certificates/:certificateId', (req: Request, res: Response) => {
  const { certificateId } = req.params;
  const cert = certificates.find(c => c.id.toUpperCase() === certificateId.toUpperCase());

  if (!cert) {
    return res.status(404).json({ success: false, message: 'Certificate record not found.' });
  }

  const event = events.find(e => e.id === cert.eventId);
  const reg = registrations.find(r => r.id === cert.registrationId);

  res.json({
    success: true,
    certificate: cert,
    event,
    registration: reg
  });
});

// Get Certificates by User ID or Email
app.get('/api/certificates/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { email } = req.query;

  const userCerts = certificates.filter(c => 
    c.userId === userId || 
    (email && c.studentEmail.toLowerCase() === String(email).toLowerCase())
  );

  res.json({
    success: true,
    count: userCerts.length,
    certificates: userCerts
  });
});

// Resend Certificate Email
app.post('/api/certificates/:certificateId/email', (req: Request, res: Response) => {
  const { certificateId } = req.params;
  const cert = certificates.find(c => c.id.toUpperCase() === certificateId.toUpperCase());

  if (!cert) {
    return res.status(404).json({ success: false, message: 'Certificate record not found.' });
  }

  const event = events.find(e => e.id === cert.eventId);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Associated event not found.' });
  }

  let baseUrl = '';
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const host = req.get('host') || 'localhost:3000';
  baseUrl = `${proto}://${host}`;

  const certificateUrl = `${baseUrl}/api/certificates/${cert.id}/view`;

  const certEmail = generateCertificateEmailHtml({
    studentName: cert.studentName,
    studentEmail: cert.studentEmail,
    studentId: cert.studentId,
    department: cert.department,
    event,
    certificateId: cert.id,
    issuedAt: cert.issuedAt,
    certificateUrl
  });

  const emailObj = dispatchEmailAndNotification({
    recipientEmail: cert.studentEmail,
    recipientName: cert.studentName,
    userId: cert.userId,
    senderName: `${event.clubName} • Certificate Cell`,
    senderEmail: event.contactEmail,
    subject: certEmail.subject,
    htmlContent: certEmail.html,
    plainText: certEmail.text,
    type: 'participation_certificate',
    eventId: event.id,
    eventTitle: event.title,
    notificationTitle: `🎓 Certificate Re-sent: ${event.title}`,
    notificationMessage: `Your Participation Certificate (${cert.id}) copy was emailed to your inbox.`
  });

  res.json({
    success: true,
    message: `Certificate sent to ${cert.studentEmail}!`,
    email: emailObj
  });
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

// ====================================================
// MASTER CONTROL SUPREME OVERRIDE ENDPOINTS
// Accessible only to 25mc1la65@mits.gwl.ac.in and 25mc1la66@mitsgwl.ac.in
// ====================================================

// 1. Master: Delete Any Club
app.delete('/api/master/clubs/:id', (req: Request, res: Response) => {
  if (!isMasterReq(req)) {
    return res.status(403).json({ success: false, message: 'Access Denied: Requires Supreme Master Control clearance.' });
  }
  const index = clubs.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Club not found.' });
  const [deletedClub] = clubs.splice(index, 1);
  broadcastSSE('club_deleted', { clubId: req.params.id });
  res.json({ success: true, message: `✓ Master Control: Club "${deletedClub.name}" deleted.`, club: deletedClub });
});

// 2. Master: Hard Delete Any Event
app.delete('/api/master/events/:id', (req: Request, res: Response) => {
  if (!isMasterReq(req)) {
    return res.status(403).json({ success: false, message: 'Access Denied: Requires Supreme Master Control clearance.' });
  }
  const index = events.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Event not found.' });
  const [deletedEvent] = events.splice(index, 1);
  // Also remove registrations
  registrations = registrations.filter(r => r.eventId !== req.params.id);
  broadcastSSE('event_deleted', { eventId: req.params.id });
  res.json({ success: true, message: `✓ Master Control: Event "${deletedEvent.title}" removed.`, event: deletedEvent });
});

// 3. Master: Change User Role / Demote / Promote Any Profile
app.put('/api/master/users/:id/role', (req: Request, res: Response) => {
  if (!isMasterReq(req)) {
    return res.status(403).json({ success: false, message: 'Access Denied: Requires Supreme Master Control clearance.' });
  }
  const user = users.find(u => u.id === req.params.id || u.email.toLowerCase() === req.params.id.toLowerCase());
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  const { role, designation, department } = req.body;
  if (role) user.role = role;
  if (designation) user.designation = designation;
  if (department) user.department = department;

  broadcastSSE('user_role_updated', { user });
  res.json({ success: true, message: `✓ Master Control: User ${user.name} role changed to ${user.role}.`, user });
});

// 4. Master: Broadcast Universal Campus Alert
app.post('/api/master/broadcast', (req: Request, res: Response) => {
  if (!isMasterReq(req)) {
    return res.status(403).json({ success: false, message: 'Access Denied: Requires Supreme Master Control clearance.' });
  }
  const { title, message } = req.body;
  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'Title and message are required.' });
  }

  users.forEach(u => {
    dispatchEmailAndNotification({
      recipientEmail: u.email,
      recipientName: u.name,
      userId: u.id,
      senderName: 'MITS Master Control',
      senderEmail: '25mc1la65@mits.gwl.ac.in',
      subject: `[MASTER DIRECTIVE] ${title}`,
      htmlContent: `<div style="font-family: sans-serif; padding: 20px; border-left: 4px solid #7c3aed;">
        <h2 style="color: #4c1d95;">MITS Central Master Control Directive</h2>
        <p><strong>Issued by Supreme Master Control</strong></p>
        <p style="font-size: 15px; color: #1e293b;">${message}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <small style="color: #64748b;">Madhav Institute of Technology and Science Gwalior (Estd. 1957)</small>
      </div>`,
      plainText: `MITS Central Master Control Directive: ${title}\n\n${message}`,
      type: 'organizer_announcement',
      notificationTitle: `[DIRECTIVE] ${title}`,
      notificationMessage: message
    });
  });

  res.json({ success: true, message: `✓ Master directive broadcasted to ${users.length} campus accounts.` });
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
