import { Router } from 'express';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct } from '../controllers/product.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { createProductSchema, updateProductSchema } from '../validations/product.validation';
import { authenticate } from '../middleware/auth.middleware';
import { requireTenant } from '../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, requireTenant);

router.post('/', validateRequest(createProductSchema), createProduct);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.patch('/:id', validateRequest(updateProductSchema), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
