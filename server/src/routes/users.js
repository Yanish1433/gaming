import { Router } from 'express';
import * as c from '../controllers/users.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { historyQuery, recordsQuery, updateMeSchema } from './schemas.js';

const router = Router();

// /me before /:username so it isn't captured as a username.
router.patch('/me', requireAuth, validate(updateMeSchema), asyncHandler(c.updateMe));
router.get('/:username', asyncHandler(c.getProfile));
router.get('/:username/records', validate(recordsQuery, 'query'), asyncHandler(c.getRecords));
router.get('/:username/rating-history', validate(historyQuery, 'query'), asyncHandler(c.getRatingHistory));

export default router;
