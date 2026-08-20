import { Router } from 'express';
import { getNotificationConfig, updateNotificationConfig, triggerTestMessage, getGatewayStatus } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireTenant } from '../middleware/tenant.middleware';

const router = Router();

// Public gateway status checking for dashboard setup
router.get('/gateway-status', getGatewayStatus);

// Secure notification endpoints
router.use(authenticate, requireTenant);

router.get('/config', getNotificationConfig);
router.post('/config', updateNotificationConfig);
router.post('/test-message', triggerTestMessage);

export default router;
