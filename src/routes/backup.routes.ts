import { Router } from 'express';
import { generateBackup, restoreBackup, requestOldData, getPendingRequests, uploadBackup } from '../controllers/backup.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Admin routes
router.get('/admin/shops/:shopId', generateBackup);
router.post('/admin/shops/:shopId/restore', uploadBackup, restoreBackup);
router.get('/admin/requests', getPendingRequests);

// Shop routes
router.post('/shop/request-data', requestOldData);

export default router;
