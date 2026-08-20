import { Router } from 'express';
import { createPurchase, getPurchases, getPurchaseById } from '../controllers/purchase.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { createPurchaseSchema } from '../validations/purchase.validation';
import { authenticate } from '../middleware/auth.middleware';
import { requireTenant } from '../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, requireTenant);

router.post('/', validateRequest(createPurchaseSchema), createPurchase);
router.get('/', getPurchases);
router.get('/:id', getPurchaseById);

export default router;
