import { Router } from 'express';
import * as c from '../controllers/ranked.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ladderQuery } from './schemas.js';

const router = Router();

router.get('/ladder', validate(ladderQuery, 'query'), asyncHandler(c.getLadder));

export default router;
