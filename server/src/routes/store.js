import { Router } from 'express';
import * as c from '../controllers/store.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { orderSchema, productQuery } from './schemas.js';

const router = Router();

router.get('/products', validate(productQuery, 'query'), asyncHandler(c.listProducts));
router.post('/orders', requireAuth, validate(orderSchema), asyncHandler(c.createOrder));
router.get('/orders/mine', requireAuth, asyncHandler(c.myOrders));

export default router;
