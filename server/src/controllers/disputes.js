import { Challenge, Dispute } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { fileUrl } from '../middleware/upload.js';
import { notify } from '../services/notify.js';
import { sideOf, participantIds } from '../services/challenges.js';

const DISPUTABLE = ['room_ready', 'in_progress', 'reported'];

export async function myDisputes(req, res) {
  const mine = await Challenge.find({ $or: [{ teamA: req.user._id }, { teamB: req.user._id }] }).select('_id').lean();
  const items = await Dispute.find({ $or: [{ raisedBy: req.user._id }, { challenge: { $in: mine.map((c) => c._id) } }] })
    .sort({ createdAt: -1 })
    .populate('challenge', 'game mode map teamSize status winnerSide')
    .populate('raisedBy', 'username avatarUrl')
    .lean();
  res.json({ items, total: items.length, page: 1 });
}

export async function createDispute(req, res) {
  const challenge = await Challenge.findById(req.body.challengeId);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  if (!sideOf(challenge, req.user._id)) throw ApiError.forbidden('Only participants can raise a dispute');
  if (!DISPUTABLE.includes(challenge.status)) {
    throw ApiError.conflict(`Can't dispute a challenge that is ${challenge.status}`);
  }
  if (await Dispute.exists({ challenge: challenge._id, status: 'open' })) {
    throw ApiError.conflict('A dispute is already open for this challenge');
  }

  const dispute = await Dispute.create({
    challenge: challenge._id,
    raisedBy: req.user._id,
    reason: req.body.reason,
    evidenceUrl: fileUrl(req.file),
  });
  challenge.status = 'disputed';
  await challenge.save();
  await notify(participantIds(challenge).filter((id) => id !== String(req.user._id)), {
    type: 'challenge_disputed',
    text: `${req.user.username} raised a dispute. An admin will review it.`,
    link: `/challenges/${challenge._id}`,
  });
  res.status(201).json(dispute);
}
