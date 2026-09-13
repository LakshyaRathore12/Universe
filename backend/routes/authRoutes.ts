import { Router } from 'express';
import { createAuthController } from '../controllers/authController.js';
import { User } from '../../src/types.js';

export const createAuthRoutes = (usersStore: User[]) => {
  const router = Router();
  const controller = createAuthController(usersStore);

  router.get('/users', controller.getUsers);
  router.get('/me', controller.getCurrentUser);
  router.post('/login', controller.login);
  router.post('/register', controller.register);

  return router;
};
