import { Notification } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export async function listNotifications(req, res) {
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean(),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ items, total: items.length, page: 1, unread });
}

export async function readAll(req, res) {
  await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
  res.json({ ok: true });
}

export async function readOne(req, res) {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { read: true } },
    { new: true },
  );
  if (!n) throw ApiError.notFound('Notification not found');
  res.json(n);
}
