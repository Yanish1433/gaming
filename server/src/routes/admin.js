import { Router } from 'express';
import * as c from '../controllers/admin.js';
import * as analytics from '../controllers/adminAnalytics.js';
import * as play from '../controllers/adminPlay.js';
import * as apps from '../controllers/organiserApplications.js';
import * as ann from '../controllers/announcements.js';
import * as spons from '../controllers/sponsors.js';
import * as reports from '../controllers/reports.js';
import * as sys from '../controllers/adminSystem.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { auditMutations } from '../services/audit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  activityQuery,
  adminChallengeQuery,
  adminTournamentQuery,
  adminTournamentUpdateSchema,
  adminUpdateOrderSchema,
  adminUpdateUserSchema,
  analyticsQuery,
  announcementSchema,
  announcementUpdateSchema,
  applicationStatusQuery,
  auditQuery,
  confirmSchema,
  disputeStatusQuery,
  exportParams,
  forceSettleSchema,
  idParams,
  orderStatusQuery,
  productSchema,
  productUpdateSchema,
  reasonSchema,
  registrationParams,
  reportActionSchema,
  reportStatusQuery,
  resolveSchema,
  reviewSchema,
  settingsUpdateSchema,
  sponsorSchema,
  sponsorUpdateSchema,
  userSearchQuery,
  winnersSchema,
} from './schemas.js';

const router = Router();
const byId = validate(idParams, 'params');
const h = asyncHandler;

// Admin only; every successful mutation below writes an AuditLog entry.
router.use(requireAuth, requireRole('admin'), auditMutations);

// ---- overview
router.get('/stats', h(c.stats));
router.get('/analytics', validate(analyticsQuery, 'query'), h(analytics.analytics));
router.get('/activity', validate(activityQuery, 'query'), h(analytics.activity));
router.get('/audit', validate(auditQuery, 'query'), h(analytics.auditLog));

// ---- people
router.get('/users', validate(userSearchQuery, 'query'), h(c.listUsers));
router.patch('/users/:id', byId, validate(adminUpdateUserSchema), h(c.updateUser));
router.get('/organiser-applications', validate(applicationStatusQuery, 'query'), h(apps.list));
router.post('/organiser-applications/:id/review', byId, validate(reviewSchema), h(apps.review));
router.get('/reports', validate(reportStatusQuery, 'query'), h(reports.list));
router.post('/reports/:id/action', byId, validate(reportActionSchema), h(reports.action));

// ---- play
router.get('/challenges', validate(adminChallengeQuery, 'query'), h(play.listChallenges));
router.post('/challenges/:id/cancel', byId, validate(reasonSchema), h(play.cancelChallenge));
router.post('/challenges/:id/settle', byId, validate(forceSettleSchema), h(play.settleChallengeAdmin));
router.delete('/challenges/:id', byId, h(play.deleteChallenge));

router.get('/tournaments', validate(adminTournamentQuery, 'query'), h(play.listTournaments));
router.patch('/tournaments/:id', byId, validate(adminTournamentUpdateSchema), h(play.updateTournament));
router.delete('/tournaments/:id', byId, h(play.deleteTournament));
router.delete('/tournaments/:id/registrations/:userId', validate(registrationParams, 'params'), h(play.removeRegistration));
router.post('/tournaments/:id/winners', byId, validate(winnersSchema), h(play.setWinners));

router.get('/disputes', validate(disputeStatusQuery, 'query'), h(c.listDisputes));
router.post('/disputes/:id/resolve', byId, validate(resolveSchema), h(c.resolveDispute));

// ---- money
router.get('/orders', validate(orderStatusQuery, 'query'), h(c.listOrders));
router.patch('/orders/:id', byId, validate(adminUpdateOrderSchema), h(c.updateOrder));

router.get('/products', h(c.listAllProducts));
router.post('/products', validate(productSchema), h(c.createProduct));
router.patch('/products/:id', byId, validate(productUpdateSchema), h(c.updateProduct));
router.delete('/products/:id', byId, h(c.deleteProduct));

// ---- growth
router.get('/announcements', h(ann.list));
router.post('/announcements', validate(announcementSchema), h(ann.create));
router.patch('/announcements/:id', byId, validate(announcementUpdateSchema), h(ann.update));
router.delete('/announcements/:id', byId, h(ann.remove));
router.post('/announcements/:id/broadcast', byId, h(ann.broadcast));

router.get('/sponsors', h(spons.list));
router.post('/sponsors', upload.single('logo'), validate(sponsorSchema), h(spons.create));
router.patch('/sponsors/:id', byId, upload.single('logo'), validate(sponsorUpdateSchema), h(spons.update));
router.delete('/sponsors/:id', byId, h(spons.remove));

// ---- system
router.get('/settings', h(sys.getAdminSettings));
router.patch('/settings', validate(settingsUpdateSchema), h(sys.updateSettings));
router.get('/demo', h(sys.demoStatus));
router.post('/demo/clear', validate(confirmSchema), h(sys.demoClear));
router.post('/demo/reseed', validate(confirmSchema), h(sys.demoReseed));
router.get('/export/:what', validate(exportParams, 'params'), h(sys.exportCsv));

export default router;
