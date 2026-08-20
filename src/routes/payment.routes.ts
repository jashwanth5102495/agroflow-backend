import { Router } from 'express';
import { createPayment, getPayments } from '../controllers/payment.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { createPaymentSchema } from '../validations/payment.validation';
import { authenticate } from '../middleware/auth.middleware';
import { requireTenant } from '../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, requireTenant);

router.post('/', validateRequest(createPaymentSchema), createPayment);
router.get('/', getPayments);

export default router;
