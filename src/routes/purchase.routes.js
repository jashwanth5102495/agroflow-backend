"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const purchase_controller_1 = require("../controllers/purchase.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const purchase_validation_1 = require("../validations/purchase.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.requireTenant);
router.post('/', (0, validate_middleware_1.validateRequest)(purchase_validation_1.createPurchaseSchema), purchase_controller_1.createPurchase);
router.get('/', purchase_controller_1.getPurchases);
router.get('/:id', purchase_controller_1.getPurchaseById);
exports.default = router;
//# sourceMappingURL=purchase.routes.js.map