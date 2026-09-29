import { Router } from 'express';
import { createRegistrationController } from '../controllers/registrationController.js';
import { Registration, UniversityEvent, EmailNotification, InAppNotification } from '../../src/types.js';

export const createRegistrationRoutes = (
  registrationsStore: Registration[],
  eventsStore: UniversityEvent[],
  emailsStore: EmailNotification[],
  notificationsStore: InAppNotification[]
) => {
  const router = Router();
  const controller = createRegistrationController(
    registrationsStore,
    eventsStore,
    emailsStore,
    notificationsStore
  );

  router.get('/', controller.getAllRegistrations);
  router.post('/manual', controller.manualRegisterCandidate);
  router.put('/:id/status', controller.updateStatus);
  router.delete('/:id', controller.deleteRegistrationById);
  router.post('/:id/register', controller.registerForEvent);
  router.delete('/:id/register', controller.cancelRegistration);
  router.get('/user/:userId', controller.getUserRegistrations);

  return router;
};
