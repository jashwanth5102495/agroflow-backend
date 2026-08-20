import { Router } from 'express';
import { getSubscriptionStatus, paySubscription, setShopSubscriptionPrice } from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/status', getSubscriptionStatus);
router.post('/pay', paySubscription);
router.post('/set-price', setShopSubscriptionPrice);

export default router;
