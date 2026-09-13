import { Router } from 'express';
import { createEventController } from '../controllers/eventController.js';
import { UniversityEvent, Registration, EmailNotification, InAppNotification, UniversityVenue } from '../../src/types.js';

export const createEventRoutes = (
  eventsStore: UniversityEvent[],
  registrationsStore: Registration[],
  emailsStore: EmailNotification[],
  notificationsStore: InAppNotification[],
  venuesStore: UniversityVenue[]
) => {
  const router = Router();
  const controller = createEventController(
    eventsStore,
    registrationsStore,
    emailsStore,
    notificationsStore,
    venuesStore
  );

  router.get('/', controller.getEvents);
  router.post('/', controller.createEvent);
  router.get('/:id', controller.getEventById);
  router.put('/:id', controller.updateEvent);
  router.delete('/:id', controller.cancelEvent);
  router.post('/:id/broadcast', controller.broadcastToAttendees);
  router.post('/:id/checkin', controller.checkInAttendee);
  router.get('/:id/attendees', controller.getAttendees);

  return router;
};
