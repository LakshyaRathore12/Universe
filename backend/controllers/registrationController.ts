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

      const { userId, userName, userEmail, studentId, department } = req.body;
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
        studentId: studentId || `2026CS${randNum}`,
        department: department || 'Engineering',
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
    }
  };
};
