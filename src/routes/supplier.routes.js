"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supplier_controller_1 = require("../controllers/supplier.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const supplier_validation_1 = require("../validations/supplier.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.requireTenant);
router.post('/', (0, validate_middleware_1.validateRequest)(supplier_validation_1.createSupplierSchema), supplier_controller_1.createSupplier);
router.get('/', supplier_controller_1.getSuppliers);
router.get('/:id', supplier_controller_1.getSupplierById);
router.patch('/:id', (0, validate_middleware_1.validateRequest)(supplier_validation_1.updateSupplierSchema), supplier_controller_1.updateSupplier);
router.delete('/:id', supplier_controller_1.deleteSupplier);
exports.default = router;
//# sourceMappingURL=supplier.routes.js.map