import { Router } from 'express';
import { createSupplier, getSuppliers, getSupplierById, updateSupplier, deleteSupplier } from '../controllers/supplier.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { createSupplierSchema, updateSupplierSchema } from '../validations/supplier.validation';
import { authenticate } from '../middleware/auth.middleware';
import { requireTenant } from '../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, requireTenant);

router.post('/', validateRequest(createSupplierSchema), createSupplier);
router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.patch('/:id', validateRequest(updateSupplierSchema), updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
