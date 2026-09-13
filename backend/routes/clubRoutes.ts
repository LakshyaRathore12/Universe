import { Router } from 'express';
import { createClubController } from '../controllers/clubController.js';
import { Club } from '../../src/types.js';

export const createClubRoutes = (clubsStore: Club[]) => {
  const router = Router();
  const controller = createClubController(clubsStore);

  router.get('/', controller.getClubs);
  router.post('/', controller.createClub);
  router.get('/:id', controller.getClubById);

  return router;
};
