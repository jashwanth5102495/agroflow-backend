import { Router } from 'express';
import { getAllShops, getAdminDashboardStats } from '../controllers/admin.controller';

const router = Router();

// Admin routes
router.get('/shops', getAllShops);
router.get('/stats', getAdminDashboardStats);

export default router;
