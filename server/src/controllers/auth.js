import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { signToken } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { selfUser } from '../utils/sanitize.js';
import { exactInsensitive } from '../utils/escapeRegex.js';
import { logAudit } from '../services/audit.js';

const MIN_AGE = 16;

function ageOn(dob, now = new Date()) {
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

export async function register(req, res) {
  const { username, email, password, dob, province } = req.body;
  if (ageOn(dob) < MIN_AGE) throw ApiError.unprocessable(`You must be at least ${MIN_AGE} to join`);

  const taken = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { usernameLower: username.toLowerCase() }],
  }).select('+usernameLower email');
  if (taken) {
    throw ApiError.conflict(taken.email === email.toLowerCase() ? 'Email already registered' : 'Username already taken');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, passwordHash, dob, province });
  await logAudit({ actor: user, action: 'user.register', targetType: 'User', targetId: user._id, summary: `${user.username} joined from ${user.province}` });
  res.status(201).json({ token: signToken(user), user: selfUser(user) });
}

export async function login(req, res) {
  const { emailOrUsername, password } = req.body;
  const id = emailOrUsername.trim();
  const user = await User.findOne(
    id.includes('@')
      ? { email: id.toLowerCase() }
      : { username: exactInsensitive(id) },
  );
  // Same message for unknown user and wrong password to avoid account enumeration.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw ApiError.unauthorized('Wrong email/username or password');
  }
  if (user.banned) throw ApiError.forbidden('This account is banned');
  res.json({ token: signToken(user), user: selfUser(user) });
}

export async function me(req, res) {
  res.json(selfUser(req.user));
}
