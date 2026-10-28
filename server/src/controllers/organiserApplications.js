import { OrganiserApplication, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { notify } from '../services/notify.js';
import { logAudit } from '../services/audit.js';

export async function apply(req, res) {
  if (req.user.role !== 'player') throw ApiError.conflict(`You are already an ${req.user.role}`);
  if (await OrganiserApplication.exists({ user: req.user._id, status: 'pending' })) {
    throw ApiError.conflict('You already have an application waiting for review');
  }
  const app = await OrganiserApplication.create({ ...req.body, user: req.user._id });
  await logAudit({ actor: req.user, action: 'organiser_application.submit', targetType: 'OrganiserApplication', targetId: app._id, summary: `${req.user.username} applied as ${app.orgName} (${app.type})` });
  res.status(201).json(app);
}

export async function mine(req, res) {
  res.json(await OrganiserApplication.find({ user: req.user._id }).sort({ createdAt: -1 }).lean());
}

// ---- admin
export async function list(req, res) {
  const filter = {};
  if (req.validQuery.status) filter.status = req.validQuery.status;
  const items = await OrganiserApplication.find(filter)
    .sort({ status: 1, createdAt: -1 })
    .populate('user', 'username avatarUrl province role createdAt')
    .populate('reviewedBy', 'username')
    .lean();
  res.json({ items, total: items.length, page: 1 });
}

export async function review(req, res) {
  const app = await OrganiserApplication.findById(req.params.id);
  if (!app) throw ApiError.notFound('Application not found');
  if (app.status !== 'pending') throw ApiError.conflict(`Application already ${app.status}`);
  const { approve, note = '' } = req.body;

  app.status = approve ? 'approved' : 'rejected';
  app.reviewedBy = req.user._id;
  app.reviewNote = note;
  await app.save();

  const user = await User.findById(app.user);
  if (approve && user && user.role === 'player') {
    user.role = 'organiser';
    await user.save();
  }
  await notify(app.user, {
    type: 'organiser_application',
    text: approve
      ? `You're now an organiser for ${app.orgName}. Host your first custom room!`
      : `Your organiser application for ${app.orgName} was not approved.${note ? ` ${note}` : ''}`,
    link: approve ? '/admin/matches' : '/settings',
  });
  res.locals.audit = {
    action: approve ? 'organiser_application.approve' : 'organiser_application.reject',
    targetType: 'OrganiserApplication',
    targetId: app._id,
    summary: `${user?.username ?? 'user'} / ${app.orgName}${note ? `: ${note}` : ''}`,
  };
  res.json(app);
}
