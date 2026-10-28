import { Router } from 'express';
import * as c from '../controllers/matches.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { auditMutations } from '../services/audit.js';
import {
  createMatchSchema,
  idParams,
  listQuery,
  resultsSchema,
  teamNameSchema,
  updateMatchSchema,
} from './schemas.js';

const router = Router();
const byId = validate(idParams, 'params');

router.get('/', validate(listQuery, 'query'), asyncHandler(c.listMatches));
router.post('/', requireAuth, requireRole('admin', 'organiser'), auditMutations, validate(createMatchSchema), asyncHandler(c.createMatch));
router.get('/:id', byId, optionalAuth, asyncHandler(c.getMatch));
router.patch('/:id', byId, requireAuth, auditMutations, validate(updateMatchSchema), asyncHandler(c.updateMatch));
router.post('/:id/register', byId, requireAuth, validate(teamNameSchema), asyncHandler(c.registerForMatch));
router.delete('/:id/register', byId, requireAuth, asyncHandler(c.unregisterFromMatch));
router.post('/:id/results', byId, requireAuth, auditMutations, validate(resultsSchema), asyncHandler(c.submitResults));

export default router;
