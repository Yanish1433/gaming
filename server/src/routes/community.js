// Public / player-facing routes from the admin addendum: applications, announcements, sponsors, stats, reports, settings.
import { Router } from 'express';
import * as apps from '../controllers/organiserApplications.js';
import * as ann from '../controllers/announcements.js';
import * as spons from '../controllers/sponsors.js';
import * as reports from '../controllers/reports.js';
import * as sys from '../controllers/adminSystem.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { announcementQuery, idParams, organiserApplicationSchema, reportCreateSchema, sponsorActiveQuery } from './schemas.js';

const router = Router();

router.post('/organiser-applications', requireAuth, validate(organiserApplicationSchema), h(apps.apply));
router.get('/organiser-applications/mine', requireAuth, h(apps.mine));

router.get('/announcements', optionalAuth, validate(announcementQuery, 'query'), h(ann.listPublic));

router.get('/sponsors/active', validate(sponsorActiveQuery, 'query'), h(spons.active));
router.post('/sponsors/:id/click', validate(idParams, 'params'), h(spons.click));

router.get('/stats/public', h(spons.publicStats));
router.get('/settings/public', h(sys.getPublicSettings));

// Multipart with an optional `evidence` image, or plain JSON.
router.post('/reports', requireAuth, upload.single('evidence'), validate(reportCreateSchema), h(reports.create));
router.get('/reports/mine', requireAuth, h(reports.mine));

export default router;
