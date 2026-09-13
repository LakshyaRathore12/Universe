import { Request, Response } from 'express';
import { EmailNotification, InAppNotification, UniversityVenue } from '../../src/types.js';
import { addSSEListener } from '../services/emailService.js';

export const createNotificationController = (
  emailsStore: EmailNotification[],
  notificationsStore: InAppNotification[],
  venuesStore: UniversityVenue[]
) => {
  return {
    getEmails: (req: Request, res: Response) => {
      const { recipientEmail, eventId } = req.query;
      let list = [...emailsStore];

      if (recipientEmail) {
        list = list.filter(e => e.recipientEmail.toLowerCase() === (recipientEmail as string).toLowerCase());
      }
      if (eventId) {
        list = list.filter(e => e.eventId === eventId);
      }

      res.json({ success: true, count: list.length, emails: list });
    },

    getNotifications: (req: Request, res: Response) => {
      const { userId } = req.query;
      let list = [...notificationsStore];
      if (userId) {
        list = list.filter(n => n.userId === userId || n.userId === (userId as string).toLowerCase());
      }
      res.json({ success: true, count: list.length, notifications: list });
    },

    markNotificationsRead: (req: Request, res: Response) => {
      const { userId } = req.body;
      notificationsStore.forEach(n => {
        if (!userId || n.userId === userId) {
          n.read = true;
        }
      });
      res.json({ success: true, message: 'Notifications marked as read' });
    },

    getVenues: (req: Request, res: Response) => {
      res.json({ success: true, venues: venuesStore });
    },

    streamSSE: (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      res.write(`event: ping\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);

      const unsubscribe = addSSEListener(({ event, payload }) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
      });

      req.on('close', () => {
        unsubscribe();
      });
    }
  };
};
