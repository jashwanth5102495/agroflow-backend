import { Router } from 'express';
import { getInventory, adjustInventory } from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireTenant } from '../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', getInventory);
router.post('/adjust', adjustInventory);

export default router;
