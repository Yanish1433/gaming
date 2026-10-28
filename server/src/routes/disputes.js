import { Router } from 'express';
import * as c from '../controllers/disputes.js';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { disputeSchema } from './schemas.js';

const router = Router();

router.use(requireAuth);
router.get('/mine', asyncHandler(c.myDisputes));
// Accepts JSON or multipart with an optional `evidence` image.
router.post('/', upload.single('evidence'), validate(disputeSchema), asyncHandler(c.createDispute));

export default router;
