import mongoose from 'mongoose';
import { Challenge, Report, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { exactInsensitive } from '../utils/escapeRegex.js';
import { fileUrl } from '../middleware/upload.js';
import { notify } from '../services/notify.js';
import { logAudit } from '../services/audit.js';
import { sideOf } from '../services/challenges.js';

export const AUTO_BAN_STRIKES = 3;

// Player: report another player (target = username or user id).
export async function create(req, res) {
  const { target, challengeId, reason, details } = req.body;
  const user = mongoose.isValidObjectId(target)
    ? await User.findById(target)
    : await User.findOne({ username: exactInsensitive(target) });
  if (!user) throw ApiError.notFound('Player not found');
  if (String(user._id) === String(req.user._id)) throw ApiError.unprocessable("You can't report yourself");

  if (challengeId) {
    const c = await Challenge.findById(challengeId).select('teamA teamB').lean();
    if (!c) throw ApiError.notFound('Challenge not found');
    if (!sideOf(c, user._id)) throw ApiError.unprocessable('That player was not in this challenge');
  }
  if (await Report.exists({ reporter: req.user._id, target: user._id, status: 'open' })) {
    throw ApiError.conflict('You already have an open report about this player');
  }

  const report = await Report.create({
    reporter: req.user._id,
    target: user._id,
    challenge: challengeId,
    reason,
    details,
    evidenceUrl: fileUrl(req.file),
  });
  await logAudit({ actor: req.user, action: 'report.create', targetType: 'Report', targetId: report._id, summary: `${req.user.username} reported ${user.username} (${reason})` });
  res.status(201).json(report);
}

export async function mine(req, res) {
  const items = await Report.find({ reporter: req.user._id }).sort({ createdAt: -1 }).populate('target', 'username avatarUrl').lean();
  res.json({ items, total: items.length, page: 1 });
}

// ---- admin
export async function list(req, res) {
  const filter = {};
  if (req.validQuery.status) filter.status = req.validQuery.status;
  const items = await Report.find(filter)
    .sort({ status: 1, createdAt: -1 })
    .populate('reporter', 'username avatarUrl')
    .populate('target', 'username avatarUrl province strikes banned')
    .populate('challenge', 'game mode teamSize status')
    .populate('reviewedBy', 'username')
    .lean();
  res.json({ items, total: items.length, page: 1 });
}

// dismiss | strike (+1, auto-ban at 3) | ban
export async function action(req, res) {
  const report = await Report.findById(req.params.id);
  if (!report) throw ApiError.notFound('Report not found');
  if (report.status !== 'open') throw ApiError.conflict(`Report already ${report.status}`);
  const { action: act, note = '' } = req.body;
  const target = await User.findById(report.target);
  if (target?.role === 'admin' && act !== 'dismiss') throw ApiError.conflict("Admins can't be struck or banned from a report");

  let outcome = 'dismissed';
  if (target && act === 'strike') {
    target.strikes += 1;
    if (target.strikes >= AUTO_BAN_STRIKES) target.banned = true;
    await target.save();
    outcome = target.banned ? `strike ${target.strikes} -> auto-banned` : `strike ${target.strikes}`;
    await notify(target._id, {
      type: 'moderation',
      text: target.banned
        ? `Your account was banned after ${target.strikes} strikes.${note ? ` ${note}` : ''}`
        : `You received a strike (${target.strikes}/${AUTO_BAN_STRIKES}) for ${report.reason.replace('_', ' ')}.${note ? ` ${note}` : ''}`,
      link: '/notifications',
    });
  } else if (target && act === 'ban') {
    target.banned = true;
    await target.save();
    outcome = 'banned';
    await notify(target._id, { type: 'moderation', text: `Your account was banned.${note ? ` ${note}` : ''}`, link: '/notifications' });
  }

  report.status = act === 'dismiss' ? 'dismissed' : 'actioned';
  report.action = act;
  report.adminNote = note;
  report.reviewedBy = req.user._id;
  await report.save();
  await notify(report.reporter, {
    type: 'report_reviewed',
    text: act === 'dismiss' ? 'Thanks for your report. We reviewed it and took no action.' : 'Thanks for your report. We took action.',
    link: '/notifications',
  });
  res.locals.audit = { action: `report.${act}`, targetType: 'Report', targetId: report._id, summary: `${target?.username ?? 'user'}: ${outcome}${note ? ` (${note})` : ''}` };
  res.json({ ...report.toObject(), target: target && { _id: target._id, username: target.username, strikes: target.strikes, banned: target.banned } });
}
