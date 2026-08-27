import { Router } from 'express';
import { getAllShops, getAdminDashboardStats, deleteShop } from '../controllers/admin.controller';

const router = Router();

// Admin routes
router.get('/shops', getAllShops);
router.delete('/shops/:id', deleteShop);
router.get('/stats', getAdminDashboardStats);

export default router;
