import { Router } from 'express';
import { createNotificationController } from '../controllers/notificationController.js';
import { EmailNotification, InAppNotification, UniversityVenue } from '../../src/types.js';

export const createNotificationRoutes = (
  emailsStore: EmailNotification[],
  notificationsStore: InAppNotification[],
  venuesStore: UniversityVenue[]
) => {
  const router = Router();
  const controller = createNotificationController(
    emailsStore,
    notificationsStore,
    venuesStore
  );

  router.get('/emails', controller.getEmails);
  router.get('/notifications', controller.getNotifications);
  router.post('/notifications/mark-read', controller.markNotificationsRead);
  router.get('/notifications/stream', controller.streamSSE);
  router.get('/venues', controller.getVenues);

  return router;
};
