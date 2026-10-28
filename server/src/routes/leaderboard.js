import { Router } from 'express';
import * as c from '../controllers/leaderboard.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { leaderboardQuery } from './schemas.js';

const router = Router();

router.get('/', validate(leaderboardQuery, 'query'), asyncHandler(c.getLeaderboard));

export default router;
