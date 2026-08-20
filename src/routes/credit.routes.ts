import { Router } from 'express';
import { getFarmerCredit, getOutstandingCredits, addCreditPayment } from '../controllers/credit.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { addCreditPaymentSchema } from '../validations/credit.validation';
import { authenticate } from '../middleware/auth.middleware';
import { requireTenant } from '../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/outstanding', getOutstandingCredits);
router.get('/:farmerId', getFarmerCredit);
router.post('/:farmerId/payment', validateRequest(addCreditPaymentSchema), addCreditPayment);

export default router;
