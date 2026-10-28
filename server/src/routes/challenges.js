import { Router } from 'express';
import * as c from '../controllers/challenges.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  acceptChallengeSchema,
  challengeQuery,
  createChallengeSchema,
  idParams,
  reportSchema,
  roomSchema,
} from './schemas.js';

const router = Router();
const byId = validate(idParams, 'params');

router.get('/', validate(challengeQuery, 'query'), asyncHandler(c.listChallenges));
router.post('/', requireAuth, validate(createChallengeSchema), asyncHandler(c.createChallenge));
router.get('/:id', byId, optionalAuth, asyncHandler(c.getChallenge));
router.post('/:id/accept', byId, requireAuth, validate(acceptChallengeSchema), asyncHandler(c.acceptChallenge));
router.post('/:id/room', byId, requireAuth, validate(roomSchema), asyncHandler(c.setRoom));
router.post('/:id/start', byId, requireAuth, asyncHandler(c.startChallenge));
router.post(
  '/:id/report',
  byId,
  requireAuth,
  upload.single('screenshot'),
  validate(reportSchema),
  asyncHandler(c.reportResult),
);
router.post('/:id/cancel', byId, requireAuth, asyncHandler(c.cancelChallenge));

export default router;
