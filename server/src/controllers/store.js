import { TopupOrder, TopupProduct } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { logAudit } from '../services/audit.js';

export async function listProducts(req, res) {
  const filter = { active: true };
  if (req.validQuery.game) filter.game = req.validQuery.game;
  const items = await TopupProduct.find(filter).sort({ game: 1, priceNpr: 1 }).lean();
  res.json(items);
}

export async function createOrder(req, res) {
  const { productId, gameUid, paymentMethod, paymentRef } = req.body;
  const product = await TopupProduct.findById(productId);
  if (!product || !product.active) throw ApiError.notFound('Product not available');

  const order = await TopupOrder.create({
    user: req.user._id,
    product: product._id,
    gameUid,
    paymentMethod,
    paymentRef,
    priceNpr: product.priceNpr,
  });
  await logAudit({
    actor: req.user,
    action: 'order.placed',
    targetType: 'TopupOrder',
    targetId: order._id,
    summary: `${req.user.username} ordered ${product.name} (Rs ${product.priceNpr}) via ${paymentMethod}`,
  });
  res.status(201).json(await order.populate('product'));
}

export async function myOrders(req, res) {
  const items = await TopupOrder.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('product').lean();
  res.json({ items, total: items.length, page: 1 });
}
