import { Request, Response } from 'express';
import { UniversityEvent, Registration, EmailNotification, InAppNotification, UniversityVenue } from '../../src/types.js';
import { EmailService, broadcastSSE } from '../services/emailService.js';

export const createEventController = (
  eventsStore: UniversityEvent[],
  registrationsStore: Registration[],
  emailsStore: EmailNotification[],
  notificationsStore: InAppNotification[],
  venuesStore: UniversityVenue[]
) => {
  return {
    getEvents: (req: Request, res: Response) => {
      const { category, clubId, status, search } = req.query;
      let filtered = [...eventsStore];

      if (category && category !== 'All') {
        filtered = filtered.filter(e => e.category.toLowerCase() === (category as string).toLowerCase());
      }
      if (clubId && clubId !== 'all') {
        filtered = filtered.filter(e => e.clubId === clubId);
      }
      if (status && status !== 'all') {
        filtered = filtered.filter(e => e.status === status);
      }
      if (search) {
        const q = (search as string).toLowerCase();
        filtered = filtered.filter(e => 
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q) ||
          e.tags.some(t => t.toLowerCase().includes(q))
        );
      }

      res.json({ success: true, count: filtered.length, events: filtered });
    },

    getEventById: (req: Request, res: Response) => {
      const event = eventsStore.find(e => e.id === req.params.id);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }
      res.json({ success: true, event });
    },

    createEvent: async (req: Request, res: Response) => {
      try {
        const {
          title,
          tagline,
          category,
          clubId,
          clubName,
          clubLogo,
          description,
          coverImage,
          startDate,
          endDate,
          startTime,
          endTime,
          venue,
          capacity,
          tags,
          speakers,
          agenda,
          prerequisites,
          certificatesProvided,
          contactEmail
        } = req.body;

        if (!title || !startDate || !startTime || !venue) {
          return res.status(400).json({ success: false, message: 'Missing required event fields' });
        }

        const selectedVenueObj = venuesStore.find(v => v.name === venue);
        const venueCap = selectedVenueObj ? selectedVenueObj.capacity : 250;

        const newEvent: UniversityEvent = {
          id: `evt-${Date.now()}`,
          title,
          tagline: tagline || 'University Workshop & Seminar Session',
          category: category || 'Workshop',
          clubId: clubId || 'club-codecraft',
          clubName: clubName || 'Campus Society',
          clubLogo: clubLogo || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
          description: description || 'Exciting hands-on session on campus.',
          coverImage: coverImage || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1000&auto=format&fit=crop&q=80',
          startDate,
          endDate: endDate || startDate,
          startTime,
          endTime: endTime || '04:00 PM',
          venue,
          isOnline: false,
          capacity: capacity ? Number(capacity) : Math.min(150, venueCap),
          registeredCount: 0,
          registrationDeadline: `${startDate}T23:59:00`,
          fee: 0,
          tags: Array.isArray(tags) ? tags : ['University', category || 'Workshop'],
          speakers: Array.isArray(speakers) && speakers.length > 0 ? speakers : [{
            name: clubName || 'Campus Convener',
            role: 'Lead Facilitator',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            companyOrCollege: clubName || 'Student Council'
          }],
          agenda: Array.isArray(agenda) && agenda.length > 0 ? agenda : [{
            id: 'ag-1',
            time: `${startTime} - ${endTime || '04:00 PM'}`,
            title: title,
            speaker: clubName || 'Lead Convener'
          }],
          prerequisites: Array.isArray(prerequisites) ? prerequisites : ['Valid University Student ID Card'],
          certificatesProvided: certificatesProvided ?? true,
          status: 'upcoming',
          contactEmail: contactEmail || 'events@campus.edu',
          createdAt: new Date().toISOString()
        };

        eventsStore.unshift(newEvent);
        broadcastSSE('event_created', { event: newEvent });

        res.status(201).json({ success: true, event: newEvent, message: 'Event scheduled successfully' });
      } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
      }
    },

    updateEvent: async (req: Request, res: Response) => {
      const eventIndex = eventsStore.findIndex(e => e.id === req.params.id);
      if (eventIndex === -1) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      const prevEvent = eventsStore[eventIndex];
      const { rescheduleReason, ...updatedFields } = req.body;

      const isDateChanged = updatedFields.startDate && updatedFields.startDate !== prevEvent.startDate;
      const isTimeChanged = updatedFields.startTime && updatedFields.startTime !== prevEvent.startTime;
      const isVenueChanged = updatedFields.venue && updatedFields.venue !== prevEvent.venue;
      const isRescheduled = isDateChanged || isTimeChanged || isVenueChanged;

      const updatedEvent: UniversityEvent = {
        ...prevEvent,
        ...updatedFields
      };

      eventsStore[eventIndex] = updatedEvent;

      // Broadcast real-time schedule update email if modified
      if (isRescheduled) {
        const attendees = registrationsStore.filter(r => r.eventId === updatedEvent.id && r.status === 'confirmed');
        await EmailService.sendScheduleChangeAlert(updatedEvent, attendees, rescheduleReason, emailsStore, notificationsStore);
      }

      broadcastSSE('event_updated', { event: updatedEvent, isRescheduled });
      res.json({ success: true, event: updatedEvent, message: 'Event updated successfully' });
    },

    cancelEvent: async (req: Request, res: Response) => {
      const event = eventsStore.find(e => e.id === req.params.id);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      event.status = 'cancelled';
      const attendees = registrationsStore.filter(r => r.eventId === event.id && r.status === 'confirmed');

      for (const att of attendees) {
        att.status = 'cancelled';
        await EmailService.dispatchEmail({
          recipientEmail: att.userEmail,
          recipientName: att.userName,
          senderEmail: event.contactEmail || 'events@campus.edu',
          senderName: `${event.clubName} Organizers`,
          subject: `CANCELLED: ${event.title}`,
          plainText: `Please note that "${event.title}" scheduled for ${event.startDate} has been cancelled by the club organizer. We apologize for any inconvenience.`,
          htmlContent: `<div style="padding:20px;font-family:sans-serif;color:#1e293b;"><h2 style="color:#e11d48;">Event Cancelled Notice</h2><p>Dear ${att.userName},</p><p>We regret to inform you that <strong>${event.title}</strong> has been cancelled by <strong>${event.clubName}</strong>.</p></div>`,
          type: 'cancellation',
          eventId: event.id,
          eventTitle: event.title,
          ticketCode: att.ticketCode
        }, emailsStore, notificationsStore);
      }

      broadcastSSE('event_updated', { event });
      res.json({ success: true, message: 'Event cancelled and attendees notified via email' });
    },

    broadcastToAttendees: async (req: Request, res: Response) => {
      const event = eventsStore.find(e => e.id === req.params.id);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      const { announcementTitle, announcementBody } = req.body;
      if (!announcementTitle || !announcementBody) {
        return res.status(400).json({ success: false, message: 'Title and message body are required' });
      }

      const attendees = registrationsStore.filter(r => r.eventId === event.id && r.status !== 'cancelled');
      await EmailService.sendBroadcastAnnouncement(
        event,
        attendees,
        announcementTitle,
        announcementBody,
        emailsStore,
        notificationsStore
      );

      res.json({
        success: true,
        recipientCount: attendees.length,
        message: `Real-time announcement dispatched to ${attendees.length} confirmed attendees.`
      });
    },

    checkInAttendee: (req: Request, res: Response) => {
      const { id } = req.params; // eventId
      const { ticketCode } = req.body;

      if (!ticketCode) {
        return res.status(400).json({ success: false, message: 'Ticket code is required' });
      }

      const registration = registrationsStore.find(
        r => r.eventId === id && r.ticketCode.toLowerCase() === ticketCode.trim().toLowerCase()
      );

      if (!registration) {
        return res.status(404).json({ success: false, message: 'Invalid ticket code for this event' });
      }

      if (registration.status === 'checked_in') {
        return res.json({ success: true, message: `Attendee ${registration.userName} was already checked in!`, registration });
      }

      registration.status = 'checked_in';

      res.json({
        success: true,
        message: `Entry verified! Welcome ${registration.userName} (${registration.studentId || 'Student'}).`,
        registration
      });
    },

    getAttendees: (req: Request, res: Response) => {
      const attendees = registrationsStore.filter(r => r.eventId === req.params.id);
      res.json({ success: true, count: attendees.length, attendees });
    }
  };
};
