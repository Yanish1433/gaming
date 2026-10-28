import { Challenge, Dispute, Match, TopupOrder, TopupProduct, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { selfUser } from '../utils/sanitize.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { notify } from '../services/notify.js';
import { participantIds, resolveScores, settleChallenge } from '../services/challenges.js';
import { maxScoreFor } from '../config/games.js';
import { diffFields, joinChanges } from '../utils/auditText.js';

export async function stats(req, res) {
  const [users, challenges, matches, ordersPending, revenue, disputesOpen] = await Promise.all([
    User.countDocuments(),
    Challenge.countDocuments(),
    Match.countDocuments(),
    TopupOrder.countDocuments({ status: { $in: ['pending', 'paid'] } }),
    TopupOrder.aggregate([{ $match: { status: 'fulfilled' } }, { $group: { _id: null, sum: { $sum: '$priceNpr' } } }]),
    Dispute.countDocuments({ status: 'open' }),
  ]);
  res.json({ users, challenges, matches, ordersPending, revenueNpr: revenue[0]?.sum || 0, disputesOpen });
}

// ---- users
export async function listUsers(req, res) {
  const { q } = req.validQuery;
  const filter = q ? { $or: [{ username: new RegExp(escapeRegex(q), 'i') }, { email: new RegExp(escapeRegex(q), 'i') }] } : {};
  const items = await User.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json({ items: items.map(selfUser), total: items.length, page: 1 });
}

export async function updateUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (String(user._id) === String(req.user._id) && (req.body.banned || (req.body.role && req.body.role !== 'admin'))) {
    throw ApiError.conflict("You can't ban or demote yourself");
  }
  const before = { role: user.role, banned: user.banned, strikes: user.strikes };
  user.set(req.body);
  await user.save();
  const changes = diffFields(before, user, { role: 'role', strikes: 'strikes' });
  if (before.banned !== user.banned) changes.unshift(user.banned ? 'banned' : 'unbanned');
  res.locals.audit = { action: 'user.update', targetType: 'User', targetId: user._id, summary: joinChanges(user.username, changes) };
  res.json(selfUser(user));
}

// ---- disputes
export async function listDisputes(req, res) {
  const filter = {};
  if (req.validQuery.status) filter.status = req.validQuery.status;
  const items = await Dispute.find(filter)
    .sort({ status: 1, createdAt: -1 })
    .populate({
      path: 'challenge',
      populate: { path: 'teamA teamB', select: 'username avatarUrl' },
    })
    .populate('raisedBy resolvedBy', 'username')
    .lean();
  res.json({ items, total: items.length, page: 1 });
}

export async function resolveDispute(req, res) {
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) throw ApiError.notFound('Dispute not found');
  if (dispute.status === 'resolved') throw ApiError.conflict('Dispute already resolved');
  const challenge = await Challenge.findById(dispute.challenge);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  // Optional admin override of per-player kills/goals; validated before anything is written.
  const overrides = req.body.scores
    ? await resolveScores(req.body.scores, participantIds(challenge), { max: maxScoreFor(challenge.game) })
    : undefined;

  dispute.status = 'resolved';
  dispute.resolution = req.body.resolution;
  dispute.resolvedBy = req.user._id;
  await dispute.save();
  // Close any sibling open disputes on the same challenge.
  await Dispute.updateMany(
    { challenge: challenge._id, status: 'open' },
    { $set: { status: 'resolved', resolution: req.body.resolution, resolvedBy: req.user._id } },
  );
  await settleChallenge(challenge, req.body.winnerSide, {
    text: `Dispute resolved: Team ${req.body.winnerSide} wins. ${req.body.resolution}`,
    scores: overrides,
    actor: req.user,
  });
  res.locals.audit = { action: 'dispute.resolve', targetType: 'Dispute', targetId: dispute._id, summary: `Team ${req.body.winnerSide} wins: ${req.body.resolution}` };
  res.json(await dispute.populate('challenge'));
}

// ---- orders
export async function listOrders(req, res) {
  const filter = {};
  if (req.validQuery.status) filter.status = req.validQuery.status;
  const items = await TopupOrder.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('product')
    .populate('user', 'username email')
    .lean();
  res.json({ items, total: items.length, page: 1 });
}

const ORDER_TEXT = {
  paid: 'Payment verified. Your top-up is on the way.',
  fulfilled: 'Top-up delivered to your game account.',
  failed: 'Top-up order failed. Check the admin note.',
  pending: 'Order moved back to pending.',
};

export async function updateOrder(req, res) {
  const order = await TopupOrder.findById(req.params.id).populate('product');
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status === 'fulfilled' && req.body.status && req.body.status !== 'fulfilled') {
    throw ApiError.conflict('Fulfilled orders are final');
  }
  const statusChanged = req.body.status && req.body.status !== order.status;
  order.set(req.body);
  await order.save();
  res.locals.audit = { action: 'order.update', targetType: 'TopupOrder', targetId: order._id, summary: `${order.product?.name || 'order'} -> ${order.status}${req.body.adminNote ? ` (${req.body.adminNote})` : ''}` };
  if (statusChanged) {
    await notify(order.user, {
      type: 'order_status',
      text: `${order.product?.name || 'Top-up'}: ${ORDER_TEXT[order.status]}`,
      link: '/orders',
    });
  }
  res.json(order);
}

// ---- products
export async function listAllProducts(req, res) {
  res.json(await TopupProduct.find().sort({ game: 1, priceNpr: 1 }).lean());
}

export async function createProduct(req, res) {
  const product = await TopupProduct.create(req.body);
  res.locals.audit = { action: 'product.create', targetType: 'TopupProduct', targetId: product._id, summary: `${product.game} ${product.name} Rs ${product.priceNpr}` };
  res.status(201).json(product);
}

export async function updateProduct(req, res) {
  const before = await TopupProduct.findById(req.params.id).lean();
  if (!before) throw ApiError.notFound('Product not found');
  const product = await TopupProduct.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) throw ApiError.notFound('Product not found');
  const changes = diffFields(
    before,
    product,
    { name: 'name', game: 'game', amount: 'amount', priceNpr: 'price', active: 'active', popular: 'popular' },
    { priceNpr: (v) => `Rs ${v}`, active: (v) => (v ? 'yes' : 'no'), popular: (v) => (v ? 'yes' : 'no') },
  );
  res.locals.audit = { action: 'product.update', targetType: 'TopupProduct', targetId: product._id, summary: joinChanges(before.name, changes) };
  res.json(product);
}

// Products with orders are deactivated instead of deleted, so order history keeps its reference.
export async function deleteProduct(req, res) {
  const product = await TopupProduct.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  res.locals.audit = { action: 'product.delete', targetType: 'TopupProduct', targetId: product._id, summary: product.name };
  if (await TopupOrder.exists({ product: product._id })) {
    product.active = false;
    await product.save();
    return res.json({ ok: true, deactivated: true });
  }
  await product.deleteOne();
  res.json({ ok: true, deleted: true });
}
