import { Request, Response } from 'express';
import { Registration, UniversityEvent, EmailNotification, InAppNotification } from '../../src/types.js';
import { EmailService, broadcastSSE } from '../services/emailService.js';

export const createRegistrationController = (
  registrationsStore: Registration[],
  eventsStore: UniversityEvent[],
  emailsStore: EmailNotification[],
  notificationsStore: InAppNotification[]
) => {
  return {
    registerForEvent: async (req: Request, res: Response) => {
      const event = eventsStore.find(e => e.id === req.params.id);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      const { userId, userName, userEmail, studentId, phone, department, year } = req.body;
      if (!userName || !userEmail) {
        return res.status(400).json({ success: false, message: 'Attendee name and email are required' });
      }

      // Check capacity
      if (event.registeredCount >= event.capacity) {
        return res.status(400).json({ success: false, message: 'Event capacity full! No seats currently available.' });
      }

      // Check existing registration
      const existing = registrationsStore.find(
        r => r.eventId === event.id && r.userEmail.toLowerCase() === userEmail.toLowerCase() && r.status === 'confirmed'
      );
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'You have already booked a pass for this event!',
          registration: existing
        });
      }

      // Generate Ticket Code
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const ticketCode = `TKT-2026-${randNum}`;

      const newRegistration: Registration = {
        id: `reg-${Date.now()}`,
        eventId: event.id,
        userId: userId || `usr-${Date.now()}`,
        userName,
        userEmail,
        studentId: studentId || `UNI-2026-CS${randNum}`,
        phone: phone || '+91 98765 00000',
        department: department || 'Engineering',
        year: year || '3rd Year',
        ticketCode,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
          `UNIVERSE-EVENT-PASS:${ticketCode}:${event.id}:${userEmail}`
        )}`,
        registeredAt: new Date().toISOString(),
        status: 'confirmed',
        emailSent: true,
        emailSentAt: new Date().toISOString()
      };

      registrationsStore.push(newRegistration);
      event.registeredCount += 1;

      // Real-time dispatch of HTML confirmation email
      const dispatchedEmail = await EmailService.sendRegistrationConfirmation(
        event,
        newRegistration,
        emailsStore,
        notificationsStore
      );

      broadcastSSE('registration_created', {
        eventId: event.id,
        registeredCount: event.registeredCount,
        registration: newRegistration
      });

      res.status(201).json({
        success: true,
        message: 'Pass confirmed! Real-time email delivered.',
        registration: newRegistration,
        email: dispatchedEmail
      });
    },

    getUserRegistrations: (req: Request, res: Response) => {
      const { userId } = req.params;
      const email = req.query.email as string;

      let userRegs = registrationsStore.filter(r => {
        if (email && r.userEmail.toLowerCase() === email.toLowerCase()) return true;
        return r.userId === userId;
      });

      // Hydrate with event data
      const hydrated = userRegs.map(reg => {
        const evt = eventsStore.find(e => e.id === reg.eventId);
        return { ...reg, event: evt };
      });

      res.json({ success: true, count: hydrated.length, registrations: hydrated });
    },

    cancelRegistration: (req: Request, res: Response) => {
      const { id } = req.params; // eventId
      const { userEmail } = req.body;

      const regIndex = registrationsStore.findIndex(
        r => r.eventId === id && (!userEmail || r.userEmail.toLowerCase() === userEmail.toLowerCase())
      );

      if (regIndex === -1) {
        return res.status(404).json({ success: false, message: 'Registration record not found' });
      }

      const reg = registrationsStore[regIndex];
      reg.status = 'cancelled';

      const event = eventsStore.find(e => e.id === id);
      if (event && event.registeredCount > 0) {
        event.registeredCount -= 1;
      }

      broadcastSSE('event_updated', { event });
      res.json({ success: true, message: 'Event pass cancelled successfully' });
    },

    // Admin & Club Organizer: Get all registered candidates with detailed filtering
    getAllRegistrations: (req: Request, res: Response) => {
      const { clubId, eventId, status, department, search } = req.query;

      let filtered = [...registrationsStore];

      // Filter by Event
      if (eventId && typeof eventId === 'string' && eventId !== 'all') {
        filtered = filtered.filter(r => r.eventId === eventId);
      }

      // Filter by Club (find if event belongs to clubId)
      if (clubId && typeof clubId === 'string' && clubId !== 'all') {
        filtered = filtered.filter(r => {
          const ev = eventsStore.find(e => e.id === r.eventId);
          return ev && ev.clubId === clubId;
        });
      }

      // Filter by Status
      if (status && typeof status === 'string' && status !== 'all') {
        filtered = filtered.filter(r => r.status === status);
      }

      // Filter by Department
      if (department && typeof department === 'string' && department !== 'all') {
        filtered = filtered.filter(r => (r.department || '').toLowerCase() === department.toLowerCase());
      }

      // Search by Name, Enrollment No (studentId), Email, Phone, TicketCode
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

      // Hydrate with corresponding event data
      const hydrated = filtered.map(reg => {
        const event = eventsStore.find(e => e.id === reg.eventId);
        return {
          ...reg,
          event
        };
      });

      // Sort by registeredAt desc (newest registrations first)
      hydrated.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

      res.json({
        success: true,
        count: hydrated.length,
        totalSeats: eventsStore.reduce((acc, ev) => acc + ev.capacity, 0),
        registrations: hydrated
      });
    },

    // Manual on-spot candidate registration by Club Admin
    manualRegisterCandidate: async (req: Request, res: Response) => {
      const { eventId, studentId, userName, userEmail, phone, department, year, notes } = req.body;

      if (!eventId || !userName || !userEmail || !studentId) {
        return res.status(400).json({
          success: false,
          message: 'Event ID, Student Enrollment No, Name, and Email are required.'
        });
      }

      const event = eventsStore.find(e => e.id === eventId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Selected event not found.' });
      }

      const randNum = Math.floor(1000 + Math.random() * 9000);
      const ticketCode = `TKT-2026-${event.category.substring(0, 2).toUpperCase()}-${randNum}`;

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

      registrationsStore.unshift(newRegistration);
      event.registeredCount += 1;

      // Real-time dispatch email
      const dispatchedEmail = await EmailService.sendRegistrationConfirmation(
        event,
        newRegistration,
        emailsStore,
        notificationsStore
      );

      broadcastSSE('registration_created', {
        eventId: event.id,
        registeredCount: event.registeredCount,
        registration: newRegistration
      });

      res.status(201).json({
        success: true,
        message: `Candidate ${userName} registered successfully with ticket ${ticketCode}!`,
        registration: newRegistration,
        email: dispatchedEmail
      });
    },

    // Update candidate check-in status
    updateStatus: (req: Request, res: Response) => {
      const { id } = req.params;
      const { status } = req.body;

      const reg = registrationsStore.find(r => r.id === id || r.ticketCode === id);
      if (!reg) {
        return res.status(404).json({ success: false, message: 'Candidate registration not found.' });
      }

      reg.status = status;
      if (status === 'checked_in') {
        reg.checkedInAt = new Date().toISOString();
      }

      const event = eventsStore.find(e => e.id === reg.eventId);

      broadcastSSE('registration_updated', { registration: reg, event });
      res.json({
        success: true,
        message: `Status updated to ${status} for ${reg.userName}`,
        registration: { ...reg, event }
      });
    },

    // Delete or cancel a candidate's registration
    deleteRegistrationById: (req: Request, res: Response) => {
      const { id } = req.params;
      const index = registrationsStore.findIndex(r => r.id === id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Registration not found' });
      }

      const [removed] = registrationsStore.splice(index, 1);
      const event = eventsStore.find(e => e.id === removed.eventId);
      if (event && event.registeredCount > 0 && removed.status !== 'cancelled') {
        event.registeredCount -= 1;
      }

      broadcastSSE('event_updated', { event });
      res.json({ success: true, message: `Registration for ${removed.userName} removed.` });
    }
  };
};
