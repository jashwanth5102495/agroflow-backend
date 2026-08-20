"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const product_validation_1 = require("../validations/product.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.requireTenant);
router.post('/', (0, validate_middleware_1.validateRequest)(product_validation_1.createProductSchema), product_controller_1.createProduct);
router.get('/', product_controller_1.getProducts);
router.get('/:id', product_controller_1.getProductById);
router.patch('/:id', (0, validate_middleware_1.validateRequest)(product_validation_1.updateProductSchema), product_controller_1.updateProduct);
router.delete('/:id', product_controller_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=product.routes.js.map