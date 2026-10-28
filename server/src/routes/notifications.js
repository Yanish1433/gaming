import { Router } from 'express';
import * as c from '../controllers/notifications.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParams } from './schemas.js';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(c.listNotifications));
router.post('/read-all', asyncHandler(c.readAll));
router.post('/:id/read', validate(idParams, 'params'), asyncHandler(c.readOne));

export default router;
