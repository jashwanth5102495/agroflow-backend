import { Router } from 'express';
import { getDashboardSummary, getRecentTransactions, getInventoryAlerts, getAnalytics } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireTenant } from '../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/summary', getDashboardSummary);
router.get('/recent-transactions', getRecentTransactions);
router.get('/inventory-alerts', getInventoryAlerts);
router.get('/analytics', getAnalytics);

export default router;
