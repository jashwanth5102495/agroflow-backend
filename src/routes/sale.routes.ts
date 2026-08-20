import { Router } from 'express';
import { createSale, getSales, getSaleById } from '../controllers/sale.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { createSaleSchema } from '../validations/sale.validation';
import { authenticate } from '../middleware/auth.middleware';
import { requireTenant } from '../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, requireTenant);

router.post('/', validateRequest(createSaleSchema), createSale);
router.get('/', getSales);
router.get('/:id', getSaleById);

export default router;
