import { Router } from 'express';
import auth from './auth.js';
import users from './users.js';
import games from './games.js';
import challenges from './challenges.js';
import matches from './matches.js';
import tournaments from './tournaments.js';
import leaderboard from './leaderboard.js';
import disputes from './disputes.js';
import notifications from './notifications.js';
import store from './store.js';
import admin from './admin.js';
import ranked from './ranked.js';
import community from './community.js';

const router = Router();

router.get('/health', (req, res) => res.json({ ok: true }));
router.use('/auth', auth);
router.use('/users', users);
router.use('/games', games);
router.use('/challenges', challenges);
router.use('/matches', matches);
router.use('/tournaments', tournaments);
router.use('/leaderboard', leaderboard);
router.use('/disputes', disputes);
router.use('/notifications', notifications);
router.use('/store', store);
router.use('/admin', admin);
router.use('/ranked', ranked);
router.use('/', community);

export default router;
