import { Router } from 'express';
import * as c from '../controllers/tournaments.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { auditMutations } from '../services/audit.js';
import { createTournamentSchema, idParams, listQuery, tournamentRegisterSchema } from './schemas.js';

const router = Router();
const byId = validate(idParams, 'params');

router.get('/', optionalAuth, validate(listQuery, 'query'), asyncHandler(c.listTournaments));
router.post(
  '/',
  requireAuth,
  requireRole('admin', 'organiser'),
  auditMutations,
  validate(createTournamentSchema),
  asyncHandler(c.createTournament),
);
router.get('/:id', byId, optionalAuth, asyncHandler(c.getTournament));
router.post('/:id/register', byId, requireAuth, validate(tournamentRegisterSchema), asyncHandler(c.registerForTournament));

export default router;
