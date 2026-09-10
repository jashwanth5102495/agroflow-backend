import { Router } from 'express';
import { getAllShops, getAdminDashboardStats, deleteShop, updateShopSubscription } from '../controllers/admin.controller';

const router = Router();

// Admin routes
router.get('/shops', getAllShops);
router.delete('/shops/:id', deleteShop);
router.put('/shops/:id/subscription', updateShopSubscription);
router.get('/stats', getAdminDashboardStats);

export default router;
