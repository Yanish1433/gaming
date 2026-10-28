import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { getSettings } from '../services/settings.js';

const READS = new Set(['GET', 'HEAD', 'OPTIONS']);
// Admins must still be able to log in to switch maintenance off.
const ALWAYS_OPEN = new Set(['/api/auth/login']);

async function isAdminRequest(req) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return false;
  try {
    const { sub } = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(sub).select('role banned').lean();
    return user?.role === 'admin' && !user.banned;
  } catch {
    return false;
  }
}

// Maintenance mode: every non-admin mutation gets 503 { error }; reads keep working.
export async function maintenanceGuard(req, res, next) {
  try {
    if (READS.has(req.method) || ALWAYS_OPEN.has(req.originalUrl.split('?')[0])) return next();
    const settings = await getSettings();
    if (!settings.maintenanceMode || (await isAdminRequest(req))) return next();
    res.status(503).json({ error: settings.maintenanceMessage || 'Site is under maintenance' });
  } catch (err) {
    next(err);
  }
}
