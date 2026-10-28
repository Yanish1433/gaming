import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as c from '../controllers/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginSchema, registerSchema } from './schemas.js';

const router = Router();

// Brute-force guard on credential endpoints only (not /me).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in a few minutes.' },
});

router.post('/register', authLimiter, validate(registerSchema), asyncHandler(c.register));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(c.login));
router.get('/me', requireAuth, asyncHandler(c.me));

export default router;
