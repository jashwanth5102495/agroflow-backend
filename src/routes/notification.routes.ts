import { Router } from 'express';
import {
  getNotificationConfig,
  updateNotificationConfig,
  triggerTestMessage,
  getGatewayStatus,
  getWhatsAppStatusController,
  requestWhatsAppQrController,
  disconnectWhatsAppController,
  triggerWhatsAppTestReportController,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireTenant } from '../middleware/tenant.middleware';

const router = Router();

// Public gateway status checking for dashboard setup
router.get('/gateway-status', getGatewayStatus);

// Secure notification endpoints
router.use(authenticate, requireTenant);

// Config endpoints
router.get('/config', getNotificationConfig);
router.post('/config', updateNotificationConfig);
router.post('/test-message', triggerTestMessage);

// WhatsApp Device Endpoints (standard path)
router.get('/whatsapp/status', getWhatsAppStatusController);
router.post('/whatsapp/qr', requestWhatsAppQrController);
router.post('/whatsapp/disconnect', disconnectWhatsAppController);
router.post('/whatsapp/test-report', triggerWhatsAppTestReportController);

// Tenant-specific route aliases (/tenants/:id/whatsapp/*)
router.get('/tenants/:id/whatsapp/status', getWhatsAppStatusController);
router.post('/tenants/:id/whatsapp/qr', requestWhatsAppQrController);
router.post('/tenants/:id/whatsapp/disconnect', disconnectWhatsAppController);
router.post('/tenants/:id/test-whatsapp-report', triggerWhatsAppTestReportController);

export default router;
