import { Router } from 'express';
import { createFarmer, getFarmers, getFarmerById, updateFarmer, deleteFarmer } from '../controllers/farmer.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { createFarmerSchema, updateFarmerSchema } from '../validations/farmer.validation';
import { authenticate } from '../middleware/auth.middleware';
import { requireTenant } from '../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, requireTenant);

router.post('/', validateRequest(createFarmerSchema), createFarmer);
router.get('/', getFarmers);
router.get('/:id', getFarmerById);
router.patch('/:id', validateRequest(updateFarmerSchema), updateFarmer);
router.delete('/:id', deleteFarmer);

export default router;
