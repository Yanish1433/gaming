import { Router } from 'express';
import * as c from '../controllers/games.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(c.listGames));
router.get('/:slug/summary', asyncHandler(c.gameSummary));

export default router;
