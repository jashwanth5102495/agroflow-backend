import { Router } from 'express';
import { registerShop, login, adminLogin, logout, getMe, refreshToken, toggleCashierMode, cashierLogin } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { registerShopSchema, loginSchema } from '../validations/auth.validation';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register-shop', validateRequest(registerShopSchema), registerShop);
router.post('/login', validateRequest(loginSchema), login);
router.post('/admin-login', adminLogin);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

router.post('/cashier/toggle', authenticate, toggleCashierMode);
router.post('/cashier/login', cashierLogin);

export default router;
