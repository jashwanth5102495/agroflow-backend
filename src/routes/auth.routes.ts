import { Router } from 'express';
import { registerShop, login, logout, getMe } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { registerShopSchema, loginSchema } from '../validations/auth.validation';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register-shop', validateRequest(registerShopSchema), registerShop);
router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
